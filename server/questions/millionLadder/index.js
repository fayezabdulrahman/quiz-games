import { additionalMillionLadderQuestions } from './additionalQuestions.js'
import { extraMillionLadderQuestions } from './extraQuestions.js'

export const millionLadderQuestions = [
  { id: 'ml-01a', rung: 0, type: 'choice', prompt: 'Which of these is traditionally used to tell the time?', options: ['Compass', 'Thermometer', 'Clock', 'Telescope'], answer: 'Clock', explanation: 'A clock measures and displays time.' },
  { id: 'ml-01b', rung: 0, type: 'choice', prompt: 'Which animal is famous for saying “meow”?', options: ['Dog', 'Cat', 'Cow', 'Duck'], answer: 'Cat', explanation: 'A cat’s familiar vocal sound is a meow.' },
  { id: 'ml-01c', rung: 0, type: 'choice', prompt: 'Which meal is usually eaten first in the day?', options: ['Dinner', 'Supper', 'Breakfast', 'Dessert'], answer: 'Breakfast', explanation: 'Breakfast literally breaks the overnight fast.' },
  { id: 'ml-02a', rung: 1, type: 'choice', prompt: 'What colour do you get by mixing blue and yellow paint?', options: ['Purple', 'Green', 'Orange', 'Pink'], answer: 'Green', explanation: 'Blue and yellow pigments combine to make green.' },
  { id: 'ml-02b', rung: 1, type: 'choice', prompt: 'Which month comes immediately after June?', options: ['May', 'July', 'August', 'September'], answer: 'July', explanation: 'July is the seventh month, directly after June.' },
  { id: 'ml-02c', rung: 1, type: 'choice', prompt: 'Which shape has three sides?', options: ['Square', 'Circle', 'Triangle', 'Pentagon'], answer: 'Triangle', explanation: 'Every triangle has three sides.' },
  { id: 'ml-03a', rung: 2, type: 'choice', prompt: 'How many sides does a regular hexagon have?', options: ['Five', 'Six', 'Seven', 'Eight'], answer: 'Six', explanation: 'The prefix “hex-” means six.' },
  { id: 'ml-03b', rung: 2, type: 'choice', prompt: 'Which ocean lies between Europe and North America?', options: ['Pacific', 'Atlantic', 'Indian', 'Arctic'], answer: 'Atlantic', explanation: 'The Atlantic Ocean separates Europe from North America.' },
  { id: 'ml-03c', rung: 2, type: 'choice', prompt: 'Which of these is a mammal?', options: ['Shark', 'Dolphin', 'Trout', 'Octopus'], answer: 'Dolphin', explanation: 'Dolphins breathe air and nurse their young.' },
  { id: 'ml-04a', rung: 3, type: 'choice', prompt: 'Which planet is known for its prominent rings?', options: ['Mars', 'Venus', 'Saturn', 'Mercury'], answer: 'Saturn', explanation: 'Saturn’s rings are the most visible in our Solar System.' },
  { id: 'ml-04b', rung: 3, type: 'choice', prompt: 'Which city is the capital of Italy?', options: ['Milan', 'Rome', 'Naples', 'Venice'], answer: 'Rome', explanation: 'Rome has been Italy’s capital since 1871.' },
  { id: 'ml-04c', rung: 3, type: 'choice', prompt: 'Which sport uses the terms love, deuce and ace?', options: ['Cricket', 'Tennis', 'Golf', 'Rugby'], answer: 'Tennis', explanation: 'Love, deuce and ace are all standard tennis terms.' },
  { id: 'ml-05a', rung: 4, type: 'choice', prompt: 'Which instrument normally has 88 keys?', options: ['Piano', 'Violin', 'Trumpet', 'Flute'], answer: 'Piano', explanation: 'A standard modern piano has 88 keys.' },
  { id: 'ml-05b', rung: 4, type: 'choice', prompt: 'What is the largest organ of the human body?', options: ['Heart', 'Liver', 'Skin', 'Lungs'], answer: 'Skin', explanation: 'The skin is the body’s largest organ by area and weight.' },
  { id: 'ml-05c', rung: 4, type: 'choice', prompt: 'Which language is primarily spoken in Brazil?', options: ['Spanish', 'Portuguese', 'French', 'Italian'], answer: 'Portuguese', explanation: 'Brazil was colonised by Portugal and Portuguese is its official language.' },
  { id: 'ml-06a', rung: 5, type: 'choice', prompt: 'In computing, what does the “U” in URL stand for?', options: ['Universal', 'Uniform', 'Unified', 'User'], answer: 'Uniform', explanation: 'URL stands for Uniform Resource Locator.' },
  { id: 'ml-06b', rung: 5, type: 'choice', prompt: 'Which metal is liquid at ordinary room temperature?', options: ['Mercury', 'Copper', 'Aluminium', 'Silver'], answer: 'Mercury', explanation: 'Mercury remains liquid at typical room temperatures.' },
  { id: 'ml-06c', rung: 5, type: 'choice', prompt: 'Which novel begins with the character Scout Finch as narrator?', options: ['The Great Gatsby', 'To Kill a Mockingbird', 'Jane Eyre', 'Little Women'], answer: 'To Kill a Mockingbird', explanation: 'Scout Finch narrates Harper Lee’s To Kill a Mockingbird.' },
  { id: 'ml-07a', rung: 6, type: 'choice', prompt: 'Which country is home to the ancient city of Petra?', options: ['Jordan', 'Greece', 'Egypt', 'Turkey'], answer: 'Jordan', explanation: 'Petra was carved into sandstone cliffs in present-day Jordan.' },
  { id: 'ml-07b', rung: 6, type: 'choice', prompt: 'Which gas makes up most of Earth’s atmosphere?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], answer: 'Nitrogen', explanation: 'Nitrogen accounts for about 78 percent of Earth’s atmosphere.' },
  { id: 'ml-07c', rung: 6, type: 'choice', prompt: 'Who composed “The Four Seasons”?', options: ['Mozart', 'Vivaldi', 'Bach', 'Chopin'], answer: 'Vivaldi', explanation: 'Antonio Vivaldi composed The Four Seasons.' },
  { id: 'ml-08a', rung: 7, type: 'choice', prompt: 'Which blood type is commonly called the universal red-cell donor?', options: ['AB positive', 'O negative', 'A positive', 'B negative'], answer: 'O negative', explanation: 'O-negative red cells can be used when a recipient’s type is unknown.' },
  { id: 'ml-08b', rung: 7, type: 'choice', prompt: 'Which line of latitude passes through Ecuador?', options: ['Tropic of Cancer', 'Equator', 'Arctic Circle', 'Prime Meridian'], answer: 'Equator', explanation: 'Ecuador takes its name from the Equator, which crosses the country.' },
  { id: 'ml-08c', rung: 7, type: 'choice', prompt: 'What is the SI unit of electrical resistance?', options: ['Volt', 'Ohm', 'Watt', 'Ampere'], answer: 'Ohm', explanation: 'Electrical resistance is measured in ohms.' },
  { id: 'ml-09a', rung: 8, type: 'choice', prompt: 'Who wrote the novel “Frankenstein”?', options: ['Jane Austen', 'Mary Shelley', 'Emily Brontë', 'George Eliot'], answer: 'Mary Shelley', explanation: 'Mary Shelley published Frankenstein in 1818.' },
  { id: 'ml-09b', rung: 8, type: 'choice', prompt: 'Which empire built Machu Picchu?', options: ['Aztec', 'Roman', 'Inca', 'Maya'], answer: 'Inca', explanation: 'Machu Picchu was built by the Inca civilisation.' },
  { id: 'ml-09c', rung: 8, type: 'choice', prompt: 'Which scientist proposed the three laws of planetary motion?', options: ['Galileo', 'Kepler', 'Newton', 'Copernicus'], answer: 'Kepler', explanation: 'Johannes Kepler formulated the three laws of planetary motion.' },
  { id: 'ml-10a', rung: 9, type: 'choice', prompt: 'What is the smallest prime number greater than 50?', options: ['51', '53', '55', '57'], answer: '53', explanation: '53 is the first prime number after 50.' },
  { id: 'ml-10b', rung: 9, type: 'choice', prompt: 'Which country uses the forint as its currency?', options: ['Hungary', 'Croatia', 'Romania', 'Bulgaria'], answer: 'Hungary', explanation: 'The Hungarian currency is the forint.' },
  { id: 'ml-10c', rung: 9, type: 'choice', prompt: 'Which Shakespeare play features Rosencrantz and Guildenstern?', options: ['Macbeth', 'Hamlet', 'Othello', 'King Lear'], answer: 'Hamlet', explanation: 'Rosencrantz and Guildenstern are childhood friends of Hamlet.' },
  { id: 'ml-11a', rung: 10, type: 'choice', prompt: 'Which element has the chemical symbol W?', options: ['Tungsten', 'Tin', 'Titanium', 'Tantalum'], answer: 'Tungsten', explanation: 'W comes from tungsten’s older name, wolfram.' },
  { id: 'ml-11b', rung: 10, type: 'choice', prompt: 'Which artist painted “The Persistence of Memory”?', options: ['Picasso', 'Dalí', 'Monet', 'Matisse'], answer: 'Dalí', explanation: 'Salvador Dalí painted the famous melting clocks in 1931.' },
  { id: 'ml-11c', rung: 10, type: 'choice', prompt: 'In Greek mythology, who flew too close to the Sun?', options: ['Orpheus', 'Icarus', 'Perseus', 'Theseus'], answer: 'Icarus', explanation: 'Icarus ignored warnings and the wax in his wings melted.' },
  { id: 'ml-12a', rung: 11, type: 'choice', prompt: 'The Peace of Westphalia ended which major European conflict?', options: ['The Hundred Years’ War', 'The Thirty Years’ War', 'The War of the Roses', 'The Seven Years’ War'], answer: 'The Thirty Years’ War', explanation: 'The 1648 treaties ended the Thirty Years’ War.' },
  { id: 'ml-12b', rung: 11, type: 'choice', prompt: 'Which philosopher wrote “Critique of Pure Reason”?', options: ['Kant', 'Hume', 'Locke', 'Nietzsche'], answer: 'Kant', explanation: 'Immanuel Kant published Critique of Pure Reason in 1781.' },
  { id: 'ml-12c', rung: 11, type: 'choice', prompt: 'What name is given to a word that reads the same forwards and backwards?', options: ['Anagram', 'Palindrome', 'Homonym', 'Oxymoron'], answer: 'Palindrome', explanation: 'A palindrome reads identically in both directions.' },
  { id: 'ml-13a', rung: 12, type: 'choice', prompt: 'Which moon is the largest in our Solar System?', options: ['Titan', 'Ganymede', 'Europa', 'Triton'], answer: 'Ganymede', explanation: 'Jupiter’s Ganymede is larger than Mercury.' },
  { id: 'ml-13b', rung: 12, type: 'choice', prompt: 'Which treaty formally ended the First World War?', options: ['Treaty of Utrecht', 'Treaty of Versailles', 'Treaty of Paris', 'Treaty of Tordesillas'], answer: 'Treaty of Versailles', explanation: 'The Treaty of Versailles was signed in 1919.' },
  { id: 'ml-13c', rung: 12, type: 'choice', prompt: 'Which branch of mathematics studies properties preserved through continuous deformation?', options: ['Topology', 'Calculus', 'Statistics', 'Trigonometry'], answer: 'Topology', explanation: 'Topology studies properties unchanged by stretching or bending.' },
  { id: 'ml-14a', rung: 13, type: 'choice', prompt: 'Which artist painted “The Arnolfini Portrait”?', options: ['Jan van Eyck', 'Albrecht Dürer', 'Hans Holbein', 'Hieronymus Bosch'], answer: 'Jan van Eyck', explanation: 'The 1434 painting is one of Jan van Eyck’s best-known works.' },
  { id: 'ml-14b', rung: 13, type: 'choice', prompt: 'Which physicist coined the term “quark”?', options: ['Murray Gell-Mann', 'Richard Feynman', 'Paul Dirac', 'Enrico Fermi'], answer: 'Murray Gell-Mann', explanation: 'Murray Gell-Mann borrowed the spelling from James Joyce.' },
  { id: 'ml-14c', rung: 13, type: 'choice', prompt: 'Who wrote the epic poem “Paradise Lost”?', options: ['John Milton', 'Geoffrey Chaucer', 'William Blake', 'Alexander Pope'], answer: 'John Milton', explanation: 'John Milton published Paradise Lost in 1667.' },
  { id: 'ml-15a', rung: 14, type: 'choice', prompt: 'Which mathematical conjecture was proved by Andrew Wiles in the 1990s?', options: ['The Goldbach conjecture', 'The Poincaré conjecture', 'Fermat’s Last Theorem', 'The Riemann hypothesis'], answer: 'Fermat’s Last Theorem', explanation: 'Andrew Wiles completed a proof of Fermat’s Last Theorem.' },
  { id: 'ml-15b', rung: 14, type: 'choice', prompt: 'Which ancient scholar estimated Earth’s circumference using shadows in two cities?', options: ['Euclid', 'Eratosthenes', 'Archimedes', 'Ptolemy'], answer: 'Eratosthenes', explanation: 'Eratosthenes used shadow angles at Syene and Alexandria.' },
  { id: 'ml-15c', rung: 14, type: 'choice', prompt: 'The fictional county of Yoknapatawpha appears in works by which author?', options: ['William Faulkner', 'John Steinbeck', 'Ernest Hemingway', 'F. Scott Fitzgerald'], answer: 'William Faulkner', explanation: 'William Faulkner set many novels in fictional Yoknapatawpha County.' },
  ...additionalMillionLadderQuestions,
  ...extraMillionLadderQuestions,
]

function questionsForRung(rung) {
  return millionLadderQuestions.filter((question) => question.rung === rung)
}

function selectForRung(rung, usedQuestionIds, excludedId) {
  const rungQuestions = questionsForRung(rung)
  let available = rungQuestions.filter(
    (question) => question.id !== excludedId && !usedQuestionIds.has(question.id),
  )
  if (!available.length) {
    rungQuestions.forEach((question) => {
      usedQuestionIds.delete(question.id)
    })
    available = rungQuestions.filter((question) => question.id !== excludedId)
  }
  const selected = available[Math.floor(Math.random() * available.length)]
  usedQuestionIds.add(selected.id)
  return selected
}

export function selectMillionLadderQuestions(usedQuestionIds = new Set()) {
  return Array.from({ length: 15 }, (_, rung) => selectForRung(rung, usedQuestionIds))
}

export function selectMillionLadderReplacement(rung, usedQuestionIds, excludedId) {
  return selectForRung(rung, usedQuestionIds, excludedId)
}
