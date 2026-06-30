export const customOnlyRequirements = {
  'one-percent': {
    minimumActiveQuestions: 10,
    note: 'Needs enough active questions to fill one full difficulty ladder.',
  },
  'majority-rules': {
    minimumActiveQuestions: 8,
    note: 'Needs enough active prompts for the default round count.',
  },
  'bluff-battle': {
    minimumActiveQuestions: 6,
    note: 'Needs enough active prompts for the default round count.',
  },
  'million-ladder': {
    minimumActiveQuestions: 15,
    note: 'Needs enough active questions to fill the ladder rungs.',
  },
  'survey-showdown': {
    minimumActiveQuestions: 6,
    note: 'Needs enough active survey prompts for one game.',
  },
  'quickfire-30': {
    minimumActiveQuestions: 64,
    note: 'Needs enough active term cards for the current board selection.',
  },
  'say-what-you-see': {
    minimumActiveQuestions: 10,
    note: 'Needs enough active puzzles for the default round count.',
  },
}

export const mixedContentRequirements = Object.fromEntries(
  Object.keys(customOnlyRequirements).map((gameType) => [
    gameType,
    {
      minimumActiveQuestions: 1,
      note: 'Can mix user-created questions into the official pool as soon as one active custom question exists.',
    },
  ])
)
