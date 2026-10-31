# UserHub

UserHub is a full-stack user-management web application. Visitors can register and log in, every user gets a protected dashboard where they can edit their own profile, and administrators get an extra page that lists all registered users.

> Laboratory project – Spring Boot REST API + React single-page app.

## Features

- User registration with validation (hashed passwords)
- Login with token-based authentication (Bearer token)
- Protected user dashboard (profile + total user count)
- Server-side logout (the token is invalidated on the server)
- Edit my profile (change full name)
- Default `ADMIN` account seeded at startup
- Admin-only Users page (name, email, role, member since; search and role filter)

A detailed feature list with endpoints and behavior is in [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md). Screenshots are in [`docs/screenshots/`](docs/screenshots/).

## Technologies Used

| Layer    | Technology |
|----------|------------|
| Backend  | Java 21, Spring Boot 4.1.x (Spring Web MVC, Spring Data JPA, Bean Validation), Maven (wrapper included) |
| Database | H2 (in-memory) with the H2 web console |
| Frontend | React 18, Vite 5, React Router 6, Axios, CSS Modules |
| Auth     | Random UUID bearer tokens held in a server-side `ConcurrentHashMap`; SHA-256 password hashing |

Architecture: **Controller → Service → Repository** (layered).

## System Requirements and Prerequisites

| Tool | Version | Check with |
|------|---------|------------|
| JDK  | **21** or newer | `java -version` |
| Node.js | **18** or newer (20 LTS or 22 recommended) | `node -v` |
| npm  | 9 or newer (bundled with Node.js) | `npm -v` |
| Git  | any recent version | `git --version` |

Maven does **not** need to be installed: the project includes the Maven Wrapper (`mvnw` / `mvnw.cmd`). An internet connection is needed the first time to download dependencies.

Free ports: **8080** (backend) and **5173** (frontend).

## Project Structure

```
.
├── backend/                    Spring Boot REST API
│   ├── pom.xml
│   └── src/main/java/edu/bsit/autentico/
│       ├── controller/         AuthController, DashboardController, UserController
│       ├── service/            UserService (auth, sessions, business logic)
│       ├── repository/         UserRepository (Spring Data JPA)
│       ├── model/              User entity
│       ├── dto/                Request/response records
│       ├── exception/          Custom exceptions + global handler
│       └── UserhubApplication.java   (also seeds the admin user)
├── frontend/                   React + Vite app
│   └── src/
│       ├── api/client.js       Axios instance + session helpers
│       ├── components/         AppShell, route guards
│       ├── pages/              Register, Login, Dashboard, Users
│       └── utils/
└── docs/                       REQUIREMENTS.md and screenshots
```

## Getting the Code

```bash
git clone <your-repository-url>
cd <repository-folder>
```

## Backend Setup and Run

Open a terminal in the `backend` folder.

```bash
cd backend
```

**Windows (PowerShell / CMD):**

```powershell
.\mvnw.cmd spring-boot:run
```

**macOS / Linux:**

```bash
chmod +x mvnw        # first time only
./mvnw spring-boot:run
```

Wait until the log shows `Started UserhubApplication` and `Seeded default admin account: admin@example.com`. The API is then available at **http://localhost:8080**. Keep this terminal open.

Optional: build a runnable JAR instead.

```bash
./mvnw clean package          # use .\mvnw.cmd on Windows
java -jar target/userhub-0.0.1-SNAPSHOT.jar
```

> No database installation is required. H2 runs in memory, so **all data is lost when the backend stops**; the admin account is re-created on every start.

## Frontend Setup and Run

Open a **second** terminal in the `frontend` folder.

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser. Make sure the backend is already running, otherwise registration and login will fail.

Production build (optional):

```bash
npm run build       # output in frontend/dist
npm run preview     # serves the build locally
```

## Application URLs and Ports

| What | URL |
|------|-----|
| Frontend (React app) | http://localhost:5173 |
| Backend REST API | http://localhost:8080/api |
| H2 database console | http://localhost:8080/h2-console |

H2 console login: JDBC URL `jdbc:h2:mem:userhubdb`, user name `sa`, empty password.

Frontend routes: `/register`, `/login`, `/dashboard` (logged-in users), `/users` (admins only).

## Default Admin Account

An administrator is created automatically at startup if none exists:

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `Admin@12345` | `ADMIN` |

Accounts created through the Registration page always receive the role `USER`. Change the default password in `UserService.java` (`DEFAULT_ADMIN_PASSWORD`) if you deploy this anywhere beyond local development.

## How to Test the Application

### 1. Automated test

```bash
cd backend
./mvnw test          # .\mvnw.cmd test on Windows
```

This runs the Spring Boot context-load test.

### 2. Manual test through the UI

1. Open http://localhost:5173/register and create an account (password of at least 8 characters). You are sent to the login page.
2. Log in. The **dashboard** shows your profile and the total number of users.
3. Click **Edit Profile**, enter a new name and save. The new name appears right away on the dashboard and in the top bar.
4. Note that a regular user has no **Users** link; opening http://localhost:5173/users redirects back to the dashboard.
5. Click **Logout**. You return to the login page.
6. Log in as `admin@example.com` / `Admin@12345`. The dashboard shows an **Admin** badge and a **View all users** button.
7. Click **View all users** (or **Users** in the navigation). The table lists every user with Full name, Email, Role and Member since. Try the search box and the role filter.

### 3. Test the API directly (curl)

On Windows PowerShell use `curl.exe` instead of `curl` and put the JSON body in single quotes with escaped double quotes, or use Git Bash.

```bash
# Register
curl -i -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test User","email":"test@example.com","password":"password123"}'

# Log in as the seeded admin – copy the "token" value from the response
curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@12345"}'

TOKEN=<paste-token-here>

# Dashboard (profile + total users)
curl -i http://localhost:8080/api/dashboard -H "Authorization: Bearer $TOKEN"

# List all users (ADMIN only; a regular user's token returns 403)
curl -i http://localhost:8080/api/dashboard/users -H "Authorization: Bearer $TOKEN"

# Edit my profile
curl -i -X PUT http://localhost:8080/api/users/me \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"fullName":"New Admin Name"}'

# Logout (204), then reuse the same token – it must now return 401
curl -i -X POST http://localhost:8080/api/auth/logout -H "Authorization: Bearer $TOKEN"
curl -i http://localhost:8080/api/dashboard -H "Authorization: Bearer $TOKEN"
```

### API summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | – | Create an account (201, 400, 409) |
| POST | `/api/auth/login` | – | Log in, returns `token` + `user` (200, 401) |
| POST | `/api/auth/logout` | Bearer | Invalidate the token (204, 401) |
| GET | `/api/dashboard` | Bearer | Own profile + total user count |
| GET | `/api/dashboard/users` | Bearer, ADMIN | All users (403 for non-admins) |
| PUT | `/api/users/me` | Bearer | Update own full name |

## Additional Configuration

The defaults work out of the box. Change these only if needed:

| Need | Where |
|------|-------|
| Backend port (default 8080) | Add `server.port=XXXX` to `backend/src/main/resources/application.properties` |
| API address used by the frontend | `baseURL` in `frontend/src/api/client.js` (default `http://localhost:8080/api`) |
| Allowed frontend origin (CORS) | `@CrossOrigin(origins = "http://localhost:5173")` in the three controllers; update it if the frontend runs on another port/host |
| Frontend port (default 5173) | `npm run dev -- --port 3000` (then update the CORS origin above) |
| Default admin credentials | Constants at the top of `UserService.java` |
| Persistent database | Replace the H2 URL in `application.properties` (for example `jdbc:h2:file:./data/userhub`), or switch to MySQL/PostgreSQL with its driver dependency |

## Troubleshooting

- **`Port 8080 was already in use`** – stop the other process or set `server.port` as shown above (and update `baseURL` in the frontend).
- **Login/registration shows a network error** – the backend is not running, or the frontend is not served from `http://localhost:5173` (CORS).
- **`Permission denied: ./mvnw`** (macOS/Linux) – run `chmod +x mvnw`.
- **Wrong Java version / `release version 21 not supported`** – install JDK 21 and make sure `java -version` and `JAVA_HOME` point to it.
- **`Cannot find module @rollup/rollup-...` when running Vite** – a known npm issue with lockfiles created on another operating system. Delete `frontend/node_modules` and `frontend/package-lock.json`, then run `npm install` again.
- **You were logged out after restarting the backend** – expected: sessions and the in-memory database are cleared on every restart. Log in again (register users again if needed).

## Documentation

- [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) – full list of implemented features, endpoints and status
- [`docs/screenshots/`](docs/screenshots/) – screenshots of the running application
