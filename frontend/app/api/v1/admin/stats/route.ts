import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@backend/lib/supabase";
import { CacheService } from "@backend/services/cacheService";

/**
 * 【統計データ取得API】
 * 管理者ダッシュボードで表示するための各種数値（来場者数、デバイス数、発見数など）を集計して返します。
 */

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // --- 準備とセキュリティチェック ---

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DB_CONFIG_MISSING",
            message: "データベースの接続設定が見つかりません",
          },
        },
        { status: 500 },
      );
    }

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "ログインが必要です" },
        },
        { status: 401 },
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    const isEmailUser = user?.app_metadata?.provider === "email";
    const isAnonymous = user?.is_anonymous;

    if (authError || !user || isAnonymous || !isEmailUser) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "管理者権限がありません" },
        },
        { status: 403 },
      );
    }

    // --- リクエスト内容の解析 ---
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "24h";
    const userId = searchParams.get("userId");

    // --- キャッシュの確認 (グローバル統計の場合のみ) ---
    if (!userId) {
      const cacheKey = `stats_global_${period}`;
      const cachedData = await CacheService.get<unknown>(cacheKey);
      if (cachedData) {
        return NextResponse.json({
          success: true,
          data: cachedData,
          fromCache: true,
        });
      }
    }

    // --- データの取得と加工 ---
    let data;
    if (userId) {
      data = await handleUserDetailRequest(userId);
    } else {
      data = await handleGlobalStatsRequest(period);

      // --- キャッシュの保存 (グローバル統計の場合のみ) ---
      const cacheKey = `stats_global_${period}`;
      await CacheService.set(cacheKey, data, 300); // 5分間キャッシュ
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "サーバー内部でエラーが発生しました";
    console.error("Stats API Error:", message);
    return NextResponse.json(
      {
        success: false,
        error: { code: "SERVER_ERROR", message },
      },
      { status: 500 },
    );
  }
}

// 補助関数の戻り値を直接オブジェクトとして返すように修正
async function handleUserDetailRequest(userId: string) {
  if (!supabaseAdmin) throw new Error("Admin client missing");

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .ilike("id", `${userId}%`)
      .limit(1);

    if (!profiles || profiles.length === 0) {
      throw new Error("ユーザーが見つかりません");
    }
    return { userDetails: profiles[0] };
  }

  interface UserBadgeResponse {
    acquired_at: string;
    badges:
      | { name: string; target_index: number }
      | { name: string; target_index: number }[];
  }

  const { data: userBadges } = await supabaseAdmin
    .from("user_badges")
    .select(`acquired_at, badges (name, target_index)`)
    .eq("user_id", userId);

  const typedUserBadges = (userBadges as unknown as UserBadgeResponse[]) || [];

  return {
    userDetails: {
      ...profile,
      created_at: formatToJST(profile.created_at),
      last_seen: profile.last_seen ? formatToJST(profile.last_seen) : null,
      badges: typedUserBadges.map((b) => ({
        acquired_at: formatToJST(b.acquired_at),
        badges: Array.isArray(b.badges)
          ? b.badges[0]
          : b.badges || { name: "不明", target_index: 0 },
      })),
    },
  };
}

async function handleGlobalStatsRequest(period: string) {
  if (!supabaseAdmin) throw new Error("Admin client missing");

  const { data: authUsers, error: authError } =
    await supabaseAdmin.auth.admin.listUsers();
  if (authError) throw authError;

  const adminIds = (authUsers.users || [])
    .filter((u) => u?.app_metadata?.provider === "email" && !u?.is_anonymous)
    .map((u) => u.id);

  const { data: allProfiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, party_size, created_at, last_seen")
    .order("created_at", { ascending: false });

  if (profilesError) throw profilesError;

  const profiles = (allProfiles || []).filter(
    (p) => p?.id && !adminIds.includes(p.id),
  );

  const totalDevices = profiles.length;
  const totalVisitors = (
    profiles as { id: string; party_size: number | null }[]
  ).reduce((acc, curr) => acc + (curr?.party_size || 1), 0);

  const now = new Date();
  let startDate = new Date();
  if (period === "1h") startDate.setHours(now.getHours() - 1);
  else if (period === "all") startDate = new Date(0);
  else startDate.setHours(now.getHours() - 24);

  const { data: allRecentBadges } = await supabaseAdmin
    .from("user_badges")
    .select("acquired_at, user_id")
    .gte("acquired_at", startDate.toISOString());

  const recentBadges = (allRecentBadges || []).filter(
    (b) => b?.user_id && !adminIds.includes(b.user_id),
  );

  const { data: allUserBadges } = await supabaseAdmin
    .from("user_badges")
    .select("user_id");
  const totalBadges = (allUserBadges || []).filter(
    (b) => b?.user_id && !adminIds.includes(b.user_id),
  ).length;

  const hourlyStats = generateTimeSeries(
    period,
    now,
    profiles as { created_at: string }[],
    recentBadges as { acquired_at: string }[],
  );

  const recentUsers = profiles.slice(0, 20).map((p) => ({
    ...p,
    created_at: formatToJST(p.created_at),
    last_seen: p.last_seen ? formatToJST(p.last_seen) : null,
  }));

  return {
    totalVisitors,
    totalDevices,
    totalBadges,
    recentUsers,
    hourlyStats,
    period,
  };
}

/**
 * 【ユーティリティ】日付を日本時間 (JST) の読みやすい形式に変換
 */
function formatToJST(dateStr: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(dateStr));
}

/**
 * 【ユーティリティ】グラフ用の時系列ラベルを作成
 */
function getJSTKey(date: Date, type: "hour" | "day" | "minute") {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const m: Record<string, string> = {};
  parts.forEach((p) => (m[p.type] = p.value));

  if (type === "minute")
    return `${m.year}-${m.month}-${m.day} ${m.hour}:${m.minute}`;
  if (type === "hour") return `${m.year}-${m.month}-${m.day} ${m.hour}:00`;
  return `${m.month}/${m.day}`;
}

/**
 * 【ユーティリティ】統計グラフ用のデータ配列を生成
 */
function generateTimeSeries(
  period: string,
  now: Date,
  profiles: { created_at: string }[],
  badges: { acquired_at: string }[],
) {
  const stats = [];
  let count = 0;
  let interval = 0;
  let type: "minute" | "hour" | "day" = "hour";

  if (period === "1h") {
    count = 60;
    interval = 60000; // 1分
    type = "minute";
  } else if (period === "24h") {
    count = 24;
    interval = 3600000; // 1時間
    type = "hour";
  } else {
    count = 30; // 全期間（直近30日分）
    interval = 86400000; // 1日
    type = "day";
  }

  for (let i = 0; i < count; i++) {
    const d = new Date(now.getTime() - (count - 1 - i) * interval);
    const labelKey = getJSTKey(d, type);

    // ラベルの表示形式（1hなら "HH:mm"、24hなら "HH:00"、allなら "MM/DD"）
    const label = type === "day" ? labelKey : labelKey.split(" ")[1];

    const devices = profiles.filter(
      (p) => getJSTKey(new Date(p.created_at), type) === labelKey,
    ).length;
    const badgeCount = badges.filter(
      (b) => getJSTKey(new Date(b.acquired_at), type) === labelKey,
    ).length;

    stats.push({ hour: label, devices, badges: badgeCount });
  }
  return stats;
}
