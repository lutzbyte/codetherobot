import type { ReactNode } from "react";
import type { Section } from "@/content/pages";
import { PageHeader } from "./PageHeader";
import styles from "./Article.module.css";

interface ArticleProps {
  title: string;
  subtitle?: string;
  updated?: string;
  sections: readonly Section[];
  children?: ReactNode;
}

/** Halaman teks yang nyaman dibaca: judul h1, bagian h2, paragraf, dan daftar. */
export function Article({ title, subtitle, updated, sections, children }: ArticleProps) {
  return (
    <section className={styles.wrap}>
      <PageHeader title={title} subtitle={subtitle} />
      {updated ? <p className={styles.updated}>Last updated: {updated}</p> : null}
      {sections.map((section) => (
        <article key={section.heading} className={styles.block}>
          <h2 className={styles.heading}>{section.heading}</h2>
          {section.paragraphs?.map((text) => (
            <p key={text} className={styles.text}>
              {text}
            </p>
          ))}
          {section.items ? (
            <ul className={styles.list}>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
      {children}
    </section>
  );
}