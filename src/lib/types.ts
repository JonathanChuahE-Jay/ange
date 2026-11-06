import type { Headings } from "./headings";

export type Settings = {
  askerName: string;
  partnerName: string;
  question: string;
  questionSubtext: string;
  yesResponse: string;
  noIsDodger: boolean;
  anniversaryDate: string;
  countdownTitle: string;
  countdownTarget: string | null;
  letterTitle: string;
  letterBody: string;
  letterSignoff: string;
  headings: Headings;
  footerText: string;
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
  /** where the clip came from: generated Ken Burns ('auto') or uploaded ('user') */
  videoSource: "auto" | "user" | null;
  /** your uploaded video plays with sound (admin toggle) */
  videoSound: boolean;
};

export type ChatQuote = {
  id: number;
  side: "me" | "partner";
  text: string;
  timeLabel: string;
  /** ms to wait after the previous message before this one appears */
  delayMs: number;
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

export type SiteContent = {
  settings: Settings;
  timeline: TimelineEvent[];
  photos: PhotoMeta[];
  chats: ChatQuote[];
  loves: Love[];
  quiz: QuizQuestion[];
  tracks: Track[];
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

