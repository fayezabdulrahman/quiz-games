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
    key: 'game_night_pack_v1',
    name: 'Game Night Pack',
    price: '€29.99',
    billing: 'One-time purchase',
    description: 'The main game-night bundle for hosts who want the full current library.',
    features: [
      'All 7 current games',
      'Full built-in question sets for each game',
      'Custom questions included',
      'Free unlimited guests',
    ],
    cta: 'Get started',
    featured: true,
  },
  {
    key: 'club_pass_monthly',
    name: 'Club Pass',
    price: '€4.99/month',
    billing: 'Subscription',
    description: 'For hosts who want the current library while subscribed plus future releases.',
    features: [
      'All current games while subscribed',
      'Custom questions included',
      'Future games and early access',
      'Official, seasonal, and topical packs',
    ],
    cta: 'Get started',
  },
]

export const planRank = {
  free_demo: 0,
  game_night_pack_v1: 2,
  club_pass_monthly: 3,
}

export function planByKey(planKey) {
  return pricingPlans.find((plan) => plan.key === planKey) || pricingPlans[0]
}
