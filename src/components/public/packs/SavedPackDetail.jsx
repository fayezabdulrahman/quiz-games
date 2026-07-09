import QuestionEditor from './QuestionEditor.jsx'
import QuestionList from './QuestionList.jsx'
import { packStatusLabels } from './packData.js'
import { IconButton } from './packUi.jsx'

export default function SavedPackDetail({
  busy,
  editorRef,
  editorQuestion,
  editing,
  gameType,
  selectedPack,
  onDeletePack,
  onDeleteImage,
  onDeleteQuestion,
  onEditQuestion,
  onSaveQuestion,
  onStartQuestion,
  onStopEditing,
  onUpdatePackStatus,
  onUploadImage,
}) {
  return (
    <>
      <div className="pack-section-heading">
        <div>
          <div className="pack-heading-title">
            <strong>{selectedPack.title}</strong>
            <span className={`pack-status-pill ${selectedPack.status}`}>
              {packStatusLabels[selectedPack.status] || selectedPack.status}
            </span>
          </div>
          <span>{selectedPack.questions.length} saved questions</span>
        </div>
        <div className="pack-inline-actions">
          <IconButton
            label="Delete pack"
            icon="delete"
            variant="danger"
            disabled={busy}
            onClick={onDeletePack}
          />
          <IconButton
            label={selectedPack.status === 'active' ? 'Make draft' : 'Activate pack'}
            icon={selectedPack.status === 'active' ? 'save' : 'check'}
            disabled={busy || selectedPack.questions.length === 0}
            onClick={() => onUpdatePackStatus(selectedPack.status === 'active' ? 'draft' : 'active')}
          />
          <IconButton
            label="Craft your question"
            icon="add"
            variant="primary"
            onClick={onStartQuestion}
          />
        </div>
      </div>

      {editing && (
        <div ref={editorRef} className="question-editor-anchor">
          <QuestionEditor
            gameType={gameType}
            question={editorQuestion}
            onCancel={onStopEditing}
            onDeleteImage={onDeleteImage}
            onSave={onSaveQuestion}
            onUploadImage={onUploadImage}
          />
        </div>
      )}

      <QuestionList
        busy={busy}
        emptyMessage="Add the first question to this pack."
        questions={selectedPack.questions}
        saved
        onDeleteQuestion={onDeleteQuestion}
        onEditQuestion={onEditQuestion}
      />
    </>
  )
}
