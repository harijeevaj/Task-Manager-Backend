import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { request } from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await request("/api/auth/login", "POST", form);
    setLoading(false);

    if (res.success) {
      localStorage.setItem("token", res.data.tokens.accessToken);
      navigate("/");
    } else {
      alert(res.error?.message || "Login failed");
    }
  };

  return (
    <div className="page page-fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="app-title">Task Manager</h1>
          <p className="app-subtitle">
            Welcome back! Log in to see and manage your tasks.
          </p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field-label">Email</label>
          <input
            className="input"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange("email")}
          />

          <label className="field-label">Password</label>
          <input
            className="input"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange("password")}
          />

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="auth-footer-text">
          New here?{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => navigate("/register")}
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}
