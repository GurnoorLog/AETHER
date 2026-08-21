import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = 'https://svnprtygyjhtnktbiyqv.supabase.co';
const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2bnBydHlneWpodG5rdGJpeXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NzQxMTgsImV4cCI6MjEwMDE1MDExOH0.tCCU3pFTlW0SVLifKs-2PhPWr8J9qhAwFvLQoNclw78';

export const supabase = createClient(url, anon, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'implicit',
  },
});
