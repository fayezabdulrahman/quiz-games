export const difficulties = [90, 80, 70, 60, 50, 40, 30, 20, 10, 1]

const answer = (text, points, ...accepted) => ({ text, points, accepted: [text, ...accepted] })

export const sampleOnePercentQuestions = difficulties.map((difficulty, index) => ({
  id: `sample-one-percent-${difficulty}`,
  difficulty,
  type: 'choice',
  prompt: `Sample ${difficulty}% question: which option matches the number ${index + 1}?`,
  options: [`Option ${index + 1}`, `Option ${index + 2}`, `Option ${index + 3}`],
  answer: `Option ${index + 1}`,
  explanation: 'This is public sample content for local fallback and smoke tests.',
}))

export const sampleMajorityPrompts = [
  {
    id: 'sample-majority-snack',
    prompt: 'Which snack would most people pick for a game night?',
    options: ['Pizza', 'Popcorn', 'Chocolate', 'Crisps'],
  },
  {
    id: 'sample-majority-weekend',
    prompt: 'What is the best way to spend a free Saturday?',
    options: ['Sleep in', 'Go outside', 'Watch films', 'See friends'],
  },
  {
    id: 'sample-majority-weather',
    prompt: 'Which weather suits a lazy day best?',
    options: ['Sunny', 'Rainy', 'Snowy', 'Windy'],
  },
  {
    id: 'sample-majority-seat',
    prompt: 'Which seat is best on a long journey?',
    options: ['Driver', 'Front passenger', 'Window seat', 'Aisle seat'],
  },
  {
    id: 'sample-majority-talent',
    prompt: 'Which party talent is most useful?',
    options: ['Cooking', 'Singing', 'Storytelling', 'Taking photos'],
  },
  {
    id: 'sample-majority-app',
    prompt: 'Which phone app would be hardest to lose?',
    options: ['Maps', 'Messages', 'Camera', 'Music'],
  },
  {
    id: 'sample-majority-breakfast',
    prompt: 'Which breakfast is the safest crowd-pleaser?',
    options: ['Toast', 'Cereal', 'Eggs', 'Pancakes'],
  },
  {
    id: 'sample-majority-holiday',
    prompt: 'Which holiday style would most people choose?',
    options: ['Beach', 'City', 'Road trip', 'Cabin'],
  },
]

export const sampleBluffPrompts = [
  {
    id: 'sample-bluff-capital',
    prompt: 'What is the capital city of Canada?',
    answer: 'Ottawa',
    explanation: 'Ottawa is the capital of Canada.',
  },
  {
    id: 'sample-bluff-planets',
    prompt: 'How many planets are in the Solar System?',
    answer: '8',
    inputMode: 'numeric',
    explanation: 'The Solar System has eight recognised planets.',
  },
  {
    id: 'sample-bluff-water',
    prompt: 'What chemical symbol represents water?',
    answer: 'H2O',
    explanation: 'Water is made from hydrogen and oxygen.',
  },
  {
    id: 'sample-bluff-moon',
    prompt: 'What natural satellite orbits Earth?',
    answer: 'The Moon',
    explanation: 'The Moon is Earth’s natural satellite.',
  },
  {
    id: 'sample-bluff-keyboard',
    prompt: 'How many letters are in the English alphabet?',
    answer: '26',
    inputMode: 'numeric',
    explanation: 'Modern English uses 26 letters.',
  },
  {
    id: 'sample-bluff-ocean',
    prompt: 'Which ocean is the largest on Earth?',
    answer: 'The Pacific Ocean',
    explanation: 'The Pacific is Earth’s largest ocean.',
  },
]

export const sampleMillionLadderQuestions = Array.from({ length: 15 }, (_, rung) => ({
  id: `sample-million-ladder-${rung + 1}`,
  rung,
  type: 'choice',
  prompt: `Sample ladder rung ${rung + 1}: which answer is correct?`,
  options: ['Answer A', 'Answer B', 'Answer C', 'Answer D'],
  answer: 'Answer A',
  explanation: 'This is public sample content for fallback play.',
}))

export const sampleSurveyShowdownPrompts = [
  {
    id: 'sample-survey-morning',
    prompt: 'Name something people do after waking up.',
    answers: [
      answer('Check their phone', 34, 'phone'),
      answer('Brush their teeth', 22, 'brush teeth'),
      answer('Make coffee', 18, 'coffee'),
      answer('Get dressed', 12, 'dress'),
      answer('Eat breakfast', 9, 'breakfast'),
      answer('Open curtains', 5, 'curtains'),
    ],
  },
  {
    id: 'sample-survey-beach',
    prompt: 'Name something people take to the beach.',
    answers: [
      answer('Towel', 30),
      answer('Sunscreen', 25, 'sun cream'),
      answer('Water', 16),
      answer('Book', 12),
      answer('Umbrella', 10),
      answer('Snacks', 7),
    ],
  },
  {
    id: 'sample-survey-kitchen',
    prompt: 'Name something found in most kitchens.',
    answers: [
      answer('Fridge', 28),
      answer('Oven', 22),
      answer('Kettle', 18),
      answer('Sink', 14),
      answer('Plates', 10),
      answer('Cutlery', 8),
    ],
  },
]

const quickfireTerms = [
  'Apple',
  'Beach',
  'Camera',
  'Dinosaur',
  'Elevator',
  'Football',
  'Guitar',
  'Hospital',
  'Island',
  'Jacket',
  'Kitchen',
  'Library',
  'Mountain',
  'Notebook',
  'Octopus',
  'Piano',
  'Question',
  'Rainbow',
  'Sandwich',
  'Telescope',
  'Umbrella',
  'Volcano',
  'Window',
  'Yoga',
  'Zoo',
  'Airport',
  'Bicycle',
  'Castle',
  'Diamond',
  'Engine',
  'Festival',
  'Garden',
  'Helmet',
  'Internet',
  'Jigsaw',
  'Keyboard',
  'Lighthouse',
  'Museum',
  'Necklace',
  'Orchestra',
  'Passport',
  'Rocket',
  'Stadium',
  'Theatre',
  'Uniform',
  'Village',
  'Waterfall',
  'Xylophone',
]

export const sampleQuickfire30Cards = Array.from({ length: 12 }, (_, index) => ({
  id: `sample-quickfire-${index + 1}`,
  terms: quickfireTerms.slice(index * 4, index * 4 + 4),
}))

export const sampleSayWhatYouSeePuzzles = [
  {
    id: 'sample-swys-over-the-moon',
    answer: 'Over the moon',
    acceptedOverride: ['Over the moon'],
    explanation: 'The word OVER appears above MOON.',
    layout: 'over-moon',
    tokens: ['OVER', 'MOON'],
  },
  {
    id: 'sample-swys-read-between-lines',
    answer: 'Read between the lines',
    acceptedOverride: ['Read between the lines'],
    explanation: 'READ is placed between two lines.',
    layout: 'between-lines',
    tokens: ['READ'],
  },
  {
    id: 'sample-swys-step-by-step',
    answer: 'Step by step',
    acceptedOverride: ['Step by step'],
    explanation: 'The word STEP climbs in repeated steps.',
    layout: 'step-by-step',
    tokens: ['STEP', 'STEP', 'STEP'],
  },
]

export const sampleQuestionPools = {
  'one-percent': sampleOnePercentQuestions,
  'majority-rules': sampleMajorityPrompts,
  'bluff-battle': sampleBluffPrompts,
  'million-ladder': sampleMillionLadderQuestions,
  'survey-showdown': sampleSurveyShowdownPrompts,
  'quickfire-30': sampleQuickfire30Cards,
  'say-what-you-see': sampleSayWhatYouSeePuzzles,
}
