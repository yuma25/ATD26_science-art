import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@app/backend"],
  experimental: {
    // プロジェクトルート外のディレクトリからのインポートを許可します
    externalDir: true,
  },
  /**
   * --- 【アセット最適化設定】 ---
   * Vercelの帯域幅（Bandwidth）を節約し、2回目以降のアクセスを高速化します。
   */
  async headers() {
    return [
      {
        // 3Dモデル、ARターゲット、画像ファイルに対するキャッシュ設定
        source: "/:path*.(glb|mind|png|jpg|jpeg|svg|webp|ico)",
        headers: [
          {
            key: "Cache-Control",
            // 1年間（31,536,000秒）ブラウザにキャッシュを強制します
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
