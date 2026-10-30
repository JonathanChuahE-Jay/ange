"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api, messageForCode } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export type AdminTab =
  | "overview"
  | "story"
  | "timeline"
  | "photos"
  | "chats"
  | "loves"
  | "quiz"
  | "music"
  | "prizes";

const TABS: { id: AdminTab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "icon-[lucide--layout-dashboard]" },
  { id: "story", label: "Question & Letter", icon: "icon-[lucide--heart]" },
  { id: "timeline", label: "Timeline", icon: "icon-[lucide--milestone]" },
  { id: "photos", label: "Photos", icon: "icon-[lucide--image]" },
  { id: "chats", label: "Chats", icon: "icon-[lucide--message-circle]" },
  { id: "loves", label: "Things you love", icon: "icon-[lucide--sparkles]" },
  { id: "quiz", label: "Quiz game", icon: "icon-[lucide--circle-help]" },
  { id: "music", label: "Music", icon: "icon-[lucide--music]" },
  { id: "prizes", label: "Prize wheel", icon: "icon-[lucide--gift]" },
];

export function AdminShell({
  tab,
  onTab,
  children,
}: {
  tab: AdminTab;
  onTab: (t: AdminTab) => void;
  children: ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmLogout, setConfirmLogout] = useState(false);

  const session = useQuery({
    queryKey: ["session"],
    queryFn: () => api.get<{ authenticated: boolean }>("/api/auth/session"),
    staleTime: 0, // never trust a cached verdict — it decides the login redirect
  });

  const logout = useMutation({
    mutationFn: () => api.send("/api/auth/session", "DELETE"),
    onSuccess: () => router.replace("/admin/login"),
    onError: (e) => toast(messageForCode((e as { code?: string }).code), "error"),
  });

  useEffect(() => {
    if (session.data && !session.data.authenticated) {
      router.replace("/admin/login");
    }
  }, [session.data, router]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg md:flex-row">
      {/* sidebar (desktop) */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-white px-4 py-6 md:flex">
        <a href="/" className="mb-8 flex items-center gap-2 px-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-rose text-white">
            <span className="icon-[lucide--heart] size-5 fill-white" />
          </span>
          <span className="font-display text-lg text-ink">ange · admin</span>
        </a>
        <nav className="flex flex-1 flex-col gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors ${
                tab === t.id
                  ? "bg-rosemist text-rose"
                  : "text-inksoft hover:bg-rosemist/50 hover:text-rose"
              }`}
            >
              <span className={`${t.icon} size-[18px]`} />
              {t.label}
            </button>
          ))}
        </nav>
        <div className="mt-4 border-t border-line pt-4">
          <button
            onClick={() => setConfirmLogout(true)}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-inksoft transition-colors hover:bg-rosemist/50 hover:text-rosedeep"
          >
            <span className="icon-[lucide--log-out] size-[18px]" />
            Log out
          </button>
        </div>
      </aside>

      {/* top bar (mobile) */}
      <div className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <a href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-rose text-white">
              <span className="icon-[lucide--heart] size-4 fill-white" />
            </span>
            <span className="font-display text-base text-ink">ange · admin</span>
          </a>
          <button
            onClick={() => setConfirmLogout(true)}
            aria-label="Log out"
            className="flex size-10 items-center justify-center rounded-xl text-inksoft"
          >
            <span className="icon-[lucide--log-out] size-5" />
          </button>
        </div>
        <div
          className="flex gap-1 overflow-x-auto px-3 pb-3"
          style={{ scrollbarWidth: "none" }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              className={`min-h-9 shrink-0 rounded-full px-4 text-sm font-semibold transition-colors ${
                tab === t.id ? "bg-rose text-white" : "bg-rosemist/60 text-inksoft"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="min-w-0 flex-1 px-5 py-8 md:px-10">{children}</main>

      <ConfirmDialog
        open={confirmLogout}
        title="Log out?"
        message="You'll need the password to get back in."
        confirmLabel="Log out"
        danger
        onConfirm={() => {
          setConfirmLogout(false);
          logout.mutate();
        }}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  );
}
