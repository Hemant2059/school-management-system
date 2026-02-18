import requests
import json

BASE_URL = "http://localhost:3000/api/v1"

USERS = {
    "ADMIN": "admin_30_ETgC",
    "STUDENT": "student_27_lu1T",
    "TEACHER": "teacher_31_ggX5",
    "ACCOUNTANT": "accountant_29_Ovfx",
    "PARENT": "parent_28_pDv1"
}

PASSWORD = "Password123!"

def login(username):
    url = f"{BASE_URL}/auth/login"
    payload = {
        "username": username,
        "password": PASSWORD
    }
    response = requests.post(url, json=payload)
    if response.status_code == 201 or response.status_code == 200:
        return response.json()["accessToken"]
    else:
        print(f"Failed to login as {username}: {response.status_code} - {response.text}")
        return None

def test_endpoint(endpoint, token, params=None):
    url = f"{BASE_URL}/{endpoint}"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    response = requests.get(url, headers=headers, params=params)
    print(f"Testing {url} with params {params}...")
    if response.status_code == 200:
        print(f"SUCCESS: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"FAILED: {response.status_code} - {response.text}")
    print("-" * 50)

def main():
    # Test Admin
    print("Testing ADMIN Dashboard...")
    admin_token = login(USERS["ADMIN"])
    if admin_token:
        test_endpoint("dashboard/admin", admin_token)

    # Test Student
    print("Testing STUDENT Dashboard...")
    student_token = login(USERS["STUDENT"])
    if student_token:
        test_endpoint("dashboard/student", student_token, params={"studentId": 1})

    # Test Teacher
    print("Testing TEACHER Dashboard...")
    teacher_token = login(USERS["TEACHER"])
    if teacher_token:
        test_endpoint("dashboard/teacher", teacher_token, params={"teacherId": 1})

    # Test Accountant
    print("Testing ACCOUNTANT Dashboard...")
    accountant_token = login(USERS["ACCOUNTANT"])
    if accountant_token:
        test_endpoint("dashboard/accountant", accountant_token)

    # Test Parent
    print("Testing PARENT Dashboard...")
    parent_token = login(USERS["PARENT"])
    if parent_token:
        test_endpoint("dashboard/parent", parent_token)

if __name__ == "__main__":
    main()
