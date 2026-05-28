import { useRef } from 'react';
import { SYNERGY_STACK, SynergyCategory } from '@/data/synergyStack';
import { linkTarget } from '@/utils/link';

/**
 * Replacement for the old "Complete Tool Kit" list. Each row is a collapsible
 * category; expanding reveals a horizontally swipeable carousel of real
 * ansonpdr.com products, each with a "why this pairs with your glue" blurb.
 *
 * The first product in each category is the lead recommendation; left/right
 * arrows and native touch swipe cycle to the alternates.
 */
export function SynergyStack() {
  return (
    <div className="synergy-stack">
      {SYNERGY_STACK.map((cat) => (
        <CategoryAccordion key={cat.id} category={cat} />
      ))}
    </div>
  );
}

function CategoryAccordion({ category }: { category: SynergyCategory }) {
  const lead = category.products[0];
  return (
    <details className="synergy-cat">
      <summary>
        <span className="synergy-icon" aria-hidden>
          {category.icon}
        </span>
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
              <a
                className="buy"
                href={p.url}
                target={linkTarget(p.url)}
                rel="noopener noreferrer"
              >
                <span aria-hidden>🛒</span>
                <span>Buy on Anson PDR</span>
              </a>
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
