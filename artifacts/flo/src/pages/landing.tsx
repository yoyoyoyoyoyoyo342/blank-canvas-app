import { useRef, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, useInView } from "framer-motion";
import { FloFace } from "@/components/FloFace";
import { supabase } from "@/lib/supabase";

const BG = "#0f0f0f";
const FG = "#e8dfd4";
const ACCENT = "#4a5e6e";
const MUTED = "#6a6a6a";
const CARD = "#1a1a1a";
const FONT = { fontFamily: "Fraunces, serif", fontWeight: 200 } as const;

function Section({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="w-full px-6 md:px-12 py-24 md:py-32 max-w-6xl mx-auto">
      {children}
    </section>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function IconCal() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={FG} strokeWidth="1">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={FG} strokeWidth="1">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  );
}

function MockCard({ accent, title, children, delay }: { accent: string; title: string; children: React.ReactNode; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ type: "spring", stiffness: 100, damping: 15, delay }}
      className="p-5 rounded-2xl mb-3"
      style={{ background: "#141414", borderLeft: `3px solid ${accent}` }}
    >
      <p className="text-xs uppercase tracking-widest mb-2" style={{ ...FONT, color: MUTED }}>{title}</p>
      <div style={{ ...FONT, color: FG }}>{children}</div>
    </motion.div>
  );
}

function FeatureCard({ accent, title, body, delay }: { accent: string; title: string; body: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay }}
      className="p-8 rounded-2xl"
      style={{
        background: `linear-gradient(135deg, ${CARD}, ${accent}0d)`,
        borderLeft: `3px solid ${accent}`,
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
    >
      <h3 className="text-2xl mb-3 italic" style={{ ...FONT, color: FG }}>{title}</h3>
      <p style={{ ...FONT, color: MUTED }}>{body}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  }, []);

  async function googleSignIn() {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { scopes: "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/gmail.readonly" },
    });
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="w-full min-h-screen" style={{ background: BG, color: FG, ...FONT }}>
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 40%, ${ACCENT}0d, transparent 60%)` }}
        />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <FloFace size={120} float />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-8 italic"
          style={{ ...FONT, fontSize: "clamp(64px, 12vw, 96px)", lineHeight: 1 }}
        >
          flo.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 italic text-lg md:text-xl"
          style={{ ...FONT, color: MUTED }}
        >
          your day, without the noise.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mt-4 text-sm md:text-base text-center max-w-md leading-relaxed"
          style={{ ...FONT, color: "#8a8a8a" }}
        >
          a warm AI assistant that reads your calendar, emails, weather and more — so you only see what actually matters.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={() => scrollTo("get-started")}
            className="px-8 py-3 rounded-full"
            style={{ background: FG, color: BG, ...FONT }}
          >
            get started
          </button>
          <button
            onClick={() => navigate("/auth")}
            className="px-8 py-3 rounded-full border"
            style={{ borderColor: "#2a2a2a", color: FG, ...FONT }}
          >
            sign in
          </button>
        </motion.div>
        <motion.div
          className="absolute bottom-10"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-2 h-2 rounded-full" style={{ background: MUTED }} />
        </motion.div>
      </section>

      <Section>
        <Reveal>
          <h2 className="text-4xl md:text-5xl italic mb-16 text-center" style={FONT}>meet flo.</h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-12">
          {[
            { icon: <FloFace size={40} />, title: "a friend, not a tool", body: "flo. feels warm and personal — like a switched-on mate who reads everything and tells you only what you need to know." },
            { icon: <IconCal />, title: "your whole day, one place", body: "calendar, email, weather, reminders, school updates and music — all pulled together every morning." },
            { icon: <IconLock />, title: "your data stays yours", body: "flo. never sells your data. ever. it lives in your accounts and we only read what you allow." },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 0.15}>
              <div className="flex flex-col items-start gap-4">
                {c.icon}
                <h3 className="text-xl italic" style={FONT}>{c.title}</h3>
                <p style={{ ...FONT, color: MUTED }}>{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section>
        <Reveal>
          <h2 className="text-4xl md:text-5xl italic mb-16 text-center" style={FONT}>
            everything you need. nothing you don't.
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-6">
          <FeatureCard accent="#4a5e6e" title="morning briefing" body="wake up to a calm AI summary of your entire day" delay={0} />
          <FeatureCard accent="#c4906b" title="chat with flo." body="ask flo. anything about your day and get instant warm answers" delay={0.1} />
          <FeatureCard accent="#7eb8c9" title="weather from rainz" body="real-time weather built into every briefing" delay={0.2} />
          <FeatureCard accent="#e8b86d" title="aula for parents" body="stay on top of your kids' school messages, schedule and updates" delay={0.3} />
        </div>
      </Section>

      <Section>
        <Reveal>
          <h2 className="text-4xl md:text-5xl italic mb-16 text-center" style={FONT}>
            this is what your morning looks like
          </h2>
        </Reveal>
        <div className="max-w-md mx-auto p-6 rounded-3xl border" style={{ background: CARD, borderColor: "#2a2a2a" }}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <h3 className="text-2xl italic" style={FONT}>good morning, alex.</h3>
            <p className="text-xs mt-1" style={{ ...FONT, color: MUTED }}>
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </motion.div>
          <MockCard accent="#7eb8c9" title="weather" delay={0.1}>12° and partly cloudy in copenhagen</MockCard>
          <MockCard accent="#4a5e6e" title="calendar" delay={0.3}>
            <p>9:00am — team standup</p>
            <p>1:30pm — lunch with sarah</p>
            <p>4:00pm — dentist</p>
          </MockCard>
          <MockCard accent="#c4906b" title="email" delay={0.5}>3 unread emails — nothing urgent</MockCard>
          <MockCard accent="#e8b86d" title="aula" delay={0.7}>oliver has PE today — remember his kit</MockCard>
          <MockCard accent="#1db954" title="spotify" delay={0.9}>soundtrack for today: your lo-fi mix</MockCard>
        </div>
      </Section>

      <Section>
        <Reveal>
          <h2 className="text-4xl md:text-5xl italic mb-16 text-center" style={FONT}>
            connect once. works forever.
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { name: "Google", desc: "calendar + gmail", badge: "free" },
            { name: "Apple", desc: "calendar + reminders", badge: "plus" },
            { name: "Spotify", desc: "daily soundtrack", badge: "plus" },
            { name: "Aula", desc: "school updates", badge: "1 child free" },
          ].map((c, i) => (
            <Reveal key={c.name} delay={i * 0.1}>
              <div className="p-6 rounded-2xl" style={{ background: CARD, border: "1px solid #2a2a2a" }}>
                <p className="text-lg italic mb-2" style={FONT}>{c.name}</p>
                <p className="text-sm mb-3" style={{ ...FONT, color: MUTED }}>{c.desc}</p>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${ACCENT}33`, color: FG, ...FONT }}>{c.badge}</span>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.4}>
          <p className="text-center italic" style={{ ...FONT, color: MUTED }}>
            flo. only reads what you allow. you can disconnect any account at any time.
          </p>
        </Reveal>
      </Section>

      <Section>
        <Reveal>
          <h2 className="text-4xl md:text-5xl italic mb-4 text-center" style={FONT}>built for danish parents.</h2>
          <p className="text-center italic mb-16" style={{ ...FONT, color: MUTED }}>and expanding to more countries soon.</p>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <p className="mb-4 leading-relaxed" style={{ ...FONT, color: FG }}>
              aula is denmark's school platform used by millions of parents. flo. connects to it directly so you never miss a message, schedule change, or school update.
            </p>
            <p className="italic" style={{ ...FONT, color: MUTED }}>
              one child is free. add more with flo. plus.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="p-6 rounded-2xl" style={{ background: CARD, borderLeft: "3px solid #e8b86d" }}>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ ...FONT, color: MUTED }}>aula</p>
              <p className="mb-2" style={FONT}>oliver has PE today — remember his kit</p>
              <p style={FONT}>parent evening next thursday at 6pm</p>
            </div>
          </Reveal>
        </div>
      </Section>

      <Section>
        <Reveal>
          <h2 className="text-4xl md:text-5xl italic mb-16 text-center" style={FONT}>
            start free. upgrade when you're ready.
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="p-8 rounded-2xl"
            style={{ background: CARD, border: "1px solid #3a3a3a" }}
          >
            <h3 className="text-2xl italic mb-6" style={FONT}>flo. free</h3>
            <ul className="space-y-2 mb-8" style={{ ...FONT, color: FG }}>
              <li>· google calendar + gmail</li>
              <li>· daily AI briefing</li>
              <li>· weather from rainz</li>
              <li>· chat with flo.</li>
              <li>· aula (1 child)</li>
            </ul>
            <p className="mb-6 italic" style={{ ...FONT, color: MUTED }}>free forever</p>
            <button onClick={() => scrollTo("get-started")} className="px-6 py-2 rounded-full border" style={{ borderColor: "#3a3a3a", color: FG, ...FONT }}>
              get started
            </button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="p-8 rounded-2xl relative"
            style={{ background: CARD, border: `1px solid ${ACCENT}`, boxShadow: `0 0 40px ${ACCENT}4d` }}
          >
            <span className="absolute top-4 right-4 text-xs px-2 py-1 rounded-full" style={{ background: `${ACCENT}33`, color: FG, ...FONT }}>save 25% yearly</span>
            <h3 className="text-2xl italic mb-6" style={FONT}>flo. plus</h3>
            <ul className="space-y-2 mb-8" style={{ ...FONT, color: FG }}>
              <li>· everything in free</li>
              <li>· apple calendar + reminders</li>
              <li>· aula unlimited children</li>
              <li>· spotify daily soundtrack</li>
              <li>· real-time nudges</li>
              <li>· deeper AI memory</li>
              <li>· custom MCPs (coming soon)</li>
            </ul>
            <p className="mb-6 italic" style={{ ...FONT, color: MUTED }}>€4/month or €36/year</p>
            <button onClick={() => navigate("/plus")} className="px-6 py-2 rounded-full" style={{ background: FG, color: BG, ...FONT }}>
              get flo. plus
            </button>
          </motion.div>
        </div>
      </Section>

      <Section id="get-started">
        <div className="flex flex-col items-center text-center gap-6">
          <Reveal>
            <h2 className="text-4xl md:text-5xl italic" style={FONT}>ready to start your day differently?</h2>
          </Reveal>
          <Reveal delay={0.15}>
            <FloFace size={100} pulse />
          </Reveal>
          <Reveal delay={0.3}>
            <button
              onClick={hasSession ? () => navigate("/briefing") : googleSignIn}
              className="px-8 py-3 rounded-full"
              style={{ background: FG, color: BG, ...FONT }}
            >
              continue with Google
            </button>
          </Reveal>
          <Reveal delay={0.4}>
            <p className="text-xs max-w-sm" style={{ ...FONT, color: MUTED }}>
              by continuing you agree to our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>
            </p>
          </Reveal>
          <Reveal delay={0.5}>
            <button onClick={() => navigate("/auth")} className="text-sm italic" style={{ ...FONT, color: MUTED }}>
              already have an account? sign in
            </button>
          </Reveal>
        </div>
      </Section>

      <footer className="border-t mt-12 py-8 text-center text-xs" style={{ borderColor: "#1a1a1a", color: MUTED, ...FONT }}>
        flo. by Locali Labs ·{" "}
        <Link href="/privacy" className="hover:underline">privacy</Link> ·{" "}
        <Link href="/cookies" className="hover:underline">cookies</Link> ·{" "}
        <Link href="/terms" className="hover:underline">terms</Link>
      </footer>
    </div>
  );
}