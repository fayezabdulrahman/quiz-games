import Finished from './components/Finished.jsx'
import Landing from './components/Landing.jsx'
import Lobby from './components/Lobby.jsx'
import MajorityFinished from './components/MajorityFinished.jsx'
import MajorityRulesScreen from './components/MajorityRulesScreen.jsx'
import QuestionScreen from './components/QuestionScreen.jsx'
import RoomGamePicker from './components/RoomGamePicker.jsx'
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
    submitBluff,
    voteForBluff,
    useLifeline,
    revealAnswer,
    nextQuestion,
    endGame,
    restartGame,
    returnToGames,
    selectRoomGame,
  } = useGameSession()

  if (!state) {
    return <Landing busy={busy} error={error} onHost={hostGame} onJoin={joinGame} />
  }

  if (state.phase === 'lobby') {
    return <Lobby state={state} onStart={startGame} />
  }

  if (state.phase === 'game-select') {
    return <RoomGamePicker state={state} error={error} onSelectGame={selectRoomGame} />
  }

  if (state.phase === 'finished') {
    if (state.gameType === 'bluff-battle') {
      return (
        <BluffBattleFinished
          state={state}
          onRestart={restartGame}
          onChangeGame={returnToGames}
        />
      )
    }
    if (state.gameType === 'majority-rules') {
      return (
        <MajorityFinished
          state={state}
          onRestart={restartGame}
          onChangeGame={returnToGames}
        />
      )
    }
    return <Finished state={state} onRestart={restartGame} onChangeGame={returnToGames} />
  }

  if (state.gameType === 'bluff-battle') {
    return (
      <BluffBattleScreen
        state={state}
        error={error}
        onSubmitBluff={submitBluff}
        onVote={voteForBluff}
        onAdvancePhase={revealAnswer}
        onNext={nextQuestion}
        onEnd={endGame}
      />
    )
  }

  if (state.gameType === 'majority-rules') {
    return (
      <MajorityRulesScreen
        state={state}
        error={error}
        onAnswer={answerQuestion}
        onReveal={revealAnswer}
        onNext={nextQuestion}
        onEnd={endGame}
      />
    )
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
import BluffBattleFinished from './components/BluffBattleFinished.jsx'
import BluffBattleScreen from './components/BluffBattleScreen.jsx'
