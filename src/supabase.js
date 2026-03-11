import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cboiymsirijdnknowyzv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Sq1Wg1tz48rZgQeDoVlqMA_ZbAJDmJY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
