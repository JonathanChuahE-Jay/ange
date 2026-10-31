"use client";

import type { ChatQuote } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";
import { WhatsAppPhone } from "./WhatsAppPhone";

/** What your chats say — a WhatsApp-styled phone that plays the conversation. */
export function Chats({
  chats,
  partnerName,
}: {
  chats: ChatQuote[];
  partnerName: string;
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

        <div className="relative mt-16 flex justify-center">
          {/* WhatsApp for iPhone — plays the conversation live */}
          <WhatsAppPhone chats={chats} partnerName={partnerName} />
        </div>
      </div>
    </section>
  );
}
