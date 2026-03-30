import { motion } from "framer-motion";
import {
  Sparkles,
  Download,
  Wand2,
  BookOpen,
  ArrowRight,
  Twitter,
  Linkedin,
  Instagram,
  Menu,
} from "lucide-react";
import heroFlowers from "@/assets/hero-flowers.jpg";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4";

export function LiquidGlassHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden font-display">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 z-0 h-full w-full object-cover"
        src={VIDEO_SRC}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-[1] bg-black/40" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
        {/* ───── Left Panel ───── */}
        <div className="relative flex w-full flex-col lg:w-[52%]">
          {/* Glass overlay */}
          <div className="liquid-glass-strong absolute inset-4 lg:inset-6 rounded-3xl" />

          {/* Inner content (above glass) */}
          <div className="relative z-10 flex flex-1 flex-col p-8 lg:p-12">
            {/* Nav */}
            <nav className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/images/darkpool-logo.png"
                  alt="DARKPOOL"
                  className="h-8 w-8 object-contain"
                />
                <span className="font-mono text-2xl font-semibold tracking-tighter text-white">
                  darkpool
                </span>
              </div>
              <button className="liquid-glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/80 transition-transform hover:scale-105 active:scale-95">
                <Menu className="h-4 w-4" />
                Menu
              </button>
            </nav>

            {/* Hero Center */}
            <div className="flex flex-1 flex-col items-start justify-center gap-8 py-16">
              <img
                src="/images/darkpool-logo.png"
                alt=""
                className="h-20 w-20 object-contain"
              />
              <h1 className="text-5xl font-medium tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl leading-[1.05]">
                Powering the
                <br />
                <em className="font-serif not-italic text-white/80 italic">
                  spirit
                </em>{" "}
                of dark AI
              </h1>

              {/* CTA */}
              <button className="liquid-glass-strong group flex items-center gap-3 rounded-full px-6 py-3 text-sm font-medium text-white transition-transform hover:scale-105 active:scale-95">
                Launch App
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                  <Download className="h-4 w-4" />
                </span>
              </button>

              {/* Pills */}
              <div className="flex flex-wrap gap-2">
                {["Private Auctions", "GPU Compute", "AI Agents"].map((t) => (
                  <span
                    key={t}
                    className="liquid-glass rounded-full px-4 py-1.5 text-xs text-white/80"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Quote */}
            <div className="flex flex-col gap-3 pb-4">
              <span className="text-xs font-medium uppercase tracking-widest text-white/50">
                AGENTIC INFRASTRUCTURE
              </span>
              <p className="max-w-md text-sm leading-relaxed text-white/60">
                <span className="font-display">"We imagined a </span>
                <em className="font-serif italic text-white/80">
                  realm with no ending
                </em>
                <span className="font-display">
                  {" "}— where compute flows unseen."
                </span>
              </p>
              <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-white/40">
                <div className="h-px flex-1 bg-white/10" />
                DARKPOOL PROTOCOL
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </div>
          </div>
        </div>

        {/* ───── Right Panel (desktop) ───── */}
        <div className="hidden w-[48%] flex-col p-6 lg:flex">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="liquid-glass flex items-center gap-1 rounded-full p-1">
              {[Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:text-white/80"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                <ArrowRight className="h-4 w-4 text-white" />
              </span>
            </div>
            <button className="liquid-glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/80 transition-transform hover:scale-105">
              <Sparkles className="h-4 w-4" />
              Account
            </button>
          </div>

          {/* Community card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="liquid-glass mt-6 w-56 rounded-2xl p-4"
          >
            <h3 className="text-sm font-medium text-white">
              Enter our ecosystem
            </h3>
            <p className="mt-1 text-xs text-white/50">
              Join the network of AI agents and GPU providers trading compute
              privately on Base.
            </p>
          </motion.div>

          {/* Bottom feature section */}
          <div className="mt-auto flex flex-col gap-4">
            <div className="liquid-glass rounded-[2.5rem] p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Processing card */}
                <div className="liquid-glass flex flex-col gap-3 rounded-3xl p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    <Wand2 className="h-5 w-5 text-white/80" />
                  </div>
                  <h4 className="text-sm font-medium text-white">
                    Processing
                  </h4>
                  <p className="text-xs text-white/50">
                    Dark-pool auction matching in 30-60s settlement windows.
                  </p>
                </div>
                {/* Growth Archive card */}
                <div className="liquid-glass flex flex-col gap-3 rounded-3xl p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    <BookOpen className="h-5 w-5 text-white/80" />
                  </div>
                  <h4 className="text-sm font-medium text-white">
                    Order Archive
                  </h4>
                  <p className="text-xs text-white/50">
                    Full commit-reveal history with on-chain verification.
                  </p>
                </div>
              </div>

              {/* Bottom card */}
              <div className="liquid-glass mt-4 flex items-center gap-4 rounded-3xl p-4">
                <img
                  src={heroFlowers}
                  alt="GPU Network"
                  className="h-16 w-24 rounded-2xl object-cover"
                />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-white">
                    Advanced Compute Sculpting
                  </h4>
                  <p className="mt-1 text-xs text-white/50">
                    Shape GPU clusters with privacy-first orchestration.
                  </p>
                </div>
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-transform hover:scale-105">
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
