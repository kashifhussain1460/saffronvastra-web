"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Carousel from "./Carousel";
import SectionHeading, { CONTAINER, SECTION_BOTTOM } from "./SectionHeading";

interface JournalSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string | null;
  publishedAt: string | null;
}

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

// Latest published journal articles (same API as /journal). Hidden when there are none.
export default function JournalTeaser() {
  const [articles, setArticles] = useState<JournalSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/journal?limit=3")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body) => {
        if (!cancelled && Array.isArray(body?.items)) setArticles(body.items);
      })
      .catch(() => {
        /* the section simply stays hidden */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (articles.length === 0) return null;

  return (
    <section aria-labelledby="home-journal-title" className={`bg-canvas ${SECTION_BOTTOM}`}>
      <div className={CONTAINER}>
        <SectionHeading id="home-journal-title" title="The Saffron Journal" subtitle="Wear Stories, Not Just Garments" />
        <Carousel
          label="The Saffron Journal"
          gapClassName="gap-[15px] md:gap-[30px]"
          slideClassName="basis-[85%] md:basis-[calc((100%-30px)/2)] lg:basis-[calc((100%-60px)/3)]"
          arrowTopClassName="top-[30%]"
        >
          {articles.map((a) => (
            <article key={a.id} className="group flex h-full flex-col">
              <Link
                href={`/journal/${a.slug}`}
                tabIndex={-1}
                aria-hidden="true"
                className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-surface-muted"
              >
                {a.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.coverImage}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                )}
              </Link>
              <div className="flex flex-1 flex-col gap-2 pt-4">
                <p className="text-sm leading-[22px] text-ink-secondary">
                  {[a.category, formatDate(a.publishedAt)].filter(Boolean).join(" · ")}
                </p>
                <h3 className="text-lg font-medium leading-7 text-ink xl:text-xl">
                  <Link href={`/journal/${a.slug}`} className="transition-colors hover:text-primary-hover">
                    {a.title}
                  </Link>
                </h3>
                {a.excerpt && <p className="line-clamp-2 text-base leading-[26px] text-ink-secondary">{a.excerpt}</p>}
              </div>
            </article>
          ))}
        </Carousel>
        <div className="mt-6 text-center">
          <Link
            href="/journal"
            className="inline-flex min-h-11 items-center text-base font-semibold text-ink transition-colors hover:text-primary-hover"
          >
            <span className="border-b border-current pb-0.5">Read the Journal</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
