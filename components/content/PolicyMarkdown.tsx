import React from "react";
import PolicyLayout, { PolicySection, policyLink, policyList } from "./PolicyLayout";

// Renders a legal page written in a small Markdown subset: "# " page title, "## " sections (they feed the contents list),
// "### " sub-headings, paragraphs, "- " lists, **bold**, [text](url), bare URLs and email addresses.
// Lines of one paragraph stay on separate lines (a trailing backslash or two spaces is allowed and ignored).

type Block =
  | { kind: "h3"; text: string }
  | { kind: "p"; lines: string[] }
  | { kind: "ul"; items: string[] };

interface Chunk {
  id: string;
  label: string;
  blocks: Block[];
}

export function fillPlaceholders(md: string, vars: Record<string, string>) {
  return md.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? "");
}

function toBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: "p", lines: para });
    if (list.length) blocks.push({ kind: "ul", items: list });
    para = [];
    list = [];
  };
  for (const raw of lines) {
    const line = raw.replace(/\\$/, "").replace(/\s+$/, "");
    if (!line.trim()) flush();
    else if (line.startsWith("### ")) {
      flush();
      blocks.push({ kind: "h3", text: line.slice(4) });
    } else if (line.startsWith("- ")) {
      if (para.length) flush();
      list.push(line.slice(2));
    } else {
      if (list.length) flush();
      para.push(line);
    }
  }
  flush();
  return blocks;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function parse(md: string) {
  let title = "";
  const preambleLines: string[] = [];
  const sections: { label: string; lines: string[] }[] = [];
  for (const line of md.split("\n")) {
    if (line.startsWith("# ") && !title) title = line.slice(2).trim();
    else if (line.startsWith("## ")) sections.push({ label: line.slice(3).trim(), lines: [] });
    else (sections.length ? sections[sections.length - 1].lines : preambleLines).push(line);
  }
  const chunks: Chunk[] = sections.map((s) => ({ id: slug(s.label), label: s.label, blocks: toBlocks(s.lines) }));
  return { title, preamble: toBlocks(preambleLines), chunks };
}

const INLINE = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\)|https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;

function Inline({ text }: { text: string }) {
  const parts = text.split(INLINE).filter((p) => p !== "");
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} className="text-ink font-medium">
              <Inline text={p.slice(2, -2)} />
            </strong>
          );
        }
        const md = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(p);
        if (md) {
          return (
            <a key={i} href={md[2]} className={policyLink}>
              {md[1]}
            </a>
          );
        }
        if (/^https?:\/\//.test(p)) {
          return (
            <a key={i} href={p} className={policyLink}>
              {p}
            </a>
          );
        }
        if (/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(p)) {
          return (
            <a key={i} href={`mailto:${p}`} className={policyLink}>
              {p}
            </a>
          );
        }
        return <React.Fragment key={i}>{p}</React.Fragment>;
      })}
    </>
  );
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.kind === "h3") {
          return (
            <h3 key={i} className="pt-2 text-base leading-6 md:text-xl md:leading-7 font-medium text-ink">
              {b.text}
            </h3>
          );
        }
        if (b.kind === "ul") {
          return (
            <ul key={i} className={policyList}>
              {b.items.map((item, j) => (
                <li key={j}>
                  <Inline text={item} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {b.lines.map((l, j) => (
              <React.Fragment key={j}>
                {j > 0 && <br />}
                <Inline text={l} />
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

export default function PolicyMarkdown({
  markdown,
  crumb,
  links,
}: {
  markdown: string;
  crumb: string;
  links: { title: string; items: { href: string; label: string }[] };
}) {
  const { title, preamble, chunks } = parse(markdown);
  return (
    <PolicyLayout title={title || crumb} crumb={crumb} sections={chunks.map(({ id, label }) => ({ id, label }))} links={links}>
      <div className="space-y-3">
        <Blocks blocks={preamble} />
      </div>
      {chunks.map((c) => (
        <PolicySection key={c.id} id={c.id} title={c.label}>
          <Blocks blocks={c.blocks} />
        </PolicySection>
      ))}
    </PolicyLayout>
  );
}
