// /lib/api/flashcards.ts
import { supabase } from "../supabase";
export const getFlashcards = async (userId) => {
    return supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
};
