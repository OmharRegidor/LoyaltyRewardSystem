import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Download NoxaLoyalty - Your Rewards, One Tap Away",
  description:
    "Download the NoxaLoyalty app to earn points, redeem rewards, and enjoy exclusive deals from your favorite local businesses.",
};

export const viewport: Viewport = {
  themeColor: "#7F0404",
};

const APK_DOWNLOAD_URL = "/api/download/apk";

export default function DownloadPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FDFBF7]">
      {/* Ambient glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#7F0404]/[0.06] blur-[120px]" />
        <div className="absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-[#7F0404]/[0.04] blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-[#D4A017]/[0.06] blur-[80px]" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(127,4,4,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(127,4,4,.08) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
        {/* Logo */}
        <div className="mb-8">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#7F0404]/10 bg-gradient-to-br from-[#7F0404] to-[#5a0303] shadow-[0_8px_30px_rgba(127,4,4,0.25)]">
            <Image
              src="/logoloyalty.png"
              alt="NoxaLoyalty"
              width={56}
              height={56}
              className="rounded-xl"
            />
          </div>
        </div>

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#7F0404]/10 bg-[#7F0404]/[0.04] px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          <span className="font-[var(--font-space-grotesk)] text-xs font-medium tracking-wide text-[#7F0404]/70">
            AVAILABLE NOW
          </span>
        </div>

        {/* Heading */}
        <h1 className="mb-4 text-center font-[var(--font-space-grotesk)] text-4xl font-bold leading-tight tracking-tight text-[#1a0a0a] sm:text-5xl lg:text-6xl">
          <span className="block">Your Rewards.</span>
          <span className="block bg-gradient-to-r from-[#7F0404] via-[#a01010] to-[#7F0404] bg-clip-text text-transparent">
            One Tap Away.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mb-10 max-w-md text-center font-[var(--font-plus-jakarta-sans)] text-base leading-relaxed text-[#1a0a0a]/50 sm:text-lg">
          Earn points, unlock exclusive rewards, and enjoy deals from your
          favorite local businesses — all in one app.
        </p>

        {/* Download buttons */}
        <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row">
          {/* iOS App Store */}
          <a
            href="https://apps.apple.com/ph/app/noxaloyalty/id6760211721"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative"
          >
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#1a1a1a] to-[#333] opacity-20 blur-lg transition-all duration-500 group-hover:opacity-40" />
            <div className="relative flex items-center gap-3 rounded-xl border border-[#1a0a0a]/15 bg-[#1a0a0a] px-8 py-4 font-[var(--font-space-grotesk)] text-white shadow-lg transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-[0_8px_40px_rgba(0,0,0,0.25)] sm:px-10 sm:py-5">
              <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div className="leading-tight">
                <span className="block text-[10px] text-white/60">Download on the</span>
                <span className="text-base font-bold tracking-wide sm:text-lg">App Store</span>
              </div>
            </div>
          </a>

          {/* Android APK */}
          <Link
            href={APK_DOWNLOAD_URL}
            download="NoxaLoyalty.apk"
            className="group relative"
          >
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#7F0404] via-[#a01010] to-[#7F0404] opacity-30 blur-lg transition-all duration-500 group-hover:opacity-50" />
            <div className="relative flex items-center gap-3 rounded-xl border border-[#7F0404]/20 bg-gradient-to-r from-[#7F0404] to-[#9a0808] px-8 py-4 font-[var(--font-space-grotesk)] text-white shadow-lg transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-[0_8px_40px_rgba(127,4,4,0.35)] sm:px-10 sm:py-5">
              <svg
                className="h-6 w-6 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3"
                />
              </svg>
              <div className="leading-tight">
                <span className="block text-[10px] text-white/60">Download</span>
                <span className="text-base font-bold tracking-wide sm:text-lg">Android APK</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Version info */}
        <p className="mb-16 text-center font-[var(--font-plus-jakarta-sans)] text-xs text-[#1a0a0a]/30">
          iOS 15+ &middot; Android 8.0+
        </p>

        {/* Feature cards */}
        <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              ),
              title: "Scan & Earn",
              desc: "Scan QR codes to collect points instantly",
            },
            {
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              ),
              title: "Redeem Rewards",
              desc: "Unlock free items and exclusive perks",
            },
            {
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              title: "Local Favorites",
              desc: "Discover businesses and deals near you",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-[#7F0404]/[0.06] bg-white p-5 shadow-sm transition-all duration-300 hover:border-[#7F0404]/10 hover:shadow-md"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#7F0404]/[0.06] text-[#7F0404]">
                {feature.icon}
              </div>
              <h3 className="mb-1 font-[var(--font-ace-grotesk)] text-sm font-bold text-[#1a0a0a]">
                {feature.title}
              </h3>
              <p className="font-[var(--font-plus-jakarta-sans)] text-xs leading-relaxed text-[#1a0a0a]/45">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 flex flex-col items-center gap-2">
          <p className="font-[var(--font-plus-jakarta-sans)] text-xs text-[#1a0a0a]/25">
            Powered by NoxaLoyalty
          </p>
        </div>
      </div>
    </div>
  );
}
