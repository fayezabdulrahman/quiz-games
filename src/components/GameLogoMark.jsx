export default function GameLogoMark({ gameType = 'one-percent', className = '' }) {
  const classNames = ['game-logo-mark', `game-logo-mark-${gameType}`, className]
    .filter(Boolean)
    .join(' ')

  if (gameType === 'quickfire-30') {
    return (
      <span className={classNames} aria-label="Quickfire 30 logo" role="img">
        <span className="logo-stopwatch-stem" aria-hidden="true" />
        <span className="logo-stopwatch-face" aria-hidden="true">30</span>
      </span>
    )
  }

  if (gameType === 'say-what-you-see') {
    return (
      <span className={classNames} aria-label="Say What You See logo" role="img">
        <span className="logo-eye" aria-hidden="true">
          <span />
        </span>
        <span className="logo-eye-spark logo-eye-spark-one" aria-hidden="true" />
        <span className="logo-eye-spark logo-eye-spark-two" aria-hidden="true" />
      </span>
    )
  }

  if (gameType === 'survey-showdown') {
    return (
      <span className={classNames} aria-label="Survey Showdown logo" role="img">
        <span className="logo-survey-bar" aria-hidden="true" />
        <span className="logo-survey-bar" aria-hidden="true" />
        <span className="logo-survey-bar" aria-hidden="true" />
      </span>
    )
  }

  if (gameType === 'bluff-battle') {
    return (
      <span className={classNames} aria-label="Bluff Battle logo" role="img">
        <span className="logo-bubble logo-bubble-back" aria-hidden="true" />
        <span className="logo-bubble logo-bubble-front" aria-hidden="true">?</span>
      </span>
    )
  }

  if (gameType === 'majority-rules') {
    return (
      <span className={classNames} aria-label="Majority Rules logo" role="img">
        <svg className="game-logo-svg" viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="21" r="8" />
          <path d="M20 52c0-10 5-17 12-17s12 7 12 17H20Z" />
          <circle cx="17" cy="27" r="6" opacity=".74" />
          <path d="M7 52c0-8 4-14 10-14 3 0 6 2 8 5-2 3-3 6-3 9H7Z" opacity=".74" />
          <circle cx="47" cy="27" r="6" opacity=".74" />
          <path d="M42 43c2-3 5-5 8-5 6 0 10 6 10 14H42c0-3-1-6-3-9Z" opacity=".74" />
        </svg>
      </span>
    )
  }

  if (gameType === 'million-ladder') {
    return (
      <span className={classNames} aria-label="Million Ladder logo" role="img">
        <span className="logo-ladder-step" aria-hidden="true" />
        <span className="logo-ladder-step" aria-hidden="true" />
        <span className="logo-ladder-step" aria-hidden="true" />
        <span className="logo-ladder-prize" aria-hidden="true">$</span>
      </span>
    )
  }

  return (
    <span className={classNames} aria-label="The 1% Club logo" role="img">
      <svg className="game-logo-svg game-logo-svg-percent" viewBox="0 0 64 64" aria-hidden="true">
        <text x="32" y="40" textAnchor="middle">1%</text>
      </svg>
    </span>
  )
}
