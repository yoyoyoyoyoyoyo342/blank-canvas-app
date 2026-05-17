import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { FloFace } from "@/components/FloFace";
import { supabase } from "@/lib/supabase";

const BG = "#0f0f0f";
const FG = "#e8dfd4";
const ACCENT = "#4a5e6e";
const MUTED = "#6a6a6a";
const FONT = { fontFamily: "Fraunces, serif", fontWeight: 200 } as const;

interface Props { userId: string }

function Page({ children, page, bg }: { children: React.ReactNode; page: number; bg?: string }) {
  return (
    <section
      data-page={page}
      className="w-full min-h-screen flex flex-col items-center justify-center px-6 relative snap-start"
      style={{ background: bg ?? BG }}
    >
      {children}
    </section>
  );
}

function useReveal(amount = 0.5) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount });
  return { ref, inView };
}

function Particles() {
  const dots = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    dx: (Math.random() - 0.5) * 60,
    dy: (Math.random() - 0.5) * 60,
    d: 6 + Math.random() * 6,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="absolute w-2 h-2 rounded-full"
          style={{ left: `${d.x}%`, top: `${d.y}%`, background: `${ACCENT}26` }}
          animate={{ x: [0, d.dx, 0], y: [0, d.dy, 0] }}
          transition={{ duration: d.d, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function Typewriter({ text, start, speed = 30 }: { text: string; start: boolean; speed?: number }) {
  const [out, setOut] = useState("");
  useEffect(() => {
    if (!start) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [start, text, speed]);
  return <span>{out}</span>;
}

function Check() {
  return (
    <motion.svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <motion.path
        d="M4 12l5 5L20 6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
    </motion.svg>
  );
}

function PageWelcome() {
  return (
    <Page page={1}>
      <Particles />
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
        <FloFace size={120} float />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="mt-8 italic"
        style={{ ...FONT, fontSize: "clamp(48px, 10vw, 80px)" }}
      >
        hi there.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.7 }}
        className="mt-6 italic text-center max-w-md"
        style={{ ...FONT, color: MUTED }}
      >
        i'm flo. i'm going to help you start every day without the noise.
      </motion.p>
      <motion.div
        className="absolute bottom-12 flex flex-col items-center gap-2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <p className="text-xs italic" style={{ ...FONT, color: MUTED }}>scroll to meet me</p>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: MUTED }} />
      </motion.div>
    </Page>
  );
}

function PageWhatIs() {
  const { ref, inView } = useReveal();
  const corners: Array<{ from: { x: number; y: number }; label: string }> = [
    { from: { x: -200, y: -200 }, label: "📅" },
    { from: { x: 200, y: -200 }, label: "✉" },
    { from: { x: -200, y: 200 }, label: "☁" },
    { from: { x: 200, y: 200 }, label: "⏰" },
  ];
  return (
    <Page page={2} bg="linear-gradient(180deg, #0f0f0f, #0f1a1f)">
      <div ref={ref} className="flex flex-col items-center text-center relative">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-3xl md:text-5xl italic mb-6"
          style={FONT}
        >
          think of me as your morning person.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="max-w-md mb-16"
          style={{ ...FONT, color: MUTED }}
        >
          i read your calendar, emails, weather, and reminders — then tell you only what matters.
        </motion.p>
        <div className="relative w-64 h-64 flex items-center justify-center">
          <FloFace size={80} pulse />
          {corners.map((c, i) => (
            <motion.div
              key={i}
              className="absolute text-2xl"
              initial={{ x: c.from.x, y: c.from.y, opacity: 0 }}
              animate={inView ? { x: 0, y: 0, opacity: [0, 1, 0.6] } : {}}
              transition={{ duration: 1.4, delay: 0.4 + i * 0.1, ease: "easeOut" }}
            >
              {c.label}
            </motion.div>
          ))}
        </div>
      </div>
    </Page>
  );
}

function BriefCard({ accent, title, delay, inView, children }: { accent: string; title: string; delay: number; inView: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={inView ? { x: 0, opacity: 1 } : {}}
      transition={{ type: "spring", stiffness: 80, damping: 12, delay }}
      className="p-4 rounded-2xl mb-3 relative overflow-hidden"
      style={{ background: "#141414", borderLeft: `3px solid ${accent}` }}
    >
      <p className="text-xs uppercase tracking-widest mb-1" style={{ ...FONT, color: MUTED }}>{title}</p>
      <div style={{ ...FONT, color: FG }}>{children}</div>
      {inView && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.2, delay: delay + 1.6, ease: "easeInOut" }}
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }}
        />
      )}
    </motion.div>
  );
}

function PageBriefing() {
  const { ref, inView } = useReveal();
  return (
    <Page page={3}>
      <div ref={ref} className="w-full max-w-md">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl italic mb-8 text-center"
          style={FONT}
        >
          your morning briefing.
        </motion.h2>
        <BriefCard accent="#7eb8c9" title="weather" delay={0.3} inView={inView}>12° and partly cloudy</BriefCard>
        <BriefCard accent="#4a5e6e" title="calendar" delay={0.6} inView={inView}>
          <p>9:00am — standup</p>
          <p>4:00pm — dentist</p>
        </BriefCard>
        <BriefCard accent="#c4906b" title="email" delay={0.9} inView={inView}>3 unread — nothing urgent</BriefCard>
        <BriefCard accent="#e8b86d" title="aula" delay={1.2} inView={inView}>oliver has PE today</BriefCard>
        <BriefCard accent="#1db954" title="spotify" delay={1.5} inView={inView}>your lo-fi mix</BriefCard>
      </div>
    </Page>
  );
}

function ChatBubble({ side, delay, inView, children }: { side: "left" | "right"; delay: number; inView: boolean; children: React.ReactNode }) {
  const isUser = side === "right";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay }}
      className={`flex items-end gap-2 mb-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && <FloFace size={24} />}
      <div
        className="px-4 py-3 rounded-2xl max-w-[75%]"
        style={{
          background: isUser ? "#1a1a1a" : `${ACCENT}33`,
          border: isUser ? "1px solid #2a2a2a" : "none",
          ...FONT,
          color: FG,
        }}
      >
        {children}
      </div>
    </motion.div>
  );
}

function Typing({ delay, inView, until }: { delay: number; inView: boolean; until: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!inView) return;
    const a = setTimeout(() => setShow(true), delay);
    const b = setTimeout(() => setShow(false), until);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [inView, delay, until]);
  if (!show) return null;
  return (
    <div className="flex items-end gap-2 mb-3">
      <FloFace size={24} />
      <div className="px-4 py-3 rounded-2xl flex gap-1" style={{ background: `${ACCENT}33` }}>
        {[0, 0.2, 0.4].map((d, i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: FG }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: d }}
          />
        ))}
      </div>
    </div>
  );
}

function PageChat() {
  const { ref, inView } = useReveal(0.4);
  const [stage, setStage] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const timers = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 2000),
      setTimeout(() => setStage(3), 3000),
      setTimeout(() => setStage(4), 4600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView]);
  return (
    <Page page={4}>
      <div ref={ref} className="w-full max-w-md">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl italic mb-8 text-center"
          style={FONT}
        >
          and you can talk to me.
        </motion.h2>
        {stage >= 1 && <ChatBubble side="right" delay={0} inView>what have i got on this afternoon?</ChatBubble>}
        <Typing delay={1200 - 500} inView={stage >= 1 && stage < 2} until={Infinity} />
        {stage >= 2 && <ChatBubble side="left" delay={0} inView>you've got a dentist at 4pm and it looks like rain — maybe leave 10 minutes early.</ChatBubble>}
        {stage >= 3 && <ChatBubble side="right" delay={0} inView>and what should i wear?</ChatBubble>}
        <Typing delay={300} inView={stage >= 3 && stage < 4} until={Infinity} />
        {stage >= 4 && <ChatBubble side="left" delay={0} inView>it's 9° and rainy — your navy coat would be perfect.</ChatBubble>}
      </div>
    </Page>
  );
}

function ConnRow({ label, desc, delay, inView }: { label: string; desc: string; delay: number; inView: boolean }) {
  return (
    <motion.div
      initial={{ x: -40, opacity: 0 }}
      animate={inView ? { x: 0, opacity: 1 } : {}}
      transition={{ duration: 0.5, delay }}
      className="flex items-center gap-4 py-3 border-b"
      style={{ borderColor: "#1a1a1a" }}
    >
      <Check />
      <div>
        <p className="italic" style={FONT}>{label}</p>
        <p className="text-sm" style={{ ...FONT, color: MUTED }}>{desc}</p>
      </div>
    </motion.div>
  );
}

function PageConnects() {
  const { ref, inView } = useReveal();
  return (
    <Page page={5}>
      <div ref={ref} className="w-full max-w-md">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl italic mb-8 text-center"
          style={FONT}
        >
          i connect to your whole life.
        </motion.h2>
        <ConnRow label="Google" desc="your calendar and emails" delay={0.2} inView={inView} />
        <ConnRow label="Apple" desc="your apple calendar and reminders" delay={0.4} inView={inView} />
        <ConnRow label="Aula" desc="your kids' school updates" delay={0.6} inView={inView} />
        <ConnRow label="Spotify" desc="your daily soundtrack" delay={0.8} inView={inView} />
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="text-center mt-8 italic"
          style={{ ...FONT, color: MUTED }}
        >
          connect once. i handle the rest.
        </motion.p>
      </div>
    </Page>
  );
}

function PageAula() {
  const { ref, inView } = useReveal();
  return (
    <Page page={6}>
      <div ref={ref} className="w-full max-w-md text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl italic mb-6"
          style={FONT}
        >
          for danish parents.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
          style={{ ...FONT, color: MUTED }}
        >
          aula keeps you on top of your kids' school life.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="p-5 rounded-2xl text-left mb-6"
          style={{ background: "#141414", borderLeft: "3px solid #e8b86d" }}
        >
          <p className="mb-2" style={FONT}>
            <Typewriter text="oliver has PE today — remember his kit" start={inView} />
          </p>
          <p style={FONT}>
            <Typewriter text="parent evening next thursday at 6pm" start={inView} speed={30} />
          </p>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="italic text-sm mb-4"
          style={{ ...FONT, color: MUTED }}
        >
          one child is free. add more with flo. plus.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
          className="text-lg"
          style={FONT}
        >
          🇩🇰 now · 🇫🇮 🇸🇪 🇳🇴 🇺🇸 🇬🇧 coming soon
        </motion.p>
      </div>
    </Page>
  );
}

function PrivacyRow({ text, delay, inView }: { text: string; delay: number; inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="flex items-center gap-3 py-2"
    >
      <Check />
      <p style={FONT}>{text}</p>
    </motion.div>
  );
}

function PagePrivacy() {
  const { ref, inView } = useReveal();
  return (
    <Page page={7}>
      <div ref={ref} className="w-full max-w-md">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl italic mb-8 text-center"
          style={FONT}
        >
          your data is yours. always.
        </motion.h2>
        <PrivacyRow text="we never sell your data" delay={0.2} inView={inView} />
        <PrivacyRow text="flo. only reads what you explicitly allow" delay={0.4} inView={inView} />
        <PrivacyRow text="disconnect any account at any time" delay={0.6} inView={inView} />
        <PrivacyRow text="your data is stored securely in the EU" delay={0.8} inView={inView} />
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 1 }}
          className="italic text-center mt-8"
          style={{ ...FONT, color: MUTED }}
        >
          "we built flo. to make your life easier, not to profit from your information."
        </motion.p>
        <div className="text-center mt-4">
          <a href="/privacy" className="text-sm underline" style={{ ...FONT, color: MUTED }}>
            read our full privacy policy
          </a>
        </div>
      </div>
    </Page>
  );
}

function PageGetStarted({ onFinish }: { onFinish: () => void }) {
  const { ref, inView } = useReveal();
  const [loading, setLoading] = useState(false);
  async function start() {
    setLoading(true);
    await onFinish();
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      window.location.href = "/briefing";
    } else {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          scopes: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly",
          redirectTo: `${window.location.origin}/briefing`,
        },
      });
    }
  }
  return (
    <Page page={8}>
      <div ref={ref} className="flex flex-col items-center text-center gap-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ type: "spring", stiffness: 120, damping: 12 }}
        >
          <FloFace size={100} pulse />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-3xl md:text-4xl italic"
          style={FONT}
        >
          let's set up your flo.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-sm"
          style={{ ...FONT, color: MUTED }}
        >
          connect your Google account to get started. you can add Apple, Aula and Spotify later in settings.
        </motion.p>
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          onClick={start}
          disabled={loading}
          className="px-8 py-3 rounded-full disabled:opacity-50"
          style={{ background: FG, color: BG, ...FONT }}
        >
          {loading ? "..." : "continue with Google"}
        </motion.button>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="text-xs max-w-xs"
          style={{ ...FONT, color: MUTED }}
        >
          by continuing you agree to our{" "}
          <a href="/terms" className="underline">terms</a> and{" "}
          <a href="/privacy" className="underline">privacy policy</a>
        </motion.p>
      </div>
    </Page>
  );
}

export default function OnboardingFlow({ userId }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const [, navigate] = useLocation();

  async function complete() {
    if (!supabase || !userId) return;
    await supabase.from("user_settings").upsert(
      { user_id: userId, onboarding_complete: true, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  }

  async function skip() {
    await complete();
    navigate("/briefing");
  }

  return (
    <div className="fixed inset-0" style={{ background: BG, color: FG }}>
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5" style={{ background: "#1a1a1a" }}>
        <motion.div className="h-full" style={{ width: progressWidth, background: ACCENT }} />
      </div>
      <button
        onClick={skip}
        className="fixed top-4 right-6 z-50 text-xs"
        style={{ ...FONT, color: MUTED }}
      >
        skip
      </button>
      <div
        ref={scrollRef}
        className="w-full h-full overflow-y-auto snap-y snap-mandatory scroll-smooth"
      >
        <PageWelcome />
        <PageWhatIs />
        <PageBriefing />
        <PageChat />
        <PageConnects />
        <PageAula />
        <PagePrivacy />
        <PageGetStarted onFinish={complete} />
      </div>
    </div>
  );
}