/**
 * Expanded expense-name keyword catalog (merged into suggestCategoryFromName).
 * Group labels are mapped to built-in category ids.
 */

const RENT_KEYWORDS = new Set([
  'landlord',
  'rent',
  'alquiler',
  'mortgage',
  'hipoteca',
]);

/** External group label → default Spendr category id */
const GROUP_CATEGORY: Record<string, string> = {
  Groceries: 'groceries',
  'Restaurants & Dining': 'dining',
  Transport: 'transport',
  Subscriptions: 'subscriptions',
  'Health & Pharmacy': 'health',
  'Utilities & Bills': 'utilities',
  'Shopping & Clothing': 'shopping',
  'Entertainment & Culture': 'entertainment',
  'Travel & Accommodation': 'transport',
  'Home & Hardware': 'shopping',
  Education: 'other',
  Pets: 'shopping',
  'Gifts & Donations': 'shopping',
  'Personal Care': 'health',
};

export const EXPENSE_KEYWORD_GROUPS: Record<string, readonly string[]> = {
  Groceries: [
    'banana', 'bananas', 'apple', 'apples', 'orange', 'oranges', 'milk', 'bread', 'eggs', 'butter',
    'cheese', 'yogurt', 'rice', 'pasta', 'flour', 'sugar', 'salt', 'pepper', 'olive oil',
    'vegetable oil', 'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'tomato',
    'tomatoes', 'potato', 'potatoes', 'onion', 'onions', 'garlic', 'lettuce', 'spinach', 'broccoli',
    'carrot', 'carrots', 'cucumber', 'avocado', 'lemon', 'lime', 'strawberry', 'strawberries',
    'blueberry', 'blueberries', 'grapes', 'mango', 'pineapple', 'watermelon', 'cereal', 'oats',
    'granola', 'coffee', 'tea', 'juice', 'sparkling water', 'water', 'coca cola', 'coke', 'pepsi',
    'beer', 'wine', 'chocolate', 'biscuits', 'cookies', 'crackers', 'chips', 'crisps', 'nuts',
    'almonds', 'cashews', 'peanuts', 'peanut butter', 'jam', 'honey', 'ketchup', 'mustard',
    'mayonnaise', 'vinegar', 'soy sauce', 'curry', 'spices', 'herbs', 'frozen pizza',
    'frozen meals', 'ice cream', 'cream', 'tofu', 'tempeh', 'lentils', 'chickpeas', 'beans',
    'canned tomatoes', 'canned tuna', 'soup', 'stock', 'broth', 'tortillas', 'pita', 'bagel',
    'croissant', 'rolls', 'buns', 'deli meat', 'ham', 'salami', 'chorizo', 'prosciutto', 'feta',
    'mozzarella', 'parmesan', 'cheddar', 'brie', 'hummus', 'tahini', 'salsa', 'guacamole',
    'mushrooms', 'bell pepper', 'zucchini', 'eggplant', 'celery', 'kale', 'arugula', 'cabbage',
    'leek', 'asparagus', 'cauliflower', 'corn', 'peas', 'edamame', 'ginger', 'cilantro', 'parsley',
    'basil', 'mint', 'rosemary', 'thyme', 'bay leaves', 'cinnamon', 'paprika', 'cumin', 'turmeric',
    'chili flakes', 'bread crumbs', 'yeast', 'baking powder', 'baking soda', 'cocoa',
  ],
  'Restaurants & Dining': [
    'restaurant', 'cafe', 'coffee shop', 'bar', 'pub', 'bistro', 'brasserie', 'tapas', 'sushi',
    'ramen', 'noodles', 'pizza', 'burger', 'sandwich', 'wrap', 'kebab', 'falafel', 'poke', 'thai',
    'indian', 'chinese', 'japanese', 'italian', 'mexican', 'greek', 'turkish', 'french', 'american',
    'brunch', 'lunch', 'dinner', 'breakfast', 'takeaway', 'take out', 'delivery', 'mcdonalds',
    'burger king', 'kfc', 'subway', 'dominos', 'pizza hut', 'starbucks', 'costa', 'nespresso',
    'espresso', 'cappuccino', 'latte', 'flat white', 'americano', 'macchiato', 'mocha', 'croissant',
    'pastry', 'cake', 'dessert', 'gelato', 'waffles', 'pancakes', 'toast', 'avocado toast', 'salad',
    'soup', 'bowl', 'taco', 'burrito', 'enchilada', 'paella', 'risotto', 'lasagna', 'steak',
    'seafood', 'oysters', 'cocktail', 'gin', 'rum', 'whiskey', 'vodka', 'tequila', 'wine glass',
    'beer pint', 'happy hour', 'brunch buffet', 'set menu', 'tasting menu', 'tip', 'service charge',
  ],
  Transport: [
    'uber', 'lyft', 'bolt', 'cabify', 'taxi', 'cab', 'ride', 'metro', 'subway', 'underground',
    'tube', 'bus', 'tram', 'train', 'ferry', 'flight', 'plane', 'airline', 'airport', 'renfe',
    'ave', 'cercanias', 'rodalies', 'bici', 'bike', 'ebike', 'scooter', 'moped', 'parking',
    'garage', 'toll', 'highway', 'motorway', 'autopista', 'fuel', 'petrol', 'gasoline', 'diesel',
    'gas station', 'gasolinera', 'repsol', 'bp', 'shell', 'cepsa', 'seat', 'volkswagen', 'renault',
    'fiat', 'car wash', 'mot', 'revision', 'workshop', 'taller', 'mechanic', 'insurance',
    'car insurance',
  ],
  Subscriptions: [
    'netflix', 'hbo', 'disney', 'prime', 'apple tv', 'mubi', 'criterion', 'spotify', 'apple music',
    'tidal', 'youtube premium', 'deezer', 'nintendo switch online', 'xbox', 'playstation plus',
    'ps plus', 'ea play', 'adobe', 'figma', 'notion', 'linear', 'github', 'vercel', 'supabase',
    'postman', 'anthropic', 'openai', 'chatgpt', 'claude', 'cursor', 'windsurf', 'raycast',
    'setapp', '1password', 'lastpass', 'bitwarden', 'dropbox', 'google one', 'icloud',
    'microsoft 365', 'office 365', 'google workspace', 'zoom', 'slack', 'discord', 'twitter',
    'x premium', 'linkedin premium', 'duolingo', 'masterclass', 'domestika', 'udemy', 'skillshare',
    'coursera', 'medium', 'substack',
  ],
  'Health & Pharmacy': [
    'pharmacy', 'farmacia', 'parafarmacia', 'doctor', 'gp', 'clinic', 'hospital', 'dentist',
    'physio', 'osteopath', 'psychologist', 'therapist', 'optician', 'glasses', 'contact lenses',
    'vitamin', 'supplement', 'protein', 'omega 3', 'magnesium', 'zinc', 'melatonin', 'paracetamol',
    'ibuprofen', 'aspirin', 'antibiotic', 'prescription', 'medicine', 'inhaler', 'bandage',
    'plaster', 'antiseptic', 'sunscreen', 'face cream', 'moisturizer', 'serum', 'spf', 'gym',
    'fitness', 'yoga', 'pilates', 'crossfit', 'swimming', 'running', 'cycling', 'health insurance',
    'medical',
  ],
  'Utilities & Bills': [
    'electricity', 'electric', 'luz', 'gas', 'water', 'agua', 'internet', 'wifi', 'broadband',
    'phone', 'mobile', 'sim', 'vodafone', 'movistar', 'orange', 'yoigo', 'o2', 'bt', 'virgin',
    'three', 'landlord', 'rent', 'alquiler', 'mortgage', 'hipoteca', 'insurance', 'seguro',
    'home insurance', 'contents insurance', 'council tax', 'ibi', 'community fee', 'communidad',
    'rubbish', 'waste', 'heating', 'boiler', 'plumber', 'electrician', 'maintenance', 'reparacion',
  ],
  'Shopping & Clothing': [
    'zara', 'mango', 'hm', 'h&m', 'uniqlo', 'pull and bear', 'bershka', 'massimo dutti', 'cos',
    'arket', 'weekday', 'monki', 'primark', 'shein', 'asos', 'zalando', 'amazon', 'ebay',
    'amazon prime', 'shoes', 'sneakers', 'trainers', 'boots', 'heels', 'sandals', 'shirt',
    'tshirt', 'trousers', 'jeans', 'dress', 'skirt', 'suit', 'jacket', 'coat', 'hoodie', 'sweater',
    'socks', 'underwear', 'accessories', 'belt', 'bag', 'backpack', 'wallet', 'watch', 'sunglasses',
    'hat', 'scarf', 'gloves', 'sports gear', 'kit', 'cycling kit', 'running shoes', 'swimwear',
  ],
  'Entertainment & Culture': [
    'cinema', 'movie', 'film', 'theatre', 'concert', 'festival', 'museum', 'gallery', 'exhibition',
    'ticket', 'ticketmaster', 'eventbrite', 'booking fee', 'book', 'ebook', 'kindle', 'comic',
    'magazine', 'newspaper', 'el pais', 'el mundo', 'the guardian', 'nytimes', 'game', 'steam',
    'nintendo', 'playstation', 'xbox', 'epic games', 'gog', 'board game', 'puzzle', 'escape room',
    'bowling', 'mini golf', 'karting', 'spa', 'sauna', 'massage',
  ],
  'Travel & Accommodation': [
    'hotel', 'hostel', 'airbnb', 'booking', 'hostelworld', 'agoda', 'expedia', 'flight', 'ryanair',
    'easyjet', 'iberia', 'vueling', 'wizz', 'british airways', 'lufthansa', 'klm', 'train ticket',
    'bus ticket', 'ferry ticket', 'tour', 'excursion', 'visa', 'travel insurance', 'luggage',
    'suitcase', 'backpack', 'travel adapter', 'foreign exchange', 'currency', 'airport lounge',
    'airport transfer',
  ],
  'Home & Hardware': [
    'ikea', 'leroy merlin', 'bricomart', 'decathlon', 'mediamarkt', 'pccomponentes', 'apple store',
    'furniture', 'chair', 'desk', 'lamp', 'shelf', 'storage', 'cleaning', 'cleaner', 'detergent',
    'soap', 'dishwasher tablets', 'washing powder', 'bleach', 'mop', 'brush', 'tool', 'drill',
    'hammer', 'paint', 'diy', 'plant', 'flower', 'pot', 'candle', 'diffuser', 'light bulb',
    'battery',
  ],
  Education: [
    'course', 'bootcamp', 'workshop', 'class', 'lesson', 'tutor', 'book', 'textbook', 'materials',
    'pencil', 'notebook', 'printing', 'stationery', 'university', 'college', 'school', 'registration',
    'fee', 'exam',
  ],
  Pets: [
    'vet', 'veterinario', 'pet food', 'dog food', 'cat food', 'treats', 'toy', 'collar', 'leash',
    'grooming', 'litter', 'cat litter', 'aquarium', 'fish food', 'pet insurance',
  ],
  'Gifts & Donations': [
    'gift', 'regalo', 'flowers', 'florist', 'card', 'donation', 'charity', 'ngo', 'crowdfunding',
    'present', 'wrapping',
  ],
  'Personal Care': [
    'haircut', 'barbershop', 'peluqueria', 'hairdresser', 'shampoo', 'conditioner', 'hair color',
    'nail salon', 'manicure', 'pedicure', 'waxing', 'razor', 'shaving', 'cologne', 'perfume',
    'deodorant', 'toothbrush', 'toothpaste', 'floss', 'mouthwash', 'face wash', 'toner',
    'exfoliator',
  ],
};

export type CatalogKeywordEntry = { keyword: string; categoryId: string };

/** Flat catalog entries for Fuse.js and prefix index (deduped by keyword+category). */
export function buildCatalogKeywordEntries(
  normalize: (raw: string) => string,
): CatalogKeywordEntry[] {
  const seen = new Set<string>();
  const entries: CatalogKeywordEntry[] = [];

  for (const [group, words] of Object.entries(EXPENSE_KEYWORD_GROUPS)) {
    const defaultCategory = GROUP_CATEGORY[group] ?? 'other';

    for (const raw of words) {
      const keyword = normalize(raw);
      if (keyword.length < 2) continue;

      let categoryId = defaultCategory;
      if (group === 'Utilities & Bills' && RENT_KEYWORDS.has(keyword)) {
        categoryId = 'rent';
      }

      const key = `${categoryId}:${keyword}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({ keyword, categoryId });
    }
  }

  return entries;
}
