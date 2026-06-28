import GameLogoMark from './GameLogoMark.jsx'

export default function Logo({ gameType = 'one-percent' }) {
  if (gameType === 'quickfire-30') {
    return (
      <div className="brand brand-quickfire">
        <GameLogoMark gameType="quickfire-30" className="brand-quickfire-mark" />
        <span><strong>QUICKFIRE</strong><small>SECONDS</small></span>
      </div>
    )
  }

  if (gameType === 'survey-showdown') {
    return (
      <div className="brand brand-survey">
        <GameLogoMark gameType="survey-showdown" className="brand-survey-mark" />
        <span><strong>SURVEY</strong><small>SHOWDOWN</small></span>
      </div>
    )
  }

  if (gameType === 'say-what-you-see') {
    return (
      <div className="brand brand-catchphrase">
        <GameLogoMark gameType="say-what-you-see" className="brand-catchphrase-mark" />
        <span>
          <strong>SAY WHAT</strong>
          <small>YOU SEE</small>
        </span>
      </div>
    )
  }

  if (gameType === 'million-ladder') {
    return (
      <div className="brand brand-ladder">
        <GameLogoMark gameType="million-ladder" className="brand-ladder-mark" />
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
        <GameLogoMark gameType="bluff-battle" className="brand-bluff-mark" />
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
        <GameLogoMark gameType="majority-rules" className="brand-majority-mark" />
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
