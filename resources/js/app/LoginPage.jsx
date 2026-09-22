import React, { useState } from "react";
import { Icon } from "@iconify/react";

function csrfToken() {
  return (
    document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content") ?? ""
  );
}

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");

  const update = (field) => (event) =>
    setForm((previous) => ({
      ...previous,
      [field]:
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value,
    }));

  const submit = async (event) => {
    event.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrors({});

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-TOKEN": csrfToken(),
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });

      if (response.ok || response.redirected) {
        window.location.href = "/dashboard";
        return;
      }

      if (response.status === 422) {
        const payload = await response.json();
        setErrors(payload.errors ?? {});
        setStatus("idle");
        return;
      }

      if (response.status === 419) {
        setErrors({
          email: ["Your session expired. Please reload and retry."],
        });
        setStatus("idle");
        return;
      }

      throw new Error("Unexpected response");
    } catch {
      setErrors({
        email: ["Could not reach the server. Check your connection."],
      });
      setStatus("idle");
    }
  };

  const fieldError = (field) => errors[field]?.[0];

  return (
    <div className="auth-shell">
      <a className="auth-brand" href="/">
        <span className="portal-brand-mark" aria-hidden="true">
          GW
        </span>
        <span>GridWatch</span>
      </a>

      <form className="auth-card" onSubmit={submit} noValidate>
        <header>
          <h2>Sign in to GridWatch</h2>
          <p>Dispatcher access for SORECO I &amp; II.</p>
        </header>

        <label className="auth-field">
          <span>Email address</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            value={form.email}
            onChange={update("email")}
            aria-invalid={Boolean(fieldError("email"))}
            aria-describedby={fieldError("email") ? "email-error" : undefined}
          />
          {fieldError("email") && (
            <small id="email-error" className="auth-error">
              {fieldError("email")}
            </small>
          )}
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={update("password")}
            aria-invalid={Boolean(fieldError("password"))}
            aria-describedby={
              fieldError("password") ? "password-error" : undefined
            }
          />
          {fieldError("password") && (
            <small id="password-error" className="auth-error">
              {fieldError("password")}
            </small>
          )}
        </label>

        <div className="auth-row">
          <label className="auth-check">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={update("remember")}
            />
            <span>Keep me signed in</span>
          </label>
          <a className="text-action" href="/forgot-password">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          className="primary-action auth-submit"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Signing in…" : "Sign in to dashboard"}
        </button>

        <p className="auth-foot">
          <a href="/">
            <Icon icon="lucide:arrow-left" width="14" height="14" aria-hidden="true" />
            Back to public outage map
          </a>
        </p>
      </form>

      <p className="auth-note">
        Authorised personnel only. Activity is logged.
      </p>
    </div>
  );
}
