export interface TipSection {
  id: string;
  title: string;
  steps: string[];
}

/** Technician guidance shown on the Tips screen. */
export const tipSections: TipSection[] = [
  {
    id: 'prep',
    title: 'Panel Prep',
    steps: [
      'Clean the panel thoroughly — strip oils, wax and road film with isopropyl alcohol.',
      'Scuff the spot lightly with compound so the glue has tooth to bite into.',
      'Wipe again and let it flash off completely before laying glue.',
    ],
  },
  {
    id: 'heat',
    title: 'Beat the Moisture',
    steps: [
      'Preheat the panel with a torch or heat gun to drive off moisture — panels should be warm, not cold.',
      'Moisture under the tab is the #1 killer of adhesion, especially in humid or cold air.',
      'Warm the glue tab slightly too so it flows into the scuff and grabs fully.',
    ],
  },
  {
    id: 'glue-choice',
    title: 'Pick the Right Glue',
    steps: [
      'Match the glue to the panel temperature, not just the air temperature.',
      'Humidity matters as much as heat — a humid 90°F is a different job than a dry 90°F.',
      'Hot, high-strength sticks go brittle when cold; cold/medium sticks go soft when hot.',
      'Re-check conditions through the day — the right glue at 7am is rarely the right glue at 2pm.',
    ],
  },
  {
    id: 'pulling',
    title: 'Pulling Technique',
    steps: [
      'Let the glue set fully before pulling — rushing pops the tab and wastes the spot.',
      'Use a slide hammer for big, high-tension dents; a mini lifter for finish and crowns.',
      'Pull straight, in small increments, and tap down the high spots as you go.',
      'Pop tabs with release agent — never rip them, or you risk lifting paint.',
    ],
  },
];
