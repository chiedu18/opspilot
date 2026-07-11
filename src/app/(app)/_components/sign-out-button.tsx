export function SignOutButton() {
  return (
    <form action="/logout" method="get">
      <button
        className="op-button op-button-secondary px-3"
        type="submit"
      >
        Sign out
      </button>
    </form>
  );
}
