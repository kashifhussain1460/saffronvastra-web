// Approved product reviews as GET /api/v1/reviews/product/:slug returns them. Shared by the product page (server: the
// reviews are rendered into the HTML and into the Product structured data) and the reviews tab (browser).

export interface PublicReview {
  id: string;
  rating: number; // 1 to 5
  title: string | null;
  body: string;
  reply: string | null;
  author: string; // "Ananya S." — the API never exposes a full name or email
  createdAt: string;
}

export interface ReviewsSummary {
  count: number;
  average: number | null;
  distribution: Record<string, number>;
}

export interface InitialReviews {
  summary: ReviewsSummary;
  items: PublicReview[];
}
