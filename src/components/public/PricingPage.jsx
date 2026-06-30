const pricingTiers = [
  {
    name: 'Free demo',
    price: 'Free',
    billing: 'Try the room flow',
    description: 'A small playable taste for checking that Game Night works with your group.',
    features: ['1 Playable Game', 'Max 4 players', 'No Account Required'],
    cta: 'Play Now',
    action: 'play',
  },
  {
    name: 'Family Pack',
    price: '€19.99',
    billing: 'One-time purchase',
    description: 'The main game-night bundle for hosts who want the full built-in library.',
    features: ['Unlock all current games', 'Full built-in question pools', 'Free guests forever'],
    cta: 'Purchase coming soon',
    featured: true,
  },
  {
    name: 'Custom Edition',
    price: '€39.99',
    billing: 'One-time purchase',
    description: 'For hosts who want to bring their own trivia, inside jokes, and reusable packs.',
    features: [
      'Everything in Family Pack',
      'Create custom questions',
      'Save reusable custom packs',
    ],
    cta: 'Purchase coming soon',
  },
]

export default function PricingPage({ setPage }) {
  return (
    <section className="public-page pricing-page shell">
      <div className="page-kicker">Pricing</div>
      <div className="page-title-row">
        <div>
          <h1>Buy once. Share the fun for free.</h1>
          <p>
            Game Night is priced around the host, not the whole room. Purchase buttons are parked
            for now while checkout gets wired in.
          </p>
        </div>
        {/* <button type="button" className="secondary" onClick={() => setPage('play')}>
          Try the demo
        </button> */}
      </div>

      <div className="pricing-grid">
        {pricingTiers.map((tier) => (
          <article
            key={tier.name}
            className={`pricing-card ${tier.featured ? 'featured' : ''}`}
          >
            <div className="pricing-card-heading">
              <div>
                <h2>{tier.name}</h2>
                <span>{tier.billing}</span>
              </div>
              {tier.featured ? <strong>Best fit</strong> : null}
            </div>
            <div className="pricing-price">{tier.price}</div>
            <p>{tier.description}</p>
            <ul>
              {tier.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <button
              type="button"
              className={tier.action === 'play' ? 'primary wide' : 'secondary wide'}
              onClick={tier.action === 'play' ? () => setPage('play') : undefined}
              disabled={!tier.action}
            >
              {tier.cta}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
