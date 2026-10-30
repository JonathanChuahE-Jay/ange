"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { api, messageForCode } from "@/lib/api";
import { TextField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

const schema = z.object({ password: z.string().min(1, "Type the password") });

export default function AdminLoginPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();

  const login = useMutation({
    mutationFn: (pw: string) => api.send("/api/auth/session", "POST", { password: pw }),
    onSuccess: async () => {
      toast("Welcome back");
      // drop any cached "not authenticated" result so /admin doesn't bounce back here
      await qc.invalidateQueries({ queryKey: ["session"] });
      router.replace("/admin");
    },
    onError: (e) => setError(messageForCode((e as { code?: string }).code)),
  });

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-rosemist via-bg to-rosemist/60 px-5">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-rose text-white shadow-lg">
            <span className="icon-[lucide--heart] size-7 fill-white" />
          </span>
          <h1 className="mt-4 font-display text-3xl text-ink">Admin login</h1>
          <p className="mt-1 text-sm text-inksoft">the love dashboard awaits</p>
        </div>
        <form
          className="mt-8 flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = schema.safeParse({ password });
            setError(parsed.success ? undefined : parsed.error.issues[0].message);
            if (parsed.success) login.mutate(parsed.data.password);
          }}
        >
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="the secret code"
            value={password}
            error={error}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={login.isPending}
            className="tap-spring btn-circle-drop min-h-12 rounded-full bg-rose font-bold text-white hover:bg-rosedeep disabled:opacity-60"
          >
            {login.isPending ? "checking…" : "Enter"}
          </button>
        </form>
        <a
          href="/"
          className="mt-6 block text-center text-[13px] text-inksoft transition-colors hover:text-rose"
        >
          ← back to the love site
        </a>
      </div>
    </div>
  );
}
