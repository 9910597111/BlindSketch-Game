const WORD_LISTS = {
  easy: [
    "CAT", "DOG", "SUN", "CAR", "BOOK", "TREE", "FISH", "BIRD", "BALL", "CAKE",
    "HOUSE", "APPLE", "CHAIR", "FLOWER", "SMILE", "HEART", "MOON", "STAR", "FIRE", "WATER",
    "BREAD", "PHONE", "CLOCK", "SHIRT", "SHOES", "CLOUD", "GRASS", "SNOW", "RAIN", "WIND"
  ],
  medium: [
    "GUITAR", "CASTLE", "ROCKET", "DRAGON", "WIZARD", "MIRROR", "BRIDGE", "TEMPLE", "FOREST", "ISLAND",
    "BUTTERFLY", "ELEPHANT", "RAINBOW", "THUNDER", "KITCHEN", "PICTURE", "BICYCLE", "PYRAMID", "TREASURE", "DIAMOND",
    "AIRPLANE", "COMPUTER", "SANDWICH", "MUSHROOM", "VOLCANO", "PENGUIN", "SUNFLOWER", "KEYBOARD", "TELESCOPE", "WATERFALL"
  ],
  hard: [
    "SAXOPHONE", "HELICOPTER", "LIGHTHOUSE", "DINOSAUR", "SKYSCRAPER", "MAGICIAN", "OCTOPUS", "JELLYFISH", "SPACESHIP", "CROCODILE",
    "BASKETBALL", "MICROSCOPE", "ACCORDION", "TRAMPOLINE", "REFRIGERATOR", "CONSTELLATION", "ARCHAEOLOGY", "PHOTOGRAPHY", "CHIMPANZEE", "THERMOMETER",
    "KALEIDOSCOPE", "XYLOPHONE", "OBSERVATORY", "METAMORPHOSIS", "CHRYSANTHEMUM", "ENCYCLOPEDIA", "PHARMACEUTICAL", "EXTRAORDINARY", "MASSACHUSETTS", "PARALLELOGRAM"
  ]
};

export function getRandomWords(count: number): string[] {
  const allWords = [...WORD_LISTS.easy, ...WORD_LISTS.medium, ...WORD_LISTS.hard];
  const shuffled = allWords.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function getWordsByDifficulty(difficulty: 'easy' | 'medium' | 'hard', count: number): string[] {
  const words = WORD_LISTS[difficulty];
  const shuffled = words.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function getDifficulty(word: string): 'easy' | 'medium' | 'hard' {
  if (WORD_LISTS.easy.includes(word.toUpperCase())) return 'easy';
  if (WORD_LISTS.medium.includes(word.toUpperCase())) return 'medium';
  return 'hard';
}

export function getRandomWord(): string {
  const allWords = [...WORD_LISTS.easy, ...WORD_LISTS.medium, ...WORD_LISTS.hard];
  return allWords[Math.floor(Math.random() * allWords.length)];
}
