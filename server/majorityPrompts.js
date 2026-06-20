export const majorityPromptPool = [
  {
    id: 'christmas-leftover',
    prompt: 'Which Christmas leftover is best the next day?',
    options: ['Turkey sandwiches', 'Roast potatoes', 'Dessert', 'Cheese board'],
  },
  {
    id: 'superpower',
    prompt: 'Which superpower would most people actually choose?',
    options: ['Flying', 'Invisibility', 'Time travel', 'Reading minds'],
  },
  {
    id: 'holiday',
    prompt: 'What makes the best family holiday?',
    options: ['Beach resort', 'City break', 'Road trip', 'Cabin in the wild'],
  },
  {
    id: 'takeaway',
    prompt: 'The whole group must share one takeaway. What are you ordering?',
    options: ['Pizza', 'Chinese', 'Indian', 'Burgers'],
  },
  {
    id: 'house-job',
    prompt: 'Which household job would you happily never do again?',
    options: ['Washing dishes', 'Cleaning bathrooms', 'Laundry', 'Vacuuming'],
  },
  {
    id: 'late-excuse',
    prompt: 'Which excuse for being late sounds most believable?',
    options: ['Traffic', 'I overslept', 'Could not find my keys', 'The bus never came'],
  },
  {
    id: 'movie-snack',
    prompt: 'What is the essential cinema snack?',
    options: ['Popcorn', 'Chocolate', 'Sweets', 'Nachos'],
  },
  {
    id: 'animal-sidekick',
    prompt: 'Which animal would make the best adventure sidekick?',
    options: ['Dog', 'Horse', 'Parrot', 'Monkey'],
  },
  {
    id: 'weekend-morning',
    prompt: 'What is the ideal way to spend a free weekend morning?',
    options: ['Sleep late', 'Big breakfast', 'Go outdoors', 'Watch TV'],
  },
  {
    id: 'phone-feature',
    prompt: 'Which phone feature would be hardest to live without?',
    options: ['Camera', 'Maps', 'Messaging', 'Music'],
  },
  {
    id: 'party-role',
    prompt: 'Which person is most important at a great party?',
    options: ['The DJ', 'The cook', 'The storyteller', 'The organiser'],
  },
  {
    id: 'school-subject',
    prompt: 'Which school subject is most useful in everyday life?',
    options: ['Maths', 'English', 'Science', 'History'],
  },
  {
    id: 'weather',
    prompt: 'Which weather is best when you have no plans?',
    options: ['Hot and sunny', 'Cold and crisp', 'Heavy rain', 'Snow'],
  },
  {
    id: 'time-machine',
    prompt: 'If you had a time machine for one trip, where would you go?',
    options: ['The distant past', 'My own childhood', 'Ten years ahead', 'The far future'],
  },
  {
    id: 'board-game-skill',
    prompt: 'What matters most when playing a family game?',
    options: ['Knowledge', 'Strategy', 'Luck', 'Bluffing'],
  },
  {
    id: 'pet-talk',
    prompt: 'If one type of animal could talk, which should it be?',
    options: ['Dogs', 'Cats', 'Birds', 'Dolphins'],
  },
  {
    id: 'free-supply',
    prompt: 'Which would you rather receive free for the rest of your life?',
    options: ['Groceries', 'Flights', 'Restaurant meals', 'Concert tickets'],
  },
  {
    id: 'famous',
    prompt: 'What would be the best reason to become famous?',
    options: ['Sport', 'Music', 'Acting', 'Inventing something'],
  },
  {
    id: 'lost-item',
    prompt: 'Which item is most annoying to lose?',
    options: ['Phone', 'Keys', 'Wallet', 'TV remote'],
  },
  {
    id: 'meal',
    prompt: 'Which meal of the day deserves the most effort?',
    options: ['Breakfast', 'Lunch', 'Dinner', 'Late-night snack'],
  },
  {
    id: 'family-talent',
    prompt: 'Which talent would be most useful at a family gathering?',
    options: ['Cooking', 'Singing', 'Telling jokes', 'Taking photos'],
  },
  {
    id: 'island-item',
    prompt: 'Which luxury would you take to a desert island?',
    options: ['A comfortable bed', 'A hot shower', 'Unlimited books', 'A music player'],
  },
  {
    id: 'season',
    prompt: 'Which season has the best atmosphere?',
    options: ['Spring', 'Summer', 'Autumn', 'Winter'],
  },
  {
    id: 'game-night-food',
    prompt: 'What is the safest food to serve at game night?',
    options: ['Pizza', 'Tacos', 'Finger food', 'A big buffet'],
  },
]

export function selectMajorityPrompts(count = 8, excludedIds = new Set()) {
  let available = majorityPromptPool.filter((prompt) => !excludedIds.has(prompt.id))

  if (available.length < count) {
    excludedIds.clear()
    available = [...majorityPromptPool]
  }

  const shuffled = [...available].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count)
  selected.forEach((prompt) => {
    excludedIds.add(prompt.id)
  })
  return selected
}
