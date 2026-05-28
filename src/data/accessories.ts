import { Accessory, AccessoryCategory } from '@/types';

/**
 * Related PDR products used for smart bundle recommendations.
 * purchaseLink slugs are realistic placeholders, verify against ansonpdr.com.
 */
export const accessories: Accessory[] = [
  {
    id: 'gun-high-temp',
    name: 'High-Temp PDR Glue Gun (60W)',
    category: 'glue-gun',
    description: 'Runs hot for hot-weather sticks that need a high gun temp.',
    purchaseLink: 'https://ansonpdr.com/products/high-temp-glue-gun',
  },
  {
    id: 'gun-dual-temp',
    name: 'Dual-Temp PDR Glue Gun',
    category: 'glue-gun',
    description: 'Switchable Low/High element, one gun for every glue.',
    purchaseLink: 'https://ansonpdr.com/products/dual-temp-glue-gun',
  },
  {
    id: 'gun-low-temp',
    name: 'Low-Temp PDR Glue Gun',
    category: 'glue-gun',
    description: 'Cooler element for cold-weather and medium-strength sticks.',
    purchaseLink: 'https://ansonpdr.com/products/low-temp-glue-gun',
  },
  {
    id: 'slide-hammer',
    name: 'PDR Slide Hammer',
    category: 'slide-hammer',
    description: 'For aggressive, high-strength pulls on big dents.',
    purchaseLink: 'https://ansonpdr.com/products/slide-hammer',
  },
  {
    id: 'mini-lifter',
    name: 'Mini Lifter / Glue Pull Lifter',
    category: 'mini-lifter',
    description: 'Controlled, gentle lift for finish work and small dents.',
    purchaseLink: 'https://ansonpdr.com/products/mini-lifter',
  },
  {
    id: 'tabs-variety',
    name: 'Glue Pull Tab Variety Pack',
    category: 'tab',
    description: 'Assorted tab shapes/sizes for creases, body lines and crowns.',
    purchaseLink: 'https://ansonpdr.com/products/glue-tabs-variety',
  },
  {
    id: 'tabs-slide-hammer',
    name: 'Slide-Hammer Pull Tabs',
    category: 'tab',
    description: 'Heavy tabs sized for slide-hammer attachment.',
    purchaseLink: 'https://ansonpdr.com/products/slide-hammer-tabs',
  },
  {
    id: 'alcohol',
    name: 'Isopropyl Alcohol (Panel Prep)',
    category: 'alcohol',
    description: 'Cleans oils and wax so glue actually bonds.',
    purchaseLink: 'https://ansonpdr.com/products/isopropyl-alcohol',
  },
  {
    id: 'compound',
    name: 'Scuff Compound',
    category: 'compound',
    description: 'Lightly scuffs the panel to improve adhesion.',
    purchaseLink: 'https://ansonpdr.com/products/scuff-compound',
  },
  {
    id: 'rags',
    name: 'Microfiber Shop Rags',
    category: 'rag',
    description: 'Lint-free wipe-down before and after pulls.',
    purchaseLink: 'https://ansonpdr.com/products/microfiber-rags',
  },
  {
    id: 'release-agent',
    name: 'Glue Release Agent',
    category: 'tool',
    description: 'Pops tabs cleanly without lifting paint.',
    purchaseLink: 'https://ansonpdr.com/products/glue-release-agent',
  },
  {
    id: 'heat-gun',
    name: 'Panel Heat Gun',
    category: 'tool',
    description: 'Preheats panels to drive off moisture for max adhesion.',
    purchaseLink: 'https://ansonpdr.com/products/heat-gun',
  },
];

export const getAccessoriesByCategory = (
  category: AccessoryCategory
): Accessory[] => accessories.filter((a) => a.category === category);

export const getAccessoryById = (id: string): Accessory | undefined =>
  accessories.find((a) => a.id === id);
