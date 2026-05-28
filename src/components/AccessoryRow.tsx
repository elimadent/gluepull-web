import { linkTarget } from '@/utils/link';
import { Accessory, AccessoryCategory } from '@/types';

const ICON_BY_CATEGORY: Record<AccessoryCategory, string> = {
  'glue-gun': '🔥',
  'slide-hammer': '🔨',
  'mini-lifter': '🛠️',
  tab: '⚪',
  alcohol: '🧪',
  compound: '🎨',
  rag: '🧻',
  tool: '🔧',
};

export function AccessoryRow({ accessory }: { accessory: Accessory }) {
  return (
    <a
      className="accessory"
      href={accessory.purchaseLink}
      target={linkTarget(accessory.purchaseLink)}
      rel="noopener noreferrer"
      aria-label={`${accessory.name} — open on ansonpdr.com`}
    >
      <div className="icon-wrap" aria-hidden>
        {ICON_BY_CATEGORY[accessory.category]}
      </div>
      <div className="body">
        <p className="name">{accessory.name}</p>
        <p className="desc">{accessory.description}</p>
      </div>
      <span aria-hidden>↗</span>
    </a>
  );
}
