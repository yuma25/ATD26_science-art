import { SpecimenSettings } from "./types";

export const greatWave: SpecimenSettings = {
  scale: "0.5 0.5 0.5",
  outerAnimation:
    "property: rotation; to: 0 0 360; dur: 25000; easing: linear; loop: true",
  innerAnimation:
    "property: rotation; from: 80 -10 -5; to: 100 10 5; dur: 3000; easing: easeInOutSine; dir: alternate; loop: true",
  minScale: 0.2,
  maxScale: 1.5,
};
