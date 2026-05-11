"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, FileText, Image as ImageIcon, MessageCircle,
  Users, ShieldCheck, LogOut, User, Tent, HeartHandshake, Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/logo";
import type { UserRole } from "@/lib/types";

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; roles?: UserRole[] };

const items: Item[] = [
  { href: "/feed",        label: "Actualités",  icon: Home },
  { href: "/trips",       label: "Séjours",     icon: Tent },
  { href: "/documents",   label: "Documents",   icon: FileText },
  { href: "/photos",      label: "Photos",      icon: ImageIcon },
  { href: "/messages",    label: "Messagerie",  icon: MessageCircle },
  { href: "/family",      label: "Ma famille",  icon: HeartHandshake, roles: ["parent"] },
  { href: "/profile",     label: "Mon profil",  icon: User },
  { href: "/admin/exchanges",     label: "Échanges familles", icon: Inbox,      roles: ["admin"] },
  { href: "/admin/families",      label: "Familles",     icon: Users,       roles: ["admin"] },
  { href: "/admin/users",         label: "Utilisateurs", icon: ShieldCheck, roles: ["admin"] },
];

export default function Nav({
  role,
  name,
}: { role: UserRole; name: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-slate-100 bg-white">
      <div className="h-20 flex items-center px-5 border-b border-slate-100">
        <Logo size="sm" />
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {items
          .filter((i) => !i.roles || i.roles.includes(role))
          .map((i) => {
            const active = pathname === i.href || pathname.startsWith(i.href + "/");
            const Icon = i.icon;
            return (
              <Link
                key={i.href}
                href={i.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  active
                    ? "bg-brand-50 text-brand-600"
                    : "text-slate-700 hover:bg-slate-50 hover:text-ink",
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-brand-500" />
                )}
                <Icon className={cn("w-4 h-4", active ? "text-brand-500" : "text-slate-400")} />
                {i.label}
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-display font-semibold">
            {initials(name)}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{name}</div>
            <div className="text-xs text-slate-500 capitalize">{role}</div>
          </div>
        </div>
        <form action="/auth/signout" method="post">
          <button className="btn-secondary w-full text-sm" type="submit">
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  );
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
