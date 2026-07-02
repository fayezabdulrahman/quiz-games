import { sampleOnePercentQuestions } from './sample/onePercent.js'
import { sampleMajorityPrompts } from './sample/majorityRules.js'
import { sampleBluffPrompts } from './sample/bluffBattle.js'
import { sampleMillionLadderQuestions } from './sample/millionLadder.js'
import { sampleSurveyShowdownPrompts } from './sample/surveyShowdown.js'
import { sampleQuickfire30Cards } from './sample/quickfire30.js'
import { sampleSayWhatYouSeePuzzles } from './sample/sayWhatYouSee.js'

export { difficulties, sampleOnePercentQuestions } from './sample/onePercent.js'
export { sampleMajorityPrompts } from './sample/majorityRules.js'
export { sampleBluffPrompts } from './sample/bluffBattle.js'
export { sampleMillionLadderQuestions } from './sample/millionLadder.js'
export { sampleSurveyShowdownPrompts } from './sample/surveyShowdown.js'
export { sampleQuickfire30Cards } from './sample/quickfire30.js'
export { sampleSayWhatYouSeePuzzles } from './sample/sayWhatYouSee.js'



export const sampleQuestionPools = {
  'one-percent': sampleOnePercentQuestions,
  'majority-rules': sampleMajorityPrompts,
  'bluff-battle': sampleBluffPrompts,
  'million-ladder': sampleMillionLadderQuestions,
  'survey-showdown': sampleSurveyShowdownPrompts,
  'quickfire-30': sampleQuickfire30Cards,
  'say-what-you-see': sampleSayWhatYouSeePuzzles,
}
