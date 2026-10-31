# UserHub – Requirements & Implemented Features

UserHub is a full-stack user-management web application.

- **Backend:** Spring Boot 4.x (Java 21), Spring Web MVC, Spring Data JPA, H2 in-memory database, Bean Validation.
- **Frontend:** React 18 + Vite, React Router, Axios, CSS Modules.
- **Architecture:** Controller → Service → Repository (layered).
- **Authentication:** Opaque bearer tokens (random UUIDs) kept in a server-side `ConcurrentHashMap` in `UserService`.
- **Roles:** `USER` (default for new registrations) and `ADMIN`.

Base URL of the API: `http://localhost:8080` · Frontend dev server: `http://localhost:5173`

---

## 1. Feature Summary

| #  | Feature                            | Category   | Endpoint(s)                                   | Status      |
|----|------------------------------------|------------|-----------------------------------------------|-------------|
| 1  | User Registration                  | Core       | `POST /api/auth/register`                     | Implemented |
| 2  | User Login (token-based)           | Core       | `POST /api/auth/login`                        | Implemented |
| 3  | Protected User Dashboard           | Core       | `GET /api/dashboard`                          | Implemented |
| 4  | Admin-only User List API           | Core       | `GET /api/dashboard/users`                    | Implemented |
| 5  | Seed Default ADMIN User            | Additional | – (runs at startup)                           | Implemented |
| 6  | Server-Side Logout                 | Additional | `POST /api/auth/logout`                       | Implemented |
| 7  | Edit My Profile                    | Additional | `PUT /api/users/me`                           | Implemented |
| 8  | Admin Users Page                   | Additional | `GET /api/dashboard/users`                    | Implemented |

---

## 2. Core Features

### 2.1 User Registration

- **Description:** A visitor can create a new account with a full name, email and password.
- **Expected behavior:**
  - The form collects **Full name**, **Email** and **Password** (minimum 8 characters).
  - Backend validation rejects a blank name, a blank or malformed email, and a password shorter than 8 characters (`400 Bad Request` with a field → message map).
  - If the email is already registered, the API responds `409 Conflict` ("Email is already registered!").
  - The password is stored as a SHA-256 hash, never in plain text.
  - New accounts always get the role `USER`, and `createdAt` is set automatically.
  - On success the API returns `201 Created` with the new user's public data (no password), and the app redirects to the login page with an "Account created. You can now log in." message.
  - A logged-in visitor who opens `/register` is redirected to the dashboard.
- **API endpoint:** `POST /api/auth/register`
  - Request: `{ "fullName": "...", "email": "...", "password": "..." }`
  - Response `201`: `{ "id", "fullName", "email", "role", "createdAt" }`
- **Status:** Implemented

### 2.2 User Login (Token-Based Authentication)

- **Description:** A registered user logs in with email and password and receives a session token.
- **Expected behavior:**
  - The user enters email and password; a **Remember me** option controls whether the token is kept in `localStorage` (persistent) or `sessionStorage` (cleared when the browser closes).
  - Invalid email or wrong password returns `401 Unauthorized` ("Invalid email or password") – the same message for both cases.
  - On success the server generates a random UUID token, stores it in the in-memory session map and returns it with the user's data.
  - The frontend sends the token on every API call via an Axios interceptor: `Authorization: Bearer <token>`.
  - A logged-in user who opens `/login` is redirected to the dashboard.
- **API endpoint:** `POST /api/auth/login`
  - Request: `{ "email": "...", "password": "..." }`
  - Response `200`: `{ "token": "...", "user": { "id", "fullName", "email", "role", "createdAt" } }`
- **Status:** Implemented

### 2.3 Protected User Dashboard

- **Description:** An authenticated landing page that shows the user's own profile and community statistics.
- **Expected behavior:**
  - Unauthenticated visitors are redirected to `/login` (`ProtectedRoute`).
  - The dashboard shows a personalised greeting, the user's avatar initials, full name, email, role (with an **Admin** badge for admins), account status and the **total number of registered users**.
  - If the server answers `401` (missing, invalid or logged-out token) the local session is cleared and the user is sent back to the login page.
  - For administrators the dashboard additionally shows the number of administrators and regular users and a "View all users" banner (see 3.4).
- **API endpoint:** `GET /api/dashboard` (requires `Authorization: Bearer <token>`)
  - Response `200`: `{ "profile": { ... }, "totalUserCount": <number> }`
- **Status:** Implemented

### 2.4 Admin-Only User List (Role-Based Access Control)

- **Description:** A protected endpoint that returns every registered user, restricted to administrators.
- **Expected behavior:**
  - A valid token is required (`401` otherwise).
  - The caller must have the role `ADMIN`; regular users receive `403 Forbidden` ("Forbidden: Access denied. Requires ADMIN role.").
  - The list never includes password data.
- **API endpoint:** `GET /api/dashboard/users`
  - Response `200`: `[ { "id", "fullName", "email", "role", "createdAt" }, ... ]`
- **Status:** Implemented

---

## 3. Additional Features

### 3.1 Seed Default ADMIN User (10 pts)

- **Description:** On application startup, make sure at least one administrator account exists so the admin features can be used immediately.
- **Expected behavior:**
  - A `CommandLineRunner` bean (in `UserhubApplication`) runs once at startup and calls `UserService.seedAdminUser()`.
  - If no user with role `ADMIN` exists, the following account is created:
    - Email: `admin@example.com`
    - Password: `Admin@12345` (stored as a SHA-256 hash)
    - Role: `ADMIN`
  - If an admin already exists, nothing happens (no duplicates).
  - If `admin@example.com` is already registered as a regular user, the seed is skipped with a warning – an existing account is never silently promoted.
  - Because the database is in-memory H2, the seed runs on every application restart.
- **API endpoint:** None (startup task).
- **Status:** Implemented

### 3.2 Server-Side Logout (10 pts)

- **Description:** Logging out invalidates the session token on the server, not just in the browser.
- **Expected behavior:**
  - `POST /api/auth/logout` accepts the `Authorization: Bearer <token>` header and removes the token from the `ConcurrentHashMap` of active sessions.
  - Returns `204 No Content` on success.
  - Missing/invalid header or an unknown/already-removed token returns `401 Unauthorized`.
  - After logout, reusing the same token on any protected endpoint returns `401`.
  - In the UI, **Logout** (header) first calls this endpoint via Axios, then clears `localStorage`/`sessionStorage` and navigates to `/login`. If the request fails (e.g. token already expired or server offline) the local session is still cleared.
- **API endpoint:** `POST /api/auth/logout`
- **Status:** Implemented

### 3.3 Edit My Profile (15 pts)

- **Description:** An authenticated user can change their own full name.
- **Expected behavior:**
  - The dashboard's **Edit Profile** button opens a modal with a **Full name** field pre-filled with the current name.
  - Submitting sends `PUT /api/users/me` with `{ "fullName": "..." }`; the name is trimmed server-side and saved to the database.
  - Validation: the name is required and limited to 100 characters (`400` with a message shown inside the modal).
  - An invalid/expired token returns `401`, and the UI sends the user back to the login page.
  - On success the modal closes, a confirmation message is shown, and the new name appears immediately on the dashboard (greeting, profile card, avatar initials) and in the top navigation bar, without a page reload. The cached user in `localStorage` is updated as well.
  - The modal can be dismissed with **Cancel**, the Escape key or by clicking outside it.
  - Only the user's own name can be changed (the target user is taken from the token, not from the URL or body); email and role cannot be modified.
- **API endpoint:** `PUT /api/users/me`
  - Request: `{ "fullName": "New Name" }`
  - Response `200`: `{ "id", "fullName", "email", "role", "createdAt" }`
- **Status:** Implemented

### 3.4 Admin Users Page (15 pts)

- **Description:** A page, available only to administrators, listing all registered users.
- **Expected behavior:**
  - Route `/users`, guarded by `AdminRoute`: not logged in → `/login`; logged in as `USER` → redirected to `/dashboard`. The **Users** link in the top navigation is only shown to admins. The backend independently enforces `ADMIN` (`403`), so the guard cannot be bypassed from the browser.
  - A data table shows every user with the columns **Full name** (with avatar initials and a "(you)" marker for the current admin), **Email**, **Role** (ADMIN/USER badge) and **Member since** (e.g. "Oct 12, 2026").
  - A header chip shows the total number of users; a footer shows "Showing X of Y users" plus the number of administrators and users.
  - Search box filters by name or email; a role dropdown filters by All roles / Admin / User.
  - The administrator's dashboard contains a **View all users** button that routes to this page.
  - The layout follows the provided UI design (UserHub.pdf, "Users" screen).
- **API endpoint:** `GET /api/dashboard/users` (see 2.4)
- **Status:** Implemented

---

## 4. Cross-Cutting Behavior

| Concern                | Behavior                                                                                                                         |
|------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| Error format           | `401`, `403`, `409` → `{ status, error, message, timestamp }`; `400` validation → `{ "<field>": "<message>" }`                    |
| CORS                   | Controllers allow the Vite dev origin `http://localhost:5173`                                                                    |
| Password storage       | SHA-256 hash (hex); plain-text passwords are never stored or returned                                                            |
| Session storage        | Server: `ConcurrentHashMap<token, userId>` (cleared on restart/logout). Client: token in `localStorage` or `sessionStorage`     |
| Route protection (UI)  | `ProtectedRoute` (login required), `AdminRoute` (ADMIN required), `PublicOnly` (login/register hidden when signed in)            |
| Database               | H2 in-memory (`jdbc:h2:mem:userhubdb`); console at `/h2-console`; schema auto-managed by Hibernate (`ddl-auto=update`)          |

## 5. API Reference

| Method | Path                    | Auth            | Success | Errors             | Purpose                  |
|--------|-------------------------|-----------------|---------|--------------------|--------------------------|
| POST   | `/api/auth/register`    | –               | 201     | 400, 409           | Create account           |
| POST   | `/api/auth/login`       | –               | 200     | 400, 401           | Log in, receive token    |
| POST   | `/api/auth/logout`      | Bearer          | 204     | 401                | Invalidate token         |
| GET    | `/api/dashboard`        | Bearer          | 200     | 401                | Own profile + user count |
| GET    | `/api/dashboard/users`  | Bearer + ADMIN  | 200     | 401, 403           | List all users           |
| PUT    | `/api/users/me`         | Bearer          | 200     | 400, 401           | Update own full name     |

## 6. Default Credentials (development only)

| Role  | Email               | Password      | Source                         |
|-------|---------------------|---------------|--------------------------------|
| ADMIN | `admin@example.com` | `Admin@12345` | Seeded at startup (feature 3.1) |
| USER  | *(register your own)* | min. 8 chars | Registration page (feature 2.1) |

## 7. Screenshots

Screenshots of the running application are stored in [`docs/screenshots/`](screenshots/). See [`screenshots/README.md`](screenshots/README.md) for the list of required shots and how to capture them.

| Feature                          | File                                         |
|----------------------------------|----------------------------------------------|
| Registration page                | `screenshots/01-register.png`                |
| Login page                       | `screenshots/02-login.png`                   |
| User dashboard (regular user)    | `screenshots/03-dashboard-user.png`          |
| Admin dashboard                  | `screenshots/04-dashboard-admin.png`         |
| Edit profile modal               | `screenshots/05-edit-profile-modal.png`      |
| Dashboard after name change      | `screenshots/06-edit-profile-updated.png`    |
| Admin users page                 | `screenshots/07-admin-users.png`             |
| Users page filtered / searched   | `screenshots/08-admin-users-filtered.png`    |
| Forbidden for regular user (403) | `screenshots/09-users-forbidden-redirect.png`|
| Logout → login page              | `screenshots/10-logout.png`                  |
| H2 console showing seeded admin  | `screenshots/11-h2-seeded-admin.png`         |
