import { useAuth } from '@clerk/react'
import BluffBattleFinished from './components/games/bluff-battle/BluffBattleFinished.jsx'
import BluffBattleScreen from './components/games/bluff-battle/BluffBattleScreen.jsx'
import Finished from './components/games/one-percent/Finished.jsx'
import Landing from './components/Landing.jsx'
import Lobby from './components/Lobby.jsx'
import MajorityFinished from './components/games/majority-rules/MajorityFinished.jsx'
import MajorityRulesScreen from './components/games/majority-rules/MajorityRulesScreen.jsx'
import MillionLadderFinished from './components/games/million-ladder/MillionLadderFinished.jsx'
import MillionLadderScreen from './components/games/million-ladder/MillionLadderScreen.jsx'
import QuestionScreen from './components/games/one-percent/QuestionScreen.jsx'
import Quickfire30Finished from './components/games/quickfire-30/Quickfire30Finished.jsx'
import Quickfire30Screen from './components/games/quickfire-30/Quickfire30Screen.jsx'
import QuizcraftFinished from './components/games/quizcraft/QuizcraftFinished.jsx'
import QuizcraftScreen from './components/games/quizcraft/QuizcraftScreen.jsx'
import RoomGamePicker from './components/room-game-picker/RoomGamePicker.jsx'
import SayWhatYouSeeFinished from './components/games/say-what-you-see/SayWhatYouSeeFinished.jsx'
import SayWhatYouSeeScreen from './components/games/say-what-you-see/SayWhatYouSeeScreen.jsx'
import AppLoadingScreen from './components/shared/AppLoadingScreen.jsx'
import HostPlayerManager from './components/shared/HostPlayerManager.jsx'
import SurveyShowdownFinished from './components/games/survey-showdown/SurveyShowdownFinished.jsx'
import SurveyShowdownScreen from './components/games/survey-showdown/SurveyShowdownScreen.jsx'
import WordWheelFinished from './components/games/word-wheel/WordWheelFinished.jsx'
import WordWheelScreen from './components/games/word-wheel/WordWheelScreen.jsx'
import { useAccountAccess } from './hooks/useAccountAccess.js'
import { useGameSession } from './hooks/useGameSession.js'

export default function App() {
  const { getToken, isSignedIn } = useAuth()
  const accountAccess = useAccountAccess()
  const {
    state,
    busy,
    error,
    hostGame,
    joinGame,
    startGame,
    answerQuestion,
    buzzCatchphrase,
    guessCatchphrase,
    submitBluff,
    voteForBluff,
    submitSurveyGuess,
    chooseSurveyControl,
    assignSurveyTeam,
    randomizeSurveyTeams,
    assignQuickfireTeam,
    randomizeQuickfireTeams,
    rollQuickfireDie,
    drawQuickfireCard,
    scoreQuickfireCard,
    nextQuickfireTurn,
    endQuickfireGame,
    submitWordWheelTurn,
    pauseWordWheel,
    resumeWordWheel,
    acceptWordWheelWord,
    undoWordWheelLast,
    returnWordWheelTurn,
    eliminateWordWheelPlayer,
    nextWordWheelRound,
    useLifeline,
    useLadderLifeline,
    revealAnswer,
    nextQuestion,
    endGame,
    restartGame,
    returnToGames,
    closeRoom,
    kickPlayer,
    selectRoomGame,
  } = useGameSession({ getAuthToken: isSignedIn ? getToken : null })

  if (!accountAccess.isLoaded || (accountAccess.isSignedIn && accountAccess.loading)) {
    return <AppLoadingScreen />
  }

  if (!state) {
    return (
      <Landing
        busy={busy}
        error={error}
        onHost={hostGame}
        onJoin={joinGame}
        accountAccess={accountAccess}
      />
    )
  }

  const renderRoom = () => {

  if (state.phase === 'lobby') {
    return (
      <Lobby
        state={state}
        onStart={startGame}
        onAssignSurveyTeam={assignSurveyTeam}
        onRandomizeSurveyTeams={randomizeSurveyTeams}
        onAssignQuickfireTeam={assignQuickfireTeam}
        onRandomizeQuickfireTeams={randomizeQuickfireTeams}
        onCloseRoom={closeRoom}
      />
    )
  }

  if (state.phase === 'game-select') {
    return (
      <RoomGamePicker
        state={state}
        error={error}
        onSelectGame={selectRoomGame}
        onCloseRoom={closeRoom}
      />
    )
  }

  if (state.phase === 'finished') {
    if (state.gameType === 'quizcraft') {
      return (
        <QuizcraftFinished
          state={state}
          onRestart={restartGame}
          onChangeGame={returnToGames}
        />
      )
    }
    if (state.gameType === 'quickfire-30') {
      return (
        <Quickfire30Finished
          state={state}
          onRestart={restartGame}
          onChangeGame={returnToGames}
        />
      )
    }
    if (state.gameType === 'word-wheel') {
      return (
        <WordWheelFinished
          state={state}
          onRestart={restartGame}
          onChangeGame={returnToGames}
        />
      )
    }
    if (state.gameType === 'say-what-you-see') {
      return (
        <SayWhatYouSeeFinished
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

  if (state.gameType === 'quizcraft') {
    return (
      <QuizcraftScreen
        state={state}
        error={error}
        onAnswer={answerQuestion}
        onReveal={revealAnswer}
        onNext={nextQuestion}
        onEnd={endGame}
      />
    )
  }

  if (state.gameType === 'say-what-you-see') {
    return (
      <SayWhatYouSeeScreen
        state={state}
        error={error}
        onBuzz={buzzCatchphrase}
        onGuess={guessCatchphrase}
        onReveal={revealAnswer}
        onNext={nextQuestion}
        onEnd={endGame}
      />
    )
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

  if (state.gameType === 'word-wheel') {
    return (
      <WordWheelScreen
        state={state}
        error={error}
        onSubmit={submitWordWheelTurn}
        onPause={pauseWordWheel}
        onResume={resumeWordWheel}
        onAcceptWord={acceptWordWheelWord}
        onUndoLast={undoWordWheelLast}
        onReturnTurn={returnWordWheelTurn}
        onEliminate={eliminateWordWheelPlayer}
        onNextRound={nextWordWheelRound}
        onEnd={endGame}
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

  return (
    <>
      {renderRoom()}
      <HostPlayerManager state={state} onKick={kickPlayer} />
    </>
  )
}
