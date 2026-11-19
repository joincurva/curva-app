import type { ExpoConfig } from "expo/config";

const environment = process.env.CURVA_MOBILE_ENV ?? "development";
const apiUrl =
  process.env.EXPO_PUBLIC_CURVA_API_URL ??
  (environment === "production"
    ? "https://joincurva.com"
    : "http://127.0.0.1:3000");

const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? "b7a63ad8-18de-479a-b1a9-9ea0a8c1a7c1";

const createExpoConfig = (): ExpoConfig => ({
  name: "Curva",
  owner: "joincurva",
  slug: "curva",
  scheme: "curva",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/icon-1024.png",
  ios: {
    bundleIdentifier: "com.joincurva.curva",
    buildNumber: "1",
    supportsTablet: false,
    deploymentTarget: "16.4",
    associatedDomains: ["applinks:joincurva.com"],
    infoPlist: { UIBackgroundModes: [] },
    privacyManifests: { NSPrivacyAccessedAPITypes: [] },
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash.png",
        imageWidth: 180,
        resizeMode: "contain",
        backgroundColor: "#0B1633",
      },
    ],
    "expo-secure-store",
    ["expo-notifications", { enableBackgroundRemoteNotifications: false }],
  ],
  extra: {
    environment,
    apiUrl,
    ...(projectId ? { eas: { projectId } } : {}),
    pushDeliveryEnabled: false,
  },
  experiments: { typedRoutes: true },
});

export default createExpoConfig;
