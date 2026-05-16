import { useLocation } from "wouter";
import Footer from "@/components/footer";

export default function TermsPage() {
  const [, setLocation] = useLocation();
  const today = "16 May 2026";

  return (
    <div className="min-h-[100dvh] bg-background text-foreground px-6 py-16 max-w-2xl mx-auto">
      <button onClick={() => setLocation("/")} className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide mb-12 block">
        ← back
      </button>

      <h1 className="text-5xl font-light italic tracking-tight text-primary mb-2">terms.</h1>
      <p className="text-xs text-muted-foreground tracking-wide mb-16">last updated {today}</p>

      <div className="space-y-12 text-sm leading-relaxed text-foreground/80">

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">acceptance of terms</h2>
          <p>By accessing or using flo. ("the Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you may not use the Service. These Terms constitute a legally binding agreement between you and Locali Labs ("we", "us", "our").</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">description of service</h2>
          <p>flo. is a personal AI-powered daily briefing assistant. The Service aggregates data from connected sources — including your calendar, email, weather, school platform, and music service — and generates a personalised daily summary using AI language models. The Service also provides an AI chat assistant with knowledge of your day's context.</p>
          <p>flo. is provided "as is". We make reasonable efforts to ensure availability and accuracy, but we do not guarantee uninterrupted service or that the AI-generated content will be error-free, complete, or suitable for any particular purpose.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">user responsibilities</h2>
          <p>You agree to:</p>
          <ul className="space-y-2 pl-4 list-disc text-foreground/70">
            <li>Use the Service only for lawful purposes and in accordance with these Terms</li>
            <li>Provide accurate information when creating your account and connecting integrations</li>
            <li>Keep your login credentials secure and notify us immediately of any unauthorised access</li>
            <li>Not attempt to reverse-engineer, decompile, or extract source code from the Service</li>
            <li>Not use the Service to process data of other individuals without their consent</li>
            <li>Not use the Service in ways that could harm, disable, or impair our infrastructure</li>
            <li>Not attempt to circumvent rate limits, authentication, or access controls</li>
          </ul>
          <p>You are responsible for all activity under your account.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">free vs pro tier</h2>
          <p><span className="text-foreground">Free tier.</span> The free tier of flo. provides access to core briefing features including weather, AI briefing, Google Calendar, and Gmail summaries. Free tier usage is subject to reasonable rate limits.</p>
          <p><span className="text-foreground">Pro tier.</span> The Pro tier unlocks additional integrations (Apple CalDAV, Aula, Spotify), extended chat history, higher usage limits, and priority AI response times. Pro tier pricing is published on the flo. website and may change with notice.</p>
          <p>We reserve the right to modify the features included in each tier with 30 days' notice to existing subscribers.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">AI-generated content</h2>
          <p>flo. uses Groq's AI API to generate briefings and chat responses. AI-generated content may occasionally be inaccurate, incomplete, or outdated. You should not rely on flo.'s AI output as a substitute for professional advice (medical, legal, financial, or otherwise).</p>
          <p>We are not responsible for decisions you make based on AI-generated content. You use the AI features at your own risk.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">third-party integrations</h2>
          <p>flo. connects to third-party services (Google, Apple, Aula, Spotify) on your behalf. Your use of these integrations is subject to the terms and privacy policies of the respective third parties. We are not responsible for the availability, accuracy, or conduct of third-party services.</p>
          <p>You may revoke flo.'s access to any third-party service at any time from the settings screen or from the third party's own account settings.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">intellectual property</h2>
          <p>The flo. name, logo, design, and software (excluding open-source components) are owned by Locali Labs and are protected by intellectual property law. You may not use our brand assets without written permission.</p>
          <p>Content you provide to flo. (e.g., manually entered schedule data, chat messages) remains yours. You grant us a limited licence to process this content solely to provide the Service.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">limitation of liability</h2>
          <p>To the maximum extent permitted by law, Locali Labs shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including loss of data, revenue, or profits — arising from your use of the Service.</p>
          <p>Our total liability to you for any claim arising from these Terms or the Service shall not exceed the amount you paid to us in the 12 months preceding the claim, or €50, whichever is greater.</p>
          <p>Nothing in these Terms limits our liability for death or personal injury caused by negligence, fraud, or any other liability that cannot be excluded by law.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">governing law</h2>
          <p>These Terms are governed by the laws of Denmark and the European Union. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of Copenhagen, Denmark, unless mandatory consumer protection law in your country of residence requires otherwise.</p>
          <p>If you are a consumer in the EU, you may also have access to the EU Online Dispute Resolution platform at <a href="https://ec.europa.eu/consumers/odr" className="underline text-foreground/60">ec.europa.eu/consumers/odr</a>.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">account termination</h2>
          <p>You may delete your account at any time by contacting us at <span className="text-foreground">hello@localilabs.com</span>. Upon deletion, all your data will be permanently removed within 30 days in accordance with our privacy policy.</p>
          <p>We reserve the right to suspend or terminate your account if you breach these Terms, engage in abusive behaviour, or if we are required to do so by law. We will provide notice where reasonably possible.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">changes to terms</h2>
          <p>We may update these Terms from time to time. We will notify you of material changes by email or by displaying a notice in the Service at least 14 days before the changes take effect. Your continued use of the Service after changes take effect constitutes acceptance of the updated Terms.</p>
          <p>If you do not agree to the updated Terms, you must stop using the Service and may delete your account.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">contact</h2>
          <p>For questions about these Terms, contact Locali Labs at:</p>
          <p className="text-foreground">hello@localilabs.com</p>
        </section>

      </div>

      <Footer />
    </div>
  );
}
