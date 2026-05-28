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
  /** A real Anson product that illustrates this technique. Used as the
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
      'Clean the panel thoroughly. Strip oils, wax and road film with isopropyl alcohol.',
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
      'Preheat the panel with a torch or heat gun to drive off moisture. Panels should be warm, not cold.',
      'Moisture under the tab is the #1 killer of adhesion, especially in humid or cold air.',
      'Warm the glue tab slightly too so it flows into the scuff and grabs fully.',
    ],
    featured: {
      // Anson doesn't sell standalone heat guns. "The Claw" product photo
      // is shot with a real heat gun mounted in it, which is the only real
      // heat-gun photograph in the catalog and what techs will recognize.
      name: 'The Claw Heat Gun Mount (shown with heat gun)',
      image:
        'https://cdn.shopify.com/s/files/1/0499/2545/6040/products/the_claw_2.jpg',
      url: 'https://ansonpdr.com/products/the-claw-heat-gun-mount-elimadent-tools',
    },
  },
  {
    id: 'glue-choice',
    title: 'Pick the Right Glue',
    subtitle: 'The environment dictates the adhesive. Match the glue to the weather and the damage.',
    steps: [
      'Match the glue to the panel temperature, not just the air temperature.',
      'Humidity matters as much as heat. A humid 90°F is a different job than a dry 90°F.',
      'Hot, high-strength sticks go brittle when cold; cold/medium sticks go soft when hot.',
      'Re-check conditions through the day. The right glue at 7am is rarely the right glue at 2pm.',
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
      'Let the glue set fully before pulling. Rushing pops the tab and wastes the spot.',
      'Use a slide hammer for big, high-tension dents; a mini lifter for finish and crowns.',
      'Pull straight, in small increments, and tap down the high spots as you go.',
      'Pop tabs with release agent. Never rip them, or you risk lifting paint.',
    ],
    featured: {
      name: 'Black Gold Combo Slide Hammer Kit',
      image:
        'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-PDR-Outlet-gold-slide-hammer-kit-a1b2c3d4.jpg',
      url: 'https://ansonpdr.com/products/black-gold-combo-slide-hammer-kit',
    },
  },
  {
    id: 'physics-sweetspot',
    title: 'The 90–92°F Sweet Spot',
    subtitle: 'Why most PDR glues hit peak grip in a narrow thermal window.',
    steps: [
      'Hot-melt PDR adhesives bond by wetting the clear coat in a molten phase, then locking in as the polymer chains re-crystallize on cooling.',
      'Empirical dynamometer testing puts the peak tensile-strength window for most PDR adhesives between 90°F and 92°F panel temperature. That is the balance point of fluid flow and rapid crystalline setup.',
      'Below that window the glue vitrifies (glass-transitions) on contact with a cold panel and the bond shatters under the first slide-hammer hit.',
      'Above it the polymer stays semi-plastic. Tension tears the glue internally instead of moving the dent, leaving sticky residue on tab and panel.',
    ],
  },
  {
    id: 'physics-rigidity-elasticity',
    title: 'Rigid vs Elastic Glues',
    subtitle: 'Two opposite philosophies, both deliberately engineered.',
    steps: [
      'Rigid glues (Tab Weld Grey is the prototype) transfer slide-hammer shock instantly with almost no stretch, and small dings set in 15–25 seconds. The tradeoff: brittle, fractures under sustained lateral tension.',
      'Elastic glues (Root Beer, Tequila Collision, Hawg Just Orange) stretch slightly under load and act as a shock absorber. Ideal for big collision dents where you are hammering the surrounding metal while the center is under sustained pull.',
      'Per the technical analysis, Root Beer\'s 600-lb static pull (elastic) beats Tab Weld\'s 480-lb (rigid). Pure tensile strength does NOT correlate with stiffness.',
      'Match the glue\'s rheology to the work: shock pulls on small/sharp dents want rigid; static pulls on large/heavy dents want elastic.',
    ],
  },
  {
    id: 'physics-humidity',
    title: 'Humidity Kills Adhesion',
    subtitle: 'Why moisture is the #1 reason a clean pull fails.',
    steps: [
      'Atmospheric moisture condenses on the clear coat in humid or high-dewpoint conditions, forming an invisible barrier between the molten polymer and the paint.',
      'Water molecules also disrupt the Van der Waals + hydrogen bonding the adhesive relies on to grip, so a humid 90°F day is genuinely harder than a dry 90°F day.',
      'Humidity-specific glues (Dent Out HS-10 Red, Carbon Tech Slime, Pink Snapper, Chocolate Thunder) carry hydrophobic tackifying resins designed to displace surface moisture during the wetting phase.',
      'On marginal days, drive moisture off the panel with a heat gun BEFORE laying glue, and reach for a Weather-Humid stick rather than a generalist.',
    ],
  },
  {
    id: 'physics-pull-force',
    title: 'Static Pull-Force Reference',
    subtitle: 'Per third-party dynamometer testing (technical analysis).',
    steps: [
      'Manufacturers do not publish PSI/lb numbers for any of these sticks. These are independent dynamometer figures, not manufacturer specs.',
      'Heavy hitters (per technical analysis): Anson Root Beer 600 lbs, Tequila Ice 540 lbs, GlueTraxx 540 lbs, Orange Fire 520 lbs, Tab Weld 480 lbs.',
      'Mid-range: Hawg Just Orange 470 lbs, Burro Bubble Gum 450 lbs. Specialists: Carbon Tech Slime 350 lbs (humid hail), Swiss Blue 300 lbs (cold).',
      'Cold-weather glues trade raw strength for cold flexibility. Swiss Blue caps at 300 lbs but does not shatter at 35°F where stronger glues would.',
    ],
  },
];
