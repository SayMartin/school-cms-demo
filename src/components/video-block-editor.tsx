"use client";

import { useRef, useState } from "react";
import { mediaUrl } from "@/lib/r2/client";
import { HeadingStyleEditor } from "@/components/heading-style-editor";
import type { VideoBlock } from "@/lib/blocks";

type MediaItem = { key: string; url: string };

type Props = {
  block: VideoBlock;
  onChange: (patch: Partial<VideoBlock>) => void;
};

const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200 MB

const ALLOWED_VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogg",
  "video/quicktime": "mov",
};

export function VideoBlockEditor({ block, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerVideos, setPickerVideos] = useState<MediaItem[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  async function openPicker() {
    setPickerOpen(true);
    setPickerLoading(true);
    try {
      const res = await fetch("/api/media-list?prefix=videos&type=video");
      const data = (await res.json()) as MediaItem[];
      setPickerVideos(data);
    } catch {
      setPickerVideos([]);
    } finally {
      setPickerLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2  focus:border-brand-green-dark focus:outline-none";

  async function handleFile(file: File) {
    if (!ALLOWED_VIDEO_TYPES[file.type]) {
      setUploadError("File type not supported. Use MP4, WebM, OGG or MOV.");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      setUploadError("File is too large (max 200 MB).");
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prefix", "videos");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Upload failed");
      }
      const { key } = (await res.json()) as { key: string };
      onChange({ videoKey: key });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center">
          <label className="text-sm font-medium text-gray-700">
            Video heading <span className="font-normal text-gray-600">(H2)</span>
          </label>
          <div className="ml-8">
            <HeadingStyleEditor
              color={block.headingColor}
              onColorChange={(c) => onChange({ headingColor: c })}
              visible={block.headingVisible}
              onVisibleChange={(v) => onChange({ headingVisible: v })}
              enabled={true}
            />
          </div>
        </div>
        <input
          type="text"
          value={block.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
          placeholder="Optional"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block mb-1">Video (R2)</label>
        {block.videoKey && (
          <div className="mb-2">
            <video
              src={mediaUrl(block.videoKey)}
              controls
              className="w-full max-w-sm rounded border border-gray-200"
              preload="metadata"
            />
            <p className="mt-1 truncate max-w-sm">{block.videoKey}</p>
          </div>
        )}
        <div className="relative flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-md border border-gray-300 bg-white px-4 py-2  hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {uploading
              ? "Uploading…"
              : block.videoKey
                ? "Change video"
                : "Upload video"}
          </button>
          <button
            type="button"
            onClick={openPicker}
            className="rounded-md border border-gray-300 bg-white px-4 py-2  hover:bg-gray-50 transition-colors"
          >
            From R2 (videos/)
          </button>
          {block.videoKey && (
            <button
              type="button"
              onClick={() => onChange({ videoKey: "" })}
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2  text-red-700 hover:bg-red-100 transition-colors"
            >
              Remove
            </button>
          )}

          {pickerOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setPickerOpen(false)}
              />
              <div className="absolute left-0 top-full z-50 mt-1 w-120 rounded-lg border border-gray-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                  <span>
                    R2 library — <span>videos/</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(false)}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    X
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto p-2">
                  {pickerLoading ? (
                    <p className="py-4 text-center">Loading…</p>
                  ) : pickerVideos.length === 0 ? (
                    <p className="py-4 text-center">
                      No videos found under <span>videos/</span>
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {pickerVideos.map((v) => (
                        <button
                          key={v.key}
                          type="button"
                          onClick={() => {
                            onChange({ videoKey: v.key });
                            setPickerOpen(false);
                          }}
                          className={`w-full rounded px-3 py-2 text-left transition-colors hover:bg-gray-100 ${block.videoKey === v.key ? "bg-brand-green-dark/10 text-brand-green-dark" : "text-gray-700"}`}
                        >
                          {v.key}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/ogg,video/quicktime"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
        {uploadError && <p className="mt-1 text-red-600">{uploadError}</p>}
      </div>

      <div>
        <label className="block mb-1">Caption (optional)</label>
        <input
          type="text"
          value={block.caption}
          onChange={(e) => onChange({ caption: e.target.value })}
          placeholder="Short description below the video"
          className={inputClass}
        />
      </div>
    </div>
  );
}
