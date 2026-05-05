import { SpecimenSettings } from "./types";

export const shellcrab: SpecimenSettings = {
  scale: "0.15 0.15 0.15",
  outerAnimation:
    "property: rotation; to: 0 360 0; dur: 20000; easing: linear; loop: true",
  innerAnimation:
    "property: position; to: 0 0.02 0; dur: 3000; easing: easeInOutQuad; dir: alternate; loop: true",
  minScale: 0.1,
  maxScale: 0.3,
};
