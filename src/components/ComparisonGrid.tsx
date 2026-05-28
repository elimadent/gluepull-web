import { GlueStickPlaceholder } from '@/components/GlueStickPlaceholder';
import { getAnsonProduct } from '@/data/products';
import { linkTarget } from '@/utils/link';
import { GlueScore } from '@/types';

interface ComparisonGridProps {
  picks: GlueScore[];
}

/**
 * Side-by-side comparison of the top picks. Goal: glance and know which
 * stick to buy. Tap a card (anywhere except the Buy button) to jump to its
 * full breakdown below.
 */
export function ComparisonGrid({ picks }: ComparisonGridProps) {
  const top = picks.slice(0, 3);
  if (!top.length) return null;

  const jumpTo = (glueId: string) => {
    const el = document.getElementById(`gp-glue-${glueId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="compare-grid" role="list" aria-label="Top picks comparison">
      {top.map((p, i) => {
        const product = getAnsonProduct(p.glue.id);
        const matched = product?.matched === true;
        const displayName = matched ? product.name : p.glue.name;
        const rankClass = i === 0 ? 'r1' : i === 1 ? 'r2' : 'r3';
        return (
          <div
            key={p.glue.id}
            className={`compare-col ${rankClass}`}
            role="listitem"
            onClick={() => jumpTo(p.glue.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                jumpTo(p.glue.id);
              }
            }}
            tabIndex={0}
            aria-label={`Jump to ${displayName} details`}
          >
            <div className="compare-rank">#{i + 1}</div>
            {matched && product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt=""
                className="compare-img"
                loading="lazy"
              />
            ) : (
              <GlueStickPlaceholder color={p.glue.color} className="compare-img" />
            )}
            <h3 className="compare-name">{displayName}</h3>
            <div className="compare-meta">
              <div className="compare-meta-row">{p.glue.strength} strength</div>
              <div className="compare-meta-row">{p.glue.gunTemp} gun</div>
            </div>
            {matched ? (
              <a
                className="compare-buy"
                href={product.productUrl}
                target={linkTarget(product.productUrl)}
                rel="noopener noreferrer"
                aria-label={`Buy ${displayName} on Anson PDR`}
                onClick={(e) => e.stopPropagation()}
              >
                <span aria-hidden>🛒</span>
                <span>Buy</span>
              </a>
            ) : (
              <span className="compare-buy disabled" aria-disabled="true">
                Not listed
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
