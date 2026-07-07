import QuestionMedia from '../../shared/QuestionMedia.jsx'
import { isIncompleteDraft, questionKindLabel, questionTitle, statusLabels } from './packData.js'
import { IconButton } from './packUi.jsx'

export default function QuestionList({ busy = false, emptyMessage, questions, onDeleteQuestion, onEditQuestion, saved = false }) {
  return (
    <div className="question-table">
      {questions.map((question) => (
        <div key={question.id || question.localId} className="question-row">
          <div>
            <strong>{questionTitle(question)}</strong>
            <QuestionMedia media={question.payload?.media || question.form?.media} className="compact" />
            <span className="question-meta">
              <span className={`question-status-pill ${isIncompleteDraft(question) ? 'incomplete' : question.status}`}>
                {isIncompleteDraft(question) ? 'Incomplete draft' : statusLabels[question.status]}
              </span>
              <span>{questionKindLabel(question)}</span>
            </span>
          </div>
          <div className="pack-inline-actions">
            <IconButton
              label="Edit question"
              icon="edit"
              onClick={() => onEditQuestion(question)}
            />
            <IconButton
              label="Delete question"
              icon="delete"
              variant="danger"
              disabled={saved && busy}
              onClick={() => onDeleteQuestion(question)}
            />
          </div>
        </div>
      ))}
      {!questions.length && (
        <div className="packs-empty small">{emptyMessage}</div>
      )}
    </div>
  )
}
