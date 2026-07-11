"use client";

import { useState } from "react";

type LoginFormProps = {
  demoEmail: string;
  demoPassword: string;
  errorMessage?: string;
};

export function LoginForm({
  demoEmail,
  demoPassword,
  errorMessage,
}: LoginFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <form
      action="/api/session"
      className="op-login-form mt-6 space-y-5"
      method="post"
      onSubmit={() => {
        setIsSubmitting(true);
      }}
    >
      <div className="op-login-access-note">
        <span aria-hidden="true" />
        <p>Demo access is prefilled for review.</p>
      </div>

      {errorMessage ? (
        <div
          className="op-form-error rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#991b1b]"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      <div>
        <label className="text-sm font-medium text-[#334155]" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="op-field mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none"
          defaultValue={demoEmail}
          id="email"
          name="email"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-[#334155]" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="op-field mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none"
          defaultValue={demoPassword}
          id="password"
          name="password"
          type="password"
        />
      </div>

      <button
        aria-busy={isSubmitting || undefined}
        className="op-button op-button-primary w-full px-4"
        data-pending={isSubmitting || undefined}
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? "Opening workspace..." : "Sign in"}
      </button>
    </form>
  );
}
