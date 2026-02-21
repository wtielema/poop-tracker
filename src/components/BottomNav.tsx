"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  icon: string;
  label: string;
  route: string;
  isCenter?: boolean;
};

const tabs: Tab[] = [
  { icon: "\u{1F3E0}", label: "Home", route: "/" },
  { icon: "\u{1F3C6}", label: "Board", route: "/board" },
  { icon: "\u{1F4A9}", label: "Log", route: "/log", isCenter: true },
  { icon: "\u{1F5FA}\uFE0F", label: "Map", route: "/map" },
  { icon: "\u{1F464}", label: "Profile", route: "/profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-end justify-around pb-[env(safe-area-inset-bottom)]"
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.route === "/"
          ? pathname === "/"
          : pathname.startsWith(tab.route);

        if (tab.isCenter) {
          return (
            <Link
              key={tab.route}
              href={tab.route}
              className="flex flex-col items-center justify-center -mt-4 tap-bounce"
              style={{ textDecoration: "none" }}
            >
              <div
                className="flex items-center justify-center rounded-full shadow-lg"
                style={{
                  width: 56,
                  height: 56,
                  background: "var(--primary)",
                  boxShadow: "0 4px 12px rgba(139, 94, 60, 0.35)",
                  fontSize: 28,
                  transition: "transform 0.2s ease",
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                }}
              >
                {tab.icon}
              </div>
              <span
                className="mt-1"
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? "var(--primary)" : "var(--muted)",
                  transition: "color 0.2s ease",
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={tab.route}
            href={tab.route}
            className="flex flex-col items-center justify-center py-2 tap-bounce"
            style={{
              textDecoration: "none",
              minWidth: 56,
              height: 64,
            }}
          >
            <span
              style={{
                fontSize: 24,
                transition: "transform 0.2s ease",
                transform: isActive ? "scale(1.15)" : "scale(1)",
                display: "block",
              }}
            >
              {tab.icon}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? "var(--primary)" : "var(--muted)",
                marginTop: 2,
                transition: "color 0.2s ease",
              }}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
