import { useMemo, useState } from 'react'
import { demoGameTypes } from '../../data/access.js'
import HostFields from './play/HostFields.jsx'
import JoinFields from './play/JoinFields.jsx'

export default function PlayForm({ onHost, onJoin, busy, error, accountAccess, demoMode }) {
  const [mode, setMode] = useState('join')
  const availableGameTypes = useMemo(() => {
    if (accountAccess?.access?.hasFullAccess && !demoMode) return null
    return accountAccess?.access?.allowedGameTypes || demoGameTypes
  }, [accountAccess?.access?.allowedGameTypes, accountAccess?.access?.hasFullAccess, demoMode])
  const [gameType, setGameType] = useState(() => availableGameTypes?.[0] || 'one-percent')
  const selectedGameType =
    availableGameTypes?.length && !availableGameTypes.includes(gameType)
      ? availableGameTypes[0]
      : gameType
  const [name, setName] = useState('')
  const [code, setCode] = useState(
    () => new URLSearchParams(window.location.search).get('join')?.slice(0, 4).toUpperCase() || '',
  )
  const [lifelineCount, setLifelineCount] = useState(1)
  const [lifelinesAnytime, setLifelinesAnytime] = useState(false)
  const [diceMode, setDiceMode] = useState('digital')
  const [bluffRoundCount, setBluffRoundCount] = useState(6)
  const [majorityRoundCount, setMajorityRoundCount] = useState(8)
  const [catchphraseRoundCount, setCatchphraseRoundCount] = useState(10)
  const [onePercentRoundCount, setOnePercentRoundCount] = useState(10)
  const [ladderRoundCount, setLadderRoundCount] = useState(15)
  const [surveyRoundCount, setSurveyRoundCount] = useState(6)
  const [quickfireRoundCount, setQuickfireRoundCount] = useState(30)
  const [wordWheelTargetScore, setWordWheelTargetScore] = useState(5)
  const [questionSeconds, setQuestionSeconds] = useState(30)
  const [wordWheelTurnSeconds, setWordWheelTurnSeconds] = useState(15)
  const [wordWheelInputMode, setWordWheelInputMode] = useState('type')
  const [catchphraseTimerEnabled, setCatchphraseTimerEnabled] = useState(false)
  const [catchphraseGuessSeconds, setCatchphraseGuessSeconds] = useState(10)
  const [contentSelectionMode, setContentSelectionMode] = useState('official')
  const [preferredQuestionSetId, setPreferredQuestionSetId] = useState(null)
  const canConfigureMajorityRounds = Boolean(accountAccess?.access?.hasFullAccess && !demoMode)
  const canManageCustomQuestions = Boolean(
    accountAccess?.isSignedIn &&
      !demoMode &&
      accountAccess?.access?.featureKeys?.includes('custom_questions'),
  )

  const submit = (event) => {
    event.preventDefault()

    if (mode === 'host') {
      onHost(selectedGameType, {
        lifelineCount,
        lifelinesAnytime,
        diceMode,
        questionSeconds: selectedGameType === 'word-wheel' ? wordWheelTurnSeconds : questionSeconds,
        roundCount:
          selectedGameType === 'say-what-you-see'
            ? catchphraseRoundCount
            : selectedGameType === 'majority-rules'
              ? canConfigureMajorityRounds
                ? majorityRoundCount
                : undefined
              : selectedGameType === 'bluff-battle'
                ? bluffRoundCount
                : selectedGameType === 'one-percent'
                  ? onePercentRoundCount
                  : selectedGameType === 'million-ladder'
                    ? ladderRoundCount
                    : selectedGameType === 'survey-showdown'
                      ? surveyRoundCount
                      : selectedGameType === 'quickfire-30'
                        ? quickfireRoundCount
                        : selectedGameType === 'word-wheel'
                          ? wordWheelTargetScore
                        : undefined,
        inputMode: wordWheelInputMode,
        guessTimerEnabled: catchphraseTimerEnabled,
        guessSeconds: catchphraseGuessSeconds,
        contentSelectionMode,
        preferredQuestionSetId:
          contentSelectionMode === 'user_only' ? preferredQuestionSetId : null,
      })
      return
    }

    onJoin(code, name)
  }

  return (
    <section className="entry-card play-card">
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
          <JoinFields name={name} code={code} setName={setName} setCode={setCode} />
        )}
        {mode === 'host' && (
          <HostFields
            gameType={selectedGameType}
            setGameType={setGameType}
            lifelineCount={lifelineCount}
            setLifelineCount={setLifelineCount}
            lifelinesAnytime={lifelinesAnytime}
            setLifelinesAnytime={setLifelinesAnytime}
            diceMode={diceMode}
            setDiceMode={setDiceMode}
            bluffRoundCount={bluffRoundCount}
            setBluffRoundCount={setBluffRoundCount}
            majorityRoundCount={majorityRoundCount}
            setMajorityRoundCount={setMajorityRoundCount}
            catchphraseRoundCount={catchphraseRoundCount}
            setCatchphraseRoundCount={setCatchphraseRoundCount}
            catchphraseTimerEnabled={catchphraseTimerEnabled}
            setCatchphraseTimerEnabled={setCatchphraseTimerEnabled}
            catchphraseGuessSeconds={catchphraseGuessSeconds}
            setCatchphraseGuessSeconds={setCatchphraseGuessSeconds}
            onePercentRoundCount={onePercentRoundCount}
            setOnePercentRoundCount={setOnePercentRoundCount}
            ladderRoundCount={ladderRoundCount}
            setLadderRoundCount={setLadderRoundCount}
            surveyRoundCount={surveyRoundCount}
            setSurveyRoundCount={setSurveyRoundCount}
            quickfireRoundCount={quickfireRoundCount}
            setQuickfireRoundCount={setQuickfireRoundCount}
            wordWheelTargetScore={wordWheelTargetScore}
            setWordWheelTargetScore={setWordWheelTargetScore}
            questionSeconds={questionSeconds}
            setQuestionSeconds={setQuestionSeconds}
            wordWheelTurnSeconds={wordWheelTurnSeconds}
            setWordWheelTurnSeconds={setWordWheelTurnSeconds}
            wordWheelInputMode={wordWheelInputMode}
            setWordWheelInputMode={setWordWheelInputMode}
            availableGameTypes={availableGameTypes}
            canConfigureMajorityRounds={canConfigureMajorityRounds}
            canManageCustomQuestions={canManageCustomQuestions}
            contentSelectionMode={contentSelectionMode}
            setContentSelectionMode={setContentSelectionMode}
            preferredQuestionSetId={preferredQuestionSetId}
            setPreferredQuestionSetId={setPreferredQuestionSetId}
          />
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="primary wide" disabled={busy}>
          {busy ? 'Connecting…' : mode === 'host' ? 'Create game room' : 'Join room'}
        </button>
      </form>
      <p className="fine-print">Guests join free with a room code. Best with one phone per player.</p>
    </section>
  )
}
