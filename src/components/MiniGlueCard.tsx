import { getAnsonProduct } from '@/data/products';
import { linkTarget } from '@/utils/link';
import { GlueScore } from '@/types';

/**
 * Compact glue card for horizontal-scroll product strips under each
 * time-block title. Image-first, name + score, single Buy CTA.
 */
export function MiniGlueCard({ score }: { score: GlueScore }) {
  const { glue, score: value } = score;
  const product = getAnsonProduct(glue.id);
  const matched = product?.matched === true;
  const displayName = matched ? product.name : glue.name;
  const imageUrl = matched ? product.imageUrl : null;
  const productUrl = matched ? product.productUrl : null;

  return (
    <article className="mini-card">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="mini-card-img"
          loading="lazy"
        />
      ) : (
        <div className="mini-card-img placeholder" aria-hidden>
          🔥
        </div>
      )}
      <div className="mini-card-body">
        <h4 className="mini-card-name">{displayName}</h4>
        <div className="mini-card-meta">
          <span className="mini-card-score">{value}</span>
          <span className="mini-card-meta-sep">·</span>
          <span className="mini-card-strength">{glue.strength}</span>
        </div>
        {productUrl ? (
          <a
            className="mini-card-buy"
            href={productUrl}
            target={linkTarget(productUrl)}
            rel="noopener noreferrer"
            aria-label={`Buy ${displayName} on Anson PDR`}
          >
            <span aria-hidden>🛒</span>
            <span>Buy</span>
          </a>
        ) : (
          <span className="mini-card-buy disabled" aria-disabled="true">
            Not listed
          </span>
        )}
      </div>
    </article>
  );
}
