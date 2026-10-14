#!/usr/bin/env python3
"""Broad GET smoke test. Reports non-2xx that are NOT expected
RBAC (403) / missing-resource (404) / validation (400) responses.
Usage: TOKEN=... python3 scripts/smoke-get.py
"""
import json
import os
import urllib.request

BASE = "http://localhost:3001/api/v1"
TOKEN = os.environ["TOKEN"]
H = {
    "Authorization": f"Bearer {TOKEN}",
    "X-School-Id": "1",
    "Content-Type": "application/json",
}

# (method, path) — query strings pre-baked where the route needs them
ROUTES = [
    ("GET", "/health"),
    ("GET", "/schools"),
    ("GET", "/schools/1"),
    ("GET", "/users"),
    ("GET", "/students?schoolId=1"),
    ("GET", "/students/search?schoolId=1&q=kiran"),
    ("GET", "/guardians"),
    ("GET", "/teachers"),
    ("GET", "/academic-class"),
    ("GET", "/sections?classId=1"),
    ("GET", "/subjects?classId=1"),
    ("GET", "/classes"),
    ("GET", "/attendance?schoolId=1"),
    ("GET", "/assignments?classId=1"),
    ("GET", "/exams"),
    ("GET", "/results?examId=1"),
    ("GET", "/fee/categories?schoolId=1"),
    ("GET", "/fee/structures/class/1?schoolId=1"),
    ("GET", "/fee/discount-rules"),
    ("GET", "/fee/penalty-rules"),
    ("GET", "/fee/late-fine-rules"),
    ("GET", "/fee/invoice-discounts?schoolId=1"),
    ("GET", "/fee/scholarships?schoolId=1"),
    ("GET", "/fee/waiver-requests?schoolId=1"),
    ("GET", "/fee/sibling-discounts?schoolId=1"),
    ("GET", "/library/books"),
    ("GET", "/library/books/see-reference"),
    ("GET", "/transport/vehicles"),
    ("GET", "/transport/routes/1"),
    ("GET", "/hostels"),
    ("GET", "/hostels/rooms?hostelId=1"),
    ("GET", "/hostels/students?hostelId=1"),
    ("GET", "/hr/staff?schoolId=1"),
    ("GET", "/hr/leave-types?schoolId=1"),
    ("GET", "/notifications"),
    ("GET", "/certificates/tc/list"),
    ("GET", "/certificates/student/1"),
    ("GET", "/documents?schoolId=1"),
    ("GET", "/documents/templates"),
    ("GET", "/academic-calendar"),
    ("GET", "/academic-calendar/upcoming"),
    ("GET", "/timetables?classId=1"),
    ("GET", "/video-classes"),
    ("GET", "/video-classes/live"),
    ("GET", "/enrollments?schoolId=1"),
    ("GET", "/promotions/report?schoolId=1"),
    ("GET", "/report-cards?examId=1"),
    ("GET", "/grade-scales"),
    ("GET", "/dashboard/admin"),
    ("GET", "/portal/student/dashboard?studentId=1"),
    ("GET", "/audit?schoolId=1"),
    ("GET", "/sms/templates"),
    ("GET", "/sms/logs"),
    ("GET", "/webhooks"),
    ("GET", "/sync/status?schoolId=1"),
    ("GET", "/rbac/permissions"),
    ("GET", "/rbac/roles?schoolId=1"),
    ("GET", "/ai/suggestions?schoolId=1"),
    ("GET", "/export/students?schoolId=1&format=json"),
    ("GET", "/compliance/annual-statistics?schoolId=1"),
]

EXPECTED_NON2XX = {400, 401, 403, 404}

bad = []
for method, path in ROUTES:
    url = BASE + path
    req = urllib.request.Request(url, method=method, headers=H)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            body = r.read().decode()[:200]
            try:
                data = json.loads(body)
                keys = sorted(data.keys()) if isinstance(data, dict) else type(data).__name__
            except Exception:
                keys = "non-json"
            print(f"{r.status} {path} keys={keys}")
    except Exception as e:
        # urllib raises HTTPError with .code for 4xx/5xx
        code = getattr(e, "code", "?")
        msg = ""
        try:
            msg = e.read().decode()[:160]
        except Exception:
            pass
        flag = " <-- CHECK" if code not in EXPECTED_NON2XX and code != 200 else ""
        print(f"{code} {path} {msg[:100]}{flag}")
        if code not in EXPECTED_NON2XX:
            bad.append((code, path, msg))

print(f"\n{len(bad)} unexpected failures")
for code, path, msg in bad:
    print(f"  {code} {path}: {msg[:140]}")
