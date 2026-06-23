import { additionalQuestions } from './additionalQuestions.js'
import { extraQuestions } from './extraQuestions.js'
import { moreQuestions } from './moreQuestions.js'

export const difficulties = [90, 80, 70, 60, 50, 40, 30, 20, 10, 1]

export const questionPool = [
  {
    id: 'reverse-word',
    difficulty: 90,
    type: 'choice',
    prompt: 'Which word does not become another English word when its letters are reversed?',
    options: ['STUN', 'DUST', 'SNUB'],
    answer: 'DUST',
    explanation: 'STUN becomes NUTS and SNUB becomes BUNS. DUST becomes TSUD.',
  },
  {
    id: 'football-holes',
    difficulty: 90,
    type: 'choice',
    prompt: 'If enclosed spaces inside letters count as goals, which team wins?',
    detail: 'ARSENAL vs LIVERPOOL',
    options: ['Arsenal', 'Liverpool'],
    answer: 'Liverpool',
    explanation: 'In uppercase, Liverpool has four enclosed spaces while Arsenal has three.',
  },
  {
    id: 'odd-cutlery',
    difficulty: 80,
    type: 'choice',
    prompt: 'Which option does not correctly fill any gap in these sentences?',
    detail: 'ATM ___ number  ·  Sheep ___  ·  Frying ___',
    options: ['PAN', 'PUN', 'PIN', 'PEN'],
    answer: 'PUN',
    explanation: 'PIN number, sheep pen and frying pan all work. PUN does not.',
  },
  {
    id: 'missing-vowels',
    difficulty: 80,
    type: 'input',
    prompt: 'Remove every vowel from “ONE PERCENT CLUB”. How many letters remain?',
    answer: ['9', 'nine'],
    explanation: 'N, P, R, C, N, T, C, L and B: nine consonants remain.',
  },
  {
    id: 'name-anagram',
    difficulty: 70,
    type: 'choice',
    prompt: 'Which option is an exact anagram of LIONEL MESSI?',
    options: ['LONE MISSILE', 'LION IN SLIME', 'NO SMILES LEE'],
    answer: 'LONE MISSILE',
    explanation: 'LONE MISSILE uses exactly the same letters.',
  },
  {
    id: 'right-left',
    difficulty: 70,
    type: 'input',
    prompt: 'John writes with his right hand. Keith writes with his left. What is the last word Keith would write in this sentence?',
    detail: '“The last word I write will be blue.”',
    answer: ['blue'],
    explanation: 'Handedness changes nothing; “blue” is still the last word.',
  },
  {
    id: 'time-of-day',
    difficulty: 60,
    type: 'choice',
    prompt: 'Who does not belong with the others?',
    options: ['Carl Noonan', 'Meg Nightingale', 'Becky Morningside', 'Dan Thomas'],
    answer: 'Dan Thomas',
    explanation: 'The other surnames contain NOON, NIGHT or MORNING.',
  },
  {
    id: 'football-word',
    difficulty: 60,
    type: 'input',
    prompt: 'What four-letter word completes all three sporting phrases?',
    detail: 'BICYCLE ____  ·  ____ OFF  ·  FREE ____',
    answer: ['kick'],
    explanation: 'Bicycle kick, kick-off and free kick.',
  },
  {
    id: 'even-sum',
    difficulty: 50,
    type: 'input',
    prompt: 'The first ten odd numbers add to 100. What do the first ten even numbers add to?',
    answer: ['110', 'one hundred and ten', 'one hundred ten'],
    explanation: 'Each even number is one more than the matching odd number, so add 10.',
  },
  {
    id: 'alphabet-vowels',
    difficulty: 50,
    type: 'input',
    prompt: 'If the alphabet had no vowels, what would be its 13th remaining letter?',
    answer: ['q'],
    explanation: 'B, C, D, F, G, H, J, K, L, M, N, P, Q.',
  },
  {
    id: 'letter-transform',
    difficulty: 40,
    type: 'choice',
    prompt: 'Change the first letter to the next letter of the alphabet and the last letter to the previous one. Which word becomes another word?',
    options: ['BRINK', 'CROWN', 'CREST'],
    answer: 'CREST',
    explanation: 'CREST becomes DRESS.',
  },
  {
    id: 'square-root-day',
    difficulty: 40,
    type: 'input',
    prompt: 'A “square-root day” has day × month equal to the last two digits of the year. In which month was 4/4/2016?',
    answer: ['april', '4'],
    explanation: '4 × 4 = 16, so it occurred in April.',
  },
  {
    id: 'three-letter-clues',
    difficulty: 30,
    type: 'input',
    prompt: 'The answers to these clues use the same three letters in different orders. What are the letters?',
    detail: 'POSSESS  ·  IMMEDIATELY  ·  VICTORIOUS',
    answer: ['own', 'o w n', 'o, w, n'],
    explanation: 'OWN, NOW and WON all use O, W and N.',
  },
  {
    id: 'common-vowel',
    difficulty: 30,
    type: 'input',
    prompt: 'Which single vowel can be added once to each item to make a new word?',
    detail: 'BY  ·  FUR  ·  LOG  ·  PEN',
    answer: ['o'],
    explanation: 'BOY, FOUR, LOGO and OPEN.',
  },
  {
    id: 'months-sequence',
    difficulty: 20,
    type: 'input',
    prompt: 'What number replaces the question mark?',
    detail: '7  8  5  5  3  4  4  ?  9  7  8  8',
    answer: ['6', 'six'],
    explanation: 'These are the letter counts of the months. August has six letters.',
  },
  {
    id: 'three-consecutive',
    difficulty: 20,
    type: 'input',
    prompt: 'Which three consecutive whole numbers add up to 3,000?',
    answer: ['999 1000 1001', '999, 1000, 1001'],
    explanation: '999 + 1000 + 1001 = 3000.',
  },
  {
    id: 'animals-string',
    difficulty: 10,
    type: 'input',
    prompt: 'Without rearranging letters, how many animal names can you find in this string?',
    detail: 'PHEASANTORTOISEALION',
    answer: ['6', 'six'],
    explanation: 'Pheasant, ant, tortoise, seal, sea lion and lion.',
  },
  {
    id: 'idiom',
    difficulty: 10,
    type: 'input',
    prompt: 'Translate this overcomplicated phrase into a familiar four-word saying:',
    detail: '“Illustrious intellects imagine identically.”',
    answer: ['great minds think alike'],
    explanation: 'Great minds think alike.',
  },
  {
    id: 'metals',
    difficulty: 1,
    type: 'input',
    prompt: 'BANDLEADER, NICKELODEON and SILVERBACK share a hidden pattern. Why could VOTING join them?',
    answer: ['metal', 'metals', 'contains a metal', 'they contain metals', 'tin'],
    explanation: 'Each word contains a metal: LEAD, NICKEL, SILVER and TIN.',
  },
  {
    id: 'tea-words',
    difficulty: 1,
    type: 'input',
    prompt: 'Which common word can go before all three to make new words?',
    detail: 'SING  ·  BAG  ·  RING',
    answer: ['tea'],
    explanation: 'Teasing, teabag and tearing.',
  },
  ...additionalQuestions,
  ...moreQuestions,
  ...extraQuestions,
]

export function selectQuestions(usedQuestionIds = new Set()) {
  return difficulties.map((difficulty) => {
    const unusedQuestions = questionPool.filter(
      (question) => question.difficulty === difficulty && !usedQuestionIds.has(question.id),
    )
    const candidates =
      unusedQuestions.length > 0
        ? unusedQuestions
        : questionPool.filter((question) => question.difficulty === difficulty)
    const selected = candidates[Math.floor(Math.random() * candidates.length)]

    usedQuestionIds.add(selected.id)
    return structuredClone(selected)
  })
}
