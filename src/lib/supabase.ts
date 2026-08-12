import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://db-test.152-228-233-227.sslip.io';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJyb2xlIjogImFub24iLCAiaXNzIjogInN1cGFiYXNlIiwgImlhdCI6IDE3ODYzNjMzMTYsICJleHAiOiAyMTAxNzIzMzE2fQ.cwTQhaH-vRoOSIV0j2Ji4weU9J0scTtliWQZ6wbq_X4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
