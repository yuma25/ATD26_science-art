import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 💡 修正：URLとKeyが存在する場合のみクライアントを作成
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

/**
 * ログイン状態を確認し、必要に応じて匿名サインインを行う
 */
export const signInAnonymously = async () => {
  try {
    if (!supabase) return null;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    let user: User | null | undefined = session?.user;

    if (!user) {
      console.log("🗝 No session found, starting anonymous sign-in...");
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      user = data.user;
    }

    if (user) {
      return user;
    }
    return null;
  } catch (error) {
    console.error("❌ Auth failure:", error);
    return null;
  }
};
