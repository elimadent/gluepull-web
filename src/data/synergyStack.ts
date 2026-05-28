/**
 * The "Synergy Stack" - for every PDR job, the glue is half the equation.
 * The other half is the gun that delivers it, the tab that grips it, the
 * tool that pulls it, and the prep/heat that lets it bond.
 *
 * This file pairs each category to a curated set of real ansonpdr.com
 * products, with a short "why this pairs with your glue" rationale per
 * product. The first product in each category is the lead recommendation;
 * the rest swipe horizontally as alternates.
 *
 * Why hand-written and not auto-generated? The pairing rationale is the
 * point - it's what turns the list from a generic tool catalog into "this
 * is THE tool to pull these glues with, and here's why."
 */

export type SynergyCategoryId =
  | 'glue-gun'
  | 'slide-hammer'
  | 'mini-lifter'
  | 'tabs'
  | 'panel-prep'
  | 'lateral-tension';

export interface SynergyProduct {
  name: string;
  image: string;
  url: string;
  /** 1-2 sentences: why THIS product pairs with the glue selection. */
  whyPaired: string;
}

export interface SynergyCategory {
  id: SynergyCategoryId;
  label: string;
  icon: string;
  /** One-line description of what the category does in the stack. */
  role: string;
  products: SynergyProduct[];
}

const cdn = 'https://cdn.shopify.com/s/files/1/0499/2545/6040';

export const SYNERGY_STACK: SynergyCategory[] = [
  {
    id: 'glue-gun',
    label: 'Glue Guns',
    icon: '🔥',
    role: 'The gun is the delivery system. Pick one whose wattage and temperature stability hold steady through long pulls.',
    products: [
      {
        name: 'Tec 820-12 Industrial Glue Gun',
        image: `${cdn}/products/tec820.jpg`,
        url: 'https://ansonpdr.com/products/tec-820-12-industrial-glue-gun',
        whyPaired:
          'Industrial-grade heating element holds temperature on long pulls and through multiple sticks. The headroom is what super-high-strength formulations (Hard Pull, Red Chile, Yellow Jacket) need to flow without dragging cold.',
      },
      {
        name: 'Anson PDR Glue Gun - Tec 305 (110V)',
        image: `${cdn}/products/ansonblackv3-sm.png`,
        url: 'https://ansonpdr.com/products/tec-305-12-professional-glue-gun',
        whyPaired:
          'Anson\'s shop-standard. Quick-recovery 110V element handles the whole everyday range, from Tequila Fire to Root Beer to Plain Jane Purple, without needing to swap guns between sticks.',
      },
      {
        name: 'Trifecta Cordless Glue Gun (Ryobi/Makita/Bosch/DeWalt)',
        image: `${cdn}/files/anson-pdr-trifecta-glue-gun-ryobi-battery-a1b2c3d4.jpg`,
        url: 'https://ansonpdr.com/products/trifecta-ryobi-makita-bosch-dewalt-cordless-glue-gun',
        whyPaired:
          'Cordless on whatever battery system you already run. Ideal for mobile PDR and hail tents where there is no outlet. Your stick still hits flow temp without dragging an extension cord.',
      },
      {
        name: '12 Volt Anson PDR Glue Gun - Tec 305',
        image: `${cdn}/products/ansonblackv3-12volt-grn.png`,
        url: 'https://ansonpdr.com/products/12-volt-anson-pdr-glue-gun',
        whyPaired:
          '12V cigarette-port version. Same Tec 305 element, for techs working out of a van or driveway with no shop power.',
      },
    ],
  },
  {
    id: 'slide-hammer',
    label: 'Slide Hammers',
    icon: '🔨',
    role: 'For aggressive, high-tension pulls. Collision damage and big stubborn dents.',
    products: [
      {
        name: 'Black Gold Combo Slide Hammer Kit',
        image: `${cdn}/files/anson-pdr-PDR-Outlet-gold-slide-hammer-kit-a1b2c3d4.jpg`,
        url: 'https://ansonpdr.com/products/black-gold-combo-slide-hammer-kit',
        whyPaired:
          'The flagship combo. Heavy stainless shaft delivers the controlled impact super-high-strength glues (Collision Hard Pull, Red Chile, Yellow Jacket) are formulated for, without ripping the tab off the panel.',
      },
      {
        name: 'Dent Vision Storm Breaker Slide Hammer',
        image: `${cdn}/files/Photoroom_000_20250529_145735.jpg`,
        url: 'https://ansonpdr.com/products/dent-vision-storm-breaker',
        whyPaired:
          'Hail-specialist tool. Long throw with weighted slug for moving the deep-set dents hail leaves. Pair with high-strength sticks dialed for the day\'s panel temp.',
      },
      {
        name: 'PDR Outlet Combo Slide Hammer',
        image: `${cdn}/files/Photoroom_004_20241217_100214.jpg`,
        url: 'https://ansonpdr.com/products/anson-mini-pdr-slide-hammer-combo',
        whyPaired:
          'Smaller, more controlled slide for medium-strength glues and intermediate dents. The right tool when full-impact would over-pull.',
      },
    ],
  },
  {
    id: 'mini-lifter',
    label: 'Mini Lifters',
    icon: '🛠️',
    role: 'Gentle, controllable pulling. Finish work, crowns, and medium-strength glues.',
    products: [
      {
        name: 'Anson PDR Mini Lifter Kit',
        image: `${cdn}/files/PhotoRoom_000_20230612_155904.jpg`,
        url: 'https://ansonpdr.com/products/rodeo-special-anson-pdr-mini-lifter-bundle',
        whyPaired:
          'Anson\'s complete starter: handle, feet, and adapter set. Smooth threaded pull is ideal for medium-strength sticks (Tequila Ice, Plain Jane Swiss Blue) where you want incremental lift instead of a hammer\'s shock.',
      },
      {
        name: 'TP Legend Mini Lifter',
        image: `${cdn}/files/Photoroom_004_20250206_160625.jpg`,
        url: 'https://ansonpdr.com/products/tp-legend-mini-lifter',
        whyPaired:
          'Precision threaded mini. Premium feel, finer turn ratio. Perfect for clean-release medium sticks on finish work where you cannot afford to lift paint.',
      },
      {
        name: 'Camauto B7 Mini Lifter',
        image: `${cdn}/files/PhotoRoom_000_20240117_092659.jpg`,
        url: 'https://ansonpdr.com/products/anson-b7-mini-lifter',
        whyPaired:
          'Italian-made, low-profile body. Pairs especially well with mid-temp glues on shallow body-line dents where access is tight.',
      },
      {
        name: 'Smart Mini Lifter Crease Terminator Kit',
        image: `${cdn}/files/189_camautocrease.png`,
        url: 'https://ansonpdr.com/products/smart-mini-lifter-crease-terminator-kit',
        whyPaired:
          'Specialty crease setup with paired feet that bridge across creased dents. Cold-weather and medium glues with elongated crease tabs are the right match.',
      },
    ],
  },
  {
    id: 'tabs',
    label: 'Pull Tabs',
    icon: '⚪',
    role: 'The interface between glue and tool. Shape and material control where the pull force lands.',
    products: [
      {
        name: 'Dent Lab Tools Tabs Variety Pack',
        image: `${cdn}/files/Photoroom_001_20250829_144921_1af5f649-14bb-4d1b-82b5-9990a65c72cf.jpg`,
        url: 'https://ansonpdr.com/products/dent-lab-tools-tabs-variety-pack',
        whyPaired:
          'Broad assortment with round, oval, and crease tabs in one box. Lets you match tab footprint to dent shape without buying a separate pack per glue.',
      },
      {
        name: 'Dent Reaper Skinny Crease Reaper Hex Tabs Variety',
        image: `${cdn}/files/GPR-glue-tabs-192-DR-HD-VP_w_RS_2048x2048_5b1216c4-fb1c-4ca0-a45b-4eafd0f31d95.webp`,
        url: 'https://ansonpdr.com/products/dent-reaper-skinny-crease-reaper-reverse-step-hex-tabs-variety-pack',
        whyPaired:
          'Reverse-step hex tabs run from 25mm to 85mm, sized for everything from sharp creases to long body-line damage. Hot-weather glues like Hard Pull get max grip on the bigger sizes.',
      },
      {
        name: 'Super Straight Glue Tab System',
        image: `${cdn}/files/ansonpdr-super-straight-glue-tab-system-kit-a1b2c3d4.jpg`,
        url: 'https://ansonpdr.com/products/super-straight-glue-tab-system',
        whyPaired:
          'Long, narrow tabs purpose-built for body lines and door crowns where round tabs distort the pull. Best with medium-strength glues that release clean.',
      },
      {
        name: 'LAKA All-in-One Glue Tabs Variety Pack',
        image: `${cdn}/files/20240514_151649_545x522_abb6660f-9940-429b-aba0-41b075ddbf12.webp`,
        url: 'https://ansonpdr.com/products/laka-all-in-one-glue-tabs',
        whyPaired:
          'Triangle, square, round, oblong: every footprint in one pack. Good fallback when you do not know in advance what dent shapes you will see (hail repair days).',
      },
    ],
  },
  {
    id: 'panel-prep',
    label: 'Panel Prep & Release',
    icon: '🧪',
    role: 'No prep, no bond. The single most under-stocked category in any PDR setup.',
    products: [
      {
        name: 'Willey Quick Glue Pull Panel Prep & Release Agent',
        image: `${cdn}/files/glue-pull-panel-prep-and-release-agent.webp`,
        url: 'https://ansonpdr.com/products/willey-quick-glue-pull-panel-prep-release-agent',
        whyPaired:
          'Two jobs in one bottle: strips wax/oil before you lay glue, then pops the tab cleanly after the pull. Saves you from carrying separate alcohol and release agent.',
      },
      {
        name: 'Cactus Juice',
        image: `${cdn}/files/PhotoRoom_20231219_095310.jpg`,
        url: 'https://ansonpdr.com/products/anson-cactus-juice',
        whyPaired:
          'Anson\'s in-house release: kind to clear coat, fast flash-off, no residue. Pair with any high-strength stick where you would otherwise be tempted to rip a stuck tab.',
      },
      {
        name: 'Anson Alcohol Bottle with Magnet',
        image: `${cdn}/files/IMG-3189.heic`,
        url: 'https://ansonpdr.com/products/anson-alcohol-bottle-with-magnet',
        whyPaired:
          'Magnetic mount sticks to the roof or fender so the prep bottle is always one reach away. Keeps prep on the panel between every tab. The difference between a clean pull and a wasted spot.',
      },
    ],
  },
  {
    id: 'lateral-tension',
    label: 'Lateral Tension',
    icon: '↔',
    role: 'Side-pull tools that grip across a crease and pull it open instead of pulling the dent up. The right answer for hard body-line damage and long rails a slide hammer cannot move.',
    products: [
      {
        name: 'Keco K-Power Hail Mini (Gen 2) Lateral Tension Tool',
        image: 'https://ansonpdr.com/cdn/shop/files/anson-pdr-keco-k-power-mini-lateral-tension-tool-a1b2c3d4.jpg',
        url: 'https://ansonpdr.com/products/keco-k-power-mini-gen-2-lateral-tension-tool',
        whyPaired:
          'Compact lateral tensioner sized for hail damage and tight body-line work. Pair with rigid sticks (Tab Weld, Red Chile) on small crease sets and with elastic sticks (Root Beer, Tequila Collision) when you need sustained side-pull without snapping the bond.',
      },
      {
        name: 'KECO 175mm Lateral Tension Tool Beam (LTT) with Centipedes',
        image: 'https://ansonpdr.com/cdn/shop/files/lateral175.webp',
        url: 'https://ansonpdr.com/products/copy-of-keco-300-mm-lateral-tension-tool-beam-ltt-beam-with-centipedes',
        whyPaired:
          'Longer 175mm beam with centipede tabs spans long body lines and roof rails. Hot- and warm-weather elastic glues (Root Beer, Hawg Just Orange, Tequila Collision) hold up to sustained lateral force without internal cohesive failure.',
      },
      {
        name: 'Black Plague Lateral Tension Adapters',
        image: 'https://ansonpdr.com/cdn/shop/files/anson-pdr-black-plague-lateral-tension-adapters-green-black-a1b2c3d4.jpg',
        url: 'https://ansonpdr.com/products/lateral-tension-adapters',
        whyPaired:
          'Adapter set that turns a standard mini-lifter into a lateral-tension rig. Cheapest way to add side-pull capability if you already own one of the Anson mini-lifters in the previous category.',
      },
      {
        name: 'CAMAUTO Lateral Tension Push/Pull Tool',
        image: 'https://ansonpdr.com/cdn/shop/files/921_003.jpg',
        url: 'https://ansonpdr.com/products/camauto-lateral-tension-push-pull-tool',
        whyPaired:
          'Combo push/pull tensioner. The "push" mode is the move when a body line has been pushed inward and a normal pull would just deform the surrounding metal. Pair with high-strength elastic glues for big collision-class jobs.',
      },
      {
        name: 'Keco K-Power Midrange (Gen 2) Lateral Tension Tool',
        image: 'https://ansonpdr.com/cdn/shop/files/410-8570-KPM.webp',
        url: 'https://ansonpdr.com/products/keco-k-power-midrange-gen-2-lateral-tension-tool',
        whyPaired:
          'Midrange between the hail mini and the full LTT beam. The everyday lateral-tension tool for mixed hail + body-line days where you do not want to keep swapping rigs.',
      },
      {
        name: 'Anson Tension Pull Straps (D-Strap)',
        image: 'https://ansonpdr.com/cdn/shop/products/PhotoRoom_000_20221213_090814.png',
        url: 'https://ansonpdr.com/products/d-strap-pulling-strap',
        whyPaired:
          'Strap-based tensioner that lets you anchor across a panel and put a controlled lateral load on a tab. Use with super-high-strength collision sticks (Anson Collision Hard Pull, Perfect Pull, CAMAUTO) when a slide hammer would lift paint.',
      },
    ],
  },
];
