import { selectPrompts } from '../selectPrompts.js'
import { familyNightQuickfire30Cards } from './familyNightCards.js'

const irishPeople = [
  'Saoirse Ronan', 'Paul Mescal', 'Cillian Murphy', 'Katie Taylor', 'Roy Keane',
  'Bono', 'Graham Norton', 'Conor McGregor', 'Niall Horan', 'Hozier',
  'Brendan Gleeson', 'Domhnall Gleeson', 'Colin Farrell', 'Pierce Brosnan', 'Aisling Bea',
  'Chris O’Dowd', 'Dara Ó Briain', 'Tommy Tiernan', 'Joanne McNally', 'Blindboy Boatclub',
  'Mary Robinson', 'Michael D. Higgins', 'Micheál Martin', 'Leo Varadkar', 'Mary McAleese',
  'Brian O’Driscoll', 'Johnny Sexton', 'Paul O’Connell', 'Rhasidat Adeleke', 'Sonia O’Sullivan',
  'Robbie Keane', 'Seamus Coleman', 'Evan Ferguson', 'Henry Shefflin', 'Joe Canning',
  'Daniel O’Donnell', 'Enya', 'Sinéad O’Connor', 'Dolores O’Riordan', 'Dermot Kennedy',
  'The Edge', 'Bob Geldof', 'Nadine Coyle', 'Rory McIlroy', 'Katie McCabe',
  'Andrew Scott', 'Brenda Fricker', 'Sally Rooney', 'Seamus Heaney', 'Bram Stoker',
]

const irishPlaces = [
  'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford',
  'Kilkenny', 'Derry', 'Belfast', 'Sligo', 'Donegal',
  'Killarney', 'Westport', 'Wexford', 'Athlone', 'Drogheda',
  'The Cliffs of Moher', 'The Giant’s Causeway', 'The Ring of Kerry', 'The Burren', 'Croagh Patrick',
  'Croke Park', 'The Aviva Stadium', 'The Guinness Storehouse', 'Temple Bar', 'Grafton Street',
  'The River Liffey', 'Phoenix Park', 'Trinity College Dublin', 'Blarney Castle', 'Newgrange',
  'The Aran Islands', 'The Skellig Islands', 'Glendalough', 'Connemara', 'The Wild Atlantic Way',
  'The Rock of Cashel', 'Páirc Uí Chaoimh', 'Hill 16', 'Copper Face Jacks', 'Tayto Park',
  'Malahide Castle', 'Dublin Zoo', 'The National Gallery', 'Howth', 'Dalkey',
  'Dingle', 'Achill Island', 'Slane Castle', 'The Phoenix Monument', 'The Spire',
]

const irishSport = [
  'The Six Nations', 'The All-Ireland Final', 'The Sam Maguire Cup', 'The Liam MacCarthy Cup', 'The Triple Crown',
  'Gaelic football', 'Hurling', 'Camogie', 'Rounders', 'Handball',
  'The Irish rugby team', 'The Republic of Ireland team', 'The British and Irish Lions', 'Leinster Rugby', 'Munster Rugby',
  'Connacht Rugby', 'Ulster Rugby', 'Shamrock Rovers', 'Bohemians', 'Celtic',
  'Manchester United', 'Liverpool', 'The Masters', 'The Ryder Cup', 'Cheltenham Festival',
  'The Grand National', 'Punchestown', 'The Curragh', 'The Galway Races', 'The Dublin Marathon',
  'Italia 90', 'Lansdowne Road', 'A penalty shootout', 'A red card', 'A hat-trick',
  'A sliotar', 'A hurley', 'A scrum', 'A bicycle kick', 'A photo finish',
  'A lineout', 'A free kick', 'A sideline cut', 'A yellow card', 'The Heineken Champions Cup',
  'The League of Ireland', 'The Irish Open', 'A penalty save', 'A drop goal', 'A county final',
]

const irishCulture = [
  'Father Ted', 'The Late Late Show', 'The Toy Show', 'Derry Girls', 'Normal People',
  'The Commitments', 'The Snapper', 'The Banshees of Inisherin', 'Riverdance', 'Once',
  'Fair City', 'Love/Hate', 'Room to Improve', 'Reeling in the Years', 'Nationwide',
  'RTÉ', 'TG4', 'The Irish Times', 'The Rose of Tralee', 'The Eurovision Song Contest',
  'The Leaving Cert', 'The Gaeltacht', 'The GAA', 'The Angelus', 'An Post',
  'A céilí', 'A trad session', 'An Irish wake', 'A county jersey', 'A Sunday roast',
  'The Book of Kells', 'Bloomsday', 'Saint Patrick’s Day', 'Halloween', 'The Late Late Toy Show jumper',
  'Ulysses', 'Dracula', 'Gulliver’s Travels', 'The Fields of Athenry', 'Molly Malone',
  'The Abbey Theatre', 'The Olympia Theatre', 'The Plough and the Stars', 'The Quiet Man', 'Kneecap',
  'An Irish goodbye', 'A school debs', 'A pub quiz', 'A tin whistle', 'A GAA club draw',
]

const irishEveryday = [
  'Guinness', 'Tayto', 'Supermac’s', 'Barry’s Tea', 'Lyons Tea',
  'Kerrygold', 'Club Orange', 'Cavan Cola', 'Ballygowan', 'Jameson',
  'Baileys', 'Cadbury Dairy Milk', 'Chicken fillet roll', 'Spice bag', 'Breakfast roll',
  'Soda bread', 'Boxty', 'Colcannon', 'Coddle', 'Barmbrack',
  'A full Irish breakfast', 'Taco fries', 'Brown sauce', 'A 99 ice cream', 'A jambon',
  'The immersion', 'A wooden spoon', 'A hot press', 'A hurley bag', 'A turf fire',
  'The Luas', 'Dublin Bus', 'Iarnród Éireann', 'Ryanair', 'Aer Lingus',
  'Dunnes Stores', 'Penney’s', 'SuperValu', 'Centra', 'Smyths Toys',
  'A deli counter', 'A breakfast spice bag', 'A leap card', 'A rain jacket', 'A packet of biscuits',
  'A toasted special', 'MiWadi', 'A school jumper', 'A county flag', 'A Sunday paper',
]

const worldPeople = [
  'Gordon Ramsay', 'Katy Perry', 'Taylor Swift', 'Beyoncé', 'Ed Sheeran',
  'Adele', 'Rihanna', 'Lady Gaga', 'Elton John', 'Harry Styles',
  'Tom Cruise', 'Dwayne Johnson', 'Leonardo DiCaprio', 'Jennifer Aniston', 'Meryl Streep',
  'Morgan Freeman', 'Will Smith', 'Margot Robbie', 'Ryan Reynolds', 'Zendaya',
  'Lionel Messi', 'Cristiano Ronaldo', 'Serena Williams', 'Tiger Woods', 'Usain Bolt',
  'Michael Jordan', 'David Beckham', 'Roger Federer', 'Lewis Hamilton', 'Simone Biles',
  'Albert Einstein', 'William Shakespeare', 'Marie Curie', 'Nelson Mandela', 'Walt Disney',
  'Steve Jobs', 'Oprah Winfrey', 'David Attenborough', 'Bear Grylls', 'Jamie Oliver',
  'Billie Eilish', 'Dua Lipa', 'Ariana Grande', 'Keanu Reeves', 'Emma Watson',
  'Stephen King', 'Greta Thunberg', 'Barack Obama', 'Michelle Obama', 'MrBeast',
]

const worldPlacesAndThings = [
  'New York City', 'London', 'Paris', 'Rome', 'Tokyo',
  'Sydney', 'Las Vegas', 'Hollywood', 'Mount Everest', 'The Grand Canyon',
  'The Eiffel Tower', 'The Statue of Liberty', 'The Great Wall of China', 'The Colosseum', 'The North Pole',
  'Disneyland', 'The White House', 'Buckingham Palace', 'The Moon', 'The Sahara Desert',
  'Google', 'Apple', 'Netflix', 'Spotify', 'Amazon',
  'McDonald’s', 'Coca-Cola', 'Lego', 'Nike', 'Adidas',
  'Hertz', 'IKEA', 'YouTube', 'WhatsApp', 'Instagram',
  'A Rubik’s Cube', 'A selfie stick', 'A karaoke machine', 'A vending machine', 'A lie detector',
  'The Louvre', 'The Taj Mahal', 'The Sydney Opera House', 'The Amazon rainforest', 'The Panama Canal',
  'Nintendo', 'TikTok', 'Tesla', 'Starbucks', 'A drone',
]

const screenAndStories = [
  'Harry Potter', 'Star Wars', 'The Lord of the Rings', 'The Lion King', 'Toy Story',
  'Frozen', 'Shrek', 'Finding Nemo', 'Jurassic Park', 'Titanic',
  'Home Alone', 'The Matrix', 'Jaws', 'Rocky', 'The Terminator',
  'Friends', 'The Simpsons', 'Stranger Things', 'Game of Thrones', 'Breaking Bad',
  'The Office', 'Peaky Blinders', 'The Crown', 'Black Mirror', 'The Great British Bake Off',
  'Sherlock Holmes', 'James Bond', 'Batman', 'Spider-Man', 'Superman',
  'Cinderella', 'Peter Pan', 'Robin Hood', 'Winnie-the-Pooh', 'Paddington Bear',
  'The Gruffalo', 'Charlie and the Chocolate Factory', 'The Hunger Games', 'The Da Vinci Code', 'The Catcher in the Rye',
  'Matilda', 'Wonka', 'The Avengers', 'Doctor Who', 'Wednesday',
  'The Traitors', 'Squid Game', 'Wicked', 'Hamilton', 'The Wizard of Oz',
]

const banks = [
  irishPeople,
  irishPlaces,
  irishSport,
  irishCulture,
  irishEveryday,
  worldPeople,
  worldPlacesAndThings,
  screenAndStories,
]

export const quickfire30Pool = [
  ...Array.from({ length: 80 }, (_, cardIndex) => ({
    id: `qf30-${String(cardIndex + 1).padStart(3, '0')}`,
    terms: Array.from({ length: 5 }, (_, termIndex) => {
      const absoluteIndex = cardIndex * 5 + termIndex
      const bank = banks[absoluteIndex % banks.length]
      return bank[Math.floor(absoluteIndex / banks.length)]
    }),
  })),
  ...familyNightQuickfire30Cards,
]

export function selectQuickfire30Cards(count = quickfire30Pool.length, usedQuestionIds) {
  return selectPrompts(quickfire30Pool, count, usedQuestionIds)
}
