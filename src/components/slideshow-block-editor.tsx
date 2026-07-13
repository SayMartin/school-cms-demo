"use client";

import { ImageUpload } from "@/components/image-upload";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { HeadingStyleEditor } from "@/components/heading-style-editor";
import { mediaUrl } from "@/lib/r2/client";
import type { SlideshowBlock, SlideshowImage } from "@/lib/blocks";

const inputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-brand-green-dark focus:outline-none";

type Props = {
  block: SlideshowBlock;
  uploadPrefix: string;
  onChange: (patch: Partial<SlideshowBlock>) => void;
  showHeading?: boolean;
};

function imgSrc(key: string): string {
  return key.startsWith("/") ? key : mediaUrl(key);
}

export function SlideshowBlockEditor({
  block,
  uploadPrefix,
  onChange,
  showHeading = true,
}: Props) {
  function updateImage(idx: number, patch: Partial<SlideshowImage>) {
    onChange({
      images: block.images.map((img, i) =>
        i === idx ? { ...img, ...patch } : img,
      ),
    });
  }

  function removeImage(idx: number) {
    onChange({ images: block.images.filter((_, i) => i !== idx) });
  }

  function addImage(key: string) {
    onChange({ images: [...block.images, { src: key, alt: "" }] });
  }

  function moveImage(idx: number, dir: 1 | -1) {
    const next = [...block.images];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap]!, next[idx]!];
    onChange({ images: next });
  }

  return (
    <div className="space-y-4">
      {/* Heading */}
      {showHeading && (
        <div className="space-y-1">
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700">
              Slideshow heading{" "}
              <span className="font-normal text-gray-600">(H2)</span>
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
      )}

      {/* Image list */}
      <div className="space-y-3">
        <p>
          Images{block.images.length > 0 ? ` (${block.images.length})` : ""} —
          the first image is shown large, the rest in a slideshow
        </p>
        {block.images.map((img, idx) => (
          <div
            key={idx}
            className="rounded-md border border-gray-200 bg-white p-3 space-y-2"
          >
            <div className="flex items-center justify-between mb-1">
              <span>Image {idx + 1}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveImage(idx, -1)}
                  className="rounded px-1.5 py-0.5 hover:text-gray-700 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={idx === block.images.length - 1}
                  onClick={() => moveImage(idx, 1)}
                  className="rounded px-1.5 py-0.5 hover:text-gray-700 disabled:opacity-30"
                >
                  ↓
                </button>
                <ConfirmDeleteButton onConfirm={() => removeImage(idx)} locked={false} />
              </div>
            </div>
            <ImageUpload
              value={img.src || null}
              onChange={(key) =>
                key ? updateImage(idx, { src: key }) : removeImage(idx)
              }
              prefix={uploadPrefix}
              label={`Image ${idx + 1}`}
              srcResolver={imgSrc}
            />
            <input
              type="text"
              value={img.alt}
              onChange={(e) => updateImage(idx, { alt: e.target.value })}
              placeholder="Caption / alt text (shown in the slideshow)"
              className={inputClass}
            />
          </div>
        ))}

        {/* Add image */}
        <ImageUpload
          value={null}
          onChange={(key) => key && addImage(key)}
          prefix={uploadPrefix}
          label="Add image"
          srcResolver={imgSrc}
        />
      </div>
    </div>
  );
}
