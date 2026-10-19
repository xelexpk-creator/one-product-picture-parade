import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wind, Waves, Minus, Sparkles, Flame, ShieldCheck, Thermometer, Zap, Tag, Truck } from "lucide-react";
import img1 from "@/assets/styler-1.jpg.asset.json";
import img2 from "@/assets/styler-2.jpg.asset.json";
import img3 from "@/assets/styler-3.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "5-in-1 Hair Dryer & Multi-Styler | One Tool, Every Look" },
      { name: "description", content: "Dry, curl, straighten, smooth and volumize with one tool and five interchangeable heads." },
      { property: "og:title", content: "5-in-1 Hair Dryer & Multi-Styler" },
      { property: "og:description", content: "Five interchangeable heads. One device. Salon results at home." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const modes = [
  { icon: Wind, name: "Dry", text: "Powerful detachable blower for fast, frizz-free drying." },
  { icon: Waves, name: "Curl", text: "Two auto-wrap barrels for left and right curls." },
  { icon: Minus, name: "Straighten", text: "Paddle brush for sleek, straight lengths." },
  { icon: Sparkles, name: "Smooth", text: "Smoothing brush tames flyaways with a glossy finish." },
  { icon: Flame, name: "Volumize", text: "Round brush lifts roots for full-bodied volume." },
];

const perks = [
  { icon: Thermometer, title: "Multiple heat settings", text: "Switch temperatures to suit your hair type." },
  { icon: ShieldCheck, title: "Premium materials", text: "Durable finish built for daily use." },
  { icon: Zap, title: "Click-on heads", text: "Swap attachments in seconds with the unlock button." },
];

const PROMO_CODE = "XELEX500";

const announcements = [
  { icon: Tag, pre: "Use promo", code: PROMO_CODE, post: "to get Rs 500 off" },
  { icon: Truck, pre: "Free delivery", code: "", post: "all over Pakistan" },
];

function AnnouncementBar() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % announcements.length), 3800);
    return () => window.clearInterval(id);
  }, [paused]);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(id);
  }, [copied]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
    } catch {
      // Clipboard unavailable — the code stays visible on screen.
    }
  }

  return (
    <div
      className="sticky top-0 z-50 border-b-2 border-plum bg-highlight text-accent-foreground"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5 sm:px-6">
        <div className="flex-1 overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${active * 100}%)` }}
          >
            {announcements.map(({ icon: Icon, pre, code, post }) => (
              <div
                key={pre + post}
                className="flex w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap font-display text-[11px] font-extrabold uppercase tracking-wide sm:text-sm"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{pre}</span>
                {code && (
                  <button
                    onClick={copyCode}
                    title="Click to copy"
                    className="rounded-md border-2 border-dashed border-plum/50 px-1.5 py-0.5 font-mono text-[10px] font-bold normal-case tracking-normal transition-colors hover:bg-plum/10 sm:text-sm"
                  >
                    {copied ? "Copied!" : code}
                  </button>
                )}
                <span>{post}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {announcements.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Show message ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-plum" : "w-1.5 bg-plum/30 hover:bg-plum/60"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function OrderButton({ className = "" }: { className?: string }) {
  return (
    <a
      href="#order"
      className={`inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-1 ${className}`}
    >
      Order Now
    </a>
  );
}

function Index() {
  return (
    <>
      <AnnouncementBar />
      <main className="overflow-hidden">
      {/* Hero */}
      <section className="bg-hero text-plum-foreground">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="font-display text-xl font-extrabold">Styl<span className="text-highlight">5</span></span>
          <a href="#order" className="rounded-full border border-plum-foreground/30 px-5 py-2 text-sm font-medium hover:bg-plum-foreground/10">Order</a>
        </nav>
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-20 pt-8 md:grid-cols-2 md:pb-28">
          <div>
            <span className="inline-block rounded-full bg-highlight px-4 py-1 text-sm font-bold text-accent-foreground">5 tools in 1</span>
            <h1 className="mt-6 text-5xl font-extrabold leading-[0.95] md:text-7xl">
              One styler.<br />Every <span className="text-primary">look.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-plum-foreground/80">
              Dry, curl, straighten, smooth and volumize — five interchangeable heads in a single powerful device.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <span className="font-display text-5xl font-extrabold text-primary">Rs 4,999</span>
              <span className="text-2xl font-semibold text-plum-foreground/50 line-through">Rs 5,499</span>
              <span className="rounded-full bg-highlight px-3 py-1 text-sm font-bold text-accent-foreground">Save Rs 500</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <OrderButton />
              <a href="#features" className="inline-flex items-center rounded-full px-6 py-4 font-medium hover:bg-plum-foreground/10">See features →</a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-6 rounded-full bg-primary/40 blur-3xl" />
            <img src={img1.url} alt="5-in-1 hair dryer and multi-styler with five attachments" className="relative animate-floaty rounded-[2rem] bg-card p-4 shadow-pop" />
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="border-y-4 border-plum bg-highlight py-4 text-accent-foreground">
        <div className="flex w-max animate-marquee gap-10 font-display text-2xl font-extrabold uppercase">
          {Array.from({ length: 2 }).flatMap((_, k) =>
            ["Dry", "Curl", "Straighten", "Smooth", "Volumize"].map((m) => (
              <span key={k + m} className="flex items-center gap-10">{m} <span className="text-primary">✦</span></span>
            )),
          )}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-4xl font-extrabold md:text-5xl">Five heads. <span className="text-primary">Zero limits.</span></h2>
        <p className="mt-4 max-w-xl text-muted-foreground">Replace a drawer full of tools with one sleek styler.</p>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {modes.map(({ icon: Icon, name, text }) => (
            <div key={name} className="group rounded-3xl border-2 border-border bg-card p-6 transition-all hover:-translate-y-2 hover:border-primary hover:shadow-pop">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground transition-transform group-hover:rotate-12">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-bold">{name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 grid items-center gap-12 md:grid-cols-2">
          <img src={img3.url} alt="Product details: detachable blower, filter, temperature switch" className="rounded-[2rem] shadow-pop" />
          <div className="space-y-6">
            {perks.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 rounded-3xl bg-secondary p-6">
                <Icon className="h-7 w-7 shrink-0 text-primary" />
                <div>
                  <h3 className="text-lg font-bold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="bg-plum py-24 text-plum-foreground">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-4xl font-extrabold md:text-5xl">Take a <span className="text-highlight">closer look</span></h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <img src={img2.url} alt="Styler gift box with all attachments" className="h-80 w-full rounded-3xl object-cover md:col-span-2 md:h-[28rem]" />
            <img src={img1.url} alt="Styler and five attachments" className="h-80 w-full rounded-3xl bg-card object-contain p-4 md:h-[28rem]" />
            <img src={img3.url} alt="Styler feature breakdown" className="h-80 w-full rounded-3xl object-cover" />
            <img src={img2.url} alt="Styler in packaging" className="h-80 w-full rounded-3xl object-cover object-right md:col-span-2" />
          </div>
        </div>
      </section>

      {/* Order CTA */}
      <section id="order" className="px-6 py-24">
        <div className="mx-auto max-w-4xl rounded-[2.5rem] bg-hero p-10 text-center text-plum-foreground shadow-pop md:p-16">
          <h2 className="text-4xl font-extrabold md:text-6xl">Ready for your <span className="text-highlight">best hair day?</span></h2>
          <p className="mx-auto mt-4 max-w-md text-plum-foreground/80">Get the complete 5-in-1 set delivered to your door.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className="font-display text-5xl font-extrabold text-primary md:text-6xl">Rs 4,999</span>
            <span className="text-2xl font-semibold text-plum-foreground/50 line-through md:text-3xl">Rs 5,499</span>
          </div>
          <p className="mt-2 text-sm font-bold uppercase tracking-wide text-plum-foreground/70">Limited-time discount — you save Rs 500</p>
          <OrderButton className="mt-8 text-lg" />
        </div>
      </section>

      <footer className="pb-10 text-center text-sm text-muted-foreground">© {new Date().getFullYear()} Styl5. All rights reserved.</footer>
    </main>
  );
}
