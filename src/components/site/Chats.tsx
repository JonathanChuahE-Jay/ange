"use client";

import { motion } from "motion/react";
import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { whatsappLink, type ChatQuote } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";
import { WhatsAppPhone } from "./WhatsAppPhone";
import { BorderBeam } from "@/components/kit/border-beam";
import { MagicCard } from "@/components/kit/magic-card";

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

  return (
    <section id="chats" className="relative scroll-mt-20 overflow-x-clip py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob size-96 bg-rosemist/80 left-[-7rem] top-1/3" style={{ animationDuration: "17s" }} />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-5">
        <SectionHeading
          kicker="exhibit A, your honor"
          title="What your chats say"
          icon="icon-[lucide--message-circle-heart]"
          note="the receipts"
        />

        <div className="relative mt-16 flex flex-col items-center justify-center gap-10 md:flex-row md:gap-14">
          {/* WhatsApp for iPhone — plays the conversation live */}
          <WhatsAppPhone chats={chats} partnerName={partnerName} />

          {/* scan-to-reply QR card */}
          <ScanCard askerName={askerName} whatsappPhone={whatsappPhone} />
        </div>
      </div>
    </section>
  );
}

function ScanCard({ askerName, whatsappPhone }: { askerName: string; whatsappPhone: string }) {
  const link = useMemo(() => whatsappLink(whatsappPhone, "Yes"), [whatsappPhone]);
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
      className="relative w-full max-w-xs"
    >
      <span aria-hidden className="tape -top-3 left-1/2 z-50 -translate-x-1/2 rotate-2" />
      <MagicCard
        className="rounded-3xl shadow-[0_20px_50px_-25px_rgb(7_94_84/0.5)]"
        gradientColor="#E3F4EF"
        gradientFrom="#25D366"
        gradientTo="#D64560"
      >
      <div className="p-6 text-center">
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
            <span className="icon-[simple-icons--whatsapp] size-4" aria-hidden />
            open chat
          </a>
        </>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-rosemist/30 px-4 py-8">
          <span className="icon-[lucide--qr-code] size-10 text-inksoft/40" aria-hidden />
          <p className="wrap text-sm text-inksoft" data-multiline>
            {askerName} hasn't set a WhatsApp number yet — add it in the admin panel to light up the
            scan-to-reply QR.
          </p>
        </div>
      )}
      </div>
      </MagicCard>
      <BorderBeam size={90} duration={9} colorFrom="#25D366" colorTo="#D64560" className="rounded-3xl" />
    </motion.div>
  );
}
