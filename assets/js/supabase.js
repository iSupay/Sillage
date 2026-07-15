import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://jkqckwzyfhkycgtsilku.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcWNrd3p5ZmhreWNndHNpbGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MDk1ODgsImV4cCI6MjA5ODM4NTU4OH0.fnWTmaMFx-Eq7QaPxFtXltIEwgjuka1VpU_Y5hvGDaA';

export const supabase = createClient(supabaseUrl, supabaseKey);