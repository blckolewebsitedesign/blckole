import Link from "next/link";
import styles from "./index.module.css";

const { COMPANY_NAME, SITE_NAME } = process.env;

export function Footer() {
  return (
    <footer className={styles.wrapper}>
      <p className={styles.manifesto}>
        Born on the road, made for the city. Technical, protective and
        unapologetically feminine, our pieces give women the confidence to move
        freely. A call to carve your own path, with no compromise and no
        concession.
      </p>

      <div className={styles.links}>
        <div className={styles.leftLinks}>
          <Link href="/page/terms-of-service" className={styles.link}>
            Terms of Service
          </Link>
          <Link href="/page/shipping-policy" className={styles.link}>
            Shipping Policy
          </Link>
          <Link href="/page/size-guide" className={styles.link}>
            Size Guide
          </Link>
        </div>

        <div className={styles.rightLinks}>
          <a href="mailto:hello@becaneparis.com" className={styles.link}>
            hello@becaneparis.com
          </a>
          <a
            href="https://instagram.com/becaneparis"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Instagram
          </a>
        </div>
      </div>
    </footer>
  );
}
