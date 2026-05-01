/**
 * 【データベース接続設定 (Supabase)】
 * このファイルでは、データベース（Supabase）と通信するための設定と初期化を行っています。
 */

import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

// 環境変数から接続に必要な情報を読み込みます
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * --- クライアントの初期化 ---
 */

// 1. 一般ユーザー用のクライアント（公開情報を扱う用）
// 💡 設定が存在する場合のみ作成し、存在しない場合は null にします
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// 2. 管理者用のクライアント（権限が必要な操作用）
export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

/**
 * --- 認証（サインイン）処理 ---
 */

/**
 * ログイン状態を確認し、必要に応じて匿名サインイン（名前などを入力しないログイン）を行います。
 * 初心者向けメモ：これにより、ユーザーは面倒な登録なしですぐに標本探しを始められます。
 */
export const signInAnonymously = async () => {
  try {
    // 1. そもそもデータベースが準備できていない場合は何もしません（早期リターン）
    if (!supabase) {
      return null;
    }

    // 2. すでにログインしているか（セッションがあるか）確認します
    const {
      data: { session },
    } = await supabase.auth.getSession();
    let user: User | null | undefined = session?.user;

    // 3. ログインしていない場合は、新しく「匿名ユーザー」としてサインインします
    if (!user) {
      console.log(
        "🗝 ログイン情報が見つかりません。匿名サインインを開始します...",
      );
      const { data, error } = await supabase.auth.signInAnonymously();

      // エラーが起きたら例外（catch）へ飛ばします
      if (error) {
        throw error;
      }
      user = data.user;
    }

    // 4. 無事にユーザー情報が取得できたらそれを返します
    if (user) {
      return user;
    }

    // 5. どちらでもない場合は null を返します
    return null;
  } catch (error) {
    // 何か問題が起きた場合はエラーログを出力します
    console.error("❌ 認証エラーが発生しました:", error);
    return null;
  }
};
