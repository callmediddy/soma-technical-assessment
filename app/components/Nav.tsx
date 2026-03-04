"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  itemCount?: number;
}

export default function Nav({ itemCount }: Props) {
  const pathname = usePathname();

  const links = [
    { href: "/",       label: "Tasks" },
    { href: "/graph",  label: "Graph" },
  ];

  return (
    <header className="border-b border-neutral-800 sticky top-0 bg-black z-10">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.ico" alt="Soma" width={20} height={20} />
          </div>
          <nav className="flex items-center gap-1">
            {links.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-500 hover:text-neutral-200"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        {itemCount !== undefined && (
          <span className="text-neutral-500 text-xs">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
        )}
      </div>
    </header>
  );
}
