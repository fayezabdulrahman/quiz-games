import Finished from './components/Finished.jsx'
import Landing from './components/Landing.jsx'
import Lobby from './components/Lobby.jsx'
import QuestionScreen from './components/QuestionScreen.jsx'
import { useGameSession } from './hooks/useGameSession.js'

export default function App() {
  const {
    state,
    busy,
    error,
    hostGame,
    joinGame,
    startGame,
    answerQuestion,
    useLifeline,
    revealAnswer,
    nextQuestion,
    endGame,
    restartGame,
  } = useGameSession()

  if (!state) {
    return <Landing busy={busy} error={error} onHost={hostGame} onJoin={joinGame} />
  }

  if (state.phase === 'lobby') {
    return <Lobby state={state} onStart={startGame} />
  }

  if (state.phase === 'finished') {
    return <Finished state={state} onRestart={restartGame} />
  }

  return (
    <QuestionScreen
      state={state}
      error={error}
      onAnswer={answerQuestion}
      onPass={useLifeline}
      onReveal={revealAnswer}
      onNext={nextQuestion}
      onEnd={endGame}
    />
  )
}
