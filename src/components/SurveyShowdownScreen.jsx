import { useState } from 'react'
import Logo from './Logo.jsx'

function TeamCard({ team, players, active, winner }) {
  const members = players.filter((player) => player.teamId === team.id)
  return (
    <div className={`survey-team-card ${team.id} ${active ? 'active' : ''} ${winner ? 'winner' : ''}`}>
      <div><span>{team.name}</span><strong>{team.score}</strong></div>
      <p>{members.map((player) => player.name).join(' · ')}</p>
    </div>
  )
}

function GuessForm({ onGuess, faceoff = false }) {
  const [guess, setGuess] = useState('')
  const submit = async (event) => {
    event.preventDefault()
    const result = await onGuess(guess)
    if (result?.ok) setGuess('')
  }
  return (
    <form className="survey-guess-form" onSubmit={submit}>
      <label htmlFor="survey-guess">
        {faceoff ? 'Your face-off answer' : 'Your team’s answer'}
      </label>
      <div>
        <input id="survey-guess" value={guess} onChange={(event) => setGuess(event.target.value)}
          placeholder="Type a popular answer…" maxLength={80} autoComplete="off" />
        <button type="submit" className="primary" disabled={!guess.trim()}>Say it</button>
      </div>
    </form>
  )
}

export default function SurveyShowdownScreen({
  state,
  error,
  onGuess,
  onChooseControl,
  onNext,
  onEnd,
}) {
  const activePlayer = state.players.find((player) => player.id === state.surveyActivePlayerId)
  const activeTeam = state.surveyTeams.find((team) => team.id === state.surveyActiveTeamId)
  const roundWinner = state.surveyTeams.find((team) => team.id === state.surveyRoundWinnerTeamId)
  const isMyTurn = state.me?.id === state.surveyActivePlayerId
  const isControlChooser = state.me?.id === state.surveyControlChooserPlayerId
  const isLastRound = state.questionIndex === state.totalQuestions - 1
  const isFaceoff = state.phase === 'survey-faceoff'
  const isControlChoice = state.phase === 'survey-control'

  return (
    <main className="game-shell survey-shell">
      <header>
        <Logo gameType="survey-showdown" />
        <div className="header-room"><span>ROOM</span><strong>{state.code}</strong></div>
      </header>
      <div className="survey-topline">
        <span>Round {state.questionIndex + 1} of {state.totalQuestions}</span>
        <strong>{state.surveyMultiplier}× points</strong>
        <span className="survey-bank">Bank {state.surveyRoundBank}</span>
      </div>
      <section className="survey-layout">
        <div className="survey-main">
          <div className="eyebrow">
            {state.phase === 'survey-steal'
              ? `${activeTeam?.name} can steal`
              : isFaceoff
                ? 'Face-off'
                : isControlChoice
                  ? `${activeTeam?.name} won the face-off`
              : state.phase === 'revealed'
                ? `${roundWinner?.name} wins the bank`
                : `${activeTeam?.name} has control`}
          </div>
          <h1>{state.question.prompt}</h1>
          <div className="survey-board">
            {state.question.answers.map((answer, index) => (
              <div className={answer.revealed ? 'revealed' : ''} key={answer.id}>
                <span>{index + 1}</span>
                <strong>{answer.revealed ? answer.text : '••••••••'}</strong>
                <b>{answer.revealed ? answer.points * state.surveyMultiplier : ''}</b>
              </div>
            ))}
          </div>
          {state.phase !== 'revealed' && (
            <>
              <div className="survey-turn-status">
                {isFaceoff || isControlChoice ? (
                  <div className="survey-faceoff-badge">VS</div>
                ) : (
                  <div className="survey-strikes" role="status" aria-label={`${state.surveyStrikes} strikes`}>
                    {[0, 1, 2].map((strike) => (
                      <span className={strike < state.surveyStrikes ? 'on' : ''} key={strike}>×</span>
                    ))}
                  </div>
                )}
                <div>
                  <strong>{activePlayer?.name || 'Next player'}</strong>
                  <span>
                    {isControlChoice
                      ? 'Choose whether your team will play or pass'
                      : isFaceoff
                        ? state.surveyFaceoffGuesses.length === 0
                          ? 'Give the highest survey answer you can'
                          : 'Beat the first answer to win control'
                        : state.phase === 'survey-steal'
                          ? 'One answer to steal the whole bank'
                          : 'Give one popular survey answer'}
                  </span>
                </div>
              </div>
              {state.surveyLastGuess && (
                <div className={`survey-last-guess ${state.surveyLastGuess.isMatch ? 'hit' : 'miss'}`}>
                  <span>{state.surveyLastGuess.isMatch ? '✓' : '×'}</span>
                  {state.surveyLastGuess.playerName} said “{state.surveyLastGuess.guess}”
                </div>
              )}
              {error && <p className="game-error" role="alert">{error}</p>}
              {!state.isHost && isControlChoice && isControlChooser && (
                <div className="survey-control-choice">
                  <button type="button" className="primary" onClick={() => onChooseControl('play')}>
                    Play
                  </button>
                  <button type="button" className="secondary" onClick={() => onChooseControl('pass')}>
                    Pass
                  </button>
                </div>
              )}
              {!state.isHost && !isControlChoice && (isMyTurn ? (
                <GuessForm onGuess={onGuess} faceoff={isFaceoff} />
              ) : (
                <div className="waiting-banner">
                  <span className="spinner" />
                  {isFaceoff
                    ? `${activePlayer?.name} is at the face-off`
                    : state.me?.teamId === state.surveyActiveTeamId
                    ? `Your teammate ${activePlayer?.name} is answering`
                    : `${activeTeam?.name} is answering`}
                </div>
              ))}
              {!state.isHost && isControlChoice && !isControlChooser && (
                <div className="waiting-banner">
                  <span className="spinner" />
                  {activePlayer?.name} is choosing Play or Pass
                </div>
              )}
              {state.isHost && (
                <div className="survey-host-callout">
                  <div>
                    <strong>{activePlayer?.name}</strong>{' '}
                    {isControlChoice
                      ? `is choosing Play or Pass for ${activeTeam?.name}`
                      : isFaceoff
                        ? `is answering the face-off for ${activeTeam?.name}`
                        : `is answering for ${activeTeam?.name}`}
                  </div>
                  <button type="button" className="secondary danger" onClick={onEnd}>
                    End game
                  </button>
                </div>
              )}
            </>
          )}
          {state.phase === 'revealed' && state.isHost && (
            <div className="host-round-actions">
              <button type="button" className="primary" onClick={onNext}>
                {isLastRound ? 'See final scores' : 'Next survey'}
              </button>
              {!isLastRound && <button type="button" className="secondary danger" onClick={onEnd}>End game</button>}
            </div>
          )}
          {state.phase === 'revealed' && !state.isHost && (
            <div className="waiting-banner">Waiting for the next survey</div>
          )}
        </div>
        <aside className="survey-scoreboard">
          <div className="eyebrow">Team scores</div>
          {state.surveyTeams.map((team) => (
            <TeamCard key={team.id} team={team} players={state.players}
              active={state.phase !== 'revealed' && team.id === state.surveyActiveTeamId}
              winner={team.id === state.surveyRoundWinnerTeamId} />
          ))}
          <div className="survey-rules-mini">
            <strong>How this round works</strong>
            <span>Win the face-off, choose Play or Pass, then avoid three strikes.</span>
          </div>
        </aside>
      </section>
    </main>
  )
}
