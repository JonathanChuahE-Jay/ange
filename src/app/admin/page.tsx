"use client";

import { useState } from "react";
import { AdminShell, type AdminTab } from "@/components/admin/AdminShell";
import { OverviewPanel } from "@/components/admin/OverviewPanel";
import { StoryForm } from "@/components/admin/StoryForm";
import { PhotosManager } from "@/components/admin/PhotosManager";
import { QuizEditor } from "@/components/admin/QuizEditor";
import { MusicManager } from "@/components/admin/MusicManager";
import { HeadingEditor } from "@/components/admin/HeadingEditor";
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
      {tab === "timeline" && <><HeadingEditor key="timeline" section="timeline" /><TimelineEditor /></>}
      {tab === "photos" && <><HeadingEditor key="photos" section="photos" /><PhotosManager /></>}
      {tab === "chats" && <><HeadingEditor key="chats" section="chats" /><ChatsEditor /></>}
      {tab === "loves" && <><HeadingEditor key="loves" section="loves" /><LovesEditor /></>}
      {tab === "quiz" && <><HeadingEditor key="games" section="games" /><QuizEditor /></>}
      {tab === "music" && <MusicManager />}
    </AdminShell>
  );
}
