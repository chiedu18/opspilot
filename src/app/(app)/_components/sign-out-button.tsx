export function SignOutButton() {
  return (
    <form action="/logout" method="get">
      <button
        className="op-focus-ring op-pressable rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
        type="submit"
      >
        Sign out
      </button>
    </form>
  );
}
