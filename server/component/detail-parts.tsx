import type { ComponentChildren } from "preact";

import { breakLines } from "../html/escape.ts";

/**
 * Term with its definitions, one column cell of a `.properties` grid.
 */
export function Dl({ term, children }: {
  term: string,
  children: ComponentChildren,
}) {
  return (
    <dl>
      <dt>{term}</dt>
      {children}
    </dl>
  );
}

/**
 * Definition with a link to a list page and a link to the source IRI.
 */
export function DdLink({ item, title }: {
  item: { href: string, label: string, iri: string },
  title: string,
}) {
  return (
    <dd>
      <a href={item.href ?? ""}>{` ${item.label} `}</a>
      <a
        href={item.iri ?? ""}
        title={title}
        rel="nofollow noopener noreferrer"
        target="_blank"
      >
        <gov-icon name="box-arrow-up-right" />
      </a>
    </dd>
  );
}

/**
 * A grid column of a `.properties` grid.
 */
export function PropertiesColumn({ children }: { children: ComponentChildren }) {
  return (
    <gov-grid-item col-span="12" col-span-md="3">
      {children}
    </gov-grid-item>
  );
}

/**
 * Cards linking to related items, such as datasets used by an application.
 */
export function RelatedItems({ items }: {
  items: { title: string, description: string, href: string }[],
}) {
  return (
    <gov-grid gap="l" class="gov-card-grid">
      {items.map(item => {
        const headlineId = "related-" + encodeURIComponent(item.href);
        return (
          <gov-grid-item col-span="12">
            <article>
              <gov-card direction="horizontal" href={item.href} aria-labelledby={headlineId}>
                <gov-flex gap="s" direction="column">
                  <header>
                    <h3 id={headlineId} class="gov-card__headline">
                      {item.title}
                    </h3>
                  </header>
                  <p dangerouslySetInnerHTML={{ __html: " " + breakLines(item.description) + " " }} />
                </gov-flex>
              </gov-card>
            </article>
          </gov-grid-item>
        );
      })}
    </gov-grid>
  );
}
