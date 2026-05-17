import { Footer } from "components/footer";
import { getPage, getPages } from "lib/shopify";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import styles from "./page.module.css";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = await getPage(`story-${params.slug}`).catch(() => null);
  if (!page) return notFound();

  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description,
    openGraph: { type: "article" },
  };
}

export default async function StoryPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const [page, allPages] = await Promise.all([
    getPage(`story-${params.slug}`).catch(() => null),
    getPages().catch(() => []),
  ]);

  if (!page) return notFound();

  const storyPages = allPages.filter((p) => p.handle.startsWith("story-"));
  const currentIndex = storyPages.findIndex(
    (p) => p.handle === `story-${params.slug}`,
  );

  return (
    <div className={styles.wrapper}>
      {/* Hero placeholder — stories would have a featured image via metafields */}
      <div className={styles.hero}>
        <span className={styles.indicator}>
          Story {String(currentIndex + 1).padStart(2, "0")} /{" "}
          {String(storyPages.length).padStart(2, "0")}
        </span>
      </div>

      <div className={styles.body}>
        <h1 className={styles.storyTitle}>{page.title}</h1>
        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: page.body }}
        />
      </div>

      <div className={styles.credits}>
        <span className={styles.creditItem}>Story</span>
        <span className={styles.creditItem}>Bécane Paris</span>
      </div>

      <Footer />
    </div>
  );
}
