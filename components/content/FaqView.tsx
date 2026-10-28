"use client";

import React, { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import PageTitle from "@/components/checkout/PageTitle";
import Accordion, { type AccordionEntry } from "@/components/content/Accordion";
import PolicyNav from "@/components/content/PolicyNav";
import { PolicySection, policyLink } from "@/components/content/PolicyLayout";

/**
 * The FAQ page. The wording comes from lib/policies/faqs.ts and is shown exactly as written; this file only decides
 * how it is laid out: title band, contents list, a search box, one accordion per group and plain text for a group
 * that holds no questions (the contact details).
 */

type Block = { kind: "p"; lines: string[] } | { kind: "ul"; items: string[] } | { kind: "ol"; items: string[] };

interface Question {
  id: string;
  question: string;
  blocks: Block[];
  plain: string; // everything the search looks at
}

interface Group {
  id: string;
  title: string;
  intro: Block[]; // text before the first question
  questions: Question[];
}

interface Parsed {
  title: string;
  preamble: Block[];
  groups: Group[];
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const stripMarks = (s: string) => s.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

function toBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  const flush = () => {
    if (para.length) blocks.push({ kind: "p", lines: para });
    if (list) blocks.push(list);
    para = [];
    list = null;
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    const bullet = line.startsWith("- ");
    const numbered = /^\d+\.\s/.test(line);
    if (!line.trim()) flush();
    else if (bullet || numbered) {
      const kind = bullet ? "ul" : "ol";
      if (para.length || (list && list.kind !== kind)) flush();
      if (!list) list = { kind, items: [] };
      list.items.push(bullet ? line.slice(2) : line.replace(/^\d+\.\s/, ""));
    } else {
      if (list) flush();
      para.push(line);
    }
  }
  flush();
  return blocks;
}

function parse(md: string): Parsed {
  let title = "";
  const pre: string[] = [];
  const raw: { title: string; lines: string[] }[] = [];
  for (const line of md.replace(/\r\n/g, "\n").split("\n")) {
    if (line.startsWith("# ") && !title) title = line.slice(2).trim();
    else if (line.startsWith("## ")) raw.push({ title: line.slice(3).trim(), lines: [] });
    else (raw.length ? raw[raw.length - 1].lines : pre).push(line);
  }
  const groups = raw.map((g): Group => {
    const intro: string[] = [];
    const qs: { question: string; lines: string[] }[] = [];
    for (const line of g.lines) {
      if (line.startsWith("### ")) qs.push({ question: line.slice(4).trim(), lines: [] });
      else (qs.length ? qs[qs.length - 1].lines : intro).push(line);
    }
    return {
      id: slug(g.title),
      title: g.title,
      intro: toBlocks(intro),
      questions: qs.map((q) => {
        const blocks = toBlocks(q.lines);
        const plain = [q.question, ...q.lines.map(stripMarks)].join(" ").toLowerCase();
        return { id: slug(q.question), question: q.question, blocks, plain };
      }),
    };
  });
  return { title, preamble: toBlocks(pre), groups };
}

// **bold**, [text](url), web addresses, e-mail addresses and +91 phone numbers; the visible text is never changed.
const INLINE = /(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)\s]+\))|(https?:\/\/[^\s)]+)|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)|(\+91 \d{5} \d{5})/g;

function Inline({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let n = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) nodes.push(text.slice(last, at));
    const key = n++;
    let token = m[0];
    let tail = "";
    if (m[1]) {
      nodes.push(
        <strong key={key} className="text-ink font-medium">
          <Inline text={token.slice(2, -2)} />
        </strong>
      );
    } else if (m[2]) {
      const [, label, href] = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token)!;
      nodes.push(
        <a key={key} href={href} className={policyLink}>
          {label}
        </a>
      );
    } else {
      const punct = /[.,;:]+$/.exec(token); // sentence punctuation after an address is not part of it
      if (punct) {
        tail = punct[0];
        token = token.slice(0, -tail.length);
      }
      const href = m[3] ? token : m[4] ? `mailto:${token}` : `tel:${token.replace(/\s/g, "")}`;
      nodes.push(
        <a key={key} href={href} className={policyLink}>
          {token}
        </a>
      );
      if (tail) nodes.push(tail);
    }
    last = at + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <>{nodes}</>;
}

function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        if (b.kind === "ul" || b.kind === "ol") {
          const List = b.kind === "ol" ? "ol" : "ul";
          return (
            <List key={i} className={`${b.kind === "ol" ? "list-decimal" : "list-disc"} pl-5 space-y-1.5 marker:text-ink-muted`}>
              {b.items.map((item, j) => (
                <li key={j}>
                  <Inline text={item} />
                </li>
              ))}
            </List>
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
    </div>
  );
}

export default function FaqView({ markdown }: { markdown: string }) {
  const doc = useMemo(() => parse(markdown), [markdown]);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const visible = useMemo(
    () =>
      doc.groups
        .map((g) => ({ ...g, shown: g.questions.filter((x) => q === "" || x.plain.includes(q)) }))
        .filter((g) => (g.questions.length === 0 ? true : g.shown.length > 0)),
    [doc, q]
  );
  const anyQuestion = visible.some((g) => g.questions.length > 0);
  const noMatch = q !== "" && !anyQuestion;

  return (
    <div className="bg-canvas text-ink">
      <PageTitle title={doc.title} crumbs={[{ label: "Home", href: "/" }, { label: "FAQs" }]} />

      <section className="py-10 md:py-20">
        <div className="max-w-[1320px] mx-auto px-4 lg:px-[15px] grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-[60px]">
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 min-w-0">
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
              <PolicyNav sections={visible.map((g) => ({ id: g.id, label: g.title }))} />
            </div>
          </aside>

          <div className="lg:col-span-8 xl:col-span-9 min-w-0 xl:pl-10 space-y-8 md:space-y-10 text-base leading-[26px] text-ink-secondary">
            <Blocks blocks={doc.preamble} />

            <div className="relative">
              <label htmlFor="faq-search" className="sr-only">
                Search questions
              </label>
              <Search aria-hidden="true" className="w-4 h-4 text-ink-muted absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="faq-search"
                type="search"
                placeholder="Search questions"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-12 pl-11 pr-12 bg-surface border border-line-strong rounded-lg text-base text-ink placeholder:text-ink-muted outline-none focus:border-ink"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-ink-muted hover:text-ink"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {noMatch && (
              <p role="status" className="text-ink">
                No matching questions found.
              </p>
            )}

            {visible.map((g, gi) => {
              const entries: AccordionEntry[] = g.shown.map((x) => ({
                id: x.id,
                question: x.question,
                answer: <Blocks blocks={x.blocks} />,
              }));
              return (
                <PolicySection key={g.id} id={g.id} title={g.title}>
                  {g.intro.length > 0 && <Blocks blocks={g.intro} />}
                  {entries.length > 0 && <Accordion items={entries} defaultOpen={gi === 0 && !q ? [entries[0].id] : []} />}
                </PolicySection>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

