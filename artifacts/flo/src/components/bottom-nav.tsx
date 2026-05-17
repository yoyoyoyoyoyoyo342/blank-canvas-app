import { useLocation } from "wouter";

interface BottomNavProps {
  accessToken: string;
}

export default function BottomNav({ accessToken }: BottomNavProps) {
  const [location, setLocation] = useLocation();

  const items = [
    {
      label: "briefing",
      path: "/",
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.5 : 1} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      label: "chat",
      path: "/chat",
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.5 : 1} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      label: "settings",
      path: "/settings",
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.5 : 1} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-border/20 bg-background/95 backdrop-blur-sm z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto h-16 px-6">
        {items.map((item) => {
          const active = location === item.path || (item.path !== "/" && location.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center gap-1 transition-colors duration-200 ${
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              {item.icon(active)}
              <span className="text-xs tracking-widest uppercase">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
