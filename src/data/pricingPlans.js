export const pricingPlans = [
  {
    key: 'free_demo',
    name: 'Demo',
    price: 'Free',
    billing: 'Try the room flow',
    description: 'A small playable taste for checking that Game Night works with your group.',
    features: ['2 Playable games', 'Max 4 players', 'No Account Required'],
    cta: 'Start for free',
    action: 'demo',
  },
  {
    key: 'family_pack_v1',
    name: 'Family Pack',
    price: '€19.99',
    billing: 'One-time purchase',
    description: 'The main game-night bundle for hosts who want the full built-in game library.',
    features: ['Unlock all current games', 'Full built-in question sets', 'Free unlimited guests'],
    cta: 'Get started',
    featured: true,
  },
  {
    key: 'custom_edition_v1',
    name: 'Custom Edition',
    price: '€39.99',
    billing: 'One-time purchase',
    description: 'For hosts who want to bring their own trivia, inside jokes, and reusable packs.',
    features: [
      'Everything in Family Pack',
      'Create custom questions',
      'Save reusable custom packs',
    ],
    cta: 'Get started',
  },
  {
    key: 'club_pass_monthly',
    name: 'Club Pass',
    price: '€9.99',
    billing: 'Monthly subscription',
    description: 'For hosts who want every current feature plus future games and new questions sets.',
    features: [
      'Everything in Custom Edition',
      'Access to new games and features',
      'Official, seasonal, and topical packs',
    ],
    cta: 'Get started',
  },
]

export const planRank = {
  free_demo: 0,
  family_pack_v1: 1,
  custom_edition_v1: 2,
  club_pass_monthly: 3,
}

export function planByKey(planKey) {
  return pricingPlans.find((plan) => plan.key === planKey) || pricingPlans[0]
}
