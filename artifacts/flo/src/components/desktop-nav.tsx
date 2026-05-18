import { useLocation } from "wouter";

interface DesktopNavProps {
  accessToken: string;
}

const FONT = { fontFamily: "Fraunces, serif", fontWeight: 200 } as const;

export default function DesktopNav({ accessToken: _accessToken }: DesktopNavProps) {
  const [location, setLocation] = useLocation();

  const items = [
    { label: "briefing", path: "/briefing" },
    { label: "chat", path: "/chat" },
    { label: "settings", path: "/settings" },
    { label: "plus", path: "/plus" },
  ];

  return (
    <aside
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 flex-col px-6 py-10 z-40 border-r"
      style={{
        background: "linear-gradient(180deg, #0a0a0a, #0f1418)",
        borderColor: "#1a1a1a",
        color: "#e8dfd4",
        ...FONT,
      }}
    >
      <div
        className="text-3xl italic mb-12 px-3"
        style={{ textShadow: "0 0 24px rgba(74,94,110,0.35)" }}
      >
        flo.
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = location === item.path || (item.path !== "/" && location.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className="text-left px-3 py-2.5 text-sm tracking-wide transition-colors rounded-md"
              style={{
                background: active ? "rgba(74,94,110,0.20)" : "transparent",
                borderLeft: active ? "2px solid #4a5e6e" : "2px solid transparent",
                color: active ? "#e8dfd4" : "#8a8a8a",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto text-xs" style={{ color: "#6a6a6a" }}>
        your day, without the noise.
      </div>
    </aside>
  );
}