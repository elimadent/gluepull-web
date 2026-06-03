import { useState } from 'react';
import { AddToCartButton } from '@/components/AddToCartButton';
import { GlueStickPlaceholder } from '@/components/GlueStickPlaceholder';
import { ProductImageLightbox } from '@/components/ProductImageLightbox';
import { getAnsonProduct } from '@/data/products';
import { panelTempRange } from '@/utils/gunTemp';
import { GlueScore } from '@/types';

interface ComparisonGridProps {
  picks: GlueScore[];
}

/**
 * Side-by-side comparison of the top picks. Tap a card to jump to its full
 * breakdown below; tap the IMAGE specifically to open it fullscreen instead.
 */
export function ComparisonGrid({ picks }: ComparisonGridProps) {
  const top = picks.slice(0, 3);
  const [zoomed, setZoomed] = useState<{ src: string; alt: string } | null>(null);
  if (!top.length) return null;

  const jumpTo = (glueId: string) => {
    const el = document.getElementById(`gp-glue-${glueId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <div className="compare-grid" role="list" aria-label="Top picks comparison">
        {top.map((p, i) => {
          const product = getAnsonProduct(p.glue.id);
          const matched = product?.matched === true;
          const displayName = matched ? product.name : p.glue.name;
          const imageUrl = matched ? product.imageUrl : null;
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
              <span className="compare-rank-num" aria-label={`Rank ${i + 1}`}>
                {i + 1}
              </span>
              <h3 className="compare-name">{displayName}</h3>
              <div
                className="compare-img-wrap"
                onClick={(e) => {
                  // Tap the image to zoom — do NOT also trigger the card's
                  // "jump to full breakdown" behavior.
                  if (!imageUrl) return;
                  e.stopPropagation();
                  setZoomed({ src: imageUrl, alt: displayName });
                }}
                role={imageUrl ? 'button' : undefined}
                aria-label={imageUrl ? `Open large view of ${displayName}` : undefined}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt=""
                    className="compare-img"
                    loading="lazy"
                  />
                ) : (
                  <GlueStickPlaceholder color={p.glue.color} className="compare-img" />
                )}
              </div>
              <div className="compare-meta">
                <div className="compare-meta-row">{p.glue.strength} strength</div>
                <div className="compare-meta-row">
                  Panel {panelTempRange(p.glue).range}
                </div>
              </div>
              {/* Stop the card's jump-to-breakdown click when tapping Buy. */}
              <div
                className="compare-buy-wrap"
                onClick={(e) => e.stopPropagation()}
              >
                {matched ? (
                  <AddToCartButton
                    className="compare-buy"
                    label="Buy"
                    product={{
                      glueId: p.glue.id,
                      name: displayName,
                      imageUrl,
                      description: product.description ?? undefined,
                      productUrl: product.productUrl,
                    }}
                  />
                ) : (
                  <span className="compare-buy disabled" aria-disabled="true">
                    Not listed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {zoomed ? (
        <ProductImageLightbox
          src={zoomed.src}
          alt={zoomed.alt}
          onClose={() => setZoomed(null)}
        />
      ) : null}
    </>
  );
}
