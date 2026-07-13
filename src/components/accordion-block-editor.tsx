import { RichTextEditor } from "@/components/rich-text-editor";
import { HeadingStyleEditor } from "@/components/heading-style-editor";
import type { AccordionSectionBlock } from "@/lib/blocks";

type Props = {
  block: AccordionSectionBlock;
  onChange: (patch: Partial<AccordionSectionBlock>) => void;
};

export function AccordionBlockEditor({ block, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-4 mb-1">
          <label className="text-sm font-medium text-gray-700 shrink-0">
            Clickable heading <span className="font-normal text-gray-600">(button)</span>
          </label>
          <HeadingStyleEditor
            color={block.headingColor}
            onColorChange={(c) => onChange({ headingColor: c })}
            visible={true}
            onVisibleChange={() => {}}
            enabled={false}
          />
        </div>
        <input
          type="text"
          value={block.summary}
          onChange={(e) => onChange({ summary: e.target.value })}
          placeholder="E.g. Show more information…"
          className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-brand-green focus:outline-none"
        />
      </div>
      <div>
        <label className="block">Content (hidden until clicked)</label>
        <div className="mt-1">
          <RichTextEditor
            key={block.id}
            value={block.body}
            onChange={(html) => onChange({ body: html })}
            placeholder="The content shown when expanded…"
          />
        </div>
      </div>
    </div>
  );
}
