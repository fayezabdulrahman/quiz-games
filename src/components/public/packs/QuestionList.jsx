import { useState } from 'react'
import QuestionMedia from '../../shared/QuestionMedia.jsx'
import { isIncompleteDraft, questionKindLabel, questionTitle, statusLabels } from './packData.js'
import { IconButton } from './packUi.jsx'

function questionKey(question) {
  return question.id || question.localId
}

function moveQuestion(questions, sourceKey, targetIndex) {
  const sourceIndex = questions.findIndex((question) => questionKey(question) === sourceKey)
  if (sourceIndex < 0 || sourceIndex === targetIndex) return questions
  const nextQuestions = [...questions]
  const [question] = nextQuestions.splice(sourceIndex, 1)
  nextQuestions.splice(targetIndex, 0, question)
  return nextQuestions
}

export default function QuestionList({
  busy = false,
  emptyMessage,
  questions,
  onDeleteQuestion,
  onEditQuestion,
  onReorderQuestions,
  saved = false,
}) {
  const [draggedQuestionKey, setDraggedQuestionKey] = useState(null)
  const canReorder = questions.length > 1 && Boolean(onReorderQuestions)

  const reorder = (sourceKey, targetIndex) => {
    const nextQuestions = moveQuestion(questions, sourceKey, targetIndex)
    if (nextQuestions !== questions) onReorderQuestions(nextQuestions)
  }

  return (
    <div className="question-table">
      {questions.map((question, index) => {
        const key = questionKey(question)
        const title = questionTitle(question)
        return (
          <div
            key={key}
            className={`question-row ${canReorder ? 'reorderable' : ''} ${draggedQuestionKey === key ? 'dragging' : ''}`.trim()}
            onDragOver={canReorder ? (event) => event.preventDefault() : undefined}
            onDrop={canReorder ? (event) => {
              event.preventDefault()
              const sourceKey = draggedQuestionKey || event.dataTransfer.getData('text/plain')
              if (sourceKey) reorder(sourceKey, index)
              setDraggedQuestionKey(null)
            } : undefined}
          >
            {canReorder && (
              <div className="question-order-controls">
                <IconButton
                  label={`Drag to reorder ${title}`}
                  icon="drag"
                  className="question-drag-handle"
                  disabled={busy}
                  draggable={!busy}
                  onDragStart={(event) => {
                    setDraggedQuestionKey(key)
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', String(key))
                  }}
                  onDragEnd={() => setDraggedQuestionKey(null)}
                />
                <div className="question-step-controls">
                  <IconButton
                    label={`Move ${title} up`}
                    icon="moveUp"
                    disabled={busy || index === 0}
                    onClick={() => reorder(key, index - 1)}
                  />
                  <IconButton
                    label={`Move ${title} down`}
                    icon="moveDown"
                    disabled={busy || index === questions.length - 1}
                    onClick={() => reorder(key, index + 1)}
                  />
                </div>
              </div>
            )}
            <div className="question-row-content">
              <strong title={title}>{title}</strong>
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
        )
      })}
      {!questions.length && (
        <div className="packs-empty small">{emptyMessage}</div>
      )}
    </div>
  )
}
