import { useMemo, useRef, useState } from 'react'
import {
  emptyQuestionForm,
  formFromQuestion,
  ONE_PERCENT_DIFFICULTIES,
  SAY_WHAT_YOU_SEE_LAYOUTS,
  validateCustomQuestion,
} from '../../../../shared/customQuestionSchemas.js'
import Spinner from '../../shared/Spinner.jsx'
import DeleteConfirmationModal from './DeleteConfirmationModal.jsx'
import { Field, IconButton } from './packUi.jsx'

function inputList(values, count) {
  return Array.from({ length: count }, (_, index) => values?.[index] || '')
}

function splitLines(value) {
  return String(value || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
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
  const [uploadingCount, setUploadingCount] = useState(0)

  const remainingSlots = Math.max(0, 4 - media.length)
  const isUploading = uploadingCount > 0

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
    setError('')
    setUploadingCount(acceptedFiles.length)
    try {
      uploaded = await Promise.all(acceptedFiles.map((file) => onUploadImage(file)))
    } catch (uploadError) {
      setError(uploadError?.message || 'Could not upload that image.')
      return
    } finally {
      setUploadingCount(0)
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
    if (isUploading) return
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
            className={`question-image-dropzone ${isDragging ? 'dragging' : ''} ${isUploading ? 'uploading' : ''}`}
            aria-busy={isUploading}
            onDragEnter={(event) => {
              event.preventDefault()
              if (isUploading) return
              setIsDragging(true)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              if (isUploading) return
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
              disabled={isUploading}
              onChange={uploadImages}
            />
            {isUploading ? (
              <Spinner className="question-image-upload-spinner" label="Uploading image" />
            ) : (
              <span className="question-image-upload-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 16V5M8 9l4-4 4 4M5 16v3h14v-3" />
                </svg>
              </span>
            )}
            <strong>{isUploading ? `Uploading ${uploadingCount} image${uploadingCount === 1 ? '' : 's'}` : 'Drag and drop images here'}</strong>
            <span>{isUploading ? 'Your preview will appear here once the upload finishes.' : 'or choose files from your device'}</span>
            <button
              type="button"
              className="secondary"
              disabled={remainingSlots === 0 || isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? 'Uploading...' : 'Choose images'}
            </button>
            <small>PNG, JPEG, WebP, or GIF. {remainingSlots} slot{remainingSlots === 1 ? '' : 's'} left.</small>
          </div>

          <div className="question-image-url-row">
            <input
              value={imageUrl}
              placeholder="https://example.com/question-image.png"
              onChange={(event) => setImageUrl(event.target.value)}
            />
            <button type="button" className="secondary" disabled={media.length >= 4 || isUploading} onClick={addImageUrl}>
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

function hasMeaningfulContent(form) {
  return Object.entries(form || {}).some(([key, value]) => {
    if (['media', 'type', 'inputMode', 'layout', 'difficulty', 'rung'].includes(key)) return false
    if (Array.isArray(value)) return value.some((item) =>
      typeof item === 'object'
        ? Object.values(item || {}).some((nested) => Array.isArray(nested) ? nested.some(Boolean) : Boolean(nested))
        : Boolean(item),
    )
    return Boolean(value)
  })
}

export default function QuestionEditor({ gameType, question, onCancel, onDeleteImage, onGenerate, onSave, onUploadImage }) {
  const [form, setForm] = useState(() =>
    question?.form ? question.form : question ? formFromQuestion(question) : emptyQuestionForm(gameType),
  )
  const initialStorageKeys = useRef(
    new Set((form.media || []).map((item) => item?.storageKey).filter(Boolean)),
  )
  const temporaryStorageKeys = useRef(new Set())
  const [aiTopic, setAiTopic] = useState('')
  const [aiError, setAiError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [confirmGeneration, setConfirmGeneration] = useState(false)
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

  const performGeneration = async () => {
    setConfirmGeneration(false)
    setGenerating(true)
    setAiError('')
    try {
      const result = await onGenerate({ gameType, topic: aiTopic.trim() })
      setForm((current) => ({ ...result.form, media: current.media || [] }))
    } catch (error) {
      setAiError(error?.message || 'Could not generate a question right now.')
    } finally {
      setGenerating(false)
    }
  }

  const generate = () => {
    if (hasMeaningfulContent(form)) {
      setConfirmGeneration(true)
      return
    }
    performGeneration()
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

      {!['say-what-you-see', 'quizcraft'].includes(gameType) && (
        <div className="question-ai-panel">
          <div className="question-ai-copy">
            <strong>Need some inspiration?</strong>
            <span>Add an optional topic, or leave it blank for a surprise question.</span>
          </div>
          <div className="question-ai-controls">
            <input
              value={aiTopic}
              maxLength={300}
              disabled={generating}
              placeholder="e.g. 90s football, family-friendly"
              onChange={(event) => setAiTopic(event.target.value)}
            />
            <button type="button" className="question-ai-button" disabled={generating} onClick={generate}>
              {generating ? <><Spinner label="Generating question" /> Generating...</> : <>
                <svg className="question-ai-icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2l1.35 4.65L18 8l-4.65 1.35L12 14l-1.35-4.65L6 8l4.65-1.35L12 2Z" />
                  <path d="M18.5 13l.8 2.7 2.7.8-2.7.8-.8 2.7-.8-2.7-2.7-.8 2.7-.8.8-2.7Z" />
                  <path d="M5 14l.65 2.35L8 17l-2.35.65L5 20l-.65-2.35L2 17l2.35-.65L5 14Z" />
                </svg>
                Generate with AI
              </>}
            </button>
          </div>
          <small>AI can make mistakes. Review the question and answer before saving.</small>
          {aiError && <span className="question-ai-error" role="alert">{aiError}</span>}
        </div>
      )}

      {['quizcraft', 'one-percent', 'million-ladder', 'bluff-battle', 'majority-rules', 'survey-showdown'].includes(gameType) && (
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

      {gameType === 'quizcraft' && (
        <>
          <Field label="Question type">
            <select
              value={form.questionType || 'multiple_choice'}
              onChange={(event) => {
                const questionType = event.target.value
                update({
                  questionType,
                  options: questionType === 'true_false' ? ['True', 'False'] : ['', '', '', ''],
                  answer: '',
                })
              }}
            >
              <option value="multiple_choice">Multiple choice</option>
              <option value="true_false">True or false</option>
            </select>
          </Field>
          {form.questionType === 'true_false' ? (
            <div className="quizcraft-boolean-builder" role="group" aria-label="Correct answer">
              {['True', 'False'].map((option) => (
                <button
                  type="button"
                  key={option}
                  className={form.answer === option ? 'active' : ''}
                  aria-pressed={form.answer === option}
                  onClick={() => update({ answer: option, options: ['True', 'False'] })}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <>
              <ArrayInputs label="Answers" values={form.options} min={2} max={6} onChange={(options) => update({ options })} />
              <Field label="Correct answer">
                <select value={form.answer || ''} onChange={(event) => update({ answer: event.target.value })}>
                  <option value="">Choose an answer</option>
                  {(form.options || []).filter(Boolean).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </Field>
            </>
          )}
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
      <DeleteConfirmationModal
        confirmation={confirmGeneration ? {
          title: 'Replace this question?',
          description: 'The AI-generated question will replace your current question fields.',
          detail: 'Your attached images will be kept.',
          confirmLabel: 'Generate question',
          busyLabel: 'Generating...',
          variant: 'primary',
        } : null}
        busy={generating}
        onCancel={() => setConfirmGeneration(false)}
        onConfirm={performGeneration}
      />
    </section>
  )
}
