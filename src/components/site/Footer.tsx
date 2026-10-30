"use client";

import { BACKEND_VERSION, FRONTEND_VERSION } from "@/lib/versions";

export function Footer({ askerName, partnerName }: { askerName: string; partnerName: string }) {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-b from-dusk1 to-dusk0 px-5 pt-14 pb-16">
      <div aria-hidden className="stars-layer absolute inset-0 opacity-50" />
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <span className="petal left-[18%] text-rose-soft" style={{ animationDuration: "14s" }}>♥</span>
        <span className="petal left-[70%] text-goldsoft" style={{ animationDuration: "18s", animationDelay: "6s" }}>♥</span>
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-5 text-center">
        {/* heart divider */}
        <div aria-hidden className="flex w-full max-w-xs items-center gap-4">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/30" />
          <span className="i-lucide-heart size-4.5 fill-rose text-rose" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/30" />
        </div>

        <p className="font-hand text-3xl text-white md:text-4xl">
          made with <span className="i-lucide-heart inline-block size-5 align-middle fill-rose text-rose" /> by {askerName} for {partnerName}
        </p>
        <p className="text-[12px] text-white/40">
          frontend v{FRONTEND_VERSION} · backend v{BACKEND_VERSION}
        </p>
        <a
          href="/admin"
          className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-[12px] text-white/40 transition-colors hover:border-white/25 hover:text-rosemist"
        >
          <span className="i-lucide-lock size-3.5" /> admin
        </a>
      </div>
    </footer>
  );
}
