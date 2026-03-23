export interface SetMetaEntry {
  title: string;
  description: string;
  is_public?: boolean; // defaults to true
  sort_order: number;
}

export const SET_META: Record<string, SetMetaEntry> = {
  'greetings_small_talk.csv': {
    title: 'Greetings & Small Talk',
    description: 'Everyday greetings, introductions, and casual conversation phrases',
    sort_order: 1,
  },
  'numbers_1_100.csv': {
    title: 'Numbers 1–100',
    description: 'Learn to read and write numbers from one to one hundred',
    sort_order: 2,
  },
  'numbers_1_100_words.csv': {
    title: 'Numbers 1–100 (Words)',
    description: 'Numbers one to one hundred written out as English words',
    sort_order: 3,
  },
  'numbers_1_100_phonetic.csv': {
    title: 'Numbers 1–100 (Phonetic)',
    description: 'Phonetic pronunciation guide for numbers one to one hundred',
    sort_order: 4,
  },
  'fruit_20_basic.csv': {
    title: 'Fruit',
    description: 'Common fruits for everyday vocabulary',
    sort_order: 5,
  },
  'vegetables_20_basic.csv': {
    title: 'Vegetables',
    description: 'Common vegetables for everyday vocabulary',
    sort_order: 6,
  },
  'food_single_words_basic.csv': {
    title: 'Food',
    description: 'Essential food vocabulary — single words for beginners',
    sort_order: 7,
  },
  'cutlery_china_10_basic.csv': {
    title: 'Cutlery & Tableware',
    description: 'Knives, forks, plates, and other table items',
    sort_order: 8,
  },
  'daily_life_20.csv': {
    title: 'Daily Life',
    description: 'Vocabulary for common everyday activities and routines',
    sort_order: 9,
  },
  'time_20.csv': {
    title: 'Time',
    description: 'Telling the time, days, months, and time expressions',
    sort_order: 10,
  },
  'shopping_money_20.csv': {
    title: 'Shopping & Money',
    description: 'Vocabulary for shopping, prices, and handling money',
    sort_order: 11,
  },
  'directions_transportation_20.csv': {
    title: 'Directions & Transportation',
    description: 'Asking for and giving directions, and transport vocabulary',
    sort_order: 12,
  },
  'accommodation_hotels_20.csv': {
    title: 'Accommodation & Hotels',
    description: 'Vocabulary for checking in, hotel facilities, and lodging',
    sort_order: 13,
  },
  'travel_essentials.csv': {
    title: 'Travel Essentials',
    description: 'Essential phrases and vocabulary for travelling',
    sort_order: 14,
  },
  'work_business_20.csv': {
    title: 'Work & Business',
    description: 'Professional vocabulary for the workplace and business settings',
    sort_order: 15,
  },
  'dating_social_20.csv': {
    title: 'Dating & Social',
    description: 'Vocabulary for socialising, dating, and meeting new people',
    sort_order: 16,
  },
  'emergencies_health_20.csv': {
    title: 'Emergencies & Health',
    description: 'Essential vocabulary for medical situations and emergencies',
    sort_order: 17,
  },
};
