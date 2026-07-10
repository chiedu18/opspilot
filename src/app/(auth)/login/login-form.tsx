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
  return (
    <form action="/api/session" className="mt-5 space-y-4" method="post">
      {errorMessage ? (
        <div
          className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#991b1b]"
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
          className="op-focus-ring op-interactive mt-1 w-full rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#99f6e4]"
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
          className="op-focus-ring op-interactive mt-1 w-full rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#99f6e4]"
          defaultValue={demoPassword}
          id="password"
          name="password"
          type="password"
        />
      </div>

      <button
        className="op-focus-ring op-pressable w-full rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#115e59]"
        type="submit"
      >
        Sign in
      </button>
    </form>
  );
}
