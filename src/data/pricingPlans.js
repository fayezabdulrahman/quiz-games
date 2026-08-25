export const pricingPlans = [
  {
    key: 'free_demo',
    name: 'Demo',
    price: 'Free',
    billing: 'Try the room flow',
    description: 'A small playable taste for checking that Game Night works with your group.',
    features: ['2 Playable games', 'Max 4 players', 'No account required'],
    cta: 'Start for free',
    action: 'demo',
  },
  {
    key: 'game_night_pack_v1',
    name: 'Lifetime Access',
    price: '€19.99',
    billing: 'One-time purchase · yours forever',
    description: 'One payment unlocks the complete Game Night experience for this account.',
    features: [
      'All current and future games',
      'All official and custom question packs',
      'Free unlimited guests',
    ],
    cta: 'Get lifetime access',
    featured: true,
  },
]

export const planRank = {
  free_demo: 0,
  game_night_pack_v1: 1,
}

export function planByKey(planKey) {
  return pricingPlans.find((plan) => plan.key === planKey) || pricingPlans[0]
}
