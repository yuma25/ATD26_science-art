"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, signInAnonymously } from "../backend/lib/supabase";
import { Badge } from "../backend/types";
import { BadgeService } from "../backend/services/badgeService";

/**
 * A-Frame 要素のための型定義
 */
interface ASceneElement extends HTMLElement {
  pause: () => void;
  hasLoaded: boolean;
  systems: {
    "mindar-image-system"?: {
      start: () => void;
    };
  };
}

export const useAR = () => {
  const [status, setStatus] = useState<"init" | "loading" | "started">("init");
  const [isFound, setIsFound] = useState(false);
  const [progress, setProgress] = useState(0);
  const [acquired, setAcquired] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [activeBadge, setActiveBadge] = useState<Badge | null>(null);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);

  const arContainerRef = useRef<HTMLDivElement>(null);
  const sceneInjectedRef = useRef(false);
  const progressRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const acquiredRef = useRef(false);
  const acquiredBadgeIdsRef = useRef<string[]>([]);

  const cleanupAR = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const sceneEl = document.querySelector("a-scene") as ASceneElement | null;
    if (sceneEl) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const el = sceneEl as any;
        if (typeof el.pause === "function") el.pause();
      } catch {
        /* ignore */
      }
      sceneEl.remove();
    }
    document.querySelectorAll("video").forEach((v) => {
      try {
        const stream = v.srcObject as MediaStream | null;
        if (stream) stream.getTracks().forEach((t) => t.stop());
      } catch {
        /* ignore */
      }
      v.remove();
    });
  }, []);

  const handleSuccess = useCallback(async (badgeId: string) => {
    if (acquiredRef.current) return;

    setAcquired(true);
    acquiredRef.current = true;
    acquiredBadgeIdsRef.current.push(badgeId);
    setShowSuccess(true);

    const userRes = await supabase?.auth.getUser();
    if (userRes?.data.user) {
      await BadgeService.acquireBadge(userRes.data.user.id, badgeId);
    }
  }, []);

  const startProgress = useCallback(
    (badgeId: string) => {
      if (acquiredRef.current || progressRef.current >= 100) return;

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        progressRef.current += 2;
        setProgress(Math.floor(progressRef.current));
        if (progressRef.current >= 100) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSuccess(badgeId);
        }
      }, 30);
    },
    [handleSuccess],
  );

  const resetProgress = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!acquiredRef.current) {
      progressRef.current = 0;
      setProgress(0);
    }
  }, []);

  const setupListeners = useCallback(() => {
    const targets = document.querySelectorAll("[mindar-image-target]");
    const ghostEl = document.querySelector("#ghost");

    targets.forEach((targetEl) => {
      // ターゲットのインデックスを取得
      const targetIndexAttr = targetEl.getAttribute("mindar-image-target");
      const match = targetIndexAttr?.match(/targetIndex:\s*(\d+)/);
      if (!match) return;
      const index = parseInt(match[1]);

      targetEl.addEventListener("targetFound", () => {
        const badge = allBadges.find((b) => b.target_index === index);
        if (!badge) return;

        setActiveBadge(badge);
        setIsFound(true);
        ghostEl?.setAttribute("visible", "false");
        document
          .querySelector(`#model-container-${index}`)
          ?.setAttribute("visible", "true");

        const alreadyHad = acquiredBadgeIdsRef.current.includes(badge.id);
        setAcquired(alreadyHad);
        acquiredRef.current = alreadyHad;

        if (!alreadyHad) startProgress(badge.id);
      });

      targetEl.addEventListener("targetLost", () => {
        setIsFound(false);
        ghostEl?.setAttribute("visible", "true");
        document
          .querySelector(`#model-container-${index}`)
          ?.setAttribute("visible", "false");
        resetProgress();
      });
    });
  }, [allBadges, startProgress, resetProgress]);

  useEffect(() => {
    const init = async () => {
      const user = await signInAnonymously();
      if (user && supabase) {
        const [badges, myAcquiredIds] = await Promise.all([
          BadgeService.getAllBadges(),
          BadgeService.getAcquiredBadgeIds(user.id),
        ]);
        setAllBadges(badges);
        acquiredBadgeIdsRef.current = myAcquiredIds;
      }
    };
    init();
    return () => cleanupAR();
  }, [cleanupAR]);

  const startAR = async () => {
    setStatus("loading");
    try {
      const load = (src: string) =>
        new Promise((res, rej) => {
          if (document.querySelector(`script[src="${src}"]`)) return res(true);
          const s = document.createElement("script");
          s.src = src;
          s.onload = res;
          s.onerror = rej;
          document.head.appendChild(s);
        });
      await load("https://aframe.io/releases/1.5.0/aframe.min.js");
      await load(
        "https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.2.0/dist/aframe-extras.min.js",
      );
      await load(
        "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js",
      );
      setStatus("started");
    } catch {
      setStatus("init");
    }
  };

  useEffect(() => {
    if (
      status === "started" &&
      arContainerRef.current &&
      !sceneInjectedRef.current &&
      allBadges.length > 0
    ) {
      sceneInjectedRef.current = true;

      // 💡 DBにあるバッジデータの target_index に基づいて動的にエンティティを生成
      const targetEntities = allBadges
        .map(
          (badge) => `
        <a-entity mindar-image-target="targetIndex: ${badge.target_index}">
          <a-entity id="model-container-${badge.target_index}" visible="false">
            <a-entity animation="property: rotation; to: 0 0 360; dur: 12000; easing: linear; loop: true">
              <a-entity position="0.5 0 0.4">
                <a-entity animation="property: rotation; from: 90 -20 -15; to: 90 20 15; dur: 4000; easing: easeInOutSine; dir: alternate; loop: true">
                  <a-gltf-model src="#m" scale="2.5 2.5 2.5" animation-mixer="clip: *; loop: repeat; timeScale: 1.2"></a-gltf-model>
                </a-entity>
              </a-entity>
            </a-entity>
          </a-entity>
        </a-entity>
      `,
        )
        .join("");

      arContainerRef.current.innerHTML = `
        <a-scene mindar-image="imageTargetSrc: /targets.mind; autoStart: false; uiLoading: no; uiScanning: no;" color-space="sRGB" renderer="colorManagement: true, physicallyCorrectLights: true, exposure: 1.5, alpha: true" vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false" loading-screen="enabled: false" embedded style="width: 100%; height: 100%;">
          <a-assets><a-asset-item id="m" src="/butterfly.glb"></a-asset-item></a-assets>
          <a-camera position="0 0 0" look-controls="enabled: false">
            <a-entity id="ghost" position="0 0 -0.8" visible="true">
              <a-gltf-model src="#m" scale="0.08 0.08 0.08" opacity="0.3" animation="property: rotation; to: 0 360 0; dur: 10000; easing: linear; loop: true"></a-gltf-model>
            </a-entity>
          </a-camera>
          ${targetEntities}
        </a-scene>
      `;

      const sceneEl = arContainerRef.current.querySelector(
        "a-scene",
      ) as ASceneElement | null;

      const boot = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((sceneEl as any)?.systems?.["mindar-image-system"]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (sceneEl as any).systems["mindar-image-system"].start();
        }
        setTimeout(() => window.dispatchEvent(new Event("resize")), 2000);
        setTimeout(() => {
          if (document.querySelector("a-scene")) {
            window.dispatchEvent(new Event("resize"));
            setupListeners();
          }
        }, 3000);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((sceneEl as any)?.hasLoaded) boot();
      else sceneEl?.addEventListener("loaded", boot);
    }
  }, [status, allBadges, setupListeners]);

  const navigateHome = useCallback(() => {
    setIsExiting(true);
    cleanupAR();
    setTimeout(() => {
      window.location.href = "/";
    }, 300);
  }, [cleanupAR]);

  return {
    status,
    isFound,
    progress,
    acquired,
    showSuccess,
    isExiting,
    activeBadge,
    arContainerRef,
    startAR,
    navigateHome,
    setShowSuccess,
  };
};
