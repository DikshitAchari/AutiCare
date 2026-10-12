from __future__ import annotations

import json
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.database.connection import SessionLocal
from app.main import app
from app.models.user import User

TEST_EMAIL: Optional[str] = None
TEST_PASSWORD = "Password@123"
RESET_PASSWORD = "NewPassword@123"
ACCESS_TOKEN: Optional[str] = None
USER_ID: Optional[int] = None
CHILD_ID: Optional[int] = None
ASSESSMENT_ID: Optional[int] = None
PREDICTION_ID: Optional[int] = None

RESULTS: List[Dict[str, Any]] = []
FAILED: List[Dict[str, Any]] = []
BLOCKED: List[Dict[str, Any]] = []
SKIPPED: List[Dict[str, Any]] = []


def mask_sensitive(value: Any) -> Any:
    if isinstance(value, dict):
        cleaned: Dict[str, Any] = {}
        for key, item in value.items():
            key_lower = str(key).lower()
            if key_lower == "input" or any(
                token in key_lower
                for token in ["token", "password", "secret", "otp", "key", "authorization", "cookie", "credential"]
            ):
                cleaned[key] = "<redacted>"
            else:
                cleaned[key] = mask_sensitive(item)
        return cleaned
    if isinstance(value, list):
        return [mask_sensitive(item) for item in value]
    return value


def safe_response_detail(resp) -> str:
    try:
        payload = resp.json()
    except Exception:
        payload = resp.text
    payload = mask_sensitive(payload)
    if isinstance(payload, dict):
        if "detail" in payload:
            detail = payload["detail"]
            if isinstance(detail, list):
                return str(detail[:2])
            return str(detail)
        if "message" in payload:
            return str(payload["message"])
        return json.dumps(payload, ensure_ascii=False)[:300]
    if isinstance(payload, list):
        return json.dumps(payload, ensure_ascii=False)[:300]
    if payload is None:
        return "No response body"
    return str(payload)[:300]


def make_headers(token: Optional[str] = None) -> Dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def mask_token(token: Optional[str]) -> str:
    if not token:
        return "<none>"
    return "<redacted>"


def record_result(name: str, status: str, reason: str = "") -> None:
    existing = next((item for item in RESULTS if item["name"] == name), None)
    if existing:
        existing["status"] = status
        existing["reason"] = reason
    else:
        RESULTS.append({"name": name, "status": status, "reason": reason})

    if status == "FAIL":
        if not any(item["name"] == name for item in FAILED):
            FAILED.append({"name": name, "reason": reason})
    elif status == "BLOCKED":
        if not any(item["name"] == name for item in BLOCKED):
            BLOCKED.append({"name": name, "reason": reason})
    elif status == "SKIPPED":
        if not any(item["name"] == name for item in SKIPPED):
            SKIPPED.append({"name": name, "reason": reason})

    print(f"[{status.upper()}] {name}{f' — {reason}' if reason else ''}")


def unique_email(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}@example.com"


def get_database_otp(email: str) -> Optional[str]:
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.lower()).first()
        return getattr(user, "otp", None)
    finally:
        db.close()


def child_payload() -> Dict[str, Any]:
    return {
        "name": "Test Child Alpha",
        "dob": "2021-05-15",
        "gender": "Male",
        "school": "AutiCare Demo Academy",
        "grade": "Kindergarten",
        "parent_notes": "Test child record for API validation.",
    }


def assessment_answers() -> Dict[str, int]:
    return {"Q1": 0, "Q2": 1, "Q3": 0, "Q4": 2, "Q5": 1, "Q6": 0, "Q7": 2, "Q8": 1}


def prediction_answers() -> Dict[str, int]:
    return {"Q1": 0, "Q2": 1, "Q3": 0, "Q4": 2, "Q5": 1, "Q6": 0, "Q7": 2, "Q8": 1}


def run_tests() -> None:
    global TEST_EMAIL, ACCESS_TOKEN, USER_ID, CHILD_ID, ASSESSMENT_ID, PREDICTION_ID
    client = TestClient(app)

    # Health
    health = client.get("/health")
    if health.status_code == 200:
        record_result("Health", "PASS")
    else:
        record_result("Health", "FAIL", safe_response_detail(health))

    # Registration
    email = unique_email("register")
    TEST_EMAIL = email
    reg = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": TEST_PASSWORD,
            "name": "API Registration Test",
            "role": "PARENT",
            "phone": "+15550000003",
        },
    )
    if reg.status_code in {200, 201}:
        data = reg.json()
        ACCESS_TOKEN = data.get("access_token")
        USER_ID = data.get("user", {}).get("id")
        record_result(
            "Registration",
            "PASS",
            f"user_id={USER_ID} token={mask_token(ACCESS_TOKEN)}",
        )
    else:
        record_result("Registration", "FAIL", safe_response_detail(reg))

    # Login
    if ACCESS_TOKEN:
        login = client.post(
            "/api/auth/login",
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "role": "PARENT",
            },
        )
        if login.status_code == 200:
            data = login.json()
            ACCESS_TOKEN = data.get("access_token")
            record_result(
                "Login",
                "PASS",
                f"token={mask_token(ACCESS_TOKEN)} user={data.get('user', {}).get('email')}",
            )
        else:
            record_result("Login", "FAIL", safe_response_detail(login))
    else:
        record_result("Login", "BLOCKED", "Registration did not return a valid access token.")

    # Current User
    if ACCESS_TOKEN:
        me = client.get("/api/auth/me", headers=make_headers(ACCESS_TOKEN))
        if me.status_code == 200:
            me_data = me.json()
            USER_ID = me_data.get("id")
            record_result("Current User", "PASS", f"user_id={USER_ID} email={me_data.get('email')}")
        else:
            record_result("Current User", "FAIL", safe_response_detail(me))
    else:
        record_result("Current User", "BLOCKED", "No access token available.")

    # Child creation and retrieval
    if ACCESS_TOKEN:
        child_resp = client.post("/api/children", json=child_payload(), headers=make_headers(ACCESS_TOKEN))
        if child_resp.status_code == 201:
            child_data = child_resp.json()
            CHILD_ID = child_data.get("id")
            record_result("Child Creation", "PASS", f"child_id={CHILD_ID}")

            list_resp = client.get("/api/children", headers=make_headers(ACCESS_TOKEN))
            if list_resp.status_code == 200:
                list_data = list_resp.json()
                if any(str(item.get("id")) == str(CHILD_ID) for item in list_data):
                    record_result("Child Retrieval", "PASS", f"retrieved_child_id={CHILD_ID}")
                else:
                    record_result("Child Retrieval", "FAIL", "Created child not returned in children list")
            else:
                record_result("Child Retrieval", "FAIL", safe_response_detail(list_resp))
        else:
            record_result("Child Creation", "FAIL", safe_response_detail(child_resp))
            record_result("Child Retrieval", "BLOCKED", "Child creation did not succeed.")
    else:
        record_result("Child Creation", "BLOCKED", "No access token available.")
        record_result("Child Retrieval", "BLOCKED", "No access token available.")

    # Assessment creation and retrieval
    if ACCESS_TOKEN and CHILD_ID:
        assessment_resp = client.post(
            "/api/assessment",
            json={"child_id": CHILD_ID, "answers": assessment_answers()},
            headers=make_headers(ACCESS_TOKEN),
        )
        if assessment_resp.status_code == 201:
            assessment_data = assessment_resp.json()
            ASSESSMENT_ID = assessment_data.get("id")
            record_result("Assessment Creation", "PASS", f"assessment_id={ASSESSMENT_ID}")

            assessment_list = client.get("/api/assessment", headers=make_headers(ACCESS_TOKEN))
            if assessment_list.status_code == 200:
                items = assessment_list.json()
                if any(str(item.get("id")) == str(ASSESSMENT_ID) for item in items):
                    record_result("Assessment Retrieval", "PASS", f"assessment_id={ASSESSMENT_ID}")
                else:
                    record_result("Assessment Retrieval", "FAIL", "Created assessment not returned in list")
            else:
                record_result("Assessment Retrieval", "FAIL", safe_response_detail(assessment_list))
        else:
            record_result("Assessment Creation", "FAIL", safe_response_detail(assessment_resp))
            record_result("Assessment Retrieval", "BLOCKED", "Assessment creation failed.")
    else:
        record_result("Assessment Creation", "BLOCKED", "No usable child profile is available.")
        record_result("Assessment Retrieval", "BLOCKED", "No usable child profile is available.")

    # Prediction creation and retrieval by ID
    if ACCESS_TOKEN and CHILD_ID:
        pred_resp = client.post(
            "/api/prediction",
            json={"child_id": CHILD_ID, "answers": prediction_answers()},
            headers=make_headers(ACCESS_TOKEN),
        )
        if pred_resp.status_code == 201:
            pred_data = pred_resp.json()
            PREDICTION_ID = pred_data.get("id")
            record_result("Prediction Creation", "PASS", f"prediction_id={PREDICTION_ID}")
            if PREDICTION_ID is not None:
                get_pred = client.get(
                    f"/api/prediction/results/{PREDICTION_ID}",
                    headers=make_headers(ACCESS_TOKEN),
                )
                if get_pred.status_code == 200:
                    get_pred_data = get_pred.json()
                    if str(get_pred_data.get("id")) == str(PREDICTION_ID):
                        record_result("Prediction Retrieval By ID", "PASS", f"prediction_id={PREDICTION_ID}")
                    else:
                        record_result("Prediction Retrieval By ID", "FAIL", "Prediction ID mismatch in fetch result")
                else:
                    record_result("Prediction Retrieval By ID", "FAIL", safe_response_detail(get_pred))
            else:
                record_result("Prediction Retrieval By ID", "FAIL", "Prediction creation response did not include an ID")
        else:
            record_result("Prediction Creation", "FAIL", safe_response_detail(pred_resp))
            record_result("Prediction Retrieval By ID", "BLOCKED", "Prediction creation failed.")
    else:
        record_result("Prediction Creation", "BLOCKED", "No valid child profile available.")
        record_result("Prediction Retrieval By ID", "BLOCKED", "No valid prediction ID available.")

    # Forgot Password / OTP verification / Password reset
    reset_email = unique_email("reset")
    reset_user = client.post(
        "/api/auth/register",
        json={
            "email": reset_email,
            "password": TEST_PASSWORD,
            "name": "Reset Password Test",
            "role": "PARENT",
            "phone": "+15550000004",
        },
    )
    if reset_user.status_code in {200, 201}:
        forgot = client.post("/api/auth/forgot-password", json={"email": reset_email})
        if forgot.status_code == 200:
            otp = get_database_otp(reset_email)
            if otp:
                record_result("Forgot Password", "PASS", "OTP generated and stored for the registered user")
                verify = client.post("/api/auth/verify-reset-otp", json={"email": reset_email, "otp": otp})
                if verify.status_code == 200:
                    record_result("OTP Verification", "PASS", "OTP verified successfully")
                    reset_resp = client.post(
                        "/api/auth/reset-password",
                        json={
                            "email": reset_email,
                            "new_password": RESET_PASSWORD,
                            "confirm_password": RESET_PASSWORD,
                        },
                    )
                    if reset_resp.status_code == 200:
                        login_after_reset = client.post(
                            "/api/auth/login",
                            json={"email": reset_email, "password": RESET_PASSWORD, "role": "PARENT"},
                        )
                        if login_after_reset.status_code == 200:
                            record_result("Password Reset", "PASS", "Password reset completed successfully and post-reset login succeeded")
                        else:
                            record_result("Password Reset", "FAIL", safe_response_detail(login_after_reset))
                    else:
                        record_result("Password Reset", "FAIL", safe_response_detail(reset_resp))
                else:
                    record_result("OTP Verification", "FAIL", safe_response_detail(verify))
            else:
                record_result("Forgot Password", "BLOCKED", "OTP was not generated in the database; email/OTP infrastructure prevented automated verification.")
                record_result("OTP Verification", "BLOCKED", "No OTP generated for automated verification.")
                record_result("Password Reset", "BLOCKED", "OTP verification could not be completed.")
        else:
            record_result("Forgot Password", "FAIL", safe_response_detail(forgot))
            record_result("OTP Verification", "BLOCKED", "Forgot-password endpoint did not succeed; OTP verification is unavailable.")
            record_result("Password Reset", "BLOCKED", "Forgot-password endpoint did not succeed; password reset cannot be validated.")
    else:
        record_result("Forgot Password", "BLOCKED", "Could not create the reset test user to exercise the real OTP flow.")
        record_result("OTP Verification", "BLOCKED", "No reset user existed for valid OTP verification.")
        record_result("Password Reset", "BLOCKED", "No reset user existed to validate the flow.")

    # Real Video/AI analyze
    repository_root = Path(__file__).resolve().parents[1]
    video_file = next(
        (
            candidate
            for extension in ("mp4", "avi", "mov")
            for candidate in repository_root.rglob(f"*.{extension}")
            if candidate.is_file()
        ),
        None,
    )
    if not ACCESS_TOKEN or not CHILD_ID:
        record_result("Real Video/AI Analyze", "BLOCKED", "No valid authenticated child profile was available for video analysis.")
    else:
        settings = get_settings()
        blockers = []
        if not settings.ai_video_model_command:
            blockers.append("AI_VIDEO_MODEL_COMMAND is not configured")
        if settings.ai_video_model_path and not Path(settings.ai_video_model_path).is_file():
            blockers.append("configured AI_VIDEO_MODEL_PATH does not exist")
        elif settings.ai_video_model_path and Path(settings.ai_video_model_path).stat().st_size == 0:
            blockers.append("configured AI model file is empty")
        if video_file is None:
            blockers.append("no valid MP4, AVI, or MOV test video exists in the repository")

        if blockers:
            record_result("Real Video/AI Analyze", "BLOCKED", "; ".join(blockers) + ".")
        else:
            mime_type = {
                ".mp4": "video/mp4",
                ".avi": "video/x-msvideo",
                ".mov": "video/quicktime",
            }[video_file.suffix.lower()]
            with open(video_file, "rb") as fh:
                payload = fh.read()
            files = {"file": (video_file.name, payload, mime_type)}
            resp = client.post(
                "/api/prediction/analyze",
                data={"child_id": str(CHILD_ID)},
                files=files,
                headers={"Authorization": f"Bearer {ACCESS_TOKEN}"},
            )
            if resp.status_code == 201:
                record_result("Real Video/AI Analyze", "PASS", f"prediction_id={resp.json().get('id')}")
            else:
                record_result("Real Video/AI Analyze", "FAIL", safe_response_detail(resp))

    # Chat
    if ACCESS_TOKEN:
        chat_request = {"message": "I am looking for a few simple sensory-friendly home activities for a child with autism."}
        chat_response = client.post("/api/chat", json=chat_request, headers=make_headers(ACCESS_TOKEN))
        if chat_response.status_code == 201:
            response_data = chat_response.json()
            record_result("Chat", "PASS", f"response_length={len(response_data.get('response', ''))}")
        else:
            record_result("Chat", "FAIL", safe_response_detail(chat_response))

        history_response = client.get("/api/chat/history", headers=make_headers(ACCESS_TOKEN))
        if history_response.status_code == 200:
            history_data = history_response.json()
            if isinstance(history_data, list) and len(history_data) >= 1:
                record_result("Chat History", "PASS", f"messages={len(history_data)}")
            else:
                record_result("Chat History", "FAIL", "Chat history did not return any messages")
        else:
            record_result("Chat History", "FAIL", safe_response_detail(history_response))
    else:
        record_result("Chat", "BLOCKED", "No access token available.")
        record_result("Chat History", "BLOCKED", "No access token available.")

    print("\n========================================")
    print("AUTICARE API TEST SUMMARY")
    print("========================================")
    passed = sum(1 for item in RESULTS if item["status"] == "PASS")
    failed = sum(1 for item in RESULTS if item["status"] == "FAIL")
    blocked = sum(1 for item in RESULTS if item["status"] == "BLOCKED")
    skipped = sum(1 for item in RESULTS if item["status"] == "SKIPPED")
    total = len(RESULTS)
    print(f"Total: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")
    print(f"Blocked: {blocked}")
    print(f"Skipped: {skipped}")
    print()

    required_names = [
        "Health",
        "Registration",
        "Login",
        "Current User",
        "Child Creation",
        "Child Retrieval",
        "Assessment Creation",
        "Assessment Retrieval",
        "Prediction Creation",
        "Prediction Retrieval By ID",
        "Forgot Password",
        "OTP Verification",
        "Password Reset",
        "Real Video/AI Analyze",
        "Chat",
        "Chat History",
    ]

    for name in required_names:
        match = next((item for item in RESULTS if item["name"] == name), None)
        if match is None:
            record_result(name, "SKIPPED", "Test not run in this session")
            continue
        status = match["status"].upper()
        reason = match["reason"]
        print(f"[{status}] {name}{f' — {reason}' if reason else ''}")

    if FAILED:
        print("\nFAILED REASONS")
        for item in FAILED:
            print(f"- {item['name']}: {item['reason']}")
    if BLOCKED:
        print("\nBLOCKED REASONS")
        for item in BLOCKED:
            print(f"- {item['name']}: {item['reason']}")


if __name__ == "__main__":
    run_tests()
