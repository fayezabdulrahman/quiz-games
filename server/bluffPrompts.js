export const bluffPromptPool = [
  {
    id: 'wombat-cubes',
    prompt: 'Wombats are famous for producing droppings shaped like what?',
    answer: 'Cubes',
    explanation: 'Different elasticity in the wombat intestine forms the droppings into cubes.',
  },
  {
    id: 'banana-berry',
    prompt: 'Botanically speaking, a banana is classified as what?',
    answer: 'A berry',
    explanation: 'Bananas develop from a single flower with one ovary, making them botanical berries.',
  },
  {
    id: 'scotland-animal',
    prompt: 'What is the national animal of Scotland?',
    answer: 'The unicorn',
    explanation: 'The unicorn has been a Scottish heraldic symbol for centuries.',
  },
  {
    id: 'octopus-hearts',
    prompt: 'How many hearts does an octopus have?',
    answer: 'Three',
    explanation: 'Two pump blood through the gills and one pumps it around the body.',
  },
  {
    id: 'flamingo-group',
    prompt: 'What wonderfully dramatic name is given to a group of flamingos?',
    answer: 'A flamboyance',
    explanation: 'A group of flamingos is commonly called a flamboyance.',
  },
  {
    id: 'sea-otter-sleep',
    prompt: 'What do sea otters sometimes do while sleeping so they do not drift apart?',
    answer: 'Hold hands',
    explanation: 'Sea otters may hold paws while resting together in floating groups called rafts.',
  },
  {
    id: 'inventor-pringle',
    prompt: 'Part of the ashes of the inventor of the Pringles can were buried in what?',
    answer: 'A Pringles can',
    explanation: 'Fredric Baur requested that some of his ashes be placed inside his famous invention.',
  },
  {
    id: 'cow-friends',
    prompt: 'Research suggests cows become less stressed when they are near what?',
    answer: 'Their best friend',
    explanation: 'Studies have observed lower stress indicators when preferred cow partners are together.',
  },
  {
    id: 'raven-group',
    prompt: 'What is one traditional collective noun for a group of ravens?',
    answer: 'An unkindness',
    explanation: 'An unkindness is one of the traditional names used for a group of ravens.',
  },
  {
    id: 'space-smell',
    prompt: 'Astronauts have compared the smell clinging to spacesuits after a spacewalk to what?',
    answer: 'Seared steak',
    explanation: 'Descriptions include seared steak, hot metal, and welding fumes.',
  },
  {
    id: 'goat-eyes',
    prompt: 'What unusual shape are the pupils in a goat’s eyes?',
    answer: 'Rectangular',
    explanation: 'Horizontal rectangular pupils give grazing animals a wide field of view.',
  },
  {
    id: 'butterfly-feet',
    prompt: 'Butterflies taste food using which part of their body?',
    answer: 'Their feet',
    explanation: 'Taste receptors on their feet help butterflies identify suitable plants.',
  },
  {
    id: 'shrimp-heart',
    prompt: 'A shrimp’s heart is located in which part of its body?',
    answer: 'Its head',
    explanation: 'The heart sits in the cephalothorax, the fused head-and-thorax region.',
  },
  {
    id: 'parrot-names',
    prompt: 'Wild parrots have been observed giving their chicks something resembling what?',
    answer: 'Names',
    explanation: 'Distinctive contact calls function rather like individual names within a flock.',
  },
  {
    id: 'hippo-sweat',
    prompt: 'What colour can the oily skin secretion of a hippopotamus appear?',
    answer: 'Red',
    explanation: 'Pigments in the secretion can make it look reddish and help protect the skin.',
  },
  {
    id: 'snail-sleep',
    prompt: 'In extreme conditions, some land snails can remain dormant for roughly how long?',
    answer: 'Three years',
    explanation: 'Some species can enter extended dormancy to survive prolonged dry conditions.',
  },
  {
    id: 'penguin-pebble',
    prompt: 'A male gentoo penguin may present a female with what during courtship?',
    answer: 'A pebble',
    explanation: 'Pebbles are valuable nesting material and may be offered during courtship.',
  },
  {
    id: 'crow-faces',
    prompt: 'Crows can remember and recognise individual human what?',
    answer: 'Faces',
    explanation: 'Experiments show that crows can remember people they associate with danger.',
  },
  {
    id: 'koala-fingerprints',
    prompt: 'The fingerprints of which animal can look remarkably similar to human fingerprints?',
    answer: 'Koalas',
    explanation: 'Koalas have detailed fingertip ridges that can closely resemble ours.',
  },
  {
    id: 'herring-communication',
    prompt: 'Herring have been observed communicating at night by releasing what?',
    answer: 'Bubbles from their backsides',
    explanation: 'Researchers recorded distinctive sounds produced as herring release gas bubbles.',
  },
]

export function selectBluffPrompts(count = 5, excludedIds = new Set()) {
  let available = bluffPromptPool.filter((prompt) => !excludedIds.has(prompt.id))

  if (available.length < count) {
    excludedIds.clear()
    available = [...bluffPromptPool]
  }

  const shuffled = [...available].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count)
  selected.forEach((prompt) => {
    excludedIds.add(prompt.id)
  })
  return selected
}
