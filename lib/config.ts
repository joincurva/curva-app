import Constants from "expo-constants";
const extra = Constants.expoConfig?.extra as
  | { apiUrl?: string; environment?: string; pushDeliveryEnabled?: boolean }
  | undefined;
export const config = {
  apiUrl: extra?.apiUrl ?? "https://joincurva.com",
  environment: extra?.environment ?? "development",
  pushDeliveryEnabled: extra?.pushDeliveryEnabled === true,
};
if (
  config.environment === "production" &&
  config.apiUrl !== "https://joincurva.com"
)
  throw new Error("Production mobile builds must use https://joincurva.com");
