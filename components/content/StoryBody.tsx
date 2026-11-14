import React from "react";
import Link from "next/link";

// Journal story body: plain text with a small, safe formatting subset. Nothing is ever rendered as HTML; React escapes
// all text. A body without any of the markers renders exactly as before (one paragraph per blank-line block).
//   ## Heading / ### Subheading     - bullet / 1. numbered list
//   **bold**                         [anchor](/internal/path) or [anchor](https://external.site)
type Block =
  | { kind: "h2" | "h3"; text: string }
  | { kind: "ul" | "ol"; items: string[] }
  | { kind: "p"; text: string };

const BULLET = /^\s*[-*]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

export function parseStory(body: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  const flushPara = () => {
    if (para.length) blocks.push({ kind: "p", text: para.join("\n") });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };
  for (const raw of body.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    const bullet = line.match(BULLET);
    const numbered = line.match(NUMBERED);
    if (!line.trim()) {
      flushPara();
      flushList();
    } else if (heading) {
      flushPara();
      flushList();
      blocks.push({ kind: heading[1].length === 2 ? "h2" : "h3", text: heading[2].trim() });
    } else if (bullet || numbered) {
      flushPara();
      const kind = bullet ? "ul" : "ol";
      if (!list || list.kind !== kind) {
        flushList();
        list = { kind, items: [] };
      }
      list.items.push((bullet || numbered)![1].trim());
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return blocks;
}

const INLINE = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

// **bold** and [links]; a link is kept only for a site path ("/…") or an https URL, otherwise its text is shown.
function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${m.index}`;
    if (m[1] !== undefined) {
      out.push(<strong key={key} className="font-semibold text-ink">{m[1]}</strong>);
    } else {
      const [label, href] = [m[2], m[3]];
      const cls = "text-ink underline underline-offset-4 hover:text-primary-hover";
      if (href.startsWith("/") && !href.startsWith("//")) {
        out.push(<Link key={key} href={href} className={cls}>{label}</Link>);
      } else if (/^https:\/\/[^\s]+$/.test(href)) {
        out.push(<a key={key} href={href} target="_blank" rel="noopener noreferrer" className={cls}>{label}</a>);
      } else {
        out.push(label);
      }
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const headingId = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export default function StoryBody({ body }: { body: string }) {
  const blocks = parseStory(body);
  return (
    <>
      {blocks.map((b, i) => {
        const key = `b${i}`;
        if (b.kind === "h2")
          return (
            <h2 key={key} id={headingId(b.text)} className="pt-4 text-2xl md:text-[28px] leading-tight font-medium text-ink scroll-mt-24">
              {inline(b.text, key)}
            </h2>
          );
        if (b.kind === "h3")
          return (
            <h3 key={key} id={headingId(b.text)} className="pt-2 text-xl font-medium text-ink scroll-mt-24">
              {inline(b.text, key)}
            </h3>
          );
        if (b.kind === "ul" || b.kind === "ol") {
          const Tag = b.kind;
          return (
            <Tag key={key} className={`${b.kind === "ul" ? "list-disc" : "list-decimal"} space-y-2 pl-6`}>
              {b.items.map((item, j) => (
                <li key={j}>{inline(item, `${key}-${j}`)}</li>
              ))}
            </Tag>
          );
        }
        if (b.kind === "p")
          return (
            <p key={key} className="whitespace-pre-line">
              {inline(b.text, key)}
            </p>
          );
        return null;
      })}
    </>
  );
}
