import {
  MILLION_LADDER_PRIZES,
  formatPrize,
  guaranteedPrize,
} from '../../../game/millionLadder.js'
import Logo from '../../shared/Logo.jsx'

export default function MillionLadderFinished({ state, onRestart, onChangeGame }) {
  const completed = state.finishReason === 'completed' && state.ladderReached === 14
  const banked = state.finishReason === 'host-ended'
  const winnings = completed || banked
    ? state.ladderReached >= 0
      ? MILLION_LADDER_PRIZES[state.ladderReached]
      : 0
    : guaranteedPrize(state.ladderReached)
  const contestantName = state.ladderContestantName || 'The contestant'

  return (
    <main className="finish-screen ladder-finish">
      <Logo gameType="million-ladder" />
      <div className="eyebrow">
        {completed ? 'The million is yours' : banked ? 'Money safely banked' : 'Final winnings'}
      </div>
      <h1>{completed ? `${contestantName} is a millionaire!` : `${contestantName} takes home`}</h1>
      <div className="ladder-winnings">{formatPrize(winnings)}</div>
      <p>
        {completed
          ? 'Fifteen questions. Three lifelines. One magnificent climb.'
          : state.ladderReached >= 0
            ? `You reached ${formatPrize(MILLION_LADDER_PRIZES[state.ladderReached])}.`
            : 'The first rung proved a cruel one.'}
      </p>
      {state.isHost ? (
        <div className="finish-actions">
          <button type="button" className="primary" onClick={onRestart}>
            Climb again
          </button>
          <button type="button" className="secondary" onClick={onChangeGame}>
            Choose another game
          </button>
        </div>
      ) : (
        <div className="waiting-banner">Waiting for the host</div>
      )}
    </main>
  )
}
