"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tent, FileText, MessageCircle, User, Users, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

export default function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = [
    { href: "/feed",      label: "Accueil",   icon: Home },
    { href: "/trips",     label: "Séjours",   icon: Tent },
    role === "parent"
      ? { href: "/family", label: "Famille", icon: HeartHandshake }
      : { href: "/documents", label: "Documents", icon: FileText },
    { href: "/messages",  label: "Messages",  icon: MessageCircle },
    role === "admin"
      ? { href: "/admin/users", label: "Admin", icon: Users }
      : { href: "/profile", label: "Profil", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-slate-100 bg-white/95 backdrop-blur z-20">
      <ul className="grid grid-cols-5">
        {items.map((i) => {
          const active = pathname.startsWith(i.href);
          const Icon = i.icon;
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition",
                  active ? "text-brand-500" : "text-slate-500",
                )}
              >
                <Icon className={cn("w-5 h-5", active && "drop-shadow-[0_2px_6px_rgba(249,97,0,0.4)]")} />
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
