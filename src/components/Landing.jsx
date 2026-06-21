import { useState } from 'react'

const featuredGames = {
  'one-percent': {
    name: 'The 1% Club',
    kicker: 'Think differently',
    description:
      'Work through 10 increasingly tricky logic questions. Use your pass wisely—one wrong answer and you are out.',
  },
  'majority-rules': {
    name: 'Majority Rules',
    kicker: 'Read the room',
    description:
      'Choose the answer you think most players will pick. Match the majority to score across eight quick rounds.',
  },
  'bluff-battle': {
    name: 'Bluff Battle',
    kicker: 'Make fiction sound true',
    description:
      'Invent a convincing fake answer, spot the real one, and earn points whenever another player falls for your bluff.',
  },
  'million-ladder': {
    name: 'Million Ladder',
    kicker: 'Take the hot seat',
    description:
      'One contestant faces 15 questions while the host runs the show and joined audience members stand by for a lifeline.',
  },
  'survey-showdown': {
    name: 'Survey Showdown',
    kicker: 'Name the popular answers',
    description:
      'Split into two teams, uncover the survey board, survive three strikes, and steal the bank from your rivals.',
  },
}

export default function Landing({ onHost, onJoin, busy, error }) {
  const [mode, setMode] = useState('join')
  const [gameType, setGameType] = useState('one-percent')
  const [featuredGame, setFeaturedGame] = useState('one-percent')
  const [name, setName] = useState('')
  const [code, setCode] = useState(
    () => new URLSearchParams(window.location.search).get('join')?.slice(0, 4).toUpperCase() || '',
  )
  const [lifelineCount, setLifelineCount] = useState(1)
  const [lifelinesAnytime, setLifelinesAnytime] = useState(false)

  const submit = (event) => {
    event.preventDefault()

    if (mode === 'host') {
      onHost(gameType, { lifelineCount, lifelinesAnytime })
      return
    }

    onJoin(code, name)
  }

  return (
    <main className="landing shell">
      <section className="hero-copy">
        <div className="eyebrow">Your living room game show</div>
        <div className="game-night-logo">
          <span>GAME</span>
          <strong>NIGHT</strong>
        </div>
        <h1>One room. A whole night of games.</h1>
        <p>
          Pick a game, share the room code, and turn everyone’s phone into a controller.
        </p>
        <div className="featured-games">
          <div className="featured-games-heading">
            <span>Games available</span>
            <small>Select one to learn more</small>
          </div>
          <div className="landing-game-chips">
            {Object.entries(featuredGames).map(([id, game]) => (
              <button
                key={id}
                type="button"
                className={featuredGame === id ? `active ${id}` : ''}
                aria-pressed={featuredGame === id}
                aria-controls="featured-game-description"
                onClick={() => setFeaturedGame(id)}
              >
                {game.name}
              </button>
            ))}
          </div>
          <div
            id="featured-game-description"
            className={`featured-game-description ${featuredGame}`}
            aria-live="polite"
          >
            <span className="featured-game-mark" aria-hidden="true">
              {featuredGame === 'one-percent'
                ? '1%'
                : featuredGame === 'majority-rules'
                  ? 'M'
                  : featuredGame === 'bluff-battle'
                    ? '?'
                    : featuredGame === 'survey-showdown'
                      ? 'S'
                      : '$'}
            </span>
            <div>
              <small>{featuredGames[featuredGame].kicker}</small>
              <strong>{featuredGames[featuredGame].name}</strong>
              <p>{featuredGames[featuredGame].description}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="entry-card">
        <div className="tabs">
          <button
            type="button"
            className={mode === 'join' ? 'active' : ''}
            onClick={() => setMode('join')}
          >
            Join game
          </button>
          <button
            type="button"
            className={mode === 'host' ? 'active' : ''}
            onClick={() => setMode('host')}
          >
            Host game
          </button>
        </div>
        <form onSubmit={submit}>
          {mode === 'join' && (
            <>
              <label>
                Your name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Alex"
                  maxLength={20}
                  autoComplete="nickname"
                />
              </label>
              <label>
                Room code
                <input
                  className="code-input"
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z]/g, '')
                        .slice(0, 4),
                    )
                  }
                  placeholder="ABCD"
                  maxLength={4}
                  autoCapitalize="characters"
                />
              </label>
            </>
          )}
          {mode === 'host' && (
            <>
              <div className="game-picker">
                <div className="game-picker-heading">
                  <strong>Choose your game</strong>
                  <span>Everyone joins after you create the room.</span>
                </div>
                <button
                  type="button"
                  className={`game-card-option ${gameType === 'one-percent' ? 'selected' : ''}`}
                  onClick={() => setGameType('one-percent')}
                >
                  <span className="game-card-icon one-percent-icon">1%</span>
                  <span>
                    <strong>The 1% Club</strong>
                    <small>Logic questions · elimination · 10 rounds</small>
                  </span>
                  <span className="selection-dot" />
                </button>
                <button
                  type="button"
                  className={`game-card-option ${gameType === 'bluff-battle' ? 'selected bluff' : ''}`}
                  onClick={() => setGameType('bluff-battle')}
                >
                  <span className="game-card-icon bluff-icon">?</span>
                  <span>
                    <strong>Bluff Battle</strong>
                    <small>Write fakes · fool friends · 5 rounds</small>
                  </span>
                  <span className="selection-dot" />
                </button>
                <button
                  type="button"
                  className={`game-card-option ${gameType === 'majority-rules' ? 'selected majority' : ''}`}
                  onClick={() => setGameType('majority-rules')}
                >
                  <span className="game-card-icon majority-icon">M</span>
                  <span>
                    <strong>Majority Rules</strong>
                    <small>Match the room · score points · 8 rounds</small>
                  </span>
                  <span className="selection-dot" />
                </button>
                <button
                  type="button"
                  className={`game-card-option ${gameType === 'million-ladder' ? 'selected ladder' : ''}`}
                  onClick={() => setGameType('million-ladder')}
                >
                  <span className="game-card-icon ladder-icon">$</span>
                  <span>
                    <strong>Million Ladder</strong>
                    <small>One contestant · prize ladder · audience lifeline</small>
                  </span>
                  <span className="selection-dot" />
                </button>
                <button
                  type="button"
                  className={`game-card-option ${gameType === 'survey-showdown' ? 'selected survey' : ''}`}
                  onClick={() => setGameType('survey-showdown')}
                >
                  <span className="game-card-icon survey-icon">S</span>
                  <span>
                    <strong>Survey Showdown</strong>
                    <small>Two teams · strikes and steals · 6 rounds</small>
                  </span>
                  <span className="selection-dot" />
                </button>
              </div>
              {gameType === 'one-percent' && (
                <div className="host-settings">
                  <div className="settings-heading">
                    <div>
                      <strong>Pass lifelines</strong>
                      <span>Applied to every contestant for this round.</span>
                    </div>
                    <fieldset className="stepper" aria-label="Lifelines per player">
                      <button
                        type="button"
                        onClick={() => setLifelineCount((count) => Math.max(0, count - 1))}
                        disabled={lifelineCount === 0}
                        aria-label="Remove one lifeline"
                      >
                        −
                      </button>
                      <strong>{lifelineCount}</strong>
                      <button
                        type="button"
                        onClick={() => setLifelineCount((count) => Math.min(10, count + 1))}
                        disabled={lifelineCount === 10}
                        aria-label="Add one lifeline"
                      >
                        +
                      </button>
                    </fieldset>
                  </div>
                  <label className="toggle-row">
                    <span>
                      <strong>Allow passes at any time</strong>
                      <small>
                        {lifelinesAnytime
                          ? 'Available from the first question.'
                          : 'Unlocks from the 50% question, like the show.'}
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      checked={lifelinesAnytime}
                      onChange={(event) => setLifelinesAnytime(event.target.checked)}
                    />
                    <span className="toggle" aria-hidden="true" />
                  </label>
                </div>
              )}
              {gameType === 'majority-rules' && (
                <div className="selected-game-note">
                  Pick the answer you think most of the room will choose. Matching the majority
                  earns one point.
                </div>
              )}
              {gameType === 'bluff-battle' && (
                <div className="selected-game-note bluff-note">
                  Invent a convincing fake answer, find the truth, and score whenever another
                  player falls for your bluff.
                </div>
              )}
              {gameType === 'million-ladder' && (
                <div className="selected-game-note ladder-note">
                  The first player to join takes the hot seat. Everyone else joins the audience
                  and can help if Ask the Audience is used.
                </div>
              )}
              {gameType === 'survey-showdown' && (
                <div className="selected-game-note survey-note">
                  Players split into two teams. Uncover the most popular answers before three
                  strikes give your rivals a chance to steal.
                </div>
              )}
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="primary wide" disabled={busy}>
            {busy ? 'Connecting…' : mode === 'host' ? 'Create game room' : 'Join game'}
          </button>
        </form>
        <p className="fine-print">
          No account needed. Best played with one host screen and a phone per player.
        </p>
      </section>
    </main>
  )
}
