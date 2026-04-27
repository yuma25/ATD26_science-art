"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/backend/lib/supabase";
import {
  Users,
  Award,
  TrendingUp,
  LogOut,
  RefreshCw,
  Clock,
  LayoutDashboard,
  ChevronRight,
  Home,
  Smartphone,
  Calendar,
  Search,
  User,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface Stats {
  totalVisitors: number;
  totalDevices: number;
  totalBadges: number;
  recentUsers: { id: string; party_size: number; created_at: string }[];
  hourlyStats: { hour: string; devices: number; badges: number }[];
  period: string;
}

interface UserDetails {
  id: string;
  party_size: number;
  created_at: string;
  badges?: {
    acquired_at: string;
    badges: { name: string; target_index: number };
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [period, setPeriod] = useState("24h");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchId, setSearchId] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const router = useRouter();
  const isInitialized = useRef(false);

  const fetchStats = useCallback(
    async (isInitial = false) => {
      if (!isInitial) setIsRefreshing(true);
      try {
        const res = await fetch(`/api/admin/stats?period=${period}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setStats(data);
      } catch (err: unknown) {
        console.error("統計データの取得に失敗しました:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [period],
  );

  const initDashboard = useCallback(async () => {
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push("/admin/login");
      return;
    }
    void fetchStats(true);
  }, [router, fetchStats]);

  const searchUser = useCallback(async (id: string) => {
    if (!id) return;
    setIsSearching(true);
    setSearchError("");
    try {
      const res = await fetch(`/api/admin/stats?userId=${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSelectedUser(data.userDetails);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "ユーザーの検索に失敗しました";
      setSearchError(message);
      setSelectedUser(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      void initDashboard();
    }
  }, [initDashboard]);

  // 期間変更時の再取得
  useEffect(() => {
    if (isInitialized.current && !isLoading) {
      void fetchStats();
    }
  }, [period, fetchStats, isLoading]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const handleRefresh = () => {
    void fetchStats();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e8e2d2]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 animate-spin text-[#3e2f28]/40" />
          <p className="text-sm font-data text-[#3e2f28]/60 tracking-widest">
            記録を照合中...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e8e2d2] text-[#3e2f28] font-sans pb-20">
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-[#3e2f28]/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-[#3e2f28] p-1.5 rounded-lg">
                <LayoutDashboard className="w-5 h-5 text-[#e8e2d2]" />
              </div>
              <span className="font-bold tracking-tighter text-lg">
                管理者パネル
              </span>
            </div>
            <button
              onClick={() => router.push("/")}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#3e2f28]/5 text-[#3e2f28]/60 transition-colors text-xs font-bold border border-[#3e2f28]/10"
            >
              <Home className="w-3.5 h-3.5" />
              メイン画面を表示
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/")}
              className="md:hidden p-2 rounded-lg hover:bg-[#3e2f28]/5 text-[#3e2f28]/60"
            >
              <Home className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors text-xs font-bold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">ログアウト</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Search className="w-5 h-5" />
              探索者の個別照会
            </h2>
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="ユーザーIDを入力 (例: 8e5f...)"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && void searchUser(searchId)
                }
                className="w-full bg-white border border-[#3e2f28]/10 rounded-xl py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#3e2f28]/20 transition-all font-mono text-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3e2f28]/40" />
              {isSearching && (
                <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#3e2f28]/40 animate-spin" />
              )}
            </div>
          </div>

          {(selectedUser || searchError) && (
            <div className="bg-white rounded-2xl border border-[#3e2f28]/10 shadow-lg p-6 relative animate-in fade-in slide-in-from-top-4">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setSearchError("");
                }}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#3e2f28]/40" />
              </button>
              {searchError ? (
                <div className="flex items-center gap-3 text-red-600">
                  <AlertCircle className="w-5 h-5" />
                  <p className="font-bold">{searchError}</p>
                </div>
              ) : (
                selectedUser && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 bg-blue-50 rounded-full flex-shrink-0 flex items-center justify-center text-blue-600">
                          <User className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-[#3e2f28]/40 uppercase tracking-widest">
                            User ID
                          </p>
                          <p className="font-mono text-[10px] sm:text-xs font-bold whitespace-nowrap overflow-x-auto pb-1 scrollbar-hide">
                            {selectedUser.id}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <p className="text-[10px] font-bold text-[#3e2f28]/40 uppercase mb-1">
                            来場人数
                          </p>
                          <p className="text-xl font-black">
                            {selectedUser.party_size || 1}名
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl">
                          <p className="text-[10px] font-bold text-[#3e2f28]/40 uppercase mb-1">
                            登録日
                          </p>
                          <p className="text-sm font-bold">
                            {new Date(
                              selectedUser.created_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-4">
                      <h3 className="font-bold flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500" />
                        発見済み標本 ({selectedUser.badges?.length || 0})
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedUser.badges &&
                        selectedUser.badges.length > 0 ? (
                          selectedUser.badges.map((b, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3 bg-white border border-[#3e2f28]/5 rounded-xl"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 text-xs font-bold">
                                  #{b.badges.target_index}
                                </div>
                                <div>
                                  <p className="text-sm font-bold">
                                    {b.badges.name}
                                  </p>
                                  <p className="text-[10px] text-[#3e2f28]/40">
                                    {new Date(b.acquired_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-[#3e2f28]/40 italic">
                            まだ標本を発見していません
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4 lg:order-2">
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#3e2f28]/40" />
              最近の探索者
            </h2>
            <div className="bg-white rounded-2xl border border-[#3e2f28]/10 shadow-sm divide-y divide-[#3e2f28]/5 max-h-[400px] lg:max-h-[800px] overflow-y-auto">
              {stats?.recentUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setSearchId(u.id);
                    void searchUser(u.id);
                  }}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-[#3e2f28]/40 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[9px] sm:text-[10px] font-bold text-[#3e2f28]/40 tracking-tight leading-none mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                        ID: {u.id}
                      </p>
                      <p className="text-xs font-bold flex items-center gap-2">
                        <span>{u.party_size || 1}名</span>
                        <span className="text-[10px] text-[#3e2f28]/30 font-normal">
                          {new Date(u.created_at).toLocaleTimeString()}
                        </span>
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#3e2f28]/20 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6 lg:order-1">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <h2 className="text-2xl font-black tracking-tight">全体統計</h2>
              <div className="flex bg-white rounded-xl border border-[#3e2f28]/10 p-1 shadow-sm">
                {["24h", "7d", "all"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${period === p ? "bg-[#3e2f28] text-white" : "text-[#3e2f28]/40 hover:text-[#3e2f28]"}`}
                  >
                    {p === "24h" ? "24時間" : p === "7d" ? "7日間" : "全期間"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatsCard
                label="総来場者数"
                value={`${stats?.totalVisitors || 0} 名`}
                icon={<Users className="w-5 h-5" />}
                color="blue"
              />
              <StatsCard
                label="総探索デバイス数"
                value={`${stats?.totalDevices || 0} 台`}
                icon={<Smartphone className="w-5 h-5" />}
                color="purple"
              />
              <StatsCard
                label="標本発見数"
                value={`${stats?.totalBadges || 0} 件`}
                icon={<Award className="w-5 h-5" />}
                color="amber"
              />
              <StatsCard
                label="平均発見率"
                value={
                  stats
                    ? `${(stats.totalBadges / Math.max(1, stats.totalDevices)).toFixed(1)} 件/台`
                    : "-"
                }
                icon={<TrendingUp className="w-5 h-5" />}
                color="green"
              />
            </div>

            <div className="bg-white rounded-2xl border border-[#3e2f28]/10 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-[#3e2f28]/5 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <h3 className="font-bold flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    アクティビティ推移
                  </h3>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-1 rounded-lg hover:bg-[#3e2f28]/5 text-[#3e2f28]/40 transition-all disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>
              </div>
              <div className="p-4 md:p-6 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats?.hourlyStats}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorDevices"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3b82f6"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3b82f6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorBadges"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#f59e0b"
                          stopOpacity={0.15}
                        />
                        <stop
                          offset="95%"
                          stopColor="#f59e0b"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#000"
                      strokeOpacity={0.05}
                    />
                    <XAxis
                      dataKey="hour"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#3e2f28",
                        opacity: 0.5,
                        fontSize: 10,
                        fontWeight: "bold",
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: "#3e2f28",
                        opacity: 0.5,
                        fontSize: 10,
                        fontWeight: "bold",
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="devices"
                      name="デバイス"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#colorDevices)"
                    />
                    <Area
                      type="monotone"
                      dataKey="badges"
                      name="発見"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fill="url(#colorBadges)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatsCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "amber" | "purple" | "green";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#3e2f28]/10 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-[#3e2f28]/50 uppercase tracking-widest flex items-center gap-1">
          {label}
        </p>
        <h3 className="text-xl md:text-2xl font-black tracking-tight tabular-nums">
          {value}
        </h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClasses[color]}`}>{icon}</div>
    </div>
  );
}
