from __future__ import annotations

import json
import uuid
from http import HTTPStatus
from typing import Any, Dict, List, Tuple

from fastapi.testclient import TestClient

from app.main import app

EXCLUDED_PATHS = {
    "/docs",
    "/redoc",
    "/openapi.json",
    "/docs/oauth2-redirect",
    "/favicon.ico",
}

METHOD_PRIORITY = {
    "GET": 0,
    "POST": 1,
    "PUT": 2,
    "PATCH": 3,
    "DELETE": 4,
}

RESULTS: List[Dict[str, Any]] = []
FAILED: List[Dict[str, Any]] = []
SKIPPED: List[Dict[str, Any]] = []

TEST_TOKEN: str | None = None
TEST_CHILD_ID: int | None = None
TEST_EMAIL: str | None = None
TEST_PASSWORD: str = "Password@123"


def discover_routes() -> List[Tuple[str, str]]:
    discovered: List[Tuple[str, str]] = []
    for route in app.routes:
        methods = getattr(route, "methods", None)
        if not methods:
            continue
        path = getattr(route, "path", None)
        if not path or path in EXCLUDED_PATHS:
            continue
        for method in sorted(methods, key=lambda m: METHOD_PRIORITY.get(m, 99)):
            if method in {"HEAD", "OPTIONS"}:
                continue
            discovered.append((method, path))

    preferred_order = [
        ("GET", "/health"),
        ("POST", "/api/auth/register"),
        ("POST", "/api/auth/login"),
        ("GET", "/api/auth/me"),
        ("GET", "/api/users/me"),
        ("POST", "/api/children"),
        ("GET", "/api/children"),
        ("POST", "/api/assessment"),
        ("GET", "/api/assessment"),
        ("POST", "/api/prediction"),
    ]

    ordered = []
    seen = set()
    for item in preferred_order:
        if item in discovered:
            ordered.append(item)
            seen.add(item)

    for item in discovered:
        if item not in seen:
            ordered.append(item)
    return ordered


def status_text(code: int) -> str:
    try:
        return f"{code} {HTTPStatus(code).phrase}"
    except ValueError:
        return str(code)


def response_detail(resp) -> str:
    try:
        payload = resp.json()
    except Exception:
        payload = resp.text

    if isinstance(payload, dict):
        if "detail" in payload:
            detail = payload["detail"]
            if isinstance(detail, list):
                return str(detail[:2])
            return str(detail)
        if "message" in payload:
            return str(payload["message"])
        return json.dumps(payload, ensure_ascii=False)[:200]
    if isinstance(payload, list):
        return json.dumps(payload, ensure_ascii=False)[:200]
    if payload is None:
        return "No response body"
    return str(payload)[:200]


def log_result(method: str, path: str, status_code: int, response_text: str = "") -> None:
    status = status_text(status_code)
    if status_code in {200, 201, 202, 204}:
        print(f"[PASS] {method} {path}")
        print(f"Status: {status}")
        if response_text:
            print(f"Response: {response_text}")
        print()
        RESULTS.append({"method": method, "path": path, "status": status_code, "response": response_text})
    else:
        print(f"[FAIL] {method} {path}")
        print(f"Status: {status}")
        print(f"Response: {response_text}")
        print()
        RESULTS.append({"method": method, "path": path, "status": status_code, "response": response_text})
        FAILED.append({"method": method, "path": path, "status": status_code, "reason": response_text})


def log_skip(method: str, path: str, reason: str) -> None:
    print(f"[SKIP] {method} {path}")
    print(f"Reason: {reason}")
    print()
    SKIPPED.append({"method": method, "path": path, "reason": reason})


def make_headers(token: str | None = None) -> Dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def build_test_user_email() -> str:
    return f"test_user_{uuid.uuid4().hex[:12]}@example.com"


def try_register_user(client: TestClient) -> str | None:
    global TEST_EMAIL, TEST_PASSWORD
    if TEST_EMAIL is None:
        TEST_EMAIL = build_test_user_email()

    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "name": "API Test User",
        "role": "PARENT",
        "phone": "+15550000001",
    }
    resp = client.post("/api/auth/register", json=payload)
    body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
    if resp.status_code in {200, 201}:
        token = body.get("access_token")
        if token:
            return token
        return None
    return None


def try_login_user(client: TestClient) -> str | None:
    global TEST_EMAIL, TEST_PASSWORD
    if TEST_EMAIL is None:
        TEST_EMAIL = build_test_user_email()

    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "role": "PARENT",
    }
    resp = client.post("/api/auth/login", json=payload)
    body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
    if resp.status_code == 200:
        token = body.get("access_token")
        if token:
            return token
    return None


def run_tests() -> None:
    global TEST_EMAIL, TEST_PASSWORD, TEST_TOKEN, TEST_CHILD_ID
    client = TestClient(app)
    routes = discover_routes()

    if TEST_EMAIL is None:
        TEST_EMAIL = build_test_user_email()

    # Public endpoints and auth flow
    for method, path in routes:
        if method == "DELETE":
            log_skip(method, path, "Destructive endpoint - skipped for safety")
            continue

        if path == "/health":
            resp = client.get(path)
            log_result(method, path, resp.status_code, response_detail(resp))
            continue

        if path in {"/api/auth/register"}:
            resp = client.post(path, json={
                "email": TEST_EMAIL or build_test_user_email(),
                "password": TEST_PASSWORD,
                "name": "API Test User",
                "role": "PARENT",
                "phone": "+15550000001",
            })
            if resp.status_code in {200, 201}:
                body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                TEST_TOKEN = body.get("access_token")
                TEST_EMAIL = body.get("user", {}).get("email") or TEST_EMAIL or build_test_user_email()
                log_result(method, path, resp.status_code, response_detail(resp))
            else:
                log_result(method, path, resp.status_code, response_detail(resp))
            continue

        if path == "/api/auth/login":
            if TEST_EMAIL is None:
                TEST_EMAIL = build_test_user_email()
            resp = client.post(path, json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "role": "PARENT",
            })
            if resp.status_code == 200:
                body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                TEST_TOKEN = body.get("access_token")
            log_result(method, path, resp.status_code, response_detail(resp))
            continue

        if path in {"/api/auth/me", "/api/users/me"}:
            if not TEST_TOKEN:
                log_skip(method, path, "Authentication-dependent endpoint - no safe test credentials available")
                continue
            resp = client.request(method, path, headers=make_headers(TEST_TOKEN))
            log_result(method, path, resp.status_code, response_detail(resp))
            continue

        if path == "/api/children" and method == "POST":
            if not TEST_TOKEN:
                log_skip(method, path, "Authentication-dependent endpoint - no safe test credentials available")
                continue
            payload = {
                "name": "Test Child",
                "dob": "2021-06-15",
                "gender": "Male",
                "school": "AutiCare Test Academy",
                "grade": "Kindergarten",
                "parent_notes": "Safe test child record created by automated API test runner",
            }
            resp = client.post(path, json=payload, headers=make_headers(TEST_TOKEN))
            if resp.status_code in {200, 201}:
                body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                TEST_CHILD_ID = body.get("id")
            log_result(method, path, resp.status_code, response_detail(resp))
            continue

        if path == "/api/children" and method == "GET":
            if not TEST_TOKEN:
                log_skip(method, path, "Authentication-dependent endpoint - no safe test credentials available")
                continue
            resp = client.get(path, headers=make_headers(TEST_TOKEN))
            log_result(method, path, resp.status_code, response_detail(resp))
            continue

        if path == "/api/assessment" and method == "POST":
            if not TEST_TOKEN:
                log_skip(method, path, "Authentication-dependent endpoint - no safe test credentials available")
                continue
            if TEST_CHILD_ID is None:
                log_skip(method, path, "Resource dependency not available: child profile not created safely")
                continue
            payload = {
                "child_id": TEST_CHILD_ID,
                "answers": {
                    "Q1": 0,
                    "Q2": 1,
                    "Q3": 0,
                    "Q4": 2,
                    "Q5": 1,
                    "Q6": 0,
                    "Q7": 2,
                    "Q8": 1,
                },
            }
            resp = client.post(path, json=payload, headers=make_headers(TEST_TOKEN))
            log_result(method, path, resp.status_code, response_detail(resp))
            continue

        if path == "/api/assessment" and method == "GET":
            if not TEST_TOKEN:
                log_skip(method, path, "Authentication-dependent endpoint - no safe test credentials available")
                continue
            resp = client.get(path, headers=make_headers(TEST_TOKEN))
            log_result(method, path, resp.status_code, response_detail(resp))
            continue

        if path == "/api/prediction" and method == "POST":
            if not TEST_TOKEN:
                log_skip(method, path, "Authentication-dependent endpoint - no safe test credentials available")
                continue
            if TEST_CHILD_ID is None:
                log_skip(method, path, "Resource dependency not available: child profile not created safely")
                continue
            payload = {
                "child_id": TEST_CHILD_ID,
                "answers": {
                    "Q1": 0,
                    "Q2": 1,
                    "Q3": 0,
                    "Q4": 2,
                    "Q5": 1,
                    "Q6": 0,
                    "Q7": 2,
                    "Q8": 1,
                },
            }
            resp = client.post(path, json=payload, headers=make_headers(TEST_TOKEN))
            log_result(method, path, resp.status_code, response_detail(resp))
            continue

        # Catch-all for any other actual route types.
        if not TEST_TOKEN and path not in {"/health"}:
            log_skip(method, path, "Authentication-dependent endpoint - no safe test credentials available")
            continue

        resp = client.request(method, path, headers=make_headers(TEST_TOKEN))
        log_result(method, path, resp.status_code, response_detail(resp))


def print_summary() -> None:
    total = len(RESULTS)
    passed = sum(1 for r in RESULTS if r["status"] in {200, 201, 202, 204})
    failed = sum(1 for r in RESULTS if r["status"] not in {200, 201, 202, 204})
    skipped = len(SKIPPED)

    code_counts = {
        200: 0,
        201: 0,
        202: 0,
        204: 0,
        400: 0,
        401: 0,
        403: 0,
        404: 0,
        422: 0,
        500: 0,
    }
    for item in RESULTS:
        if item["status"] in code_counts:
            code_counts[item["status"]] += 1

    print("========================================")
    print("       AUTICARE API TEST SUMMARY")
    print("========================================")
    print(f"Total Tested: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Skipped: {skipped}")
    print()
    print(f"200 OK: {code_counts[200]}")
    print(f"201 Created: {code_counts[201]}")
    print(f"202 Accepted: {code_counts[202]}")
    print(f"204 No Content: {code_counts[204]}")
    print()
    print("Other Status Codes:")
    print(f"400 Bad Request: {code_counts[400]}")
    print(f"401 Unauthorized: {code_counts[401]}")
    print(f"403 Forbidden: {code_counts[403]}")
    print(f"404 Not Found: {code_counts[404]}")
    print(f"422 Validation Error: {code_counts[422]}")
    print(f"500 Internal Server Error: {code_counts[500]}")
    print()
    print("========================================")
    print("FAILED APIs")
    print("========================================")
    if FAILED:
        for item in FAILED:
            print(f"{item['method']} {item['path']}")
            print(f"Status: {status_text(item['status'])}")
            print(f"Reason: {item['reason']}")
            print()
    else:
        print("None")
    print()
    print("========================================")
    print("SKIPPED APIs")
    print("========================================")
    if SKIPPED:
        for item in SKIPPED:
            print(f"{item['method']} {item['path']}")
            print(f"Reason: {item['reason']}")
            print()
    else:
        print("None")
    print("========================================")


def main() -> None:
    routes = discover_routes()
    print("Discovered routes:")
    for method, path in routes:
        print(f"- {method} {path}")
    print(f"Total discovered routes: {len(routes)}")
    print()
    run_tests()
    print_summary()


if __name__ == "__main__":
    main()
