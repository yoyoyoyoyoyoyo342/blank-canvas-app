import { useLocation } from "wouter";
import Footer from "@/components/footer";

export default function CookiesPage() {
  const [, setLocation] = useLocation();
  const today = "16 May 2026";

  return (
    <div className="min-h-[100dvh] bg-background text-foreground px-6 py-16 max-w-2xl mx-auto">
      <button onClick={() => setLocation("/")} className="text-xs text-muted-foreground hover:text-foreground transition-colors tracking-wide mb-12 block">
        ← back
      </button>

      <h1 className="text-5xl font-light italic tracking-tight text-primary mb-2">cookies.</h1>
      <p className="text-xs text-muted-foreground tracking-wide mb-16">last updated {today}</p>

      <div className="space-y-12 text-sm leading-relaxed text-foreground/80">

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">what are cookies</h2>
          <p>Cookies are small text files placed on your device when you visit a website. They are widely used to make websites work efficiently and to provide information to site owners. flo. uses a minimal number of cookies that are strictly necessary for the service to function.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">cookies we use</h2>

          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-foreground text-sm">Authentication session cookie</p>
              <p className="text-muted-foreground text-xs">Provider: Supabase · Duration: session / up to 1 week</p>
              <p>This cookie stores your authentication session token, allowing you to remain logged in between visits. It is set when you sign in with Google and is deleted when you sign out. This cookie is strictly necessary — without it, the service cannot function.</p>
            </div>

            <div className="space-y-2">
              <p className="text-foreground text-sm">Preferences cookie</p>
              <p className="text-muted-foreground text-xs">Provider: flo. · Duration: up to 1 year</p>
              <p>This cookie stores lightweight UI preferences such as your selected theme. No personal data is stored in this cookie.</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">cookies we do not use</h2>
          <p>flo. does not use:</p>
          <ul className="space-y-2 pl-4 list-disc text-foreground/70">
            <li>Advertising or targeting cookies</li>
            <li>Third-party tracking pixels or beacons</li>
            <li>Analytics cookies (e.g. Google Analytics, Mixpanel)</li>
            <li>Social media tracking cookies</li>
            <li>Cross-site tracking mechanisms</li>
            <li>Fingerprinting technologies</li>
          </ul>
          <p>We do not share cookie data with any advertising networks or data brokers.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">local storage</h2>
          <p>In addition to cookies, flo. uses browser local storage to cache certain UI state (such as your briefing preferences). Local storage data does not leave your device and is not accessible to third parties.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">managing cookies</h2>
          <p>Because flo. only uses strictly necessary cookies for authentication, disabling them will prevent you from signing in. You can manage or delete cookies through your browser settings:</p>
          <ul className="space-y-2 pl-4 list-disc text-foreground/70">
            <li><span className="text-foreground">Chrome</span> — Settings → Privacy and security → Cookies and other site data</li>
            <li><span className="text-foreground">Firefox</span> — Settings → Privacy &amp; Security → Cookies and Site Data</li>
            <li><span className="text-foreground">Safari</span> — Preferences → Privacy → Manage Website Data</li>
            <li><span className="text-foreground">Edge</span> — Settings → Cookies and site permissions</li>
          </ul>
          <p>Note that clearing your cookies will sign you out of flo.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs tracking-widest uppercase text-muted-foreground">consent</h2>
          <p>By using flo., you consent to our use of the strictly necessary cookies described above. Because we do not use non-essential cookies, we do not display a cookie consent banner — there is nothing to accept or decline beyond the authentication cookie that is required for the service to work.</p>
          <p>If you have any questions about our use of cookies, contact us at <span className="text-foreground">privacy@localilabs.com</span>.</p>
        </section>

      </div>

      <Footer />
    </div>
  );
}
