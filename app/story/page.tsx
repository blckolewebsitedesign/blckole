import { Footer } from "components/footer";
import type { Metadata } from "next";
import Image from "next/image";
import styles from "./page.module.css";
import { StorySidebar } from "./story-sidebar";

export const metadata: Metadata = {
  title: "Story",
  description:
    "You always find your way back. The story behind BLCKHOLE — heavy denim, deliberate hardware, and clothes that survive your real week.",
  openGraph: { type: "article" },
};

const CHAPTERS: {
  num: string;
  id: string;
  label: string;
  body: string;
  image: string;
  imageAlt: string;
}[] = [
  {
    num: "01",
    id: "how-this-started",
    label: "How this started",
    body: "BLCKHOLE grew out of late nights in the studio — arguing about pocket depth, watching denim crease wrong until it finally creased right, and deciding we would rather sell fewer pieces than explain bad ones. The name stuck because everyone already knew what a black hole does: it pulls until you stop fighting it.",
    image: "/Story_2.png",
    imageAlt: "Studio sketchbook with denim sketches and fabric swatches",
  },
  {
    num: "02",
    id: "what-we-actually-make",
    label: "What we actually make",
    body: "Heavy denim that keeps its line. Fleece with weight. Graphics you notice from across the room, then discover detail when you step closer. Hardware that feels cold in your palm on purpose. We are not chasing drops every week — we chase the version that survives your real week.",
    image: "/Story_3.png",
    imageAlt: "Close-up of stitched leather and heavy denim seam",
  },
  {
    num: "03",
    id: "how-we-use-colour",
    label: "How we use colour",
    body: "Most of the wardrobe is black and off-black because that is what we live in. White shows up where contrast buys clarity. Red is rare — saved for where it should read like a signal, not wallpaper. If you only remember one thing: we treat colour like punctuation, not filler.",
    image: "/Story_4.png",
    imageAlt: "Embossed leather patch on dark denim",
  },
];

const TIMELINE: { year: string; body: string }[] = [
  {
    year: "2024",
    body: "First patterns, first wrong samples, first orders from friends who refused a discount",
  },
  {
    year: "2025",
    body: "Denim program tightens · hardware and print vendors locked in",
  },
  {
    year: "2026",
    body: "Collection 01 online · same-day dispatch on in-stock pieces where noted",
  },
];

export default function StoryPage() {
  return (
    <>
      <main className={styles.page}>
        <div className={styles.layout}>
          <StorySidebar />

          <div className={styles.main}>
            {/* ── Hero ────────────────────────────────────────────── */}
            <section id="intro" className={styles.hero}>
              <div className={styles.heroText}>
                <p className={styles.eyebrow}>Story</p>
                <h1 className={styles.headline}>
                  You always
                  <br />
                  find your way back.
                </h1>
                <p className={styles.intro}>
                  That line started as a note on a scrap of pattern paper — not
                  a slogan meeting. It is the rule we cut to: if the garment
                  does not feel inevitable when you put it on, we do not ship
                  it.
                </p>
              </div>

              <div className={styles.heroVisual}>
                <Image
                  src="/Story_1.png"
                  alt="BLCKHOLE figure in a heavyweight leather coat"
                  width={1086}
                  height={1448}
                  priority
                  sizes="(max-width: 860px) 80vw, 420px"
                  className={styles.heroImage}
                />
                <aside className={styles.founderNote} aria-label="Founder note">
                  <p className={styles.founderEyebrow}>Founder note</p>
                  <p className={styles.founderQuote}>
                    BLCKHOLE exists because we wanted clothes with weight — not
                    just in fabric, but in intent.
                  </p>
                  <p className={styles.founderSign}>— A.</p>
                </aside>
              </div>
            </section>

            {/* ── Chapters ────────────────────────────────────────── */}
            <section className={styles.chapters} aria-label="Story chapters">
              {CHAPTERS.map((c) => (
                <article key={c.id} id={c.id} className={styles.chapter}>
                  <header className={styles.chapterHead}>
                    <span className={styles.chapterNum}>{c.num}.</span>
                    <h2 className={styles.chapterLabel}>{c.label}</h2>
                  </header>
                  <div className={styles.chapterBodyWrap}>
                    <p className={styles.chapterBody}>{c.body}</p>
                    <div className={styles.chapterThumb}>
                      <Image
                        src={c.image}
                        alt={c.imageAlt}
                        width={1448}
                        height={1086}
                        sizes="(max-width: 860px) 240px, 220px"
                        className={styles.chapterImage}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </section>

            {/* ── Timeline (horizontal) ───────────────────────────── */}
            <section
              id="timeline"
              className={styles.timeline}
              aria-label="Our evolution"
            >
              <p className={styles.timelineEyebrow}>Our evolution</p>
              <div className={styles.timelineRail} aria-hidden="true" />
              <ol className={styles.timelineList}>
                {TIMELINE.map((row) => (
                  <li key={row.year} className={styles.timelineCell}>
                    <span className={styles.timelineDot} aria-hidden="true" />
                    <span className={styles.timelineYear}>{row.year}</span>
                    <span className={styles.timelineBody}>{row.body}</span>
                  </li>
                ))}
              </ol>
            </section>

            {/* ── Bottom strip ────────────────────────────────────── */}
            <div className={styles.bottomStrip} aria-hidden="true">
              <span>BLCKHOLE — EST. 2026</span>
              <span className={styles.bottomCenter}>
                NOT TRENDING. JUST TRUE.
              </span>
              <span>© BLCKHOLE STUDIO</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
