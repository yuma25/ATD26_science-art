"use client";

/**
 * 【管理者ログイン画面】
 * 管理者パネルにアクセスするためのログインフォームです。
 * Supabase Auth（メールアドレスとパスワード）を利用して認証を行います。
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@backend/lib/supabase";
import { LogIn, Key, Mail, AlertCircle, RefreshCw } from "lucide-react";

export default function AdminLoginPage() {
  // --- 状態管理 (State) ---
  const [email, setEmail] = useState(""); // 入力されたメールアドレス
  const [password, setPassword] = useState(""); // 入力されたパスワード
  const [error, setError] = useState<string | null>(null); // エラーメッセージ
  const [isLoading, setIsLoading] = useState(false); // ログイン処理中フラグ
  const [isChecking, setIsChecking] = useState(true); // 初回のログインチェック中フラグ
  const router = useRouter();

  /**
   * 💡 自動転送設定
   * すでにログインしている場合は、ログイン画面を表示せずにダッシュボードへ移動させます。
   */
  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) {
        setIsChecking(false);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // 💡 厳格チェック：セッションがあり、かつそれが「メールログイン（管理者）」の場合のみ自動転送
      const isEmailUser = session?.user?.app_metadata?.provider === "email";
      const isAnonymous = session?.user?.is_anonymous;

      if (session && !isAnonymous && isEmailUser) {
        router.replace("/admin");
      } else {
        // 管理者以外（未ログインまたは匿名ユーザー）の場合は、ログインフォームを表示する（チェック完了）
        setIsChecking(false);
      }
    };
    void checkUser();
  }, [router]);

  /**
   * ログインボタンが押された時の処理
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // ページのリロードを防ぐ
    setIsLoading(true);
    setError(null);

    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      // Supabaseの機能を使って認証を実行
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      // 成功したらダッシュボードへ移動
      router.push("/admin");
    } catch (err: unknown) {
      // エラーがあればメッセージを表示
      const message =
        err instanceof Error ? err.message : "ログインに失敗しました";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // セッション確認中の表示
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8e2d2]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#3e2f28]/20" />
      </div>
    );
  }

  // --- ログインフォームの表示 ---
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#e8e2d2]">
      <div className="max-w-md w-full">
        {/* ヘッダー装飾 */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-white/50 backdrop-blur-sm border border-[#3e2f28]/10 mb-4">
            <LogIn className="w-8 h-8 text-[#3e2f28]" />
          </div>
          <h1 className="text-3xl font-bold text-[#3e2f28] mb-2 tracking-widest uppercase">
            ADMIN ARCHIVE
          </h1>
          <p className="text-[#3e2f28]/60 italic font-serif">管理者ログイン</p>
        </div>

        {/* メインフォーム */}
        <div className="bg-white/40 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-xl relative overflow-hidden">
          {/* デザイン用のテープ装飾 */}
          <div className="tape -top-2 -left-4 rotate-[-15deg] w-20 h-6 opacity-60"></div>
          <div className="tape -bottom-2 -right-4 rotate-[-15deg] w-20 h-6 opacity-60"></div>

          <form
            onSubmit={(e) => {
              void handleLogin(e);
            }}
            className="space-y-6 relative z-10"
          >
            {/* エラーメッセージの表示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center gap-3 text-sm animate-pulse">
                <AlertCircle className="w-4 h-4" />
                <span>
                  {error === "Invalid login credentials"
                    ? "メールアドレスまたはパスワードが正しくありません"
                    : error}
                </span>
              </div>
            )}

            {/* メールアドレス入力 */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-[#3e2f28]/60 ml-1 font-bold">
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3e2f28]/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/50 border border-[#3e2f28]/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#3e2f28]/20 transition-all"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>

            {/* パスワード入力 */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-[#3e2f28]/60 ml-1 font-bold">
                パスワード
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3e2f28]/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/50 border border-[#3e2f28]/10 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#3e2f28]/20 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#3e2f28] text-[#e8e2d2] py-4 rounded-xl font-bold tracking-widest hover:bg-[#523f35] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? "認証中..." : "管理者ページに入る"}
            </button>
          </form>
        </div>

        {/* 戻るボタン */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-xs uppercase tracking-[0.2em] text-[#3e2f28]/40 hover:text-[#3e2f28] transition-colors font-bold"
          >
            ← フィールドに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
