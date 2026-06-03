import Fuse from 'fuse.js';
import { CATEGORIES } from '../data/categories';
import { buildCatalogKeywordEntries } from '../data/expenseKeywordCatalog';
import { isSpendingExpense } from '../data/focusCategory';
import type { Expense } from '../data/types';

const CATEGORY_IDS = new Set(CATEGORIES.map(c => c.id));

/** Normalized tokens → accumulated score per category (from past expenses). */
export type ExpenseNameCategoryIndex = {
  byExactName: Map<string, string>;
  byToken: Map<string, Map<string, number>>;
  /** Longest names first for substring checks */
  nameEntries: { name: string; categoryId: string }[];
};

const MIN_NAME_LEN = 2;
const MIN_SCORE = 14;
const SCORE_MARGIN = 1.2;
/** Fuse.js: 0 = exact, 1 = match anything */
const FUSE_THRESHOLD = 0.3;

const SCORE = {
  exactHistory: 100,
  historySubstring: 45,
  historyToken: 18,
  keyword: (len: number) => 12 + Math.min(len, 24),
  prefix: (typedLen: number) => 14 + Math.min(typedLen, 12),
  fuzzy: (quality: number, keywordLen: number) =>
    Math.round(12 + quality * 20 + Math.min(keywordLen, 16) * 0.4),
  categoryName: 10,
  customName: 12,
} as const;

/**
 * Static keyword → category map (US + EU brands, subscriptions, merchants).
 * Longer phrases are matched first via sorted rules.
 */
const CATEGORY_KEYWORDS: Record<string, readonly string[]> = {
  rent: [
    'rent',
    'rental',
    'lease',
    'leasing',
    'landlord',
    'tenant',
    'mortgage',
    'housing',
    'apartment',
    'flat rent',
    'condo fee',
    'hoa',
    'homeowners association',
    'property tax',
    'strata',
    'roommate',
    'accommodation',
    'airbnb host',
    'zillow',
    'immobilien',
    'miete',
    'wohnung',
    'hypothek',
    'real estate',
    'letting',
    'deposit return',
  ],
  groceries: [
    'grocery',
    'groceries',
    'supermarket',
    'hypermarket',
    'food market',
    'farmers market',
    'produce',
    'butcher',
    'bakery',
    'deli',
    'organic market',
    'whole foods',
    'trader joe',
    'trader joes',
    'costco',
    'walmart grocery',
    'target grocery',
    'kroger',
    'safeway',
    'publix',
    'aldi',
    'lidl',
    'rewe',
    'edeka',
    'penny',
    'netto',
    'kaufland',
    'tesco',
    'sainsbury',
    'sainsburys',
    'asda',
    'morrisons',
    'waitrose',
    'carrefour',
    'auchan',
    'leclerc',
    'intermarche',
    'mercadona',
    'eroski',
    'coop',
    'migros',
    'denner',
    'spar',
    'billa',
    'hofer',
    'food lion',
    'heb',
    'meijer',
    'wegmans',
    'sprouts',
    'instacart grocery',
    'gopuff',
    'ocado',
    'picard',
    'biocoop',
    'monoprix',
    'franprix',
    'esselunga',
    'conad',
    'woolworths',
    'coles',
    'woolies',
    'iga',
    'food basics',
    'no frills',
    'superstore',
    'marks and spencer food',
    'm&s food',
    'fruit',
    'fruits',
    'banana',
    'bananas',
    'apple',
    'apples',
    'orange',
    'oranges',
    'lemon',
    'lemons',
    'lime',
    'limes',
    'grape',
    'grapes',
    'berry',
    'berries',
    'strawberry',
    'strawberries',
    'blueberry',
    'blueberries',
    'raspberry',
    'raspberries',
    'blackberry',
    'blackberries',
    'cherry',
    'cherries',
    'peach',
    'peaches',
    'pear',
    'pears',
    'plum',
    'plums',
    'mango',
    'mangoes',
    'mangos',
    'pineapple',
    'pineapples',
    'watermelon',
    'melon',
    'melons',
    'avocado',
    'avocados',
    'kiwi',
    'kiwis',
    'coconut',
    'coconuts',
    'papaya',
    'fig',
    'figs',
    'date fruit',
    'dates',
    'pomegranate',
    'grapefruit',
    'tangerine',
    'clementine',
    'mandarin',
    'vegetable',
    'vegetables',
    'tomato',
    'tomatoes',
    'potato',
    'potatoes',
    'onion',
    'onions',
    'garlic',
    'carrot',
    'carrots',
    'broccoli',
    'spinach',
    'lettuce',
    'cabbage',
    'cucumber',
    'cucumbers',
    'pepper',
    'peppers',
    'zucchini',
    'courgette',
    'mushroom',
    'mushrooms',
    'celery',
    'asparagus',
    'cauliflower',
    'kale',
    'chard',
    'beet',
    'beets',
    'turnip',
    'radish',
    'leek',
    'leeks',
    'corn',
    'sweetcorn',
    'green bean',
    'green beans',
    'pea',
    'peas',
    'veggies',
    'veggie',
    'meat',
    'meats',
    'seafood',
    'fish market',
    'dairy',
    'milk',
    'eggs',
    'bread',
    'pasta',
    'rice',
    'cereal',
    'snack',
    'snacks',
    'beverage',
    'beverages',
    'drinks',
    'soda',
    'juice',
    'frozen food',
    'pantry',
    'staples',
    'organic food',
    'health food store',
    'instacart',
    'shipt',
    'fresh direct',
    'hello fresh groceries',
    'meal kit groceries',
    'food hall',
    'greengrocer',
    'fishmonger',
    'wine shop groceries',
    'liquor store food',
    'corner shop',
    'bodega',
    'minimart',
    'mini mart',
    '7 eleven food',
    'circle k snacks',
  ],
  dining: [
    'restaurant',
    'restaurants',
    'dining',
    'dine in',
    'dine-out',
    'cafe',
    'café',
    'coffee',
    'espresso',
    'latte',
    'starbucks',
    'dunkin',
    'tim hortons',
    'pret a manger',
    'pret',
    'costa coffee',
    'nero',
    'peets',
    'blue bottle',
    'mcdonald',
    'mcdonalds',
    'burger king',
    'wendys',
    'wendy',
    'five guys',
    'in-n-out',
    'chipotle',
    'subway',
    'kfc',
    'pizza',
    'pizzeria',
    'dominos',
    'domino',
    'papa john',
    'sushi',
    'ramen',
    'thai food',
    'indian restaurant',
    'chinese restaurant',
    'taco',
    'burrito',
    'brunch',
    'lunch out',
    'dinner out',
    'takeaway',
    'takeout',
    'take out',
    'delivery food',
    'food delivery',
    'doordash',
    'door dash',
    'ubereats',
    'uber eats',
    'deliveroo',
    'grubhub',
    'just eat',
    'wolt',
    'glovo',
    'seamless',
    'postmates',
    'bar',
    'pub',
    'brewery',
    'winery',
    'bistro',
    'brasserie',
    'trattoria',
    'steakhouse',
    'nando',
    'greggs',
    'wagamama',
    'itsu',
    'leon',
    'shake shack',
    'panera',
    'olive garden',
    'cheesecake factory',
    'dunkin donuts',
    'krispy kreme',
    'ice cream',
    'gelato',
    'food truck',
    'canteen',
    'cantina',
    'mess hall',
    'hotel restaurant',
    'room service',
    'catering',
    'banquet',
  ],
  transport: [
    'uber',
    'lyft',
    'taxi',
    'cab',
    'rideshare',
    'ride share',
    'bolt taxi',
    'free now',
    'freenow',
    'grab',
    'didi',
    'ola',
    'fuel',
    'gas station',
    'petrol',
    'diesel',
    'shell',
    'bp ',
    'exxon',
    'chevron',
    'mobil',
    'total energies',
    'esso',
    'aral',
    'orlen',
    'circle k fuel',
    'parking',
    'car park',
    'garage parking',
    'toll',
    'tolls',
    'highway',
    'autobahn',
    'transit',
    'metro',
    'subway fare',
    'bus fare',
    'tram',
    'train ticket',
    'rail',
    'railway',
    'amtrak',
    'eurostar',
    'sncf',
    'deutsche bahn',
    'bahn',
    'flixbus',
    'flix bus',
    'national express',
    'coach',
    'ferry',
    'flight',
    'airline',
    'airlines',
    'ryanair',
    'easyjet',
    'lufthansa',
    'british airways',
    'delta air',
    'united air',
    'southwest',
    'airport',
    'boarding pass',
    'car rental',
    'rental car',
    'hertz',
    'avis',
    'enterprise rent',
    'sixt',
    'zipcar',
    'turo',
    'lime scooter',
    'bird scooter',
    'bike share',
    'bikeshare',
    'scooter rental',
    'car wash',
    'auto repair',
    'mechanic',
    'garage repair',
    'tire',
    'tyre',
    'oil change',
    'mot test',
    'vehicle',
    'automotive',
    'dmv',
    'registration fee',
    'inspection',
    'ev charging',
    'chargepoint',
    'tesla supercharger',
    'ionity',
    'cabify',
    'blablacar',
    'commute',
    'commuting',
    'mileage',
    'gas fill',
    'fill up',
    'transit pass',
    'oyster card',
    'clipper card',
    'metrocard',
    'opal card',
    'myki',
    'ventra',
    'presto',
    'parking meter',
    'speeding ticket',
    'traffic fine',
    'auto insurance',
    'car insurance',
    'geico',
    'progressive',
    'state farm',
    'allstate',
    'car payment',
    'auto loan',
    'motorcycle',
    'moped',
    'scooter ride',
    'vespa',
    'minicab',
    'black cab',
    'gett',
    'via transportation',
    'waymo',
    'cruise ride',
    'parkmobile',
    'justpark',
    'spothero',
    'parkwhiz',
    'roadside',
    'tow truck',
    'towing',
    'windshield',
    'wiper',
    'brake pad',
    'battery replacement',
    'jiffy lube',
    'midas',
    'peugeot service',
    'bmw service',
    'mercedes service',
    'oil filter',
    'car parts',
    'autozone',
    'halfords',
    'europcar',
    'budget rent a car',
    'national car rental',
    'bolt ride',
    'yandex taxi',
    'careem',
    'gojek',
  ],
  subscriptions: [
    'subscription',
    'subscriptions',
    'subscribe',
    'recurring',
    'membership fee',
    'monthly plan',
    'annual plan',
    'netflix',
    'spotify',
    'apple music',
    'youtube premium',
    'youtube music',
    'disney+',
    'disney plus',
    'hulu',
    'hbo',
    'max.com',
    'prime video',
    'amazon prime',
    'audible',
    'kindle unlimited',
    'icloud',
    'google one',
    'google storage',
    'dropbox',
    'notion',
    'slack',
    'github',
    'chatgpt',
    'openai',
    'claude.ai',
    'anthropic',
    'midjourney',
    'adobe',
    'creative cloud',
    'microsoft 365',
    'office 365',
    'xbox game pass',
    'playstation plus',
    'nintendo online',
    'vpn',
    'nordvpn',
    'expressvpn',
    'surfshark',
    'patreon',
    'substack',
    'onlyfans',
    'deezer',
    'tidal',
    'soundcloud go',
    'crunchyroll',
    'paramount+',
    'peacock',
    'apple tv',
    'apple.com/bill',
    'google *',
    'linkedin premium',
    'medium membership',
    'duolingo',
    'headspace',
    'calm app',
    'strava',
    'whoop',
    'oura',
    '1password',
    'lastpass',
    'canva pro',
    'figma',
    'zoom',
    'webflow',
    'vercel',
    'heroku',
    'digitalocean',
    'aws',
    'azure',
    'gcp',
    'cloudflare',
    'domain renewal',
    'hosting',
    'new york times',
    'nytimes',
    'economist',
    'wall street journal',
    'wsj',
    'telegraph',
    'guardian supporter',
    'saas',
    'software subscription',
    'license renewal',
    'auto renew',
    'autorenew',
    'membership',
    'memberships',
    'premium plan',
    'pro plan',
    'plus plan',
    'annual subscription',
    'monthly subscription',
    'billing cycle',
    'recurring charge',
    'apple subscription',
    'google play subscription',
    'playstation now',
    'xbox live',
    'nintendo switch online',
    'espn+',
    'espn plus',
    'dazn',
    'f1 tv',
    'nba league pass',
    'spotify premium',
    'netflix plan',
    'hbo max',
    'paramount plus',
    'apple arcade',
    'google play pass',
    'icloud storage',
    'dropbox plus',
    'evernote',
    'todoist',
    'bear app',
    'things app',
    'raycast pro',
    'setapp',
    'grammarly',
    'linkedin learning',
    'skillshare',
    'masterclass',
    'coursera',
    'udemy',
    'pluralsight',
    'jetbrains',
    'copilot',
    'github copilot',
    'cursor pro',
    'vercel pro',
    'supabase',
    'planetscale',
    'railway app',
    'render.com',
    'namecheap',
    'godaddy',
    'squarespace',
    'wix premium',
    'shopify plan',
    'mailchimp',
    'hubspot',
    'salesforce',
    'zoom pro',
    'loom',
    'miro',
    'linear app',
    'jira',
    'confluence',
    'asana',
    'monday.com',
    'airtable',
    'superhuman',
    'fastmail',
    'proton mail',
    'protonvpn',
    'bitwarden',
    'dashlane',
    'ynab',
    'monarch money',
    'copilot money',
  ],
  entertainment: [
    'entertainment',
    'cinema',
    'movie',
    'movies',
    'theater',
    'theatre',
    'concert',
    'gig',
    'ticketmaster',
    'eventbrite',
    'festival',
    'amusement',
    'theme park',
    'disneyland',
    'disney world',
    'museum',
    'gallery',
    'zoo',
    'aquarium',
    'bowling',
    'arcade',
    'escape room',
    'sports ticket',
    'football ticket',
    'stadium',
    'arena',
    'streaming rental',
    'video game',
    'videogame',
    'steam',
    'playstation store',
    'xbox store',
    'epic games',
    'nintendo eshop',
    'board game',
    'hobby',
    'lego',
    'nightclub',
    'club entry',
    'karaoke',
    'mini golf',
    'ski pass',
    'lift ticket',
    'golf course',
    'tennis court',
    'pool hall',
    'betting',
    'lottery',
    'casino',
    'poker',
    'bookmaker',
  ],
  health: [
    'pharmacy',
    'chemist',
    'drugstore',
    'cvs',
    'walgreens',
    'rite aid',
    'boots pharmacy',
    'apotheke',
    'pharmacie',
    'doctor',
    'physician',
    'gp ',
    'general practitioner',
    'clinic',
    'hospital',
    'urgent care',
    'emergency room',
    'er copay',
    'dental',
    'dentist',
    'orthodont',
    'optician',
    'optometrist',
    'glasses',
    'contact lens',
    'vision',
    'medical',
    'healthcare',
    'health care',
    'lab test',
    'blood test',
    'x-ray',
    'mri',
    'physio',
    'physiotherapy',
    'physical therapy',
    'chiropractor',
    'therapy',
    'psychologist',
    'psychiatrist',
    'counseling',
    'counselling',
    'gym',
    'fitness',
    'fitness center',
    'health club',
    'peloton',
    'classpass',
    'yoga',
    'pilates',
    'crossfit',
    'personal trainer',
    'wellness',
    'spa treatment',
    'massage therapy',
    'vitamin',
    'supplement',
    'protein powder',
    'health insurance',
    'copay',
    'co-pay',
    'deductible',
    'prescription',
    'vaccine',
    'vaccination',
    'flu shot',
    'dermatologist',
    'allergist',
    'vitamins',
    'supplements',
    'multivitamin',
    'omega 3',
    'probiotics',
    'medicine',
    'medicines',
    'medication',
    'medications',
    'meds',
    'aspirin',
    'ibuprofen',
    'paracetamol',
    'acetaminophen',
    'tylenol',
    'advil',
    'aleve',
    'bandage',
    'bandages',
    'first aid',
    'sunscreen',
    'lotion',
    'skincare',
    'skin care',
    'deodorant',
    'shampoo',
    'conditioner',
    'soap',
    'toothpaste',
    'toothbrush',
    'floss',
    'mouthwash',
    'hygiene',
    'tampon',
    'tampons',
    'sanitary',
    'menstrual',
    'contraceptive',
    'hearing aid',
    'wheelchair',
    'crutches',
    'inhaler',
    'insulin',
    'antibiotic',
    'antibiotics',
    'antihistamine',
    'cough syrup',
    'cold medicine',
    'flu medicine',
    'thermometer',
    'blood pressure',
    'acupuncture',
    'naturopath',
    'telehealth',
    'telemedicine',
    'urgent clinic',
    'minute clinic',
    'cigna',
    'anthem',
    'blue cross',
    'united healthcare',
    'medicare',
    'medicaid',
    'dental cleaning',
    'root canal',
    'braces',
    'invisalign',
    'contacts',
    'lenses',
    'optical',
    'specsavers',
    'lenscrafters',
    'holland barrett',
    'gnc',
    'vitamin shoppe',
    'iherb',
    'cvs pharmacy',
    'walmart pharmacy',
    'costco pharmacy',
    'boots',
    'superdrug',
    'dm drogerie',
    'rossmann',
    'muller drogerie',
    'massage',
    'facial',
    'derma',
    'dermatology',
    'allergy shot',
    'flu vaccine',
    'covid test',
    'lab work',
    'bloodwork',
    'xray',
    'scan',
    'mri scan',
    'ct scan',
    'ambulance',
    'ems',
    'nursing',
    'care home',
    'hearing test',
    'physio session',
    'sports massage',
    'chiro',
    'osteopath',
    'counsellor',
    'therapist session',
  ],
  shopping: [
    'shopping',
    'retail',
    'store purchase',
    'amazon',
    'amzn',
    'ebay',
    'etsy',
    'aliexpress',
    'temu',
    'shein',
    'zalando',
    'asos',
    'h&m',
    'hm ',
    'zara',
    'uniqlo',
    'mango',
    'primark',
    'nike',
    'adidas',
    'puma',
    'decathlon',
    'ikea',
    'home depot',
    'homedepot',
    'lowes',
    "lowe's",
    'best buy',
    'bestbuy',
    'media markt',
    'mediamarkt',
    'saturn',
    'fnac',
    'darty',
    'currys',
    'argos',
    'john lewis',
    'target',
    'walmart',
    'costco shop',
    'tj maxx',
    'marshalls',
    'ross stores',
    'nordstrom',
    'macy',
    'bloomingdale',
    'sephora',
    'ulta',
    'cosmetic',
    'makeup',
    'perfume',
    'clothing',
    'apparel',
    'shoes',
    'sneakers',
    'furniture',
    'homeware',
    'home goods',
    'bed bath',
    'wayfair',
    'west elm',
    'crate and barrel',
    'gift shop',
    'gift card',
    'bookstore',
    'books',
    'stationery',
    'electronics',
    'apple store',
    'samsung shop',
    'phone case',
    'accessories',
    'jewelry',
    'jewellery',
    'watch',
    'handbag',
    'purse',
    'mall',
    'outlet',
    'thrift',
    'vintage shop',
    'flea market',
    'florist',
    'flowers',
    'party supplies',
    'toy store',
    'baby store',
    'pet supplies',
    'chewy',
    'petsmart',
    'petco',
    'clothes',
    'clothing',
    'garment',
    'garments',
    'fashion',
    'outfit',
    'wardrobe',
    'gadget',
    'gadgets',
    'laptop',
    'laptops',
    'computer',
    'computers',
    'phone',
    'phones',
    'smartphone',
    'tablet',
    'charger',
    'chargers',
    'cable',
    'headphone',
    'headphones',
    'earbuds',
    'airpods',
    'speaker',
    'tv',
    'television',
    'monitor',
    'printer',
    'ink cartridge',
    'toner',
    'sofa',
    'couch',
    'mattress',
    'pillow',
    'bedding',
    'sheet',
    'sheets',
    'towel',
    'curtain',
    'rug',
    'lamp',
    'decor',
    'decoration',
    'renovation',
    'paint supplies',
    'hardware store',
    'tool',
    'tools',
    'garden center',
    'plant',
    'plants',
    'nursery plants',
    'craft store',
    'hobby lobby',
    'michaels',
    'bunnings',
    'leroy merlin',
    'obi baumarkt',
    'bauhaus',
    'harbor freight',
    'tractor supply',
    'office depot',
    'staples office',
    'paperchase',
    'card shop',
    'gift',
    'gifts',
    'present',
    'presents',
    'souvenir',
    'merchandise',
    'merch',
    'sneaker',
    'boots shoes',
    'sandals',
    'heels',
    'dress',
    'jacket',
    'coat',
    'jeans',
    'trousers',
    'pants',
    'shirt',
    'blouse',
    'skirt',
    'swimwear',
    'lingerie',
    'underwear',
    'socks',
    'hat',
    'scarf',
    'gloves',
    'wallet',
    'belt',
    'sunglasses',
    'ring',
    'necklace',
    'earrings',
    'bracelet',
    'costume jewelry',
    'kitchenware',
    'cookware',
    'utensil',
    'appliance',
    'vacuum',
    'dyson',
    'blender',
    'microwave',
    'kettle',
    'toaster',
    'game console',
    'controller',
    'gaming',
    'pop mart',
    'uniqlo',
    'cos',
    'arket',
    'massimo dutti',
    'pull and bear',
    'bershka',
    'stradivarius',
    'reserved',
    'ccc shoes',
    'foot locker',
    'jd sports',
    'sports direct',
    'decathlon gear',
    'rei',
    'patagonia',
    'north face',
    'columbia',
    'lululemon',
    'gymshark apparel',
    'shein order',
    'temu order',
    'wish.com',
    'banggood',
    'gearbest',
    'newegg',
    'b&h photo',
    'micro center',
  ],
  utilities: [
    'utility',
    'utilities',
    'electric',
    'electricity',
    'power bill',
    'energy bill',
    'gas bill',
    'natural gas',
    'heating',
    'water bill',
    'sewer',
    'trash collection',
    'waste management',
    'internet',
    'broadband',
    'fiber',
    'fibre',
    'wifi',
    'wi-fi',
    'isp',
    'comcast',
    'xfinity',
    'verizon fios',
    'at&t',
    'att ',
    't-mobile',
    'tmobile',
    'vodafone',
    'o2 ',
    'ee mobile',
    'three uk',
    'orange telecom',
    'bouygues',
    'sfr',
    'telekom',
    'deutsche telekom',
    'phone bill',
    'mobile bill',
    'landline',
    'council tax',
    'property utility',
    'octopus energy',
    'british gas',
    'edf',
    'engie',
    'eon',
    'iberdrola',
    'enel',
    'heating oil',
    'cooling',
    'air conditioning service',
    'solar panel',
    'smart meter',
    'water utility',
    'electric company',
    'gas utility',
  ],
};

export function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

type KeywordRule = { categoryId: string; keyword: string };
type FuseKeywordEntry = { keyword: string; categoryId: string };

const KEYWORD_RULES: KeywordRule[] = (() => {
  const seen = new Set<string>();
  const rules: KeywordRule[] = [];
  const push = (categoryId: string, keyword: string) => {
    if (keyword.length < 2) return;
    const key = `${categoryId}:${keyword}`;
    if (seen.has(key)) return;
    seen.add(key);
    rules.push({ categoryId, keyword });
  };

  const ingest = (categoryId: string, raw: string) => {
    if (!CATEGORY_IDS.has(categoryId)) return;
    const keyword = normalizeName(raw);
    push(categoryId, keyword);
    if (!keyword.includes(' ')) {
      for (const variant of tokenVariants(keyword)) push(categoryId, variant);
    } else {
      push(categoryId, singularizePhrase(keyword));
    }
  };

  for (const [categoryId, words] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const word of words) ingest(categoryId, word);
  }

  for (const { categoryId, keyword } of buildCatalogKeywordEntries(normalizeName)) {
    ingest(categoryId, keyword);
  }

  return rules.sort((a, b) => b.keyword.length - a.keyword.length);
})();

const FUSE_KEYWORD_ENTRIES: FuseKeywordEntry[] = KEYWORD_RULES.map(({ keyword, categoryId }) => ({
  keyword,
  categoryId,
}));

const keywordFuse = new Fuse(FUSE_KEYWORD_ENTRIES, {
  keys: ['keyword'],
  threshold: FUSE_THRESHOLD,
  distance: 100,
  includeScore: true,
  ignoreLocation: true,
  minMatchCharLength: 2,
});

const CATEGORY_NAME_TOKENS: Map<string, string[]> = new Map(
  CATEGORIES.map(c => [
    c.id,
    tokenize(normalizeName(c.name)),
  ]),
);

export function tokenize(normalized: string): string[] {
  if (!normalized) return [];
  const out: string[] = [];
  for (const part of normalized.split(' ')) {
    if (part.length >= 2) out.push(part);
  }
  return out;
}

/** Lightweight English singular — vitamins→vitamin, groceries→grocery, matches→match */
export function singularizeToken(token: string): string {
  if (token.length < 4) return token;
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
  if (
    token.endsWith('ches') ||
    token.endsWith('shes') ||
    token.endsWith('xes') ||
    token.endsWith('zes') ||
    token.endsWith('ses')
  ) {
    return token.slice(0, -2);
  }
  if (token.endsWith('es') && token.length > 4) {
    const stem = token.slice(0, -2);
    if (stem.endsWith('ch') || stem.endsWith('sh') || stem.endsWith('ss') || stem.endsWith('x')) {
      return stem;
    }
    return stem;
  }
  if (
    token.endsWith('s') &&
    !token.endsWith('ss') &&
    !token.endsWith('us') &&
    !token.endsWith('is') &&
    !token.endsWith('ness')
  ) {
    return token.slice(0, -1);
  }
  return token;
}

function singularizePhrase(phrase: string): string {
  return phrase
    .split(' ')
    .map(singularizeToken)
    .join(' ');
}

function tokenVariants(token: string): string[] {
  const variants = new Set<string>([token]);
  const singular = singularizeToken(token);
  variants.add(singular);
  if (singular.length >= 3 && !singular.endsWith('s')) variants.add(`${singular}s`);
  if (singular.length >= 4 && !singular.endsWith('es')) variants.add(`${singular}es`);
  return [...variants];
}

export function buildExpenseNameCategoryIndex(expenses: Expense[]): ExpenseNameCategoryIndex {
  const byExactName = new Map<string, string>();
  const byToken = new Map<string, Map<string, number>>();
  const nameEntries: { name: string; categoryId: string }[] = [];

  const spending = expenses.filter(isSpendingExpense);
  const sorted = [...spending].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  const latestByName = new Map<string, string>();

  for (const expense of sorted) {
    const norm = normalizeName(expense.name);
    if (norm.length < MIN_NAME_LEN) continue;

    byExactName.set(norm, expense.categoryId);
    latestByName.set(norm, expense.categoryId);

    const indexToken = (token: string) => {
      let bucket = byToken.get(token);
      if (!bucket) {
        bucket = new Map();
        byToken.set(token, bucket);
      }
      bucket.set(expense.categoryId, (bucket.get(expense.categoryId) ?? 0) + 1);
    };

    for (const token of tokenize(norm)) {
      indexToken(token);
      const stem = singularizeToken(token);
      if (stem !== token) indexToken(stem);
    }
  }

  for (const [name, categoryId] of latestByName) {
    nameEntries.push({ name, categoryId });
  }
  nameEntries.sort((a, b) => b.name.length - a.name.length);
  return { byExactName, byToken, nameEntries };
}

function addScore(scores: Map<string, number>, categoryId: string, points: number, allowed: Set<string>) {
  if (!allowed.has(categoryId) || points <= 0) return;
  scores.set(categoryId, (scores.get(categoryId) ?? 0) + points);
}

function containsKeyword(text: string, keyword: string): boolean {
  if (!keyword) return false;
  if (keyword.includes(' ')) return text.includes(keyword);

  let from = 0;
  while (from <= text.length - keyword.length) {
    const idx = text.indexOf(keyword, from);
    if (idx === -1) return false;
    const before = idx === 0 || text[idx - 1] === ' ';
    const after = idx + keyword.length === text.length || text[idx + keyword.length] === ' ';
    if (before && after) return true;
    from = idx + 1;
  }
  return false;
}

function matchesKeyword(norm: string, keyword: string): boolean {
  if (!keyword) return false;

  if (keyword.includes(' ')) {
    if (containsKeyword(norm, keyword)) return true;
    const stemmedPhrase = singularizePhrase(keyword);
    if (stemmedPhrase !== keyword && containsKeyword(singularizePhrase(norm), stemmedPhrase)) {
      return true;
    }
    return norm.includes(keyword) || singularizePhrase(norm).includes(stemmedPhrase);
  }

  if (containsKeyword(norm, keyword)) return true;

  const tokens = tokenize(norm);
  for (const token of tokens) {
    if (token === keyword) return true;
    const stem = singularizeToken(token);
    if (stem === keyword || keyword === stem) return true;
    if (keyword.length >= 4 && stem.startsWith(keyword)) return true;
    if (keyword.length >= 4 && keyword.startsWith(stem) && stem.length >= 4) return true;
  }

  if (keyword.length >= 4) {
    const whole = singularizeToken(norm.replace(/ /g, ''));
    if (whole === keyword || whole.startsWith(keyword)) return true;
  }

  return false;
}

function scoreKeywords(norm: string, scores: Map<string, number>, allowed: Set<string>) {
  for (const { categoryId, keyword } of KEYWORD_RULES) {
    if (matchesKeyword(norm, keyword)) {
      addScore(scores, categoryId, SCORE.keyword(keyword.length), allowed);
    }
  }
}

/** Fast path: typed prefix of a keyword (banan → banana) */
function scorePrefixMatches(norm: string, scores: Map<string, number>, allowed: Set<string>) {
  const tokens = tokenize(norm);
  const stems = tokens.map(singularizeToken);

  for (const { categoryId, keyword } of KEYWORD_RULES) {
    if (!allowed.has(categoryId) || keyword.length < 3) continue;

    if (keyword.includes(' ')) {
      if (norm.length >= 2 && keyword.startsWith(norm)) {
        addScore(scores, categoryId, SCORE.prefix(norm.length + 2), allowed);
      }
      continue;
    }

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const stem = stems[i];
      if (token.length < 2) continue;
      if (keyword.startsWith(token) || keyword.startsWith(stem)) {
        addScore(scores, categoryId, SCORE.prefix(token.length), allowed);
      } else if (token.length >= 3 && (token.startsWith(keyword) || stem.startsWith(keyword))) {
        addScore(scores, categoryId, SCORE.prefix(keyword.length), allowed);
      }
    }
  }
}

function scoreFuzzy(norm: string, scores: Map<string, number>, allowed: Set<string>) {
  const queries = new Set<string>([norm, ...tokenize(norm)]);
  const seen = new Set<string>();

  for (const query of queries) {
    if (query.length < 2) continue;

    for (const hit of keywordFuse.search(query, { limit: 8 })) {
      if (hit.score == null || hit.score > FUSE_THRESHOLD) continue;

      const { categoryId, keyword } = hit.item;
      if (!allowed.has(categoryId)) continue;

      const key = `${categoryId}:${keyword}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const quality = 1 - hit.score;
      addScore(scores, categoryId, SCORE.fuzzy(quality, keyword.length), allowed);
    }
  }
}

function scoreHistory(
  norm: string,
  index: ExpenseNameCategoryIndex,
  scores: Map<string, number>,
  allowed: Set<string>,
) {
  const exact = index.byExactName.get(norm);
  if (exact) addScore(scores, exact, SCORE.exactHistory, allowed);

  for (const token of tokenize(norm)) {
    const variants = tokenVariants(token);
    for (const lookup of variants) {
      const bucket = index.byToken.get(lookup);
      if (!bucket) continue;
      for (const [categoryId, count] of bucket) {
        addScore(scores, categoryId, SCORE.historyToken * Math.min(count, 4), allowed);
      }
    }
  }

  if (norm.length >= 4) {
    for (const { name, categoryId } of index.nameEntries) {
      if (name.length < 4) continue;
      if (norm.includes(name)) {
        addScore(scores, categoryId, SCORE.historySubstring, allowed);
        break;
      }
      if (name.includes(norm)) {
        addScore(scores, categoryId, SCORE.historySubstring - 8, allowed);
      }
    }
  }
}

function scoreCategoryNames(
  norm: string,
  scores: Map<string, number>,
  allowed: Set<string>,
  catalogNames: { id: string; name: string }[],
) {
  for (const cat of catalogNames) {
    if (!allowed.has(cat.id)) continue;

    const tokens =
      CATEGORY_IDS.has(cat.id) ? (CATEGORY_NAME_TOKENS.get(cat.id) ?? []) : tokenize(normalizeName(cat.name));

    for (const token of tokens) {
      if (token.length < 3) continue;
      if (matchesKeyword(norm, token)) {
        addScore(
          scores,
          cat.id,
          CATEGORY_IDS.has(cat.id) ? SCORE.categoryName : SCORE.customName,
          allowed,
        );
      }
    }
  }
}

function pickBest(scores: Map<string, number>): string | null {
  let bestId: string | null = null;
  let best = 0;
  let second = 0;

  for (const [id, score] of scores) {
    if (score > best) {
      second = best;
      best = score;
      bestId = id;
    } else if (score > second) {
      second = score;
    }
  }

  if (!bestId || best < MIN_SCORE) return null;
  if (second > 0 && best < second * SCORE_MARGIN) return null;
  return bestId;
}

export type SuggestCategoryOptions = {
  name: string;
  allowedCategoryIds: readonly string[];
  /** Spending history index — pass from useMemo for efficiency */
  historyIndex: ExpenseNameCategoryIndex;
  /** Picker catalog (built-in + custom + focus) for display-name matching */
  catalogNames?: readonly { id: string; name: string }[];
};

/**
 * Suggests a category from expense name using history, keywords, and catalog names.
 * Offline, deterministic, tuned for the add-expense picker.
 */
export function suggestCategoryFromName(options: SuggestCategoryOptions): string | null {
  const norm = normalizeName(options.name);
  if (norm.length < MIN_NAME_LEN) return null;

  const allowed = new Set(options.allowedCategoryIds);
  if (allowed.size === 0) return null;

  const scores = new Map<string, number>();
  scoreHistory(norm, options.historyIndex, scores, allowed);
  scorePrefixMatches(norm, scores, allowed);
  scoreKeywords(norm, scores, allowed);
  scoreFuzzy(norm, scores, allowed);

  const catalog =
    options.catalogNames ??
    CATEGORIES.map(c => ({ id: c.id, name: c.name }));
  scoreCategoryNames(norm, scores, allowed, catalog);

  const best = pickBest(scores);
  if (best) return best;
  return allowed.has('other') ? 'other' : null;
}

/** Build index from expenses when caller does not memoize */
export function suggestCategoryFromNameWithExpenses(
  name: string,
  expenses: Expense[],
  allowedCategoryIds: readonly string[],
  catalogNames?: readonly { id: string; name: string }[],
): string | null {
  return suggestCategoryFromName({
    name,
    allowedCategoryIds,
    historyIndex: buildExpenseNameCategoryIndex(expenses),
    catalogNames,
  });
}
