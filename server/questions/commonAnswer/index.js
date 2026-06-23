import { selectPrompts } from '../selectPrompts.js'
import { extraMajorityPrompts } from './extraPrompts.js'

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
    options: ['Pizza', 'Chinese', 'Indian', 'Chipper'],
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
  {
    id: 'alarm-snooze',
    prompt: 'What is the first thing most people do when an early alarm rings?',
    options: ['Get straight up', 'Press snooze', 'Check the time', 'Check their phone'],
  },
  {
    id: 'road-trip-seat',
    prompt: 'Which seat is best on a long road trip?',
    options: ['Driver', 'Front passenger', 'Window seat in back', 'Middle seat in back'],
  },
  {
    id: 'rainy-day',
    prompt: 'What is the best thing to do on a rainy afternoon?',
    options: ['Watch a film', 'Read a book', 'Bake something', 'Go for a wet walk'],
  },
  {
    id: 'breakfast-food',
    prompt: 'Which breakfast food would be hardest to give up?',
    options: ['Toast', 'Cereal', 'Eggs', 'Pancakes'],
  },
  {
    id: 'queue-annoyance',
    prompt: 'What is the most annoying thing someone can do in a queue?',
    options: ['Cut in', 'Stand too close', 'Talk loudly', 'Hold everyone up'],
  },
  {
    id: 'unexpected-day-off',
    prompt: 'You get an unexpected day off. What do you do first?',
    options: ['Go back to bed', 'Make plans', 'Tackle house jobs', 'Watch something'],
  },
  {
    id: 'hotel-priority',
    prompt: 'What matters most when choosing a hotel?',
    options: ['Location', 'Price', 'Comfort', 'Breakfast'],
  },
  {
    id: 'music-decade',
    prompt: 'Which decade had the best popular music?',
    options: ['1970s', '1980s', '1990s', '2000s'],
  },
  {
    id: 'gift-card',
    prompt: 'Which gift card would be most useful?',
    options: ['Supermarket', 'Restaurant', 'Clothes shop', 'Online marketplace'],
  },
  {
    id: 'small-talk',
    prompt: 'Which topic is safest when making small talk?',
    options: ['Weather', 'Sport', 'TV', 'Holiday plans'],
  },
  {
    id: 'fridge-essential',
    prompt: 'Which item is the biggest disaster to run out of?',
    options: ['Milk', 'Butter', 'Cheese', 'Eggs'],
  },
  {
    id: 'birthday-cake',
    prompt: 'Which birthday cake flavour is the safest crowd-pleaser?',
    options: ['Chocolate', 'Vanilla', 'Lemon', 'Carrot cake'],
  },
  {
    id: 'zombie-tool',
    prompt: 'Which everyday item would be most useful in a zombie apocalypse?',
    options: ['Torch', 'Kitchen knife', 'Bicycle', 'First-aid kit'],
  },
  {
    id: 'work-perk',
    prompt: 'Which workplace perk would improve your week the most?',
    options: ['Four-day week', 'Free lunch', 'Work from home', 'Later starts'],
  },
  {
    id: 'childhood-game',
    prompt: 'Which type of childhood game was the most fun?',
    options: ['Hide-and-seek', 'Tag', 'Board games', 'Video games'],
  },
  {
    id: 'bad-habit',
    prompt: 'Which bad habit is hardest to break?',
    options: ['Procrastinating', 'Late-night snacking', 'Phone scrolling', 'Interrupting'],
  },
  {
    id: 'pizza-topping',
    prompt: 'Which pizza topping is the safest choice for a group?',
    options: ['Pepperoni', 'Ham', 'Mushrooms', 'Just cheese'],
  },
  {
    id: 'airport-time',
    prompt: 'How early should you arrive at the airport for a flight?',
    options: ['One hour', 'Two hours', 'Three hours', 'As late as possible'],
  },
  {
    id: 'best-smell',
    prompt: 'Which smell instantly improves your mood?',
    options: ['Fresh coffee', 'Baking bread', 'Cut grass', 'Clean laundry'],
  },
  {
    id: 'remote-control',
    prompt: 'Who should control the TV remote?',
    options: ['The host', 'The oldest person', 'The person who chose the show', 'Take turns'],
  },
  {
    id: 'holiday-packing',
    prompt: 'What is the item people are most likely to forget on holiday?',
    options: ['Toothbrush', 'Phone charger', 'Sunscreen', 'Something to sleep in'],
  },
  {
    id: 'restaurant-choice',
    prompt: 'When trying a new restaurant, what matters most?',
    options: ['The menu', 'Reviews', 'Price', 'Atmosphere'],
  },
  {
    id: 'celebrity-skill',
    prompt: 'Which celebrity skill would be best to have?',
    options: ['Sing brilliantly', 'Act convincingly', 'Play elite sport', 'Make people laugh'],
  },
  {
    id: 'neighbour-favour',
    prompt: 'Which favour would you most happily do for a neighbour?',
    options: ['Take in a parcel', 'Water plants', 'Feed a pet', 'Give them a lift'],
  },
  {
    id: 'kitchen-appliance',
    prompt: 'Which kitchen appliance is most useful?',
    options: ['Microwave', 'Air fryer', 'Toaster', 'Coffee machine'],
  },
  {
    id: 'winning-prize',
    prompt: 'Which prize would you most like to win?',
    options: ['Cash', 'A new car', 'A luxury holiday', 'A dream home makeover'],
  },
  {
    id: 'public-transport',
    prompt: 'What is the worst part of public transport?',
    options: ['Delays', 'Crowds', 'Noise', 'No seat'],
  },
  {
    id: 'photo-type',
    prompt: 'Which photo is most worth keeping?',
    options: ['Family group', 'Holiday view', 'Funny candid', 'Pet photo'],
  },
  {
    id: 'ideal-nap',
    prompt: 'How long is the ideal nap?',
    options: ['Ten minutes', 'Twenty minutes', 'One hour', 'As long as possible'],
  },
  {
    id: 'game-cheating',
    prompt: 'What is the worst offence during a family game?',
    options: ['Cheating', 'Changing the rules', 'Taking too long', 'Being a bad loser'],
  },
  {
    id: 'text-reply',
    prompt: 'How quickly should a friend reply to a normal text?',
    options: ['Immediately', 'Within an hour', 'The same day', 'Whenever they can'],
  },
  {
    id: 'weeknight-dinner',
    prompt: 'What makes the best easy weeknight dinner?',
    options: ['Pasta', 'Stir-fry', 'Something from the freezer', 'Takeaway'],
  },
  {
    id: 'home-room',
    prompt: 'Which room matters most in a home?',
    options: ['Kitchen', 'Living room', 'Bedroom', 'Bathroom'],
  },
  {
    id: 'phone-call',
    prompt: 'Who is most likely to keep you on the phone too long?',
    options: ['A parent', 'A sibling', 'A close friend', 'Customer service'],
  },
  {
    id: 'summer-treat',
    prompt: 'What is the best treat on a hot day?',
    options: ['Ice cream', 'Cold drink', 'Fresh fruit', 'Barbecue food'],
  },
  {
    id: 'winter-comfort',
    prompt: 'What is the best thing about a cold winter evening?',
    options: ['A warm fire', 'A hot drink', 'A cosy blanket', 'Comfort food'],
  },
  {
    id: 'learning-skill',
    prompt: 'Which new skill would be most rewarding to learn?',
    options: ['A language', 'An instrument', 'Cooking', 'DIY'],
  },
  {
    id: 'friend-quality',
    prompt: 'Which quality matters most in a good friend?',
    options: ['Loyalty', 'Honesty', 'Humour', 'Kindness'],
  },
  {
    id: 'day-trip',
    prompt: 'Which makes the best spontaneous day trip?',
    options: ['The beach', 'A city', 'The countryside', 'A theme park'],
  },
  {
    id: 'internet-loss',
    prompt: 'What would you miss most if the internet disappeared for a day?',
    options: ['Messaging', 'Streaming', 'Social media', 'Looking things up'],
  },
  ...extraMajorityPrompts,
]

export function selectMajorityPrompts(count = 8, excludedIds = new Set()) {
  return selectPrompts(majorityPromptPool, count, excludedIds)
}
