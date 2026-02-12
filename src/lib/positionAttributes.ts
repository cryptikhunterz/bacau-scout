// ─── Position-Specific Attribute Definitions ────────────────────────
// Each position category has a set of attribute groups with named attributes.
// Attributes are rated on the same 1-5 AbilityRating scale.

export type PositionCategory =
  | 'Goalkeeper'
  | 'Centre-Back'
  | 'Full-Back'
  | 'Defensive Midfield'
  | 'Central Midfield'
  | 'Attacking Midfield'
  | 'Winger'
  | 'Centre-Forward'
  | 'Default';

export interface AttributeGroup {
  title: string;
  attributes: string[];
}

export interface PositionTemplate {
  label: string;
  badge: string; // emoji or short code
  groups: AttributeGroup[];
}

// ─── Position Templates ─────────────────────────────────────────────

export const POSITION_TEMPLATES: Record<PositionCategory, PositionTemplate> = {
  Goalkeeper: {
    label: 'Goalkeeper',
    badge: '🧤',
    groups: [
      { title: 'Defensive Actions', attributes: ['1v1s', 'Interceptions', 'Parrying', 'Aerial Duels', 'Handling'] },
      { title: 'Offensive Actions', attributes: ['Short Distribution', 'Long Distribution', 'Throwing', 'Starts Counters', 'Support in Build'] },
      { title: 'Physical', attributes: ['Speed', 'Height/Reach', 'Agility', 'Mobility', 'Reflexes'] },
      { title: 'Technical', attributes: ['First Touch', 'Catching/Punching'] },
      { title: 'Tactical', attributes: ['Positioning', 'Reading Play', 'Timing', 'Awareness', 'Intelligence'] },
      { title: 'Mental', attributes: ['Anticipation', 'Communication', 'Decision-Making', 'Discipline', 'Concentration'] },
    ],
  },

  'Centre-Back': {
    label: 'Centre-Back',
    badge: '🛡️',
    groups: [
      { title: 'Defensive Actions', attributes: ['1v1 Defending', 'Interceptions', 'Tackling', 'Aerial Duels', 'Marking', 'Blocks'] },
      { title: 'Offensive Actions', attributes: ['Long Distribution', 'Progressive Passing', 'Build-up Play', 'Carrying'] },
      { title: 'Physical', attributes: ['Strength', 'Speed', 'Agility', 'Stamina', 'Aerial Presence'] },
      { title: 'Technical', attributes: ['First Touch', 'Short Passing', 'Long Passing', 'Heading'] },
      { title: 'Tactical', attributes: ['Positioning', 'Reading Play', 'Anticipation', 'Covering', 'Line Management'] },
      { title: 'Mental', attributes: ['Concentration', 'Decision-Making', 'Communication', 'Leadership', 'Composure'] },
    ],
  },

  'Full-Back': {
    label: 'Full-Back',
    badge: '🏃',
    groups: [
      { title: 'Defensive Actions', attributes: ['1v1 Defending', 'Tackling', 'Interceptions', 'Marking', 'Recovery Runs'] },
      { title: 'Offensive Actions', attributes: ['Crossing', 'Overlapping Runs', 'Progressive Carries', 'Chance Creation', 'Final Third Entries'] },
      { title: 'Physical', attributes: ['Speed', 'Acceleration', 'Stamina', 'Agility', 'Strength'] },
      { title: 'Technical', attributes: ['First Touch', 'Short Passing', 'Crossing', 'Dribbling'] },
      { title: 'Tactical', attributes: ['Positioning', 'Transition Play', 'Width', 'Pressing Triggers', 'Tactical Discipline'] },
      { title: 'Mental', attributes: ['Decision-Making', 'Work Rate', 'Awareness', 'Concentration', 'Discipline'] },
    ],
  },

  'Defensive Midfield': {
    label: 'Defensive Midfield',
    badge: '🔒',
    groups: [
      { title: 'Defensive Actions', attributes: ['Tackling', 'Interceptions', 'Counter-Press', 'Aerial Duels', 'Shielding', 'Recovery'] },
      { title: 'Offensive Actions', attributes: ['Progressive Passing', 'Build-up Play', 'Ball Carrying', 'Line Breaking Passes'] },
      { title: 'Physical', attributes: ['Strength', 'Stamina', 'Speed', 'Agility', 'Endurance'] },
      { title: 'Technical', attributes: ['First Touch', 'Short Passing', 'Long Passing', 'Ball Control'] },
      { title: 'Tactical', attributes: ['Positioning', 'Reading Play', 'Transition', 'Pressing Triggers', 'Spatial Awareness'] },
      { title: 'Mental', attributes: ['Concentration', 'Decision-Making', 'Composure', 'Leadership', 'Game Intelligence'] },
    ],
  },

  'Central Midfield': {
    label: 'Central Midfield',
    badge: '⚙️',
    groups: [
      { title: 'Defensive Actions', attributes: ['Tackling', 'Interceptions', 'Counter-Press', 'Recovery Runs'] },
      { title: 'Offensive Actions', attributes: ['Progressive Passing', 'Chance Creation', 'Box Arrivals', 'Through Balls', 'Goal Threat'] },
      { title: 'Physical', attributes: ['Stamina', 'Speed', 'Agility', 'Strength', 'Endurance'] },
      { title: 'Technical', attributes: ['First Touch', 'Short Passing', 'Long Passing', 'Dribbling', 'Shooting'] },
      { title: 'Tactical', attributes: ['Positioning', 'Transition', 'Movement', 'Pressing Triggers', 'Game Management'] },
      { title: 'Mental', attributes: ['Decision-Making', 'Vision', 'Composure', 'Work Rate', 'Intelligence'] },
    ],
  },

  'Attacking Midfield': {
    label: 'Attacking Midfield',
    badge: '🎯',
    groups: [
      { title: 'Defensive Actions', attributes: ['Pressing', 'Interceptions', 'Counter-Press'] },
      { title: 'Offensive Actions', attributes: ['Chance Creation', 'Through Balls', 'Key Passes', 'Shooting', 'Link-up Play', 'Final Third Actions'] },
      { title: 'Physical', attributes: ['Speed', 'Agility', 'Acceleration', 'Balance', 'Stamina'] },
      { title: 'Technical', attributes: ['First Touch', 'Dribbling', 'Short Passing', 'Shooting', 'Ball Control', 'Finishing'] },
      { title: 'Tactical', attributes: ['Movement', 'Positioning', 'Space Finding', 'Pressing Triggers', 'Transition'] },
      { title: 'Mental', attributes: ['Vision', 'Creativity', 'Decision-Making', 'Composure', 'Intelligence'] },
    ],
  },

  Winger: {
    label: 'Winger',
    badge: '⚡',
    groups: [
      { title: 'Defensive Actions', attributes: ['Counter-Press', 'Tracking Back', 'Recovery Runs'] },
      { title: 'Offensive Actions', attributes: ['Crossing', 'Dribbling', 'Chance Creation', 'Goal Threat', '1v1 Attacking', 'Final Third Entries'] },
      { title: 'Physical', attributes: ['Speed', 'Acceleration', 'Agility', 'Stamina', 'Balance'] },
      { title: 'Technical', attributes: ['First Touch', 'Crossing', 'Dribbling', 'Shooting', 'Ball Control'] },
      { title: 'Tactical', attributes: ['Width', 'Movement', 'Transition', 'Positioning', 'Pressing Triggers'] },
      { title: 'Mental', attributes: ['Decision-Making', 'Creativity', 'Composure', 'Work Rate', 'Flair'] },
    ],
  },

  'Centre-Forward': {
    label: 'Centre-Forward',
    badge: '⚽',
    groups: [
      { title: 'Defensive Actions', attributes: ['Counter-Press', 'Hold-up Play', 'Aerial Challenges'] },
      { title: 'Offensive Actions', attributes: ['Finishing', 'Movement', 'Heading', 'Link-up Play', 'Chance Conversion', 'Runs in Behind'] },
      { title: 'Physical', attributes: ['Strength', 'Speed', 'Aerial Presence', 'Agility', 'Power'] },
      { title: 'Technical', attributes: ['First Touch', 'Shooting', 'Heading', 'Ball Control', 'Finishing'] },
      { title: 'Tactical', attributes: ['Movement', 'Positioning', 'Pressing Triggers', 'Space Creation', 'Runs'] },
      { title: 'Mental', attributes: ['Composure', 'Decision-Making', 'Anticipation', 'Instinct', 'Killer Instinct'] },
    ],
  },

  Default: {
    label: 'General',
    badge: '📋',
    groups: [], // empty — form will fall back to the legacy Physical/Technique/Tactic sections
  },
};

// ─── Position Mapping ───────────────────────────────────────────────
// Maps Transfermarkt position strings to our position categories.

const POSITION_MAP: [RegExp, PositionCategory][] = [
  [/goalkeeper/i, 'Goalkeeper'],
  [/centre-back/i, 'Centre-Back'],
  [/left-back|right-back/i, 'Full-Back'],
  [/defensive midfield/i, 'Defensive Midfield'],
  [/central midfield/i, 'Central Midfield'],
  [/attacking midfield/i, 'Attacking Midfield'],
  [/left winger|right winger/i, 'Winger'],
  [/centre-forward/i, 'Centre-Forward'],
];

/**
 * Resolve a Transfermarkt position string to our position category.
 * Falls back to 'Default' if no match.
 */
export function resolvePositionCategory(position: string): PositionCategory {
  if (!position) return 'Default';
  for (const [regex, category] of POSITION_MAP) {
    if (regex.test(position)) return category;
  }
  return 'Default';
}

/**
 * Get the full template for a given position string.
 */
export function getPositionTemplate(position: string): PositionTemplate {
  return POSITION_TEMPLATES[resolvePositionCategory(position)];
}

/**
 * Get all attribute keys for a position template as a flat list.
 * Keys are the attribute names used as Record keys in positionAttributes.
 */
export function getPositionAttributeKeys(position: string): string[] {
  const template = getPositionTemplate(position);
  return template.groups.flatMap(g => g.attributes);
}
