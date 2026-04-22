import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// 1. 一般権限（ブラウザ用）
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. 管理者権限 (サーバーサイド専用)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * ログイン状態を確認し、プロフィールを同期する
 */
export const signInAnonymously = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let currentUser = user;

    if (!currentUser) {
      console.log("Starting new anonymous session...");
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      currentUser = data.user;
    }

    if (currentUser) {
      // 💡 ブラウザから直接DBに書かず、APIルートを通じて同期する (RLS回避)
      try {
        await fetch("/api/profile/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id }),
        });
        console.log("✅ Identity sync request sent.");
      } catch {
        console.warn("⚠️ Identity sync call failed, but user session exists.");
      }
    }
    return currentUser;
  } catch (error) {
    console.error("❌ Auth failure:", error);
    return null;
  }
};
