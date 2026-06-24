import { useEffect, useRef, useState } from 'react'
import Logo from './Logo.jsx'
import PlayerList from './PlayerList.jsx'
import QuickfireTeamSetup from './QuickfireTeamSetup.jsx'
import SurveyTeamSetup from './SurveyTeamSetup.jsx'

export default function Lobby({
  state,
  onStart,
  onAssignSurveyTeam,
  onRandomizeSurveyTeams,
  onAssignQuickfireTeam,
  onRandomizeQuickfireTeams,
  onCloseRoom,
}) {
  const joinUrl = `${window.location.origin}?join=${state.code}`
  const [copyStatus, setCopyStatus] = useState('')
  const copyTimer = useRef(null)

  useEffect(
    () => () => {
      window.clearTimeout(copyTimer.current)
    },
    [],
  )

  const copyInvite = async () => {
    window.clearTimeout(copyTimer.current)
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopyStatus('Invite link copied')
    } catch {
      setCopyStatus('Could not copy the link')
    }
    copyTimer.current = window.setTimeout(() => setCopyStatus(''), 2400)
  }

  return (
    <main className="game-shell lobby">
      <header>
        <Logo gameType={state.gameType} />
        <span className="live-chip">LIVE ROOM</span>
      </header>
      <section className="lobby-grid">
        <div className="room-code-panel">
          <div className="eyebrow">Join at this address</div>
          <div className="join-url">{window.location.host}</div>
          <div className="room-code">{state.code}</div>
          <div className="code-caption">Room code</div>
          <button
            type="button"
            className="text-button"
            onClick={copyInvite}
          >
            {copyStatus === 'Invite link copied' ? 'Copied!' : 'Copy invite link'}
          </button>
        </div>
        <div className="contestants-panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Contestants</div>
              <h2>{state.players.length} joined</h2>
            </div>
            <span className="pulse" />
          </div>
          <div className="room-settings-summary">
            {state.gameType === 'quickfire-30' ? (
              <>
                <span><strong>30</strong> second team turns</span>
                <span>{state.settings.diceMode === 'manual' ? 'Physical' : 'Digital'} handicap die · first to 30</span>
              </>
            ) : state.gameType === 'say-what-you-see' ? (
              <>
                <span><strong>10</strong> visual puzzles</span>
                <span>
                  {state.settings.guessTimerEnabled
                    ? `${state.settings.guessSeconds}s to answer after buzzing`
                    : 'No buzz answer timer'}
                </span>
              </>
            ) : state.gameType === 'survey-showdown' ? (
              <>
                <span><strong>6</strong> team survey rounds</span>
                <span>Three strikes · one chance to steal</span>
              </>
            ) : state.gameType === 'bluff-battle' ? (
              <>
                <span><strong>{state.settings.roundCount}</strong> bluffing rounds</span>
                <span>2 points for truth · 1 per fooled player</span>
              </>
            ) : state.gameType === 'majority-rules' ? (
              <>
                <span><strong>8</strong> opinion rounds</span>
                <span>Match the majority to score</span>
              </>
            ) : state.gameType === 'million-ladder' ? (
              <>
                <span><strong>15</strong> prize questions</span>
                <span>First player is contestant · others join the audience</span>
              </>
            ) : (
              <>
                <span>
                  <strong>{state.settings.lifelineCount}</strong>{' '}
                  {state.settings.lifelineCount === 1 ? 'pass' : 'passes'} each
                </span>
                <span>
                  {state.settings.lifelinesAnytime ? 'Available all round' : 'Available from 50%'}
                </span>
              </>
            )}
          </div>
          {state.gameType === 'survey-showdown' ? (
            <SurveyTeamSetup
              state={state}
              onAssign={onAssignSurveyTeam}
              onRandomize={onRandomizeSurveyTeams}
            />
          ) : state.gameType === 'quickfire-30' ? (
            <QuickfireTeamSetup
              state={state}
              onAssign={onAssignQuickfireTeam}
              onRandomize={onRandomizeQuickfireTeams}
            />
          ) : (
            <PlayerList players={state.players} />
          )}
          {state.isHost ? (
            <div className="lobby-host-actions">
              <button
                type="button"
                className="primary wide"
                onClick={onStart}
                disabled={
                  ['bluff-battle', 'survey-showdown', 'quickfire-30'].includes(state.gameType)
                    ? state.players.length < 2 ||
                      (state.gameType === 'survey-showdown' &&
                        (state.players.some((player) => !player.teamId) ||
                          state.surveyTeams.some((team) => team.playerIds.length === 0))) ||
                      (state.gameType === 'quickfire-30' &&
                        (state.players.some((player) => !player.teamId) ||
                          state.quickfireTeams.some((team) => team.playerIds.length === 0)))
                    : !state.players.length
                }
              >
                {['bluff-battle', 'survey-showdown', 'quickfire-30'].includes(state.gameType) &&
                (state.players.length < 2 ||
                  (state.gameType === 'survey-showdown' &&
                    (state.players.some((player) => !player.teamId) ||
                      state.surveyTeams.some((team) => team.playerIds.length === 0))) ||
                  (state.gameType === 'quickfire-30' &&
                    (state.players.some((player) => !player.teamId) ||
                      state.quickfireTeams.some((team) => team.playerIds.length === 0))))
                  ? state.players.length < 2
                    ? 'Waiting for 2 players'
                    : 'Assign both teams'
                  : 'Start the game'}
              </button>
              <button
                type="button"
                className="secondary danger wide"
                onClick={onCloseRoom}
              >
                Close room
              </button>
            </div>
          ) : (
            <div className="waiting-banner">
              <span className="spinner" />
              Waiting for the host to begin
            </div>
          )}
        </div>
      </section>
      {copyStatus && (
        <div
          className={`toast ${copyStatus.startsWith('Could') ? 'toast-error' : ''}`}
          role="status"
          aria-live="polite"
        >
          <span>{copyStatus.startsWith('Could') ? '!' : '✓'}</span>
          {copyStatus}
        </div>
      )}
    </main>
  )
}
