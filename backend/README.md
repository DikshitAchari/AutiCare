# AutiCare Backend

AutiCare backend is a FastAPI service for authentication, child profiles, autism screening assessment storage, and screening prediction logic for the AutiCare project.

## Purpose

This backend provides the API layer for the existing React frontend while keeping the frontend and backend separate. It supports:

- user registration and login
- role-based access for parent, therapist, and admin accounts
- child profile management
- autism screening assessment submission and storage
- AI-assisted preliminary prediction results
- secure JWT-based authentication

## Project Structure

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── security.py
│   ├── database/
│   │   ├── __init__.py
│   │   └── connection.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── assessment.py
│   │   └── prediction.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── user.py
│   └── services/
│       ├── __init__.py
│       ├── auth_service.py
│       ├── assessment_service.py
│       └── prediction_service.py
├── tests/
│   ├── __init__.py
│   └── test_api.py
├── .env.example
├── .gitignore
├── requirements.txt
├── README.md
└── autocare.db (created after database setup)
```

## Python Version

Recommended version: Python 3.11+

## Installation

```bash
cd AutiCare/backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Environment Variables

Create a `.env` file based on `.env.example`.

```bash
cp .env.example .env
```

Edit the file with your own values.

Example:

```env
SECRET_KEY=your-long-random-secret
DATABASE_URL=sqlite:///./auticare.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Database Setup

The app uses SQLAlchemy and SQLite by default for local development.

```bash
python -c "from app.database.connection import Base, engine; Base.metadata.create_all(bind=engine)"
```

This creates the database file `auticare.db` in the backend folder.

## Start the API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Base URL

```text
http://localhost:8000
```

## Swagger / OpenAPI Docs

```text
http://localhost:8000/docs
http://localhost:8000/redoc
```

## Postman Instructions

1. Open Postman.
2. Create a new request.
3. Set the base URL to `http://localhost:8000`.
4. Use the endpoints below.
5. For protected routes, add the JWT token in the Authorization header:

```http
Authorization: Bearer <token>
```

## React Frontend Connection

The existing frontend should connect to the backend using the API base URL configured in a frontend environment variable or a centralized fetch wrapper. The backend is configured with CORS so local React development from `http://localhost:5173` can call the API without changing the frontend UI logic.

Example frontend request pattern:

```ts
const res = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'parent@test.com', password: '123456', role: 'PARENT' })
});
```

## Example API Requests

### Register

```http
POST http://localhost:8000/api/auth/register
Content-Type: application/json

{
  "email": "parent3@test.com",
  "password": "123456",
  "name": "Aisha Khan",
  "role": "PARENT",
  "phone": "+91 9988776655"
}
```

### Login

```http
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "email": "parent@test.com",
  "password": "123456",
  "role": "PARENT"
}
```

### Submit assessment

```http
POST http://localhost:8000/api/assessment
Content-Type: application/json
Authorization: Bearer <token>

{
  "child_id": "child-uuid",
  "answers": {
    "Q1": 0,
    "Q2": 1,
    "Q3": 0,
    "Q4": 2,
    "Q5": 1,
    "Q6": 0,
    "Q7": 2,
    "Q8": 1
  }
}
```

### Prediction

```http
POST http://localhost:8000/api/prediction
Content-Type: application/json
Authorization: Bearer <token>

{
  "child_id": "child-uuid",
  "answers": {
    "Q1": 0,
    "Q2": 1,
    "Q3": 0,
    "Q4": 2,
    "Q5": 1,
    "Q6": 0,
    "Q7": 2,
    "Q8": 1
  }
}
```

## Notes

- The app is designed as a screening support system and should not claim formal medical diagnosis.
- The prediction service is a placeholder for future ML integration.
- Keep the frontend and backend projects separate.
