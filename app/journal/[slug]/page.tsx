import { BRAND } from "@/lib/brand";
import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import JournalCard, { formatJournalDate, type JournalSummary } from "@/components/content/JournalCard";

// Always read the live journal, so an unpublished story disappears at once.
export const dynamic = "force-dynamic";

const API_ORIGIN = process.env.API_ORIGIN || "http://127.0.0.1:4000";

interface Props {
  params: Promise<{ slug: string }>;
}

// null means the story does not exist or is not published. Any other failure is thrown.
const loadStory = cache(async (slug: string) => {
  const res = await fetch(`${API_ORIGIN}/api/v1/journal/${encodeURIComponent(slug)}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Journal service responded with ${res.status}`);
  return (await res.json()).data as {
    slug: string;
    title: string;
    excerpt: string | null;
    coverImage: string | null;
    category: string | null;
    publishedAt: string | null;
    readMinutes: number;
    body: string;
  };
});

// Related stories: same category first, then the latest stories. A failure only hides the section.
async function loadRelated(slug: string, category: string | null): Promise<JournalSummary[]> {
  const get = async (q: URLSearchParams) => {
    try {
      const res = await fetch(`${API_ORIGIN}/api/v1/journal?${q}`, { cache: "no-store" });
      if (!res.ok) return [];
      return ((await res.json()).items ?? []) as JournalSummary[];
    } catch {
      return [];
    }
  };
  const picked: JournalSummary[] = [];
  const add = (items: JournalSummary[]) => {
    for (const a of items) if (a.slug !== slug && !picked.some((p) => p.slug === a.slug) && picked.length < 3) picked.push(a);
  };
  if (category) add(await get(new URLSearchParams({ limit: "4", category })));
  if (picked.length < 3) add(await get(new URLSearchParams({ limit: "6" })));
  return picked;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = await loadStory(slug).catch(() => null);
  if (!story) return { title: `Story not found | ${BRAND.name}` };
  return {
    title: `${story.title} | The Saffron Journal`,
    description: story.excerpt || undefined,
    alternates: { canonical: `/journal/${story.slug}` },
    openGraph: { type: "article", title: story.title, description: story.excerpt || undefined, url: `/journal/${story.slug}`, ...(story.coverImage ? { images: [{ url: story.coverImage }] } : {}) },
  };
}

export default async function JournalStoryPage({ params }: Props) {
  const { slug } = await params;
  const story = await loadStory(slug);
  if (!story) notFound();
  const related = await loadRelated(story.slug, story.category);

  // Plain text: a blank line starts a new paragraph. React escapes everything, so the text is never treated as markup.
  const paragraphs = story.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const date = formatJournalDate(story.publishedAt);

  return (
    <div className="bg-canvas text-ink">
      {story.coverImage ? (
        <div className="relative h-[260px] sm:h-[380px] lg:h-[568px] bg-surface-muted overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={story.coverImage} alt={story.title} className="absolute inset-0 w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-10 md:h-16 bg-surface-muted" aria-hidden="true" />
      )}

      <article
        className={`relative max-w-[970px] mx-auto bg-canvas rounded-t-xl px-4 sm:px-8 lg:px-[60px] pt-6 md:pt-10 ${
          story.coverImage ? "-mt-10 md:-mt-[135px]" : "-mt-6 md:-mt-10"
        }`}
      >
        <header className="text-center space-y-3 md:space-y-4">
          {story.category && (
            <Link
              href={`/journal?category=${encodeURIComponent(story.category)}`}
              className="inline-flex items-center min-h-8 px-3 rounded-full bg-surface-muted text-sm text-ink hover:text-primary-hover"
            >
              {story.category}
            </Link>
          )}
          <h1 className="text-[28px] leading-9 md:text-[40px] md:leading-[48px] font-medium text-ink">{story.title}</h1>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-sm text-ink-secondary">
            {date && (
              <li className="inline-flex items-center gap-2">
                <Calendar aria-hidden="true" className="w-4 h-4" strokeWidth={1.5} />
                <time dateTime={story.publishedAt ?? undefined}>{date}</time>
              </li>
            )}
            <li className="inline-flex items-center gap-2">
              <Clock aria-hidden="true" className="w-4 h-4" strokeWidth={1.5} />
              <span>{story.readMinutes} min read</span>
            </li>
          </ul>
        </header>

        {story.excerpt && (
          <p className="mt-8 md:mt-10 text-lg leading-7 text-ink">{story.excerpt}</p>
        )}

        <div className="mt-6 space-y-4 text-base leading-[26px] text-ink-secondary" data-testid="story-body">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">{p}</p>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-4">
          {story.category ? (
            <p className="flex items-center gap-2 text-sm text-ink-secondary">
              <span>Tag:</span>
              <Link
                href={`/journal?category=${encodeURIComponent(story.category)}`}
                className="inline-flex items-center min-h-8 px-3 rounded-full bg-surface-muted text-ink hover:text-primary-hover"
              >
                {story.category}
              </Link>
            </p>
          ) : (
            <span />
          )}
          <Link href="/journal" className="inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-ink hover:text-primary-hover">
            <ArrowLeft aria-hidden="true" className="w-4 h-4" /> Back to The Saffron Journal
          </Link>
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="py-10 md:py-20">
          <div className="max-w-[1320px] mx-auto px-4 lg:px-[15px]">
            <div className="text-center mb-8 md:mb-12">
              <h2 id="related-heading" className="text-[28px] leading-9 md:text-[40px] md:leading-[48px] font-medium text-ink">
                Related Articles
              </h2>
              <p className="mt-2 text-base text-ink-secondary">More stories from the Saffron Journal</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-[15px] md:gap-x-[30px] gap-y-[30px]">
              {related.map((a) => (
                <JournalCard key={a.id} article={a} headingLevel={3} />
              ))}
            </div>
          </div>
        </section>
      )}
      {related.length === 0 && <div className="h-10 md:h-20" aria-hidden="true" />}
    </div>
  );
}
