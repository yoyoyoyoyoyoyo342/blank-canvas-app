import { useLocation } from "wouter";

export default function Footer() {
  const [, setLocation] = useLocation();

  return (
    <footer className="w-full py-6 mt-auto">
      <p className="text-center text-xs text-muted-foreground/50 tracking-wide">
        flo. by Locali Labs{" "}
        <span className="mx-1">·</span>
        <button onClick={() => setLocation("/privacy")} className="hover:text-muted-foreground transition-colors">
          privacy
        </button>
        <span className="mx-1">·</span>
        <button onClick={() => setLocation("/cookies")} className="hover:text-muted-foreground transition-colors">
          cookies
        </button>
        <span className="mx-1">·</span>
        <button onClick={() => setLocation("/terms")} className="hover:text-muted-foreground transition-colors">
          terms
        </button>
      </p>
    </footer>
  );
}
