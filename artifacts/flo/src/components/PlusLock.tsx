import { Link } from "wouter";
import { FloFace } from "./FloFace";

export function PlusLock({ feature }: { feature: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl text-center"
      style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
    >
      <FloFace size={60} float />
      <p style={{ color: "#e8dfd4", fontFamily: "Fraunces, serif", fontWeight: 200 }}>
        this is a flo. plus feature
      </p>
      <p style={{ color: "#6a6a6a", fontFamily: "Fraunces, serif", fontWeight: 200, fontSize: 13 }}>
        unlock {feature.toLowerCase()} and more
      </p>
      <Link
        href="/plus"
        className="px-5 py-2 rounded-full text-sm"
        style={{ background: "#e8dfd4", color: "#0f0f0f", fontFamily: "Fraunces, serif", fontWeight: 200 }}
      >
        upgrade to flo. plus
      </Link>
    </div>
  );
}