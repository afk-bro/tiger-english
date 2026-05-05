// src/features/lessons/data/units.ts
import type { Unit } from "../lesson.types";

/** Helper to create a coming-soon stub unit. */
function stub(
  slug: string,
  number: number,
  title: string,
  topic: string,
  grammarFocus: string,
  cefrLevel: Unit["cefrLevel"],
  estimatedMinutes = 40,
): Unit {
  return {
    slug,
    number,
    title,
    topic,
    grammarFocus,
    estimatedMinutes,
    status: "coming-soon",
    cefrLevel,
    sections: [],
    translations: {},
  };
}

export const units: Unit[] = [
  // ─── A0–A1 Module 1: First English Sounds and Greetings ──────────────────
  {
    slug: "unit-1",
    number: 1,
    title: "To Be: Introduction",
    topic: "Personal information & meeting people",
    grammarFocus: "Present tense of 'to be' (am / is / are)",
    estimatedMinutes: 30,
    status: "available",
    cefrLevel: "A1",
    sections: [
      { key: "overview", estimatedMinutes: 3 },
      { key: "grammar", estimatedMinutes: 8 },
      { key: "vocabulary", estimatedMinutes: 5 },
      { key: "dialogues", estimatedMinutes: 6 },
      { key: "activities", estimatedMinutes: 8 },
    ],
    translations: {
      th: {
        title: "To Be: บทนำ",
        topic: "ข้อมูลส่วนตัวและการพบปะผู้คน",
        grammarFocus: "กาลปัจจุบันของ 'to be' (am / is / are)",
      },
      vi: {
        title: "To Be: Giới thiệu",
        topic: "Thông tin cá nhân và gặp gỡ mọi người",
        grammarFocus: "Thì hiện tại của 'to be' (am / is / are)",
      },
      "zh-CN": {
        title: "To Be: 介绍",
        topic: "个人信息和认识新朋友",
        grammarFocus: "'to be' 的现在时 (am / is / are)",
      },
    },
  },
  {
    slug: "unit-2",
    number: 2,
    title: "To Be + Location",
    topic: "Talking about where people and things are",
    grammarFocus: "Subject pronouns + 'to be' for location ('Where is he?' / 'He's in the kitchen.')",
    estimatedMinutes: 35,
    status: "available",
    cefrLevel: "A1",
    sections: [
      { key: "overview", estimatedMinutes: 3 },
      { key: "grammar", estimatedMinutes: 8 },
      { key: "vocabulary", estimatedMinutes: 8 },
      { key: "dialogues", estimatedMinutes: 6 },
      { key: "activities", estimatedMinutes: 10 },
    ],
    translations: {
      vi: {
        title: "To Be + Vị trí",
        topic: "Nói về vị trí của người và đồ vật",
        grammarFocus: "Đại từ nhân xưng + 'to be' chỉ vị trí",
      },
    },
  },
  stub("unit-3", 3, "Greetings & Saying Goodbye", "Common greetings and farewells", "Hello / Hi / Good morning / Goodbye / See you", "A1"),
  stub("unit-4", 4, "The Alphabet & Spelling", "Spelling your name out loud", "English alphabet pronunciation; asking 'How do you spell that?'", "A1"),

  // ─── A0–A1 Module 2: Personal Information ────────────────────────────────
  stub("unit-5", 5, "Numbers 1–20", "Counting and basic numbers", "Cardinal numbers; asking 'How many?'", "A1"),
  stub("unit-6", 6, "My Age & Birthday", "Talking about age and dates", "How old are you? I am … years old. Ordinal numbers.", "A1"),
  stub("unit-7", 7, "Where Are You From?", "Countries and nationalities", "I'm from … / I'm [nationality]. Country and nationality vocabulary.", "A1"),
  stub("unit-8", 8, "Colours & Basic Descriptions", "Describing things with colours", "What colour is it? It's … Adjective + noun order.", "A1"),

  // ─── A0–A1 Module 3: Classroom Instructions ──────────────────────────────
  stub("unit-9", 9, "Classroom Commands", "Following teacher instructions", "Open your book. Listen. Repeat. Stand up. Sit down.", "A1"),
  stub("unit-10", 10, "Classroom Objects", "Naming things around you", "What is this? It's a …  pen, book, desk, board.", "A1"),
  stub("unit-11", 11, "Asking for Help", "Getting clarification in class", "Can you repeat that? I don't understand. How do you say … ?", "A1"),
  stub("unit-12", 12, "Please & Thank You", "Basic politeness formulas", "Thank you / You're welcome / Excuse me / Sorry.", "A1"),

  // ─── A0–A1 Module 4: Food & Ordering ─────────────────────────────────────
  stub("unit-13", 13, "Food & Drink Vocabulary", "Common foods and drinks", "This is … / I like … / I don't like …  Noun vocabulary.", "A1"),
  stub("unit-14", 14, "At the Café", "Ordering a drink or snack", "Can I have …? I'd like … How much is it? Here you go.", "A1"),
  stub("unit-15", 15, "Do You Like …?", "Expressing likes and dislikes", "Do you like …? Yes, I love it. / No, not really. Simple present questions.", "A1"),
  stub("unit-16", 16, "Numbers 20–100 & Prices", "Bigger numbers and shopping vocabulary", "How much does it cost? It costs … pence/dollar/baht.", "A1"),

  // ─── A0–A1 Module 5: Family & People ─────────────────────────────────────
  stub("unit-17", 17, "My Family", "Family member vocabulary", "This is my mother / father / brother / sister. Possessive adjectives.", "A1"),
  stub("unit-18", 18, "Describing People", "Basic physical descriptions", "She is tall / short / young / old. He has … hair.", "A1"),
  stub("unit-19", 19, "This Is My Friend", "Introducing others", "This is … / He is … / She is … Third-person 'to be'.", "A1"),
  stub("unit-20", 20, "Possessive 's", "Showing belonging", "That is Maria's bag. Whose is this? It's mine / yours.", "A1"),

  // ─── A0–A1 Module 6: Numbers & Time ──────────────────────────────────────
  stub("unit-21", 21, "Telling the Time", "Hours and minutes", "What time is it? It's … o'clock / half past / quarter to.", "A1"),
  stub("unit-22", 22, "Days of the Week", "Seven days and schedules", "What day is it today? It's Monday. On Monday I …", "A1"),
  stub("unit-23", 23, "Months & Seasons", "Months and weather patterns", "What month is it? It's … In winter / summer it's …", "A1"),
  stub("unit-24", 24, "Daily Routine", "Simple daily schedule", "I wake up at … I go to school at … I eat lunch at …", "A1"),

  // ─── A0–A1 Module 7: Common Objects & Places ─────────────────────────────
  stub("unit-25", 25, "My Home", "Rooms and furniture", "This is the living room. There is a sofa. There are …", "A1"),
  stub("unit-26", 26, "In the Classroom", "School objects and places", "Where is the … ? It's next to / under / on the …", "A1"),
  stub("unit-27", 27, "Getting Around", "Basic transport and directions", "Turn left / right. Go straight. Take the bus / train.", "A1"),
  stub("unit-28", 28, "Places in Town", "Local landmarks and shops", "There is a park near here. Where is the bank? It's …", "A1"),

  // ─── A0–A1 Module 8: Likes & Abilities ───────────────────────────────────
  stub("unit-29", 29, "Can You …?", "Talking about ability", "Can you swim? Yes, I can. / No, I can't. Modal: can.", "A1"),
  stub("unit-30", 30, "Sports & Hobbies", "Free-time activities", "I play football. I like reading. Do you do any sports?", "A1"),
  stub("unit-31", 31, "How Often?", "Frequency adverbs", "I always / usually / sometimes / never … Simple adverbs.", "A1"),
  stub("unit-32", 32, "A0–A1 Review", "Consolidation of A0–A1 learning", "Review all A0–A1 grammar, vocabulary, and dialogue patterns.", "A1"),

  // ─── A1–A2 Module 1: Daily Life & Routines ───────────────────────────────
  stub("unit-33", 33, "Simple Present Tense", "Talking about habits and facts", "I work. She works. Do you work? Yes/No questions and short answers.", "A2"),
  stub("unit-34", 34, "A Morning Routine", "Sequencing daily events", "First I … then I … After that I … Time connectors.", "A2"),
  stub("unit-35", 35, "At the Weekend", "Weekend activities and plans", "What do you do at the weekend? I usually … / Sometimes I …", "A2"),
  stub("unit-36", 36, "Plans for Tomorrow", "Simple future with 'going to'", "I'm going to … tomorrow. Are you going to …? Yes / No.", "A2"),

  // ─── A1–A2 Module 2: Shopping & Prices ───────────────────────────────────
  stub("unit-37", 37, "At the Shop", "Shopping vocabulary and prices", "How much is this? That's too expensive. I'll take it.", "A2"),
  stub("unit-38", 38, "Clothes & Sizes", "Clothing vocabulary and trying on", "I'd like to try on … Do you have it in size …? It fits / doesn't fit.", "A2"),
  stub("unit-39", 39, "Comparing Things", "Comparative adjectives", "This is bigger / cheaper / nicer than … Which one do you prefer?", "A2"),
  stub("unit-40", 40, "Making a Purchase", "Completing a transaction", "I'll pay by card / cash. Can I have a receipt? Thank you.", "A2"),

  // ─── A1–A2 Module 3: Health & Problems ───────────────────────────────────
  stub("unit-41", 41, "Parts of the Body", "Body vocabulary and health", "My head hurts. I have a cold. What's wrong? Are you okay?", "A2"),
  stub("unit-42", 42, "At the Doctor's", "Medical appointments", "I have a … I feel … The doctor says … You should rest.", "A2"),
  stub("unit-43", 43, "Giving Advice", "Should / shouldn't", "You should drink water. You shouldn't eat sugar. Modal: should.", "A2"),
  stub("unit-44", 44, "A1–A2 Review", "Consolidation of A1–A2 learning", "Review all A1–A2 grammar, vocabulary, and dialogue patterns.", "A2"),
];
