import { bluffPromptPool } from '../../questions/bluffBattle/index.js'
import { majorityPromptPool } from '../../questions/commonAnswer/index.js'
import { millionLadderQuestions } from '../../questions/millionLadder/index.js'
import { questionPool } from '../../questions/onePercent/index.js'
import { quickfire30Pool } from '../../questions/quickfire30/index.js'
import { sayWhatYouSeePuzzles } from '../../questions/sayWhatYouSee/index.js'
import { surveyShowdownPool } from '../../questions/surveyShowdown/index.js'

export const localQuestionPools = {
  'one-percent': questionPool,
  'majority-rules': majorityPromptPool,
  'bluff-battle': bluffPromptPool,
  'million-ladder': millionLadderQuestions,
  'survey-showdown': surveyShowdownPool,
  'quickfire-30': quickfire30Pool,
  'say-what-you-see': sayWhatYouSeePuzzles,
}
