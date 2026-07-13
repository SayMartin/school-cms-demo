import parse, { domToReact, Element } from "html-react-parser";
import type { DOMNode } from "html-react-parser";
import { ButtonLink } from "@/components/button-link";

function isElement(node: DOMNode): node is Element {
  return node.type === "tag";
}

function transformNode(node: DOMNode) {
  if (!isElement(node) || node.name !== "a") return undefined;

  const href = node.attribs?.href ?? "#";
  const isExternal = node.attribs?.target === "_blank";
  const isBtn = node.attribs?.class?.includes("rte-btn") ?? false;

  if (isBtn) {
    return (
      <ButtonLink href={href} external={isExternal} variant="primary">
        {domToReact(node.children as DOMNode[])}
      </ButtonLink>
    );
  }

  return undefined;
}

export function RichTextContent({ html, className }: { html: string; className?: string }) {
  return (
    <div className={`rich-content ${className ?? ""}`}>
      {parse(html, { replace: transformNode })}
    </div>
  );
}
