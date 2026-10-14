#!/usr/bin/env python3
"""Audit raw-SQL calls in services:
1. $n placeholder max vs params-array length mismatches.
2. INSERT/UPDATE tables+columns exist in information_schema.
Usage: python3 scripts/audit-sql.py (needs DB up; uses .env)
"""
import os
import re
import sys

import psycopg2

SRC = "src"


def load_env():
    env = {}
    try:
        with open(".env") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip()
    except FileNotFoundError:
        pass
    return env


def find_db_calls(text):
    """Yield (line_no, method, sql, params_text) for db.* calls with
    template-literal SQL. Handles ${} by bailing (returns None sql)."""
    out = []
    # db.insert(`...`, [...]) / db.query(`...`, [...]) / single-arg calls
    pattern = re.compile(r"db\.(insert|query|queryOne|update|delete)\s*\(\s*`")
    for m in pattern.finditer(text):
        line_no = text.count("\n", 0, m.start()) + 1
        i = m.end()
        # read template literal respecting escapes; bail on ${ (dynamic SQL)
        sql_chars = []
        dynamic = False
        while i < len(text):
            ch = text[i]
            if ch == "\\":
                sql_chars.append(text[i : i + 2])
                i += 2
                continue
            if ch == "`":
                break
            if ch == "$" and i + 1 < len(text) and text[i + 1] == "{":
                dynamic = True
                break
            sql_chars.append(ch)
            i += 1
        if dynamic:
            out.append((line_no, m.group(1), None, None))
            continue
        sql = "".join(sql_chars)
        # skip to comma or closing paren
        j = i + 1
        while j < len(text) and text[j] in " \t\n":
            j += 1
        params_text = None
        if j < len(text) and text[j] == ",":
            j += 1
            while j < len(text) and text[j] in " \t\n":
                j += 1
            if j < len(text) and text[j] == "[":
                depth_sq = 0
                depth_par = 0
                depth_br = 0
                in_s = in_d = in_t = False
                k = j
                arr = []
                while k < len(text):
                    c = text[k]
                    prev = text[k - 1] if k > 0 else ""
                    if in_s:
                        arr.append(c)
                        if c == "'" and prev != "\\":
                            in_s = False
                    elif in_d:
                        arr.append(c)
                        if c == '"' and prev != "\\":
                            in_d = False
                    elif in_t:
                        arr.append(c)
                        if c == "`" and prev != "\\":
                            in_t = False
                    else:
                        if c == "'":
                            in_s = True
                            arr.append(c)
                        elif c == '"':
                            in_d = True
                            arr.append(c)
                        elif c == "`":
                            in_t = True
                            arr.append(c)
                        elif c in "[(":
                            if c == "[":
                                depth_sq += 1
                            else:
                                depth_par += 1
                            arr.append(c)
                        elif c == "{":
                            depth_br += 1
                            arr.append(c)
                        elif c == "]":
                            depth_sq -= 1
                            arr.append(c)
                            if depth_sq == 0 and depth_par == 0 and depth_br == 0:
                                break
                        elif c == ")":
                            depth_par -= 1
                            arr.append(c)
                        elif c == "}":
                            depth_br -= 1
                            arr.append(c)
                        else:
                            arr.append(c)
                    k += 1
                params_text = "".join(arr)
        out.append((line_no, m.group(1), sql, params_text))
    return out


def top_level_commas(s):
    """Count top-level commas in [...] array text (s includes brackets)."""
    depth = 0
    in_s = in_d = in_t = False
    commas = 0
    empty = True
    i = 0
    body = s[1:-1]
    for idx, c in enumerate(body):
        prev = body[idx - 1] if idx > 0 else ""
        if in_s:
            if c == "'" and prev != "\\":
                in_s = False
            continue
        if in_d:
            if c == '"' and prev != "\\":
                in_d = False
            continue
        if in_t:
            if c == "`" and prev != "\\":
                in_t = False
            continue
        if c == "'":
            in_s = True
            empty = False
        elif c == '"':
            in_d = True
            empty = False
        elif c == "`":
            in_t = True
            empty = False
        elif c in "[({":
            depth += 1
            empty = False
        elif c in "])}":
            depth -= 1
        elif c == "," and depth == 0:
            commas += 1
        elif not c.isspace():
            empty = False
    if empty:
        return 0
    # tolerate a single trailing comma
    stripped = body.strip()
    if stripped.endswith(","):
        commas -= 1
    return commas + 1


def main():
    env = load_env()
    conn = psycopg2.connect(
        host=env.get("DB_HOST", "localhost"),
        port=int(env.get("DB_PORT", "5544")),
        user=env.get("DB_USERNAME", "school"),
        password=env.get("DB_PASSWORD", "School@321"),
        dbname=env.get("DB_NAME", "sms_nepal"),
    )
    cur = conn.cursor()
    cur.execute(
        "SELECT table_name, column_name FROM information_schema.columns "
        "WHERE table_schema='public'"
    )
    schema = {}
    for t, c in cur.fetchall():
        schema.setdefault(t, set()).add(c)
    cur.close()
    conn.close()

    mismatches = []
    bad_tables = []
    bad_cols = []
    dynamic = 0
    checked = 0
    for root, _, files in os.walk(SRC):
        for fn in files:
            if not fn.endswith(".service.ts"):
                continue
            path = os.path.join(root, fn)
            with open(path) as f:
                text = f.read()
            for line_no, method, sql, params in find_db_calls(text):
                if sql is None:
                    dynamic += 1
                    continue
                checked += 1
                nums = [int(n) for n in re.findall(r"\$(\d+)", sql)]
                maxn = max(nums) if nums else 0
                if params is None:
                    if maxn > 0:
                        mismatches.append(
                            f"{path}:{line_no} [{method}] placeholders up to ${maxn} but NO params array"
                        )
                    continue
                cnt = top_level_commas(params)
                if maxn != cnt:
                    mismatches.append(
                        f"{path}:{line_no} [{method}] max placeholder ${maxn} vs {cnt} params :: {sql[:100]!r}"
                    )
                # table/column existence for INSERT/UPDATE (static only)
                m_ins = re.search(
                    r"INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)", sql, re.I | re.S
                )
                tgt = None
                cols = []
                if m_ins:
                    tgt = m_ins.group(1)
                    cols = [c.strip().strip('"') for c in m_ins.group(2).split(",")]
                else:
                    m_upd = re.search(r"UPDATE\s+(\w+)\s+SET\s+(.*?)\s+WHERE\s", sql, re.I | re.S)
                    if m_upd:
                        tgt = m_upd.group(1)
                        cols = re.findall(r"(\w+)\s*=\s*\$", m_upd.group(2))
                if tgt:
                    if tgt not in schema:
                        bad_tables.append(f"{path}:{line_no} unknown table {tgt}")
                    else:
                        for c in cols:
                            if c and c not in schema[tgt]:
                                bad_cols.append(
                                    f"{path}:{line_no} {tgt}.{c} not in DB"
                                )

    print(f"checked={checked} dynamic-skipped={dynamic}")
    print(f"\n--- placeholder mismatches ({len(mismatches)}) ---")
    for m in mismatches:
        print(m)
    print(f"\n--- unknown tables ({len(bad_tables)}) ---")
    for m in bad_tables:
        print(m)
    print(f"\n--- unknown columns ({len(bad_cols)}) ---")
    for m in bad_cols:
        print(m)


if __name__ == "__main__":
    main()
