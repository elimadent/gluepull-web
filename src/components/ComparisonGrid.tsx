import { getAnsonProduct } from '@/data/products';
import { linkTarget } from '@/utils/link';
import { GlueScore } from '@/types';

interface ComparisonGridProps {
  picks: GlueScore[];
}

/**
 * Side-by-side comparison of the top picks. Goal: glance and know which
 * stick to buy. Each column packs image + name + score + the headline
 * attributes + a one-tap Buy CTA. Detailed cards live below this grid.
 */
export function ComparisonGrid({ picks }: ComparisonGridProps) {
  const top = picks.slice(0, 3);
  if (!top.length) return null;

  return (
    <div className="compare-grid" role="table" aria-label="Top picks comparison">
      {top.map((p, i) => {
        const product = getAnsonProduct(p.glue.id);
        const matched = product?.matched === true;
        const displayName = matched ? product.name : p.glue.name;
        const rankClass = i === 0 ? 'r1' : i === 1 ? 'r2' : 'r3';
        return (
          <div key={p.glue.id} className={`compare-col ${rankClass}`} role="row">
            <div className="compare-rank">#{i + 1}</div>
            {matched && product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt=""
                className="compare-img"
                loading="lazy"
              />
            ) : (
              <div className="compare-img placeholder" aria-hidden>
                🔥
              </div>
            )}
            <h3 className="compare-name">{displayName}</h3>
            <div className="compare-score">{p.score}</div>
            <div className="compare-meta">
              <div className="compare-meta-row">{p.glue.color}</div>
              <div className="compare-meta-row">{p.glue.strength}</div>
              <div className="compare-meta-row">{p.glue.gunTemp} gun</div>
            </div>
            {matched ? (
              <a
                className="compare-buy"
                href={product.productUrl}
                target={linkTarget(product.productUrl)}
                rel="noopener noreferrer"
                aria-label={`Buy ${displayName} on Anson PDR`}
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
