"use client";

import { useRef, useState } from "react";

export type Attachment = {
  key: string;
  name: string;
  type: string;
  size: number;
  fieldId?: string;
};

type Props = {
  value: Attachment[];
  onChange: (files: Attachment[]) => void;
  label?: string;
  maxFiles?: number;
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function iconFor(type: string): string {
  if (type.startsWith("image/")) return "🖼️";
  if (type.startsWith("video/")) return "🎬";
  return "📄";
}

export function AttachmentUpload({
  value,
  onChange,
  label = "Bifoga filer (dokument, foto, video)",
  maxFiles = 10,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setError(null);
    if (value.length + files.length > maxFiles) {
      setError(`Max ${maxFiles} filer.`);
      return;
    }
    setUploading(true);
    try {
      const uploaded: Attachment[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/applications/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(
            `${file.name}: ${body.error ?? "Upload failed"}`,
          );
        }
        uploaded.push((await res.json()) as Attachment);
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  function remove(key: string) {
    onChange(value.filter((f) => f.key !== key));
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {value.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {value.map((f) => (
            <li
              key={f.key}
              className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden>{iconFor(f.type)}</span>
                <span className="truncate">{f.name}</span>
                <span className="shrink-0 text-gray-600">
                  {formatSize(f.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(f.key)}
                className="shrink-0 text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        disabled={uploading || value.length >= maxFiles}
        onClick={() => inputRef.current?.click()}
        className="mt-2 rounded-md border border-gray-300 bg-white px-4 py-2 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {uploading ? "Uploading…" : "Add files"}
      </button>

      <p className="mt-1 text-sm text-gray-600">
        Allowed formats: PDF, Word, images (JPG/PNG), video (MP4/MOV). Max 25 MB
        per document, 200 MB per video.
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx,.odt,.txt,.rtf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
