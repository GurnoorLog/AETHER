import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function Index() {
  const { session } = useAuth();
  const [target, setTarget] = useState<'/(tabs)' | '/onboarding' | '/login' | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!session?.user) {
      setTarget('/login');
      return;
    }
    supabase
      .from('user_profiles')
      .select('onboarding_completed')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (mounted) setTarget(data?.onboarding_completed ? '/(tabs)' : '/onboarding');
      });
    return () => {
      mounted = false;
    };
  }, [session]);

  if (!target) return null;
  return <Redirect href={target} />;
}
