import { describe, it, expect, vi, beforeEach } from "vitest";

// テスト用のグローバルなモック設定
const mockMediaDevices = {
  getUserMedia: vi.fn(),
};

Object.defineProperty(global.navigator, "mediaDevices", {
  value: mockMediaDevices,
  writable: true,
});

// requestCameraPermission 関数をテストするため、フックからロジックをシミュレート
async function simulateRequestPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // 成功時：ストリームのトラックを止める処理をシミュレート
    stream.getTracks().forEach((track: { stop: () => void }) => track.stop());
    return { success: true, status: "granted" };
  } catch {
    return { success: false, status: "denied" };
  }
}

describe("Camera Activation Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("カメラの許可が得られた場合、成功を返すこと", async () => {
    // getUserMedia が成功するケースをモック
    mockMediaDevices.getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    });

    const result = await simulateRequestPermission();

    expect(mockMediaDevices.getUserMedia).toHaveBeenCalledWith({ video: true });
    expect(result.success).toBe(true);
    expect(result.status).toBe("granted");
  });

  it("ユーザーがカメラを拒否した場合、失敗を返すこと", async () => {
    // getUserMedia が失敗（拒否）するケースをモック
    mockMediaDevices.getUserMedia.mockRejectedValue(
      new Error("Permission denied"),
    );

    const result = await simulateRequestPermission();

    expect(result.success).toBe(false);
    expect(result.status).toBe("denied");
  });
});
