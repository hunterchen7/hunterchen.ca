import { lazy } from "react";

const loadChessboardWatermark = () => import("./models/ChessboardWatermark");
const loadLaptopWatermark = () => import("./models/LaptopWatermark");
const loadRocketWatermark = () => import("./models/RocketWatermark");
const loadCameraWatermark = () =>
  import("./models/ZdogReferenceCameraWatermark");

export const ChessboardWatermark = lazy(loadChessboardWatermark);
export const LaptopWatermark = lazy(loadLaptopWatermark);
export const RocketWatermark = lazy(loadRocketWatermark);
export const CameraWatermark = lazy(loadCameraWatermark);

export function preloadHeroModels() {
  void Promise.allSettled([
    loadChessboardWatermark(),
    loadLaptopWatermark(),
    loadRocketWatermark(),
    loadCameraWatermark(),
  ]);
}
