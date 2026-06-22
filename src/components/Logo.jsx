export default function Logo({ gameType = 'one-percent' }) {
  if (gameType === 'quickfire-30') {
    return (
      <div className="brand brand-quickfire">
        <span className="brand-quickfire-mark">30</span>
        <span><strong>QUICKFIRE</strong><small>SECONDS</small></span>
      </div>
    )
  }

  if (gameType === 'survey-showdown') {
    return (
      <div className="brand brand-survey">
        <span className="brand-survey-mark">S</span>
        <span><strong>SURVEY</strong><small>SHOWDOWN</small></span>
      </div>
    )
  }

  if (gameType === 'million-ladder') {
    return (
      <div className="brand brand-ladder">
        <span className="brand-ladder-mark">$</span>
        <span>
          <strong>MILLION</strong>
          <small>LADDER</small>
        </span>
      </div>
    )
  }

  if (gameType === 'bluff-battle') {
    return (
      <div className="brand brand-bluff">
        <span className="brand-bluff-mark">?</span>
        <span>
          <strong>BLUFF</strong>
          <small>BATTLE</small>
        </span>
      </div>
    )
  }

  if (gameType === 'majority-rules') {
    return (
      <div className="brand brand-majority">
        <span className="brand-majority-mark">M</span>
        <span>
          <strong>MAJORITY</strong>
          <small>RULES</small>
        </span>
      </div>
    )
  }

  return (
    <div className="brand">
      <span className="brand-the">THE</span>
      <span className="brand-number">1%</span>
      <span className="brand-club">CLUB</span>
    </div>
  )
}
