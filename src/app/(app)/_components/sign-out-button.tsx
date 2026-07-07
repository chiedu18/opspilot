export function SignOutButton() {
  return (
    <form action="/logout" method="get">
      <button
        className="rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#99f6e4]"
        type="submit"
      >
        Sign out
      </button>
    </form>
  );
}
