// /types/flashcard.ts
export interface Flashcard {
  id: string;
  user_id: string;
  word: string;
  definition: string;
  example_sentence?: string;
  part_of_speech?: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  created_at: string;
}
