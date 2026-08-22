import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import type { CustomerInfo } from 'react-native-purchases';

// Test Store key for development — replace with goog_ key for production
const REVENUECAT_API_KEY = Platform.select({
  android: 'goog_HJXdLvbLcwECBZPJqYoWwwknyVU',
  ios: '',
}) as string;

let configured = false;

export async function configureRevenueCat() {
  if (configured || !REVENUECAT_API_KEY) return;
  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
    configured = true;
  } catch (e) {
    console.warn('[RevenueCat] configure failed:', e);
  }
}

export async function identifyUser(userId: string) {
  try {
    await configureRevenueCat();
    await Purchases.logIn(userId);
  } catch (e) {
    console.warn('[RevenueCat] logIn failed:', e);
  }
}

export async function getEntitlementTier(): Promise<'free' | 'pro' | 'unlimited'> {
  try {
    await configureRevenueCat();
    const info: CustomerInfo = await Purchases.getCustomerInfo();
    if (info.entitlements.active['unlimited']) return 'unlimited';
    if (info.entitlements.active['pro']) return 'pro';
  } catch {
    // not configured or no entitlements
  }
  return 'free';
}

export { Purchases };
