"use client";

import { useState } from "react";
import { AdminShell, type AdminTab } from "@/components/admin/AdminShell";
import { OverviewPanel } from "@/components/admin/OverviewPanel";
import { StoryForm } from "@/components/admin/StoryForm";
import { PhotosManager } from "@/components/admin/PhotosManager";
import { QuizEditor } from "@/components/admin/QuizEditor";
import { MusicManager } from "@/components/admin/MusicManager";
import {
  ChatsEditor,
  LovesEditor,
  TimelineEditor,
} from "@/components/admin/Editors";

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("overview");

  return (
    <AdminShell tab={tab} onTab={setTab}>
      {tab === "overview" && <OverviewPanel />}
      {tab === "story" && <StoryForm />}
      {tab === "timeline" && <TimelineEditor />}
      {tab === "photos" && <PhotosManager />}
      {tab === "chats" && <ChatsEditor />}
      {tab === "loves" && <LovesEditor />}
      {tab === "quiz" && <QuizEditor />}
      {tab === "music" && <MusicManager />}
    </AdminShell>
  );
}
