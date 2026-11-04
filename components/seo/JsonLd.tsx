import type { JsonLdNode } from "@/lib/jsonld";

interface JsonLdProps {
  data: JsonLdNode | JsonLdNode[];
}

// One JSON-LD block. JSON.stringify escapes quotes; "<" is escaped so the data can never close the script tag.
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, String.fromCharCode(92) + "u003c") }}
    />
  );
}
