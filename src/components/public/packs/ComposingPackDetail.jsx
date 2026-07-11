import QuestionEditor from './QuestionEditor.jsx'
import QuestionList from './QuestionList.jsx'
import { Field, IconButton } from './packUi.jsx'

export default function ComposingPackDetail({
  busy,
  draftPackTitle,
  editorRef,
  editorQuestion,
  editing,
  gameType,
  pendingPackQuestions,
  selectedGame,
  onClose,
  onDeleteImage,
  onDeleteQuestion,
  onEditQuestion,
  onGenerateQuestion,
  onSavePack,
  onSaveQuestion,
  onSetDraftPackTitle,
  onStartQuestion,
  onStopEditing,
  onUploadImage,
}) {
  return (
    <>
      <div className="pack-section-heading">
        <div>
          <strong>Name your pack</strong>
          <span>Create questions locally, then save this {selectedGame?.name} pack when you're ready.</span>
        </div>
        <div className="pack-inline-actions">
          <IconButton
            label="Save pack"
            icon="save"
            variant="primary"
            disabled={busy || editing || !draftPackTitle.trim()}
            onClick={onSavePack}
          />
        </div>
      </div>
      <Field label="Pack name">
        <input
          value={draftPackTitle}
          placeholder={`${selectedGame?.name || 'Game'} night pack`}
          onChange={(event) => onSetDraftPackTitle(event.target.value)}
        />
      </Field>
      {editing ? (
        <div ref={editorRef} className="question-editor-anchor">
          <QuestionEditor
            gameType={gameType}
            question={editorQuestion}
            onCancel={onStopEditing}
            onDeleteImage={onDeleteImage}
            onGenerate={onGenerateQuestion}
            onSave={onSaveQuestion}
            onUploadImage={onUploadImage}
          />
        </div>
      ) : (
        <div className="pack-inline-actions">
          <IconButton
            label="Craft your question"
            icon="add"
            variant="primary"
            onClick={onStartQuestion}
          />
          <IconButton
            label="Close"
            icon="close"
            onClick={onClose}
          />
        </div>
      )}
      <QuestionList
        emptyMessage="Add a question, then save the pack when you're ready."
        questions={pendingPackQuestions}
        onDeleteQuestion={onDeleteQuestion}
        onEditQuestion={onEditQuestion}
      />
    </>
  )
}
