import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://jkqckwzyfnkycgtsilku.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcWNrd3p5Zm5reWNndHNpbGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTgwMzIsImV4cCI6MjA1ODczNDAzMn0.fnWTmaMFx-Eq7QaPxFtX1tIEwgjuka1VpU_Y5hvGDaA';

export const supabase = createClient(supabaseUrl, supabaseKey);