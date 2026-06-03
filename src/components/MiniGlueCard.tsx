import { useState } from 'react';
import { AddToCartButton } from '@/components/AddToCartButton';
import { GlueStickPlaceholder } from '@/components/GlueStickPlaceholder';
import { ProductImageLightbox } from '@/components/ProductImageLightbox';
import { getAnsonProduct } from '@/data/products';
import { gunTempCompact, panelTempRange } from '@/utils/gunTemp';
import { GlueScore } from '@/types';

/**
 * Compact glue card for horizontal-scroll product strips under each
 * time-block title. Title-first; image tap opens the fullscreen lightbox.
 */
export function MiniGlueCard({ score }: { score: GlueScore }) {
  const { glue } = score;
  const product = getAnsonProduct(glue.id);
  const matched = product?.matched === true;
  const displayName = matched ? product.name : glue.name;
  const imageUrl = matched ? product.imageUrl : null;
  const [zoomOpen, setZoomOpen] = useState(false);

  return (
    <article className="mini-card">
      <h4 className="mini-card-name">{displayName}</h4>
      {imageUrl ? (
        <button
          type="button"
          className="mini-card-img-btn"
          onClick={() => setZoomOpen(true)}
          aria-label={`Open large view of ${displayName}`}
        >
          <img
            src={imageUrl}
            alt=""
            className="mini-card-img"
            loading="lazy"
          />
          <span className="mini-card-zoom" aria-hidden>⤢</span>
        </button>
      ) : (
        <GlueStickPlaceholder color={glue.color} className="mini-card-img" />
      )}
      <div className="mini-card-body">
        <div className="mini-card-meta">{glue.strength} · {gunTempCompact(glue.gunTemp)}</div>
        <div className="mini-card-meta">Panel · {panelTempRange(glue).range}</div>
        {matched ? (
          <AddToCartButton
            className="mini-card-buy"
            label="Buy"
            product={{
              glueId: glue.id,
              name: displayName,
              imageUrl,
              description: product.description ?? undefined,
              productUrl: product.productUrl,
            }}
          />
        ) : (
          <span className="mini-card-buy disabled" aria-disabled="true">
            Not listed
          </span>
        )}
      </div>
      {zoomOpen && imageUrl ? (
        <ProductImageLightbox
          src={imageUrl}
          alt={displayName}
          onClose={() => setZoomOpen(false)}
        />
      ) : null}
    </article>
  );
}
