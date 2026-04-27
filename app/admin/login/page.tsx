"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/backend/lib/supabase";
import { LogIn, Key, Mail, AlertCircle, RefreshCw } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      if (!supabase) {
        setIsChecking(false);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.replace("/admin");
      } else {
        setIsChecking(false);
      }
    };
    void checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!supabase) throw new Error("Supabase client not initialized");

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      router.push("/admin");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "ログインに失敗しました";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8e2d2]">
        <RefreshCw className="w-8 h-8 animate-spin text-[#3e2f28]/20" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#e8e2d2]">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-white/50 backdrop-blur-sm border border-[#3e2f28]/10 mb-4">
            <LogIn className="w-8 h-8 text-[#3e2f28]" />
          </div>
          <h1 className="text-3xl font-bold text-[#3e2f28] mb-2 tracking-widest uppercase">
            ADMIN ARCHIVE
          </h1>
          <p className="text-[#3e2f28]/60 italic font-serif">管理者ログイン</p>
        </div>

        <div className="bg-white/40 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-xl relative overflow-hidden">
          <div className="tape -top-2 -left-4 rotate-[-15deg] w-20 h-6 opacity-60"></div>
          <div className="tape -bottom-2 -right-4 rotate-[-15deg] w-20 h-6 opacity-60"></div>

          <form
            onSubmit={(e) => {
              void handleLogin(e);
            }}
            className="space-y-6 relative z-10"
          >
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
              {isLoading ? "認証中..." : "アーカイブに入る"}
            </button>
          </form>
        </div>

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
