import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/backend/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase admin client not initialized" },
        { status: 500 },
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "24h";
    const userId = searchParams.get("userId");

    // --- 💡 個別ユーザーの照会モード ---
    if (userId) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        const { data: profiles, error: searchError } = await supabaseAdmin
          .from("profiles")
          .select("*")
          .ilike("id", `${userId}%`)
          .limit(1);

        if (searchError || !profiles || profiles.length === 0) {
          return NextResponse.json(
            { error: "ユーザーが見つかりません" },
            { status: 404 },
          );
        }
        return NextResponse.json({ userDetails: profiles[0] });
      }

      const { data: userBadges, error: userBadgesError } = await supabaseAdmin
        .from("user_badges")
        .select(
          `
          acquired_at,
          badges (
            name,
            target_index
          )
        `,
        )
        .eq("user_id", userId);

      if (userBadgesError) throw userBadgesError;

      return NextResponse.json({
        userDetails: {
          ...profile,
          badges: userBadges,
        },
      });
    }

    // --- 💡 通常の統計モード ---
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, party_size, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;

    const totalDevices = profiles.length;
    const totalVisitors = profiles.reduce(
      (acc, curr) => acc + (curr.party_size || 1),
      0,
    );
    const recentUsers = profiles.slice(0, 20);

    const { count: totalBadges, error: badgesError } = await supabaseAdmin
      .from("user_badges")
      .select("*", { count: "exact", head: true });

    if (badgesError) throw badgesError;

    const now = new Date();
    let startDate = new Date();
    if (period === "7d") startDate.setDate(now.getDate() - 7);
    else if (period === "all") startDate = new Date(0);
    else startDate.setHours(now.getHours() - 24);

    const { data: recentBadges, error: recentBadgesError } = await supabaseAdmin
      .from("user_badges")
      .select("acquired_at, user_id")
      .gte("acquired_at", startDate.toISOString());

    if (recentBadgesError) throw recentBadgesError;

    const hourlyStats = [];
    if (period === "24h") {
      for (let i = 0; i < 24; i++) {
        const d = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
        const hourLabel = `${d.getHours()}:00`;
        const devices = profiles.filter(
          (p) =>
            new Date(p.created_at).getHours() === d.getHours() &&
            new Date(p.created_at) > startDate,
        ).length;
        const badges =
          recentBadges?.filter(
            (b) => new Date(b.acquired_at).getHours() === d.getHours(),
          ).length || 0;
        hourlyStats.push({ hour: hourLabel, devices, badges });
      }
    } else {
      const days = period === "7d" ? 7 : 30;
      for (let i = 0; i < days; i++) {
        const d = new Date(
          now.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000,
        );
        const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
        const devices = profiles.filter(
          (p) => new Date(p.created_at).toDateString() === d.toDateString(),
        ).length;
        const badges =
          recentBadges?.filter(
            (b) => new Date(b.acquired_at).toDateString() === d.toDateString(),
          ).length || 0;
        hourlyStats.push({ hour: dateLabel, devices, badges });
      }
    }

    return NextResponse.json({
      totalVisitors,
      totalDevices,
      totalBadges,
      recentUsers,
      hourlyStats,
      period,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Stats API Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
