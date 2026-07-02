import { answer } from './shared.js'

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
