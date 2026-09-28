export const statusLabels = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived',
}

export const packStatusLabels = {
  draft: 'Draft',
  active: 'Published',
  archived: 'Archived',
}

const questionKindLabels = {
  fact_answer: 'Bluff answer',
  multiple_choice: 'Multiple choice',
  opinion_choice: 'Choice prompt',
  survey_answers: 'Survey answers',
  term_card: 'Term card',
  text_input: 'Typed answer',
  visual_puzzle: 'Visual puzzle',
}

export function isIncompleteDraft(question) {
  return question?.status === 'draft' && question?.payload?.completion?.isComplete === false
}

export function questionKindLabel(question) {
  if (question.questionKind === 'true_false') return 'True or false'
  return questionKindLabels[question?.questionKind] || question?.questionKind || 'Question'
}

export function questionTitle(question) {
  return question?.prompt || question?.answer || question?.payload?.terms?.join(', ') || 'Untitled question'
}
