/**
 * モジュールのインポート
 * ファイル操作、パス操作、そしてGoogle Gemini APIを操作するためのライブラリを読み込みます。
 */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * AIレビューの実行メイン関数
 * GitHub Actions などの CI 環境で動作し、
 * 送信されたコードの差分（diff）をAIが分析してコメントを生成します。
 */
async function review() {
  try {
    // 1. 環境変数から Gemini API キーを取得します
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("AI Review: GEMINI_API_KEY is not set. Skipping review.");
      return;
    }

    // 2. Gemini API を初期化し、使用するモデルを指定します
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. コマンドライン引数から「コードの差分（git diff）」を取得します
    const diff = process.argv[2] || "";
    if (!diff) {
      console.log("AI Review: No diff provided.");
      return;
    }

    // 4. AIへの「プロンプト（指示書）」を作成します
    const prompt = `
      あなたは世界最高峰のソフトウェアエンジニアです。
      以下のコードの変更点（git diff）をレビューしてください。
      
      【レビューの指針】
      - 改善点（バグの可能性、可読性の向上）
      - 称賛すべき点（良い実装、工夫されている点）
      上記を日本語で簡潔に伝えてください。

      ---
      ${diff}
    `;

    // 5. AIに内容を送信し、結果を受け取ります
    const result = await model.generateContent(prompt);
    console.log("--- AI CODE REVIEW ---");
    console.log(result.response.text());
    console.log("-----------------------");
  } catch (e) {
    // レビューに失敗しても、CI（ビルドやデプロイ）自体は止めないようにします
    console.error("AI Review Error:", e.message);
  }
}

// 実行
review();
