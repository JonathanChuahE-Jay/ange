"use client";

import { motion } from "motion/react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { whatsappLink, type ChatQuote } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

/** What your chats say — a WhatsApp-styled phone plus a scan-to-reply QR
 *  that opens a real WhatsApp chat with the asker. */
export function Chats({
  chats,
  partnerName,
  askerName,
  whatsappPhone,
}: {
  chats: ChatQuote[];
  partnerName: string;
  askerName: string;
  whatsappPhone: string;
}) {
  if (chats.length === 0) return null;
  const lastPartnerIdx = chats.reduce((acc, c, i) => (c.side === "partner" ? i : acc), -1);

  return (
    <section id="chats" className="relative scroll-mt-20 overflow-x-clip py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob size-96 bg-rosemist/80 left-[-7rem] top-1/3" style={{ animationDuration: "17s" }} />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-5">
        <SectionHeading
          kicker="exhibit A, your honor"
          title="What your chats say"
          icon="i-lucide-message-circle-heart"
          note="the receipts"
        />

        <div className="relative mt-16 flex flex-col items-center justify-center gap-10 md:flex-row md:gap-14">
          {/* WhatsApp phone */}
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-sm overflow-hidden rounded-[2.8rem] border-[10px] border-ink bg-[#ECE5DD] shadow-2xl"
          >
            <span aria-hidden className="absolute top-2.5 left-1/2 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-ink" />

            {/* status bar */}
            <div className="flex items-center justify-between bg-gradient-to-b from-[#075E54] to-[#054d44] px-7 pt-4 pb-2 text-white">
              <span className="text-[12px] font-semibold">9:41</span>
              <span className="flex items-center gap-1.5" aria-hidden>
                <span className="i-lucide-signal size-3.5" />
                <span className="i-lucide-wifi size-3.5" />
                <span className="i-lucide-battery-full size-4.5" />
              </span>
            </div>

            {/* WhatsApp header */}
            <div className="flex items-center gap-3 bg-[#075E54] px-4 pb-3 text-white">
              <div className="flex size-10 items-center justify-center rounded-full bg-white/15 font-display text-lg">
                {partnerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-bold">{partnerName}</p>
                <p className="text-[11px] text-white/70">online</p>
              </div>
              <span className="i-simple-icons-whatsapp ml-auto size-5 text-white/90" aria-hidden />
            </div>

            {/* messages */}
            <div className="flex max-h-[26rem] flex-col gap-2 bg-[#ECE5DD] p-3.5">
              <span className="mx-auto rounded-lg bg-white/80 px-3 py-1 text-[10px] font-bold tracking-wider text-inksoft/70 uppercase shadow-sm">
                today
              </span>
              {chats.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, scale: 0.85, y: 10 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 22,
                    delay: Math.min(i * 0.1, 0.6),
                  }}
                  className={`flex max-w-[82%] flex-col ${c.side === "me" ? "self-end items-end" : "self-start items-start"}`}
                >
                  <div className="relative">
                    <p
                      className={`wrap rounded-2xl px-3 py-2 text-[15px] leading-snug shadow-sm ${
                        c.side === "me"
                          ? "rounded-br-md bg-[#DCF8C6] text-[#111B21]"
                          : "rounded-bl-md bg-white text-[#111B21]"
                      }`}
                      data-multiline
                    >
                      {c.text}
                      <span className="ml-2 inline-flex translate-y-0.5 items-center gap-1 text-[10px] whitespace-nowrap text-inksoft/60">
                        {c.timeLabel}
                        {c.side === "me" && (
                          <span className="i-lucide-check-check size-3.5 text-[#34B7F1]" aria-hidden />
                        )}
                      </span>
                    </p>
                    {i === lastPartnerIdx && (
                      <span
                        aria-hidden
                        className="absolute -bottom-1.5 left-2 rounded-full border border-[#ECE5DD] bg-white px-1.5 py-0.5 text-[11px] shadow-sm"
                      >
                        ❤️
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* typing indicator */}
              <div className="mt-1 flex items-center gap-2 self-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="size-1.5 animate-bounce rounded-full bg-inksoft/50"
                      style={{ animationDelay: `${d * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* scan-to-reply QR card */}
          <ScanCard askerName={askerName} whatsappPhone={whatsappPhone} />
        </div>
      </div>
    </section>
  );
}

function ScanCard({ askerName, whatsappPhone }: { askerName: string; whatsappPhone: string }) {
  const link = useMemo(() => whatsappLink(whatsappPhone, "Yes 💖"), [whatsappPhone]);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (!link) return;
    let alive = true;
    QRCode.toDataURL(link, {
      margin: 1,
      width: 240,
      color: { dark: "#075E54", light: "#FFF8F3" },
    }).then((url) => {
      if (alive) setQr(url);
    }).catch(() => {});
    return () => {
      alive = false;
    };
  }, [link]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: 2 }}
      whileInView={{ opacity: 1, y: 0, rotate: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="shadow-rise relative w-full max-w-xs rounded-3xl border border-line bg-white p-6 text-center"
    >
      <span aria-hidden className="tape -top-3 left-1/2 z-5 -translate-x-1/2 rotate-2" />
      <p className="text-[12px] font-bold tracking-[0.3em] text-[#075E54] uppercase">keep talking</p>
      <h3 className="mt-2 font-display text-2xl text-ink">Reply for real</h3>
      {link && qr ? (
        <>
          <div className="mx-auto mt-4 w-fit rounded-2xl border-2 border-dashed border-[#075E54]/30 bg-[#FFF8F3] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt={`WhatsApp QR code to chat with ${askerName}`} width={200} height={200} className="size-50" />
          </div>
          <p className="wrap mt-4 font-hand text-2xl leading-snug text-inksoft" data-multiline>
            scan me with WhatsApp → linked devices, or your phone camera
          </p>
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="tap-spring btn-circle-drop mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#075E54] px-6 text-sm font-bold text-white hover:bg-[#054d44]"
          >
            <span className="i-simple-icons-whatsapp size-4" aria-hidden />
            open chat
          </a>
        </>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-rosemist/30 px-4 py-8">
          <span className="i-lucide-qr-code size-10 text-inksoft/40" aria-hidden />
          <p className="wrap text-sm text-inksoft" data-multiline>
            {askerName} hasn't set a WhatsApp number yet — add it in the admin panel to light up the
            scan-to-reply QR.
          </p>
        </div>
      )}
    </motion.div>
  );
}
