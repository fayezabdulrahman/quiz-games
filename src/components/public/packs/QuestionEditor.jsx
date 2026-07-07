import { useMemo, useRef, useState } from 'react'
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

const MAX_UPLOAD_BYTES = 1_200_000
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

function mediaLabel(item, index) {
  return item?.alt || item?.name || `Image ${index + 1}`
}

function ImageAttachments({ media = [], onChange, onDeleteImage, onUploadImage }) {
  const fileInputRef = useRef(null)
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState('')
  const [isExpanded, setIsExpanded] = useState(media.length > 0)
  const [isDragging, setIsDragging] = useState(false)

  const remainingSlots = Math.max(0, 4 - media.length)

  const updateItem = (index, patch) => {
    onChange(media.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  const deleteIfTemporary = async (item) => {
    const storageKey = item?.storageKey
    if (!storageKey) return
    await onDeleteImage?.(storageKey)
  }

  const removeItem = async (index) => {
    await deleteIfTemporary(media[index])
    onChange(media.filter((_, itemIndex) => itemIndex !== index))
  }

  const addImageUrl = () => {
    const src = imageUrl.trim()
    if (!src) return
    if (!/^https?:\/\//i.test(src)) {
      setError('Use a full image URL starting with http or https.')
      return
    }
    setError('')
    onChange([...media, { type: 'image', src, alt: `Question image ${media.length + 1}` }])
    setImageUrl('')
  }

  const processFiles = async (selectedFiles) => {
    const files = Array.from(selectedFiles || [])
    if (!files.length) return
    if (remainingSlots === 0) {
      setError('Remove an image before adding another one.')
      return
    }

    const acceptedFiles = files.slice(0, remainingSlots).filter((file) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError('Images must be PNG, JPEG, WebP, or GIF.')
        return false
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setError('Each uploaded image must be under 1.2 MB.')
        return false
      }
      return true
    })
    if (!acceptedFiles.length) return
    if (files.length > remainingSlots) {
      setError(`Only ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'} can be added.`)
    }

    if (!onUploadImage) {
      setError('Image uploads are not configured yet.')
      return
    }

    let uploaded = []
    try {
      uploaded = await Promise.all(acceptedFiles.map((file) => onUploadImage(file)))
    } catch (uploadError) {
      setError(uploadError?.message || 'Could not upload that image.')
      return
    }

    if (uploaded.length) {
      setError('')
      onChange([...media, ...uploaded])
    }
  }

  const uploadImages = async (event) => {
    await processFiles(event.target.files)
    event.target.value = ''
  }

  const dropImages = async (event) => {
    event.preventDefault()
    setIsDragging(false)
    await processFiles(event.dataTransfer.files)
  }

  return (
    <div className={`question-image-builder ${isExpanded ? 'expanded' : ''}`}>
      <button
        type="button"
        className="question-image-toggle"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <span>
          <strong>Image questions supported</strong>
          <small>Add up to four optional images for visual prompts.</small>
        </span>
        <span className="question-image-toggle-meta">
          {media.length ? `${media.length}/4 added` : 'Optional'}
        </span>
      </button>

      {isExpanded && (
        <div className="question-image-panel">
          <div
            className={`question-image-dropzone ${isDragging ? 'dragging' : ''}`}
            onDragEnter={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={dropImages}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              onChange={uploadImages}
            />
            <span className="question-image-upload-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 16V5M8 9l4-4 4 4M5 16v3h14v-3" />
              </svg>
            </span>
            <strong>Drag and drop images here</strong>
            <span>or choose files from your device</span>
            <button
              type="button"
              className="secondary"
              disabled={remainingSlots === 0}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose images
            </button>
            <small>PNG, JPEG, WebP, or GIF. {remainingSlots} slot{remainingSlots === 1 ? '' : 's'} left.</small>
          </div>

          <div className="question-image-url-row">
            <input
              value={imageUrl}
              placeholder="https://example.com/question-image.png"
              onChange={(event) => setImageUrl(event.target.value)}
            />
            <button type="button" className="secondary" disabled={media.length >= 4} onClick={addImageUrl}>
              Add URL
            </button>
          </div>

          {error && <span className="question-image-error">{error}</span>}
          {media.length > 0 && (
            <div className="question-image-list">
              {media.map((item, index) => (
                <div key={`${item.src}-${index}`} className="question-image-item">
                  <div className="question-image-thumb">
                    <img src={item.src} alt={mediaLabel(item, index)} />
                  </div>
                  <input
                    value={item.alt || ''}
                    placeholder={`Image ${index + 1} description`}
                    onChange={(event) => updateItem(index, { alt: event.target.value })}
                  />
                  <button type="button" className="secondary danger" onClick={() => removeItem(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
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

export default function QuestionEditor({ gameType, question, onCancel, onDeleteImage, onSave, onUploadImage }) {
  const [form, setForm] = useState(() =>
    question?.form ? question.form : question ? formFromQuestion(question) : emptyQuestionForm(gameType),
  )
  const initialStorageKeys = useRef(
    new Set((form.media || []).map((item) => item?.storageKey).filter(Boolean)),
  )
  const temporaryStorageKeys = useRef(new Set())
  const update = (patch) => setForm((current) => ({ ...current, ...patch }))
  const validation = useMemo(() => validateCustomQuestion(gameType, form), [form, gameType])

  const uploadImage = async (file) => {
    const media = await onUploadImage(file)
    if (media?.storageKey) temporaryStorageKeys.current.add(media.storageKey)
    return media
  }

  const deleteTemporaryImage = async (storageKey) => {
    if (!temporaryStorageKeys.current.has(storageKey) || initialStorageKeys.current.has(storageKey)) return
    temporaryStorageKeys.current.delete(storageKey)
    await onDeleteImage?.(storageKey)
  }

  const cancel = async () => {
    const keys = Array.from(temporaryStorageKeys.current)
    temporaryStorageKeys.current.clear()
    await Promise.all(keys.map((storageKey) => onDeleteImage?.(storageKey)))
    onCancel()
  }

  const save = (status) => {
    temporaryStorageKeys.current.clear()
    onSave({ form, status })
  }

  return (
    <section className="question-editor">
      <div className="pack-section-heading">
        <div>
          <strong>{question ? 'Edit question' : 'Craft your question'}</strong>
          <span>{validation.errors[0]?.message || validation.warnings[0]?.message || 'Ready to save.'}</span>
        </div>
        <IconButton label="Close" icon="close" onClick={cancel} />
      </div>

      {['one-percent', 'million-ladder', 'bluff-battle', 'majority-rules', 'survey-showdown'].includes(gameType) && (
        <>
          <Field label="Prompt">
            <textarea value={form.prompt || ''} onChange={(event) => update({ prompt: event.target.value })} />
          </Field>
          <ImageAttachments
            media={form.media || []}
            onChange={(media) => update({ media })}
            onDeleteImage={deleteTemporaryImage}
            onUploadImage={uploadImage}
          />
        </>
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
