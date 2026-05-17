import floMascot from "@/assets/flo-mascot.png";
import { motion } from "framer-motion";

interface FloFaceProps {
  size?: number;
  float?: boolean;
  pulse?: boolean;
  className?: string;
}

export function FloFace({ size = 40, float = false, pulse = false, className }: FloFaceProps) {
  const animate = pulse
    ? { scale: [1, 1.05, 1] }
    : float
    ? { y: [0, -4, 0] }
    : undefined;
  const transition = pulse
    ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" as const }
    : float
    ? { duration: 3, repeat: Infinity, ease: "easeInOut" as const }
    : undefined;

  return (
    <motion.img
      src={floMascot}
      alt="flo."
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: size * 0.22 }}
      animate={animate}
      transition={transition}
      className={className}
      draggable={false}
    />
  );
}

export function FloLoading({ label = "getting your day ready..." }: { label?: string }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-6" style={{ background: "#0f0f0f" }}>
      <FloFace size={120} pulse />
      <p className="italic" style={{ color: "#e8dfd4", fontFamily: "Fraunces, serif", fontWeight: 200 }}>
        {label}
      </p>
    </div>
  );
}

export function FloEmpty({ message, size = 60 }: { message: string; size?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <FloFace size={size} float />
      <p style={{ color: "#8a8a8a", fontFamily: "Fraunces, serif", fontWeight: 200 }}>{message}</p>
    </div>
  );
}