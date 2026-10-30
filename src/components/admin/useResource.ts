"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, messageForCode } from "@/lib/api";
import type { Paged } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

/** Shared CRUD machinery for an admin resource list. */
export function useResource<T extends { id: number }>(key: string, base: string, pageSize = 100) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const onError = (e: unknown) =>
    toast(messageForCode((e as { code?: string }).code), "error");

  const list = useQuery({
    queryKey: [key],
    queryFn: () => api.get<Paged<T>>(`${base}?pageSize=${pageSize}`),
  });

  const create = useMutation({
    mutationFn: (body: unknown) => api.send<T>(base, "POST", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [key] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["site"] });
      toast("Added ✨");
    },
    onError,
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: unknown }) =>
      api.send<T>(`${base}/${id}`, "PUT", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [key] });
      qc.invalidateQueries({ queryKey: ["site"] });
      toast("Saved ✨");
    },
    onError,
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.send(`${base}/${id}`, "DELETE"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [key] });
      qc.invalidateQueries({ queryKey: ["overview"] });
      qc.invalidateQueries({ queryKey: ["site"] });
      toast("Removed");
    },
    onError,
  });

  return { list, create, update, remove };
}
