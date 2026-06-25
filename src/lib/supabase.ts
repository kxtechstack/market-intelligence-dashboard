import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vbjfqetudhlgibnqrand.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiamZxZXR1ZGhsZ2libnFyYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Mzk3MzksImV4cCI6MjA5NjExNTczOX0.6XghjVBSe03tZRsRFVa_dNjs1LDIo0QPSaCbgq9sClI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
