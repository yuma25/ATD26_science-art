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
    if (!supabase) return null;

    // 1. 現在のセッション取得を試みる
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    // 💡 リフレッシュトークン異常などが発生している場合、強制的にログアウトしてクリア
    if (sessionError) {
      console.warn(
        "🔄 セッションの不整合を検知しました。リセットします...",
        sessionError.message,
      );
      await supabase.auth.signOut();
      const { data, error: retryError } =
        await supabase.auth.signInAnonymously();
      if (retryError) throw retryError;
      return data.user;
    }

    let user: User | null = session?.user || null;

    // 2. ログインしていない場合は、新しく「匿名ユーザー」としてサインイン
    if (!user) {
      console.log("🗝 匿名サインインを開始します...");
      const { data, error: signInError } =
        await supabase.auth.signInAnonymously();
      if (signInError) throw signInError;
      user = data.user;
    }

    return user || null;
  } catch (error: unknown) {
    console.error("❌ 認証エラーが発生しました:", error);
    return null;
  }
};
