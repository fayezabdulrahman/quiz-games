export default function Logo({ gameType = 'one-percent' }) {
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
