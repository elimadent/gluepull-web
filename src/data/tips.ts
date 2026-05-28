export interface TipFeaturedProduct {
  /** Display name shown under "Tool shown:". */
  name: string;
  /** Real product image URL from ansonpdr.com (Shopify CDN). */
  image: string;
  /** Canonical ansonpdr.com product page. */
  url: string;
}

export interface TipSection {
  id: string;
  title: string;
  /** Editorial one-liner under the title. */
  subtitle?: string;
  steps: string[];
  /** A real Anson product that illustrates this technique — used as the
   *  section thumbnail AND linked in the "Tool shown" footer. */
  featured?: TipFeaturedProduct;
}

/** Technician guidance shown on the Tips screen. */
export const tipSections: TipSection[] = [
  {
    id: 'prep',
    title: 'Panel Prep',
    subtitle: 'Strip the film, scuff for tooth, flash bone-dry.',
    steps: [
      'Clean the panel thoroughly — strip oils, wax and road film with isopropyl alcohol.',
      'Scuff the spot lightly with compound so the glue has tooth to bite into.',
      'Wipe again and let it flash off completely before laying glue.',
    ],
    featured: {
      name: 'Willey Quick Glue Pull Panel Prep & Release Agent',
      image:
        'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/glue-pull-panel-prep-and-release-agent.webp',
      url: 'https://ansonpdr.com/products/willey-quick-glue-pull-panel-prep-release-agent',
    },
  },
  {
    id: 'heat',
    title: 'Beat the Moisture',
    subtitle: 'Drive water out of the paint and the tab before you bond.',
    steps: [
      'Preheat the panel with a torch or heat gun to drive off moisture — panels should be warm, not cold.',
      'Moisture under the tab is the #1 killer of adhesion, especially in humid or cold air.',
      'Warm the glue tab slightly too so it flows into the scuff and grabs fully.',
    ],
    featured: {
      name: 'BETAG T-Hotbox Magic Wand Set',
      image:
        'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/T-Hotbox-Magic-Wand-Set-1024x681_1.jpg',
      url: 'https://ansonpdr.com/products/t-hotbox-magic-wand-set',
    },
  },
  {
    id: 'glue-choice',
    title: 'Pick the Right Glue',
    subtitle: 'Match the stick to the panel — not the calendar.',
    steps: [
      'Match the glue to the panel temperature, not just the air temperature.',
      'Humidity matters as much as heat — a humid 90°F is a different job than a dry 90°F.',
      'Hot, high-strength sticks go brittle when cold; cold/medium sticks go soft when hot.',
      'Re-check conditions through the day — the right glue at 7am is rarely the right glue at 2pm.',
    ],
    featured: {
      name: 'Plain Jane PDR Variety Pack',
      image:
        'https://cdn.shopify.com/s/files/1/0499/2545/6040/products/jane_hail_var_1.jpg',
      url: 'https://ansonpdr.com/products/plain-jane-pdr-variety-pack',
    },
  },
  {
    id: 'pulling',
    title: 'Pulling Technique',
    subtitle: 'Let it set. Pull straight. Knock down high spots.',
    steps: [
      'Let the glue set fully before pulling — rushing pops the tab and wastes the spot.',
      'Use a slide hammer for big, high-tension dents; a mini lifter for finish and crowns.',
      'Pull straight, in small increments, and tap down the high spots as you go.',
      'Pop tabs with release agent — never rip them, or you risk lifting paint.',
    ],
    featured: {
      name: 'Black Gold Combo Slide Hammer Kit',
      image:
        'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-PDR-Outlet-gold-slide-hammer-kit-a1b2c3d4.jpg',
      url: 'https://ansonpdr.com/products/black-gold-combo-slide-hammer-kit',
    },
  },
];
