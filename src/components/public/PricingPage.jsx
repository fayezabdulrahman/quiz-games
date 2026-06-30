import { useNavigate } from 'react-router-dom'
import { planByKey, planRank, pricingPlans } from '../../data/pricingPlans.js'

const paidPlans = pricingPlans.filter((plan) => plan.key !== 'free_demo')
const highestPaidPlanRank = Math.max(...paidPlans.map((plan) => planRank[plan.key] || 0))

function nextPaidPlanRank(currentRank) {
  return paidPlans
    .map((plan) => planRank[plan.key] || 0)
    .filter((rank) => rank > currentRank)
    .sort((a, b) => a - b)[0]
}

function visiblePlans(accountAccess) {
  const currentKey = accountAccess?.access?.productKey || 'free_demo'
  const hasPaidPlan = accountAccess?.access?.hasFullAccess
  const currentRank = planRank[currentKey] || 0
  const upgradeRank = nextPaidPlanRank(currentRank)

  return pricingPlans.filter((plan) => {
    if (!hasPaidPlan) return true
    const rank = planRank[plan.key] || 0
    return plan.key === currentKey || rank === upgradeRank
  })
}

export default function PricingPage({ accountAccess }) {
  const navigate = useNavigate()
  const currentKey = accountAccess?.access?.productKey || 'free_demo'
  const hasPaidPlan = accountAccess?.access?.hasFullAccess
  const currentPlan = planByKey(currentKey)
  const isTopPaidPlan = hasPaidPlan && (planRank[currentKey] || 0) >= highestPaidPlanRank
  const plans = visiblePlans(accountAccess)

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
      </div>

      {accountAccess?.error && (
        <div className="account-access-alert" role="alert">
          <strong>Account access could not load</strong>
          <span>{accountAccess.error}</span>
        </div>
      )}

      {isTopPaidPlan ? (
        <section className="top-plan-panel" aria-label="Current top tier plan">
          <span>Current plan</span>
          <div>
            <h2>You've currently purchased our top tier pack.</h2>
            <p>
              {currentPlan.name} already includes the full paid Game Night library and every
              upgrade currently available.
            </p>
          </div>
        </section>
      ) : null}

      <div className="pricing-grid">
        {plans.map((plan) => {
          const isCurrentPlan = hasPaidPlan && plan.key === currentKey
          const isUpgrade = hasPaidPlan && (planRank[plan.key] || 0) > (planRank[currentKey] || 0)
          const buttonLabel = isCurrentPlan ? 'Current plan' : plan.cta

          return (
            <article
              key={plan.key}
              className={`pricing-card ${plan.featured ? 'featured' : ''} ${
                isCurrentPlan ? 'current' : ''
              }`}
            >
              <div className="pricing-card-heading">
                <div>
                  <h2>{plan.name}</h2>
                  <span>{plan.billing}</span>
                </div>
                {isCurrentPlan ? <strong>Current plan</strong> : null}
                {!isCurrentPlan && plan.featured ? <strong>Most Popular</strong> : null}
              </div>
              <div className="pricing-price">{plan.price}</div>
              <p>{plan.description}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button
                type="button"
                className={plan.action === 'demo' ? 'primary wide' : 'secondary wide'}
                onClick={plan.action === 'demo' ? () => navigate('/demo') : undefined}
                disabled={isCurrentPlan || isUpgrade || !plan.action}
              >
                {buttonLabel}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
