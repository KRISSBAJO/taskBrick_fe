"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Archive,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link2,
  Loader2,
  Paperclip,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  archiveFileAsset,
  createFileAsset,
  createUploadIntent,
  deleteFileAsset,
  listFileAssets,
  restoreFileAsset,
  type FileAsset,
  type UploadIntent,
  type Visibility,
} from "@/lib/api";
import { cn } from "@/lib/cn";
import { userInitials } from "@/lib/workspace-ui";
import { useConfirm } from "./confirm-provider";
import { useToast } from "./toast-provider";

type FileAssetManagerProps = {
  token: string;
  entityType: string;
  entityId: string;
  scope?: string;
  title?: string;
  compact?: boolean;
  canManage?: boolean;
  onChanged?: () => void;
};

const visibilityOptions: Visibility[] = ["TEAM", "WORKSPACE", "ORGANIZATION", "PRIVATE"];

export function FileAssetManager({
  canManage = true,
  compact,
  entityId,
  entityType,
  onChanged,
  scope,
  title = "Files",
  token,
}: FileAssetManagerProps) {
  const { confirm } = useConfirm();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<FileAsset[]>([]);
  const [query, setQuery] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("TEAM");

  const resolvedScope = scope ?? entityType;

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const result = await listFileAssets(token, {
        limit: 100,
        search: query.trim() || undefined,
        scope: resolvedScope,
        entityType,
        entityId,
        includeArchived,
        includeDeleted,
      });
      setFiles(result.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load files.");
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, includeArchived, includeDeleted, query, resolvedScope, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadFiles(), 0);
    return () => window.clearTimeout(timer);
  }, [loadFiles]);

  const activeCount = useMemo(
    () => files.filter((file) => !file.archivedAt && !file.deletedAt).length,
    [files],
  );

  async function registerLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;
    const form = event.currentTarget;
    const fd = new FormData(form);
    const fileName = String(fd.get("fileName") || "").trim();
    const fileUrl = String(fd.get("fileUrl") || "").trim();
    const mimeType = String(fd.get("mimeType") || "").trim();
    if (!fileName || !fileUrl) return;

    setSaving("link");
    try {
      const created = await createFileAsset(token, {
        fileName,
        fileUrl,
        mimeType: mimeType || undefined,
        provider: "external",
        scope: resolvedScope,
        entityType,
        entityId,
        visibility,
        metadata: {
          source: "frontend-link-registration",
          kind: assetKind(fileUrl, mimeType),
        },
      });
      setFiles((current) => [created, ...current]);
      form.reset();
      onChanged?.();
      toast({ title: "File linked", description: created.fileName, variant: "success" });
    } catch (error) {
      toast({ title: "Unable to link file", description: messageFrom(error), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function uploadFile(file: File) {
    if (!canManage) return;
    setSaving("upload");
    try {
      const intent = await createUploadIntent(token, {
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        scope: resolvedScope,
        entityType,
        entityId,
        visibility,
      });
      const uploadedUrl = await uploadWithIntent(intent, file);
      const created = await createFileAsset(token, {
        fileName: file.name,
        fileUrl: uploadedUrl,
        storageKey: intent.storageKey,
        provider: intent.provider,
        mimeType: file.type || intent.mimeType || undefined,
        sizeBytes: file.size,
        scope: resolvedScope,
        entityType,
        entityId,
        visibility,
        metadata: {
          source: "frontend-direct-upload",
          uploadProvider: intent.provider,
          kind: assetKind(file.name, file.type),
        },
      });
      setFiles((current) => [created, ...current]);
      onChanged?.();
      toast({ title: "Upload registered", description: created.fileName, variant: "success" });
    } catch (error) {
      toast({ title: "Upload unavailable", description: messageFrom(error), variant: "error" });
    } finally {
      setSaving("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function onArchive(file: FileAsset) {
    if (!canManage) return;
    setSaving(file.id);
    try {
      const updated = await archiveFileAsset(token, file.id);
      setFiles((current) => current.map((item) => (item.id === file.id ? updated : item)));
      onChanged?.();
    } catch (error) {
      toast({ title: "Unable to archive file", description: messageFrom(error), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onRestore(file: FileAsset) {
    if (!canManage) return;
    setSaving(file.id);
    try {
      const updated = await restoreFileAsset(token, file.id);
      setFiles((current) => current.map((item) => (item.id === file.id ? updated : item)));
      onChanged?.();
    } catch (error) {
      toast({ title: "Unable to restore file", description: messageFrom(error), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  async function onDelete(file: FileAsset) {
    if (!canManage) return;
    const ok = await confirm({
      title: "Delete file record?",
      description: `Soft-delete "${file.fileName}". Provider storage cleanup remains governed by backend policy.`,
      confirmLabel: "Delete file",
      tone: "danger",
    });
    if (!ok) return;

    setSaving(file.id);
    try {
      const updated = await deleteFileAsset(token, file.id);
      setFiles((current) => current.map((item) => (item.id === file.id ? updated : item)));
      onChanged?.();
    } catch (error) {
      toast({ title: "Unable to delete file", description: messageFrom(error), variant: "error" });
    } finally {
      setSaving("");
    }
  }

  return (
    <section className={cn("overflow-hidden rounded-2xl border border-line bg-panel shadow-sm", compact && "rounded-xl")}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-[#111111]">
            <Paperclip className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-sm font-black text-foreground">{title}</h3>
            <p className="text-xs font-semibold text-ink-soft">{activeCount} active · {files.length} visible</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void loadFiles()}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-line bg-background text-ink-soft hover:bg-panel-muted hover:text-foreground"
            aria-label="Refresh files"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </button>
          {canManage ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadFile(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving === "upload"}
                className="tb-yellow-button inline-flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-black disabled:opacity-55"
              >
                {saving === "upload" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                Upload
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 p-4">
        <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_150px_auto_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search file name, mime type, or provider"
              className="h-10 w-full rounded-xl border border-line bg-background pl-9 pr-3 text-sm font-semibold text-foreground outline-none focus:border-primary"
            />
          </label>
          <select
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as Visibility)}
            disabled={!canManage}
            className="h-10 rounded-xl border border-line bg-background px-3 text-xs font-black text-foreground outline-none focus:border-primary"
          >
            {visibilityOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-background px-3 text-xs font-black text-foreground">
            <input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} />
            Archived
          </label>
          <label className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-background px-3 text-xs font-black text-foreground">
            <input type="checkbox" checked={includeDeleted} onChange={(event) => setIncludeDeleted(event.target.checked)} />
            Deleted
          </label>
        </div>

        {canManage ? (
          <form onSubmit={registerLink} className="grid gap-2 rounded-xl border border-line bg-background p-3 lg:grid-cols-[1fr_1.4fr_160px_auto]">
            <input name="fileName" required placeholder="File name" className={fieldClass} />
            <input name="fileUrl" required type="url" placeholder="https:// file, document, image, or provider link" className={fieldClass} />
            <input name="mimeType" placeholder="MIME type" className={fieldClass} />
            <button type="submit" disabled={saving === "link"} className="h-10 rounded-xl bg-foreground px-4 text-xs font-black text-white disabled:opacity-55">
              {saving === "link" ? "Saving..." : "Link file"}
            </button>
          </form>
        ) : null}

        {message ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{message}</div> : null}

        {loading ? (
          <div className="grid gap-2">
            {Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-xl bg-panel-muted" />)}
          </div>
        ) : files.length ? (
          <div className="grid gap-2">
            {files.map((file) => (
              <FileAssetRow
                key={file.id}
                canManage={canManage}
                file={file}
                saving={saving === file.id}
                onArchive={() => void onArchive(file)}
                onDelete={() => void onDelete(file)}
                onRestore={() => void onRestore(file)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-background px-4 py-8 text-center">
            <Paperclip className="mx-auto size-7 text-ink-soft" />
            <p className="mt-2 text-sm font-black text-foreground">No files yet</p>
            <p className="mt-1 text-xs text-ink-soft">Upload a file or register a provider link.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function FileAssetRow({
  canManage,
  file,
  onArchive,
  onDelete,
  onRestore,
  saving,
}: {
  canManage: boolean;
  file: FileAsset;
  onArchive: () => void;
  onDelete: () => void;
  onRestore: () => void;
  saving: boolean;
}) {
  const inactive = Boolean(file.deletedAt || file.archivedAt);

  return (
    <article className={cn("flex flex-wrap items-center gap-3 rounded-xl border border-line bg-background p-3", inactive && "opacity-65")}>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-panel-muted text-foreground">
        <FileAssetIcon file={file} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <a href={file.fileUrl} target="_blank" rel="noreferrer" className="truncate text-sm font-black text-foreground hover:text-primary-dark">
            {file.fileName}
          </a>
          <span className="rounded-lg border border-line bg-panel px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.1em] text-ink-soft">
            {file.provider}
          </span>
          {file.archivedAt ? <StatePill label="Archived" /> : null}
          {file.deletedAt ? <StatePill label="Deleted" danger /> : null}
        </div>
        <p className="mt-1 truncate text-xs font-semibold text-ink-soft">
          {[file.mimeType, formatBytes(file.sizeBytes), file.visibility].filter(Boolean).join(" · ") || "File metadata"}
        </p>
        {file.uploadedBy ? (
          <p className="mt-1 text-[11px] font-semibold text-ink-soft">
            Uploaded by {userInitials(file.uploadedBy)} · {formatDate(file.createdAt)}
          </p>
        ) : null}
      </div>
      <div className="flex items-center gap-1.5">
        <a
          href={file.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex size-9 items-center justify-center rounded-xl border border-line bg-panel text-ink-soft hover:bg-panel-muted hover:text-foreground"
          aria-label="Open file"
        >
          <ExternalLink className="size-4" />
        </a>
        {canManage ? (
          <>
            {inactive ? (
              <button type="button" onClick={onRestore} disabled={saving} className={iconButtonClass} aria-label="Restore file">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
              </button>
            ) : (
              <button type="button" onClick={onArchive} disabled={saving} className={iconButtonClass} aria-label="Archive file">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />}
              </button>
            )}
            <button type="button" onClick={onDelete} disabled={saving || Boolean(file.deletedAt)} className={cn(iconButtonClass, "hover:bg-red-50 hover:text-red-700")} aria-label="Delete file">
              <Trash2 className="size-4" />
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

function StatePill({ danger, label }: { danger?: boolean; label: string }) {
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-black", danger ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700")}>
      {label}
    </span>
  );
}

async function uploadWithIntent(intent: UploadIntent, file: File) {
  if (!intent.uploadUrl) {
    throw new Error(intent.note || `${intent.provider} direct upload is not fully configured yet.`);
  }

  if (intent.provider === "cloudinary") {
    const body = new FormData();
    Object.entries(intent.fields).forEach(([key, value]) => body.append(key, String(value)));
    body.append("file", file);
    const response = await fetch(intent.uploadUrl, { method: "POST", body });
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Cloudinary upload failed.");
    const secureUrl = typeof payload.secure_url === "string" ? payload.secure_url : undefined;
    const url = typeof payload.url === "string" ? payload.url : undefined;
    return secureUrl ?? url ?? intent.fileUrl;
  }

  const response = await fetch(intent.uploadUrl, {
    method: intent.method,
    headers: intent.headers,
    body: file,
  });
  if (!response.ok) throw new Error(`${intent.provider} upload failed with status ${response.status}.`);
  return intent.fileUrl;
}

function FileAssetIcon({ file }: { file: FileAsset }) {
  const kind = assetKind(file.fileUrl, file.mimeType ?? undefined);
  if (kind === "image") return <ImageIcon className="size-5" />;
  if (kind === "link") return <Link2 className="size-5" />;
  return <FileText className="size-5" />;
}

function assetKind(value: string, mimeType?: string) {
  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType?.startsWith("video/")) return "video";
  if (/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(value)) return "image";
  if (/^https?:\/\//i.test(value)) return "link";
  return "file";
}

function formatBytes(value?: number | null) {
  if (!value || value < 1) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 102.4) / 10} KB`;
  return `${Math.round(value / 1024 / 102.4) / 10} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

const fieldClass =
  "h-10 min-w-0 rounded-xl border border-line bg-panel px-3 text-sm font-semibold text-foreground outline-none transition focus:border-primary";

const iconButtonClass =
  "inline-flex size-9 items-center justify-center rounded-xl border border-line bg-panel text-ink-soft transition hover:bg-panel-muted hover:text-foreground disabled:opacity-45";
