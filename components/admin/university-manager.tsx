"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, X, Check, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import type { components } from "@/lib/api/schema";
import type { UniversityCreate, UniversityUpdate } from "@/lib/api/admin-types";

type University = components["schemas"]["UniversityRead"];

interface UniversityManagerProps {
  universities: University[];
}

type FormMode = { type: "new" } | { type: "edit"; university: University };

const EMPTY_FORM: UniversityCreate = {
  name: "",
  website: "",
  portal_url: "",
  open_date: null,
  close_date: null,
  is_active: false,
  scoring_method: null,
};

export function UniversityManager({ universities }: UniversityManagerProps) {
  const router = useRouter();
  const [mode, setMode] = useState<FormMode | null>(null);
  const [form, setForm] = useState<UniversityCreate>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openNew() {
    setForm(EMPTY_FORM);
    setError(null);
    setMode({ type: "new" });
  }

  function openEdit(university: University) {
    setForm({
      name: university.name,
      website: university.website,
      portal_url: university.portal_url,
      open_date: university.open_date ?? null,
      close_date: university.close_date ?? null,
      is_active: university.is_active,
      scoring_method: university.scoring_method ?? null,
    });
    setError(null);
    setMode({ type: "edit", university });
  }

  function closeForm() {
    setMode(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      if (mode?.type === "new") {
        await apiClient.post("/admin/universities", form);
      } else if (mode?.type === "edit") {
        const patch: UniversityUpdate = {};
        const u = mode.university;
        if (form.name !== u.name) patch.name = form.name;
        if (form.website !== u.website) patch.website = form.website;
        if (form.portal_url !== u.portal_url)
          patch.portal_url = form.portal_url;
        if (form.open_date !== (u.open_date ?? null))
          patch.open_date = form.open_date;
        if (form.close_date !== (u.close_date ?? null))
          patch.close_date = form.close_date;
        if (form.is_active !== u.is_active) patch.is_active = form.is_active;
        if (form.scoring_method !== (u.scoring_method ?? null))
          patch.scoring_method = form.scoring_method;
        await apiClient.patch(`/admin/universities/${u.id}`, patch);
      }
      closeForm();
      startTransition(() => router.refresh());
    } catch {
      setError("Save failed. Check your inputs and try again.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openNew}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus size={16} aria-hidden />
          New university
        </button>
      </div>

      <Card variant="paper" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Open date</Th>
                <Th>Close date</Th>
                <Th className="w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {universities.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    No universities yet.
                  </td>
                </tr>
              ) : (
                universities.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20">
                    <Td>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {u.portal_url}
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={u.is_active ? "success" : "neutral"}>
                        {u.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </Td>
                    <Td className="text-muted-foreground">
                      {u.open_date ?? "-"}
                    </Td>
                    <Td className="text-muted-foreground">
                      {u.close_date ?? "-"}
                    </Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
                      >
                        <Pencil size={12} aria-hidden />
                        Edit
                      </button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {mode && (
        <Card variant="paper" className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-xl">
              {mode.type === "new" ? "New university" : "Edit university"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              aria-label="Close form"
              className="-mr-1 cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className={inputClass}
                />
              </Field>
              <Field label="Scoring method">
                <input
                  type="text"
                  value={form.scoring_method ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      scoring_method: e.target.value || null,
                    })
                  }
                  placeholder="e.g. up_aps, uct_fps"
                  className={inputClass}
                />
              </Field>
              <Field label="Website" required>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) =>
                    setForm({ ...form, website: e.target.value })
                  }
                  required
                  placeholder="https://"
                  className={inputClass}
                />
              </Field>
              <Field label="Portal URL" required>
                <input
                  type="url"
                  value={form.portal_url}
                  onChange={(e) =>
                    setForm({ ...form, portal_url: e.target.value })
                  }
                  required
                  placeholder="https://"
                  className={inputClass}
                />
              </Field>
              <Field label="Open date">
                <input
                  type="date"
                  value={form.open_date ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, open_date: e.target.value || null })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Close date">
                <input
                  type="date"
                  value={form.close_date ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, close_date: e.target.value || null })
                  }
                  className={inputClass}
                />
              </Field>
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm">Active (visible to students)</span>
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors",
                  isPending
                    ? "cursor-not-allowed opacity-60"
                    : "hover:bg-primary/90",
                )}
              >
                {isPending ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden />
                ) : (
                  <Check size={14} aria-hidden />
                )}
                {mode.type === "new" ? "Create" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="cursor-pointer rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40";

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 ${className ?? ""}`}>{children}</td>;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}
