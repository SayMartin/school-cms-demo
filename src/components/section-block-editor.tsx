import { RichTextEditor } from "@/components/rich-text-editor";
import { HeadingStyleEditor } from "@/components/heading-style-editor";
import type { SectionBlock } from "@/lib/blocks";

type Props = {
  block: SectionBlock;
  onChange: (patch: Partial<SectionBlock>) => void;
};

export function SectionBlockEditor({ block, onChange }: Props) {
  return (
    <RichTextEditor
      key={block.id}
      value={block.body}
      onChange={(html) => onChange({ body: html })}
      placeholder="Section content…"
      topSlot={
        <div className="space-y-1">
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700">
              Section heading{" "}
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
            placeholder="Optional — renders as H1"
            className="w-full rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm focus:border-brand-green-dark focus:bg-white focus:outline-none"
          />
        </div>
      }
    />
  );
}
