export type Settings = {
  askerName: string;
  partnerName: string;
  question: string;
  questionSubtext: string;
  yesResponse: string;
  noIsDodger: boolean;
  whatsappPhone: string;
  anniversaryDate: string;
  countdownTitle: string;
  countdownTarget: string | null;
  letterTitle: string;
  letterBody: string;
  letterSignoff: string;
};

export type TimelineEvent = {
  id: number;
  date: string;
  title: string;
  description: string;
  emoji: string;
  position: number;
};

export type PhotoMeta = {
  id: number;
  caption: string;
  /** a generated motion clip is ready at /api/photos/:id/video */
  hasVideo: boolean;
};

export type ChatQuote = {
  id: number;
  side: "me" | "partner";
  text: string;
  timeLabel: string;
  position: number;
};

export type Love = {
  id: number;
  emoji: string;
  text: string;
};

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
};

export type Track = {
  id: number;
  title: string;
  artist: string;
};

export type Prize = {
  id: number;
  label: string;
  emoji: string;
  color: string;
  weight: number;
};

export type SiteContent = {
  settings: Settings;
  timeline: TimelineEvent[];
  photos: PhotoMeta[];
  chats: ChatQuote[];
  loves: Love[];
  quiz: QuizQuestion[];
  tracks: Track[];
  prizes: Prize[];
  answeredYesAt: string | null;
};

export type Paged<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
};

/** wa.me deep link for the scan-to-chat QR (international digits). */
export function whatsappLink(phone: string, text: string): string | null {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 8) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
