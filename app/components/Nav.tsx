import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function Nav() {
  return (
    <header className="w-full px-6 py-4 flex items-center justify-between text-sm text-ink-quiet">
      <Link href="/" className="tracking-wide">
        Drill
      </Link>
      <nav className="flex gap-5">
        <Link href="/archive" className="hover:text-ink">
          Archive
        </Link>
        <Link href="/map" className="hover:text-ink">
          Map
        </Link>
        <Link href="/brain" className="hover:text-ink">
          Brain
        </Link>
        <LogoutButton />
      </nav>
    </header>
  );
}
