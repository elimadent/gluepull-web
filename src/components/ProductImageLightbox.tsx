import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ProductImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

/**
 * Full-screen image lightbox. Click anywhere (or Esc) to close.
 *
 * Rendered through a portal to document.body so the overlay always covers
 * the entire viewport, regardless of which scrolling/clipping/stacking-
 * context parent the trigger was opened from. iOS Safari otherwise traps
 * `position: fixed` inside horizontal scrollers like the time-block
 * carousel, causing the dark scrim to fail to cover the page.
 */
export function ProductImageLightbox({ src, alt, onClose }: ProductImageLightboxProps) {
  // Esc closes; lock body scroll while open WITHOUT losing scroll position.
  // (Setting overflow:hidden alone makes iOS Safari jump to top when released;
  // the position:fixed + negative top trick freezes the page in place and
  // restores the exact scroll offset on close.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);

    const scrollY = window.scrollY;
    const prevPos = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevWidth = document.body.style.width;
    const prevOverflow = document.body.style.overflow;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.position = prevPos;
      document.body.style.top = prevTop;
      document.body.style.width = prevWidth;
      document.body.style.overflow = prevOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [onClose]);

  // Render the overlay into <body> via a portal so it always covers the
  // whole viewport, even if the calling component is inside a horizontal
  // scroller or any element with its own stacking context.
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <button
        type="button"
        className="image-lightbox-close"
        onClick={onClose}
        aria-label="Close image"
      >
        ×
      </button>
      <img
        src={src}
        alt={alt}
        className="image-lightbox-img"
        // Stop bubbling so clicks ON the image don't immediately close it —
        // user can pinch-zoom mobile or right-click to save. Any click in the
        // surrounding overlay still dismisses.
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body
  );
}
