# Cookie-Based SSO Demo (Go + React)

Minimal working example showing cookie-based authentication shared across subdomains:

- `login.example.com` -> Go authentication server
- `api.example.com` -> Go API server
- `app.example.com` -> React frontend client 1
- `app2.example.com` -> React frontend client 2

After logging in at `login.example.com`, the browser stores a `session_id` cookie for `.example.com` and automatically sends it to `api.example.com`, allowing both frontend clients to verify authentication status with the same auth session.

## Project Structure

```text
project-root/
	login-server/
	api-server/
	frontend/
  frontend-2/
```

## Why This Works Across Subdomains

The login server sets:

- `Domain=.example.com`
- `Path=/`

Because the cookie domain is `.example.com`, the browser can send the same cookie to sibling subdomains like `login.example.com`, `api.example.com`, `app.example.com`, and `app2.example.com`.

`SameSite=Lax` is used in this demo. Lax allows cookie sending for same-site contexts and top-level navigations while reducing some CSRF exposure compared with `SameSite=None`.

## Local Hosts Setup

Add these entries to your hosts file:

```text
127.0.0.1 login.example.com
127.0.0.1 api.example.com
127.0.0.1 app.example.com
127.0.0.1 app2.example.com
```

On macOS, edit:

```bash
sudo nano /etc/hosts
```

## Backend Details

### Login Server

- Endpoint: `POST http://login.example.com:8080/login`
- Accepts JSON body:

```json
{
  "username": "admin",
  "password": "1234"
}
```

- Hardcoded credentials:
  - username: `admin`
  - password: `1234`
- On success, sets cookie:
  - Name: `session_id`
  - Domain: `.example.com`
  - Path: `/`
  - HttpOnly: `true`
  - Secure: `false` (local testing only)
  - SameSite: `Lax`

### Logout Endpoint

- Endpoint: `POST http://login.example.com:8080/logout`
- Clears the shared `session_id` cookie at `Domain=.example.com` and `Path=/`
- Because the cookie is shared, logout from one client logs out all clients

### API Server

- Endpoint: `GET http://api.example.com:8081/me`
- Reads `session_id` cookie
- If cookie exists, returns:

```json
{ "user": "admin" }
```

- If cookie is missing, returns `401 Unauthorized`

### CORS

Both servers allow:

- Origin: `http://app.example.com:3000`
- Origin: `http://app2.example.com:3001`
- Credentials: `true`

This is required because the frontend and backend are cross-origin (different subdomains/ports), and credentialed requests need explicit CORS headers.

## Frontend Details

Both React clients contain:

1. Login Page
   - Username input
   - Password input
   - Login button
   - Sends `POST /login` with `credentials: "include"`

2. Dashboard Page
   - On load, calls `GET /me` with `credentials: "include"`

- Includes a Logout button that sends `POST /logout` with `credentials: "include"`
- Shows `User is logged in` if authorized
- Shows `Not logged in` if unauthorized

`credentials: "include"` is mandatory. Without it, the browser will not include cookies in cross-origin fetch requests, and may ignore cross-origin `Set-Cookie` handling.

## Run Instructions

Open four terminals from project root.

1. Start login server

```bash
cd login-server
go run .
```

2. Start API server

```bash
cd api-server
go run .
```

3. Start frontend client 1

```bash
cd frontend
npm install
npm run dev
```

4. Start frontend client 2

```bash
cd frontend-2
npm install
npm run dev
```

Then open:

```text
http://app.example.com:3000
http://app2.example.com:3001
```

## Quick Test Flow

1. Open `http://app.example.com:3000` and log in with `admin` / `1234`.
2. Open `http://app2.example.com:3001` and go to Dashboard.
3. You should see `User is logged in` without logging in again, proving shared auth across multiple clients.
4. Click Logout on either client.
5. Refresh Dashboard on both clients and you should see `Not logged in` on both.

## Security Notes (Important)

- In production, set `Secure=true` so cookies are sent only over HTTPS.
- In production, HTTPS is required for secure cookie handling.
- `Domain=.example.com` is required when you want one cookie shared by multiple subdomains.
- This demo is intentionally minimal and does not include CSRF protection, server-side session storage, or rotating session IDs.
