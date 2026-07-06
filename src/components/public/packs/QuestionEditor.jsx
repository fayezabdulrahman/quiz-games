import { useMemo, useState } from 'react'
import {
  emptyQuestionForm,
  formFromQuestion,
  ONE_PERCENT_DIFFICULTIES,
  SAY_WHAT_YOU_SEE_LAYOUTS,
  validateCustomQuestion,
} from '../../../../shared/customQuestionSchemas.js'
import { Field, IconButton } from './packUi.jsx'

function inputList(values, count) {
  return Array.from({ length: count }, (_, index) => values?.[index] || '')
}

function splitLines(value) {
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function joinLines(values) {
  return (Array.isArray(values) ? values : []).join('\n')
}

function ArrayInputs({ label, values, min = 2, max = 6, onChange, placeholders = [] }) {
  const visible = inputList(values, Math.max(min, values?.length || 0))
  const update = (index, value) => {
    const next = [...visible]
    next[index] = value
    onChange(next)
  }
  return (
    <div className="pack-field">
      <span>{label}</span>
      <div className="pack-array">
        {visible.map((value, index) => (
          <input
            key={index}
            value={value}
            placeholder={placeholders[index] || `${label} ${index + 1}`}
            onChange={(event) => update(index, event.target.value)}
          />
        ))}
      </div>
      {min !== max && (
        <div className="pack-inline-actions">
          <button
            type="button"
            className="secondary"
            disabled={visible.length >= max}
            onClick={() => onChange([...visible, ''])}
          >
            Add
          </button>
          <button
            type="button"
            className="secondary"
            disabled={visible.length <= min}
            onClick={() => onChange(visible.slice(0, -1))}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}

function SurveyAnswers({ answers, onChange }) {
  const visible = answers?.length ? answers : Array.from({ length: 6 }, () => ({ text: '', points: '', accepted: [] }))
  const update = (index, patch) => {
    onChange(visible.map((answer, itemIndex) => (itemIndex === index ? { ...answer, ...patch } : answer)))
  }
  return (
    <div className="pack-field">
      <span>Survey answers</span>
      <div className="survey-answer-builder">
        {visible.map((answer, index) => (
          <div key={index} className="survey-answer-row">
            <input
              value={answer.text || ''}
              placeholder={`Answer ${index + 1}`}
              onChange={(event) => update(index, { text: event.target.value })}
            />
            <input
              type="number"
              min="0"
              max="100"
              value={answer.points ?? ''}
              placeholder="Pts"
              onChange={(event) => update(index, { points: event.target.value })}
            />
            <input
              value={joinLines(answer.accepted)}
              placeholder="Accepted aliases, one per line"
              onChange={(event) => update(index, { accepted: splitLines(event.target.value) })}
            />
          </div>
        ))}
      </div>
      <div className="pack-inline-actions">
        <button
          type="button"
          className="secondary"
          disabled={visible.length >= 8}
          onClick={() => onChange([...visible, { text: '', points: '', accepted: [] }])}
        >
          Add answer
        </button>
        <button
          type="button"
          className="secondary"
          disabled={visible.length <= 3}
          onClick={() => onChange(visible.slice(0, -1))}
        >
          Remove answer
        </button>
      </div>
    </div>
  )
}

export default function QuestionEditor({ gameType, question, onCancel, onSave }) {
  const [form, setForm] = useState(() =>
    question?.form ? question.form : question ? formFromQuestion(question) : emptyQuestionForm(gameType),
  )
  const update = (patch) => setForm((current) => ({ ...current, ...patch }))
  const validation = useMemo(() => validateCustomQuestion(gameType, form), [form, gameType])

  const save = (status) => {
    onSave({ form, status })
  }

  return (
    <section className="question-editor">
      <div className="pack-section-heading">
        <div>
          <strong>{question ? 'Edit question' : 'Craft your question'}</strong>
          <span>{validation.errors[0]?.message || validation.warnings[0]?.message || 'Ready to save.'}</span>
        </div>
        <IconButton label="Close" icon="close" onClick={onCancel} />
      </div>

      {['one-percent', 'million-ladder', 'bluff-battle', 'majority-rules', 'survey-showdown'].includes(gameType) && (
        <Field label="Prompt">
          <textarea value={form.prompt || ''} onChange={(event) => update({ prompt: event.target.value })} />
        </Field>
      )}

      {gameType === 'one-percent' && (
        <>
          <Field label="Detail">
            <input value={form.detail || ''} onChange={(event) => update({ detail: event.target.value })} />
          </Field>
          <div className="pack-grid-two">
            <Field label="Difficulty">
              <select value={form.difficulty || 90} onChange={(event) => update({ difficulty: Number(event.target.value) })}>
                {ONE_PERCENT_DIFFICULTIES.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>{difficulty}%</option>
                ))}
              </select>
            </Field>
            <Field label="Answer type">
              <select value={form.type || 'choice'} onChange={(event) => update({ type: event.target.value })}>
                <option value="choice">Multiple choice</option>
                <option value="input">Typed answer</option>
              </select>
            </Field>
          </div>
          {form.type === 'choice' ? (
            <>
              <ArrayInputs label="Options" values={form.options} min={2} max={6} onChange={(options) => update({ options })} />
              <Field label="Correct answer">
                <select value={form.answer || ''} onChange={(event) => update({ answer: event.target.value })}>
                  <option value="">Choose an option</option>
                  {(form.options || []).filter(Boolean).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </Field>
            </>
          ) : (
            <Field label="Accepted answers">
              <textarea value={joinLines(form.acceptedAnswers)} onChange={(event) => update({ acceptedAnswers: splitLines(event.target.value), answer: splitLines(event.target.value)[0] || '' })} />
            </Field>
          )}
        </>
      )}

      {gameType === 'million-ladder' && (
        <>
          <Field label="Ladder rung">
            <select value={form.rung || 1} onChange={(event) => update({ rung: Number(event.target.value) })}>
              {Array.from({ length: 15 }, (_, index) => (
                <option key={index + 1} value={index + 1}>Rung {index + 1}</option>
              ))}
            </select>
          </Field>
          <ArrayInputs label="Options" values={form.options} min={4} max={4} onChange={(options) => update({ options })} />
          <Field label="Correct answer">
            <select value={form.answer || ''} onChange={(event) => update({ answer: event.target.value })}>
              <option value="">Choose an option</option>
              {(form.options || []).filter(Boolean).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </Field>
        </>
      )}

      {gameType === 'bluff-battle' && (
        <div className="pack-grid-two">
          <Field label="Real answer">
            <input value={form.answer || ''} onChange={(event) => update({ answer: event.target.value })} />
          </Field>
          <Field label="Input mode">
            <select value={form.inputMode || 'text'} onChange={(event) => update({ inputMode: event.target.value })}>
              <option value="text">Text</option>
              <option value="numeric">Numeric</option>
            </select>
          </Field>
        </div>
      )}

      {gameType === 'majority-rules' && (
        <ArrayInputs label="Choices" values={form.options} min={2} max={6} onChange={(options) => update({ options })} />
      )}

      {gameType === 'survey-showdown' && (
        <SurveyAnswers answers={form.answers} onChange={(answers) => update({ answers })} />
      )}

      {gameType === 'quickfire-30' && (
        <ArrayInputs label="Terms" values={form.terms} min={5} max={5} onChange={(terms) => update({ terms })} />
      )}

      {gameType === 'say-what-you-see' && (
        <>
          <div className="pack-grid-two">
            <Field label="Phrase answer">
              <input value={form.answer || ''} onChange={(event) => update({ answer: event.target.value })} />
            </Field>
            <Field label="Puzzle layout">
              <select value={form.layout || 'square-one'} onChange={(event) => update({ layout: event.target.value })}>
                {SAY_WHAT_YOU_SEE_LAYOUTS.map((layout) => (
                  <option key={layout} value={layout}>{layout}</option>
                ))}
              </select>
            </Field>
          </div>
          <ArrayInputs label="Visible tokens" values={form.tokens} min={1} max={6} onChange={(tokens) => update({ tokens })} />
          <Field label="Accepted answers">
            <textarea value={joinLines(form.acceptedAnswers)} onChange={(event) => update({ acceptedAnswers: splitLines(event.target.value) })} />
          </Field>
        </>
      )}

      {!['quickfire-30'].includes(gameType) && (
        <Field label="Explanation">
          <textarea value={form.explanation || ''} onChange={(event) => update({ explanation: event.target.value })} />
        </Field>
      )}

      <div className="pack-editor-actions">
        <IconButton label="Save draft" icon="save" onClick={() => save('draft')} />
        <IconButton
          label={question ? 'Save question' : 'Create question'}
          icon={question ? 'save' : 'check'}
          variant="primary"
          disabled={validation.errors.length > 0}
          onClick={() => save('active')}
        />
      </div>
    </section>
  )
}
