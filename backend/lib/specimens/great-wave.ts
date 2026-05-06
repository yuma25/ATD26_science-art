import { SpecimenSettings } from "./types";

export const greatWave: SpecimenSettings = {
  // モデルの大きさ（4.5 に少し拡大）
  scale: "4.5 4.5 4.5",
  // モデルの重心補正（サイズに合わせて調整）
  position: "0 -1.5 0",
  // モデルの向き（初期状態で 45度斜めを向かせる）
  rotation: "0 45 0",
  // 全体の回転アニメーション（停止）
  outerAnimation: "",
  // モデル自体の揺れアニメーション
  // 3秒周期で激しくうねるように調整
  innerAnimation:
    "property: rotation; from: -10 40 -10; to: 15 50 10; dur: 3000; easing: easeInOutSine; dir: alternate; loop: true",
  // AR空間でのピンチ操作による最小・最大サイズ制限
  minScale: 0.5,
  maxScale: 15.0,
};
