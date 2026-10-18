import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ypfjzxibzhqehppmxifw.supabase.co';
const supabaseAnonKey = 'sb_publishable_Hq0JjbvwsH0G7Wt0Hq6KLQ_BbCbnvFp';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
