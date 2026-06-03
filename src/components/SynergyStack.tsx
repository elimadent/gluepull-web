import { useMemo, useRef } from 'react';
import { AddToCartButton } from '@/components/AddToCartButton';
import { SYNERGY_STACK, SynergyCategory, SynergyProduct } from '@/data/synergyStack';
import { useBestSellers, type RankFn } from '@/hooks/useBestSellers';

/**
 * Replacement for the old "Complete Tool Kit" list. Each row is a collapsible
 * category; expanding reveals a horizontally swipeable carousel of real
 * ansonpdr.com products, each with a "why this pairs with your glue" blurb.
 *
 * The lead recommendation is the best seller in the category (per the live
 * Anson best-sellers list); ties and non-best-sellers keep their hand-authored
 * order. Left/right arrows and native touch swipe cycle to the alternates.
 */
export function SynergyStack() {
  const { rankOf } = useBestSellers();
  const categories = useMemo(
    () =>
      SYNERGY_STACK.map((cat) => ({
        ...cat,
        products: orderByBestSeller(cat.products, rankOf),
      })),
    [rankOf]
  );
  return (
    <div className="synergy-stack">
      {categories.map((cat) => (
        <CategoryAccordion key={cat.id} category={cat} />
      ))}
    </div>
  );
}

/** Anson product handle from a /products/<handle> URL. */
function handleOf(url: string): string | undefined {
  return url.match(/\/products\/([^/?#]+)/)?.[1];
}

/** Best sellers first (by rank), everything else in its original order. */
function orderByBestSeller(
  products: SynergyProduct[],
  rankOf: RankFn
): SynergyProduct[] {
  return products
    .map((p, i) => ({ p, i, rank: rankOf(handleOf(p.url)) }))
    .sort((a, b) => {
      if (a.rank !== undefined && b.rank !== undefined) return a.rank - b.rank || a.i - b.i;
      if (a.rank !== undefined) return -1;
      if (b.rank !== undefined) return 1;
      return a.i - b.i;
    })
    .map((x) => x.p);
}

function CategoryAccordion({ category }: { category: SynergyCategory }) {
  const lead = category.products[0];
  return (
    <details className="synergy-cat">
      <summary>
        {lead ? (
          <img
            src={lead.image}
            alt=""
            className="synergy-icon-img"
            loading="lazy"
          />
        ) : (
          <span className="synergy-icon" aria-hidden>
            {category.icon}
          </span>
        )}
        <span className="synergy-head-text">
          <span className="synergy-cat-label">{category.label}</span>
          <span className="synergy-cat-role">{category.role}</span>
          {lead ? (
            <span className="synergy-lead">Lead pick: {lead.name}</span>
          ) : null}
        </span>
        <span className="synergy-chev" aria-hidden>▾</span>
      </summary>
      <ProductCarousel category={category} />
    </details>
  );
}

function ProductCarousel({ category }: { category: SynergyCategory }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>('.synergy-card')?.offsetWidth ?? 280;
    const step = cardWidth + 16; // card width + gap
    el.scrollBy({ left: direction === 'right' ? step : -step, behavior: 'smooth' });
  };

  return (
    <div className="synergy-carousel-wrap">
      <button
        type="button"
        className="synergy-arrow left"
        onClick={() => scrollBy('left')}
        aria-label="Previous product"
      >
        ‹
      </button>
      <div
        className="synergy-carousel"
        ref={scrollerRef}
        role="list"
        aria-label={`${category.label} options`}
      >
        {category.products.map((p, i) => (
          <article key={p.url} className="synergy-card" role="listitem">
            {i === 0 ? <div className="synergy-lead-tag">LEAD PICK</div> : null}
            <img
              src={p.image}
              alt=""
              className="synergy-card-img"
              loading="lazy"
            />
            <div className="synergy-card-body">
              <h4 className="synergy-card-name">{p.name}</h4>
              <p className="synergy-card-why">
                <span className="synergy-card-why-label">Why this pairs</span>
                <span>{p.whyPaired}</span>
              </p>
              <AddToCartButton
                className="buy"
                label="Buy on Anson PDR"
                product={{
                  name: p.name,
                  imageUrl: p.image,
                  description: p.whyPaired,
                  productUrl: p.url,
                }}
              />
            </div>
          </article>
        ))}
      </div>
      <button
        type="button"
        className="synergy-arrow right"
        onClick={() => scrollBy('right')}
        aria-label="Next product"
      >
        ›
      </button>
    </div>
  );
}
