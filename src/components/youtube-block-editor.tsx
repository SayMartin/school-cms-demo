import { HeadingStyleEditor } from "@/components/heading-style-editor";
import type { YoutubeBlock } from "@/lib/blocks";

type Props = {
  block: YoutubeBlock;
  onChange: (patch: Partial<YoutubeBlock>) => void;
};

export function YoutubeBlockEditor({ block, onChange }: Props) {
  const inputClass =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-green-dark focus:outline-none";

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
        <label className="block mb-1">YouTube link</label>
        <input
          type="url"
          value={block.url}
          onChange={(e) => onChange({ url: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=..."
          className={inputClass}
        />
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
