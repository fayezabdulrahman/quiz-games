import BluffBattleFinished from './components/BluffBattleFinished.jsx'
import BluffBattleScreen from './components/BluffBattleScreen.jsx'
import Finished from './components/Finished.jsx'
import Landing from './components/Landing.jsx'
import Lobby from './components/Lobby.jsx'
import MajorityFinished from './components/MajorityFinished.jsx'
import MajorityRulesScreen from './components/MajorityRulesScreen.jsx'
import MillionLadderFinished from './components/MillionLadderFinished.jsx'
import MillionLadderScreen from './components/MillionLadderScreen.jsx'
import QuestionScreen from './components/QuestionScreen.jsx'
import Quickfire30Finished from './components/Quickfire30Finished.jsx'
import Quickfire30Screen from './components/Quickfire30Screen.jsx'
import RoomGamePicker from './components/RoomGamePicker.jsx'
import SurveyShowdownFinished from './components/SurveyShowdownFinished.jsx'
import SurveyShowdownScreen from './components/SurveyShowdownScreen.jsx'
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
    submitSurveyGuess,
    chooseSurveyControl,
    assignQuickfireTeam,
    randomizeQuickfireTeams,
    rollQuickfireDie,
    drawQuickfireCard,
    scoreQuickfireCard,
    nextQuickfireTurn,
    endQuickfireGame,
    useLifeline,
    useLadderLifeline,
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
    return (
      <Lobby
        state={state}
        onStart={startGame}
        onAssignQuickfireTeam={assignQuickfireTeam}
        onRandomizeQuickfireTeams={randomizeQuickfireTeams}
      />
    )
  }

  if (state.phase === 'game-select') {
    return <RoomGamePicker state={state} error={error} onSelectGame={selectRoomGame} />
  }

  if (state.phase === 'finished') {
    if (state.gameType === 'quickfire-30') {
      return (
        <Quickfire30Finished
          state={state}
          onRestart={restartGame}
          onChangeGame={returnToGames}
        />
      )
    }
    if (state.gameType === 'survey-showdown') {
      return <SurveyShowdownFinished state={state} onRestart={restartGame} onChangeGame={returnToGames} />
    }
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
    if (state.gameType === 'million-ladder') {
      return (
        <MillionLadderFinished
          state={state}
          onRestart={restartGame}
          onChangeGame={returnToGames}
        />
      )
    }
    return <Finished state={state} onRestart={restartGame} onChangeGame={returnToGames} />
  }

  if (state.gameType === 'survey-showdown') {
    return <SurveyShowdownScreen state={state} error={error} onGuess={submitSurveyGuess}
      onChooseControl={chooseSurveyControl} onNext={nextQuestion} onEnd={endGame} />
  }

  if (state.gameType === 'quickfire-30') {
    return (
      <Quickfire30Screen
        state={state}
        error={error}
        onRoll={rollQuickfireDie}
        onDraw={drawQuickfireCard}
        onScore={scoreQuickfireCard}
        onNext={nextQuickfireTurn}
        onEnd={endQuickfireGame}
      />
    )
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

  if (state.gameType === 'million-ladder') {
    return (
      <MillionLadderScreen
        state={state}
        error={error}
        onAnswer={answerQuestion}
        onReveal={revealAnswer}
        onNext={nextQuestion}
        onEnd={endGame}
        onLifeline={useLadderLifeline}
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
