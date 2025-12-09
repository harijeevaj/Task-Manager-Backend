import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { request } from "../api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await request("/api/auth/register", "POST", form);
    setLoading(false);

    if (res.success) {
      navigate("/login");
    } else {
      alert(res.error?.message || "Registration failed");
    }
  };

  return (
    <div className="page page-fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="app-title">Task Manager</h1>
          <p className="app-subtitle">Create an account to manage your tasks smarter.</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field-label">Username</label>
          <input
            className="input"
            placeholder="Enter your username"
            value={form.username}
            onChange={handleChange("username")}
          />

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
            placeholder="Enter a strong password"
            value={form.password}
            onChange={handleChange("password")}
          />

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{" "}
          <button
            type="button"
            className="link-button"
            onClick={() => navigate("/login")}
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
