"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SidebarNavItem = {
  label: string;
  href?: string;
  key?: string;
  onSelect?: () => void;
  isActive?: boolean;
};

export function SidebarNav({
  items,
}: {
  items?: SidebarNavItem[];
}) {
  const pathname = usePathname();
  const navItems = items ?? [];

  if (navItems.length === 0) {
    return null;
  }

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = item.isActive ?? (item.href ? pathname === item.href : false);
          const content = (
            <span className={isActive ? "nav-link active" : "nav-link"}>{item.label}</span>
          );

          if (item.onSelect) {
            return (
              <button key={item.key ?? item.label} type="button" onClick={item.onSelect} className={isActive ? "nav-button active" : "nav-button"}>
                {content}
              </button>
            );
          }

          if (!item.href) {
            return (
              <button key={item.key ?? item.label} type="button" className={isActive ? "nav-button active" : "nav-button"}>
                {content}
              </button>
            );
          }

          return (
            <Link key={item.href} href={item.href} className={isActive ? "nav-link active" : "nav-link"}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
