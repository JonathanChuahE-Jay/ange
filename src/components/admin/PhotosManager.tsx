"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { api, messageForCode } from "@/lib/api";
import type { Paged, PhotoMeta } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EditorModal } from "./EditorModal";
import { useResource } from "./useResource";
import { TextField } from "@/components/ui/Field";

type AdminPhoto = PhotoMeta & { mime: string; position: number; createdAt: string };

export function PhotosManager() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { list, remove } = useResource<AdminPhoto>("photos", "/api/admin/photos");
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [captioning, setCaptioning] = useState<AdminPhoto | null>(null);
  const [caption, setCaption] = useState("");
  const [deleting, setDeleting] = useState<AdminPhoto | null>(null);

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      form.append("caption", file.name.replace(/\.[^.]+$/, ""));
      return api.upload("/api/admin/photos", form);
    },
    onMutate: () => setUploading(true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["photos"] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["site"] });
      toast("Photo added 📸");
    },
    onError: (e) => toast(messageForCode((e as { code?: string }).code), "error"),
    onSettled: () => {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    },
  });

  const rename = useMutation({
    mutationFn: ({ id, caption }: { id: number; caption: string }) =>
      api.send("/api/admin/photos", "PUT", { id, caption }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["photos"] });
      qc.invalidateQueries({ queryKey: ["site"] });
      toast("Caption saved");
      setCaptioning(null);
    },
    onError: (e) => toast(messageForCode((e as { code?: string }).code), "error"),
  });

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink">Photos</h2>
          <p className="mt-0.5 text-[13px] text-inksoft">JPG, PNG, WebP or GIF · up to 8 MB each</p>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload.mutate(file);
          }}
        />
        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="tap-spring btn-circle-drop inline-flex min-h-10 items-center gap-2 rounded-full bg-rose px-5 text-sm font-bold text-white hover:bg-rosedeep disabled:opacity-60"
        >
          <span className="i-lucide-upload size-4" />
          {uploading ? "uploading…" : "Upload photo"}
        </button>
      </div>

      {list.isPending && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton aspect-square rounded-2xl" />
          ))}
        </div>
      )}

      {list.data && (
        <PagedGrid
          items={list.data}
          uploading={uploading}
          onCaption={(p) => {
            setCaptioning(p);
            setCaption(p.caption);
          }}
          onDelete={setDeleting}
        />
      )}

      <EditorModal
        open={captioning !== null}
        title="Photo caption"
        busy={rename.isPending}
        onClose={() => setCaptioning(null)}
        onSave={() => captioning && rename.mutate({ id: captioning.id, caption })}
      >
        <TextField
          label="Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="that day at the beach…"
        />
        {captioning && (
          <div className="img-zoom-frame overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/photos/${captioning.id}/raw`} alt="" className="max-h-56 w-full object-cover" />
          </div>
        )}
      </EditorModal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this photo?"
        message="It will be gone forever — no take-backs."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}

function PagedGrid({
  items,
  uploading,
  onCaption,
  onDelete,
}: {
  items: Paged<AdminPhoto>;
  uploading: boolean;
  onCaption: (p: AdminPhoto) => void;
  onDelete: (p: AdminPhoto) => void;
}) {
  if (items.items.length === 0 && !uploading) {
    return (
      <p className="mt-6 rounded-2xl border border-dashed border-line bg-white px-5 py-8 text-center text-sm text-inksoft">
        No photos yet — upload the first memory 📷
      </p>
    );
  }
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.items.map((p) => (
        <figure key={p.id} className="group relative overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="img-zoom-frame aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/photos/${p.id}/raw`}
              alt={p.caption || "photo"}
              className="size-full object-cover"
            />
          </div>
          <figcaption className="wrap truncate px-3 py-2 text-[13px] text-inksoft" data-multiline>
            {p.caption || "—"}
          </figcaption>
          <div className="absolute inset-x-0 top-0 flex justify-end gap-1 p-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button
              onClick={() => onCaption(p)}
              aria-label="Edit caption"
              className="flex size-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition-colors hover:text-rose"
            >
              <span className="i-lucide-pencil size-4" />
            </button>
            <button
              onClick={() => onDelete(p)}
              aria-label="Delete photo"
              className="flex size-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-md transition-colors hover:text-rosedeep"
            >
              <span className="i-lucide-trash-2 size-4" />
            </button>
          </div>
        </figure>
      ))}
    </div>
  );
}
