import React from "react";
import Link from "next/link";
import { BookOpen, Calendar, Clock } from "lucide-react";

export interface JournalSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string | null;
  publishedAt: string | null;
  readMinutes: number;
}

export const formatJournalDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

/** Modave blog-grid card: 4:3 rounded image, meta row, 20px title, excerpt. */
export default function JournalCard({ article, headingLevel = 2 }: { article: JournalSummary; headingLevel?: 2 | 3 }) {
  const Heading = `h${headingLevel}` as "h2";
  const href = `/journal/${article.slug}`;
  const date = formatJournalDate(article.publishedAt);
  return (
    <article className="group flex flex-col min-w-0">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-[4/3] rounded-xl overflow-hidden bg-surface-muted mb-4 md:mb-6"
      >
        {!article.coverImage && (
          <BookOpen aria-hidden="true" className="absolute inset-0 m-auto w-10 h-10 text-ink-muted" strokeWidth={1} />
        )}
        {article.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        {article.category && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-surface text-ink text-xs font-medium">
            {article.category}
          </span>
        )}
      </Link>
      <ul className="flex flex-wrap items-center gap-x-8 gap-y-1 mb-2 md:mb-3 text-sm leading-[22px] text-ink-secondary">
        {date && (
          <li className="inline-flex items-center gap-2">
            <Calendar aria-hidden="true" className="w-4 h-4" strokeWidth={1.5} />
            <time dateTime={article.publishedAt ?? undefined}>{date}</time>
          </li>
        )}
        <li className="inline-flex items-center gap-2">
          <Clock aria-hidden="true" className="w-4 h-4" strokeWidth={1.5} />
          <span>{article.readMinutes} min read</span>
        </li>
      </ul>
      <Heading className="text-base leading-6 md:text-xl md:leading-7 font-medium text-ink mb-2">
        <Link href={href} className="hover:text-primary-hover transition-colors">
          {article.title}
        </Link>
      </Heading>
      {article.excerpt && <p className="text-sm md:text-base leading-[22px] md:leading-[26px] text-ink-secondary line-clamp-3">{article.excerpt}</p>}
    </article>
  );
}
