import { useEffect, useState } from "react";

const LOGIN_URL = "http://login.example.com:8080/login";
const LOGOUT_URL = "http://login.example.com:8080/logout";
const ME_URL = "http://api.example.com:8081/me";
const OTHER_SITE_URL = "http://app2.example.com:3001";

export default function App() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("1234");
  const [message, setMessage] = useState("");
  const [authStatus, setAuthStatus] = useState("Unknown");
  const isLoggedIn = authStatus === "Logged in";

  const checkSession = async () => {
    setAuthStatus("Checking...");
    try {
      const res = await fetch(ME_URL, {
        method: "GET",
        // Required so the browser sends session_id to api.example.com on this cross-origin request.
        credentials: "include"
      });

      if (res.ok) {
        setAuthStatus("Logged in");
      } else {
        setAuthStatus("Not logged in");
      }
    } catch (_) {
      setAuthStatus("Not logged in");
    }
  };

  const handleLogin = async () => {
    setMessage("Logging in...");

    try {
      const res = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Required for cookie auth across origins: without this, browser will ignore Set-Cookie and omit cookies.
        credentials: "include",
        body: JSON.stringify({ username, password })
      });

      if (!res.ok) {
        const text = await res.text();
        setMessage(`Login failed: ${text}`);
        return;
      }

      setMessage("Login successful.");
      await checkSession();
    } catch (err) {
      setMessage(`Request error: ${err.message}`);
    }
  };

  const handleLogout = async () => {
    setMessage("Logging out...");
    try {
      const res = await fetch(LOGOUT_URL, {
        method: "POST",
        // Required so the cookie clear response from login.example.com is applied by the browser.
        credentials: "include"
      });

      if (!res.ok) {
        const text = await res.text();
        setMessage(`Logout failed: ${text}`);
        return;
      }

      setMessage("Logged out successfully.");
      setAuthStatus("Not logged in");
    } catch (err) {
      setMessage(`Request error: ${err.message}`);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <div className="container">
      <h1>Site A: app.example.com</h1>

      <p className="explain">
        This site and Site B both use <strong>login.example.com</strong>. The
        cookie is set on <strong>.example.com</strong>, so one login is shared.
      </p>

      <section className="card">
        <p className="status">
          Session status: <strong>{authStatus}</strong>
        </p>

        {isLoggedIn ? (
          <div className="actions">
            <button onClick={checkSession}>Check Session</button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="actions">
              <button onClick={handleLogin}>Login</button>
              <button onClick={checkSession}>Check Session</button>
            </div>
          </>
        )}

        <p>{message}</p>
      </section>

      <div className="next">
        <a href={OTHER_SITE_URL} target="_blank" rel="noreferrer">
          Open Site B (app2.example.com:3001)
        </a>
      </div>
    </div>
  );
}
