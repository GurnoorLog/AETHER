import { useCallback, useEffect, useState } from 'react';
import Purchases from 'react-native-purchases';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { configureRevenueCat } from '@/lib/revenuecat';
import { useAuth } from '@/lib/auth';
import { identifyUser } from '@/lib/revenuecat';

export interface RevenueCatState {
  offerings: PurchasesPackage[];
  customerInfo: CustomerInfo | null;
  loading: boolean;
  purchasing: string | null;
  error: string;
  refresh: () => void;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
}

export function useRevenueCat(): RevenueCatState {
  const { session } = useAuth();
  const [offerings, setOfferings] = useState<PurchasesPackage[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchOfferings = useCallback(async () => {
    try {
      await configureRevenueCat();
      const result = await Purchases.getOfferings();
      const current = result.current;
      setOfferings(current?.availablePackages ?? []);
    } catch {
      // offerings not available yet — products may not be configured in dashboard
    }
  }, []);

  const fetchCustomerInfo = useCallback(async () => {
    try {
      await configureRevenueCat();
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch {
      // ignore
    }
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([fetchOfferings(), fetchCustomerInfo()]).finally(() => setLoading(false));
  }, [fetchOfferings, fetchCustomerInfo]);

  useEffect(() => { refresh(); }, [refresh]);

  // Identify user with Supabase ID when session changes
  useEffect(() => {
    if (session?.user?.id) {
      identifyUser(session.user.id).catch(() => {});
    }
  }, [session?.user?.id]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    setPurchasing(pkg.identifier);
    setError('');
    try {
      const result = await Purchases.purchasePackage(pkg);
      setCustomerInfo(result.customerInfo);
      return true;
    } catch (e: any) {
      if (e?.code === 'PURCHASE_CANCELLED_ERROR' || e?.userCancelled) return false;
      setError(e.message ?? 'Purchase failed. Try again.');
      return false;
    } finally {
      setPurchasing(null);
    }
  }, []);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      const hasEntitlement = info.entitlements.active['pro'] || info.entitlements.active['unlimited'];
      if (!hasEntitlement) setError('No active subscription found to restore.');
      return !!hasEntitlement;
    } catch (e: any) {
      setError(e.message ?? 'Restore failed.');
      return false;
    }
  }, []);

  return { offerings, customerInfo, loading, purchasing, error, refresh, purchasePackage, restorePurchases };
}

export function getTierFromCustomerInfo(info: CustomerInfo | null): 'free' | 'pro' | 'unlimited' {
  if (!info) return 'free';
  if (info.entitlements.active['unlimited']) return 'unlimited';
  if (info.entitlements.active['pro']) return 'pro';
  return 'free';
}
