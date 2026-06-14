import type { Repo } from "../lib/types";

interface Props {
  repos: readonly Repo[];
}

/**
 * Crawlable structured data, rendered INTO the React tree so it ships in the
 * prerendered static HTML (and stays accurate after the client live-refetch
 * re-renders). One ItemList whose elements are SoftwareSourceCode nodes, one
 * per cleaned repo.
 */
export function JsonLd({ repos }: Props) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Kinetic Gain - public repository portfolio",
    numberOfItems: repos.length,
    itemListElement: repos.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SoftwareSourceCode",
        name: r.name,
        ...(r.description ? { description: r.description } : {}),
        codeRepository: r.url,
        ...(r.language ? { programmingLanguage: r.language } : {}),
        ...(r.topics.length ? { keywords: r.topics.join(", ") } : {}),
        author: { "@type": "Person", name: "Mirza Causevic" },
      },
    })),
  };
  // Escape "<" so a description containing "</script>" cannot break out of the tag.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
