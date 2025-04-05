"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Người chơi", href: "/players" },
  ];

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container">
        <Link href="/" className="font-bold text-xl flex items-center mr-8">
          <span>DNA Game</span>
        </Link>
        <div className="flex items-center space-x-4 lg:space-x-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
