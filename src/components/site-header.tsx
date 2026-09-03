import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Restposten
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/listings" className="text-foreground/80 hover:text-foreground">
            Marktplatz
          </Link>
          <Link href="/sell/new" className="text-foreground/80 hover:text-foreground">
            Verkaufen
          </Link>
        </nav>
      </div>
    </header>
  );
}
