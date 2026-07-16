// Se importa la función para crear el cliente de Supabase desde su CDN oficial
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// URL única del proyecto en Supabase — identifica a qué base de datos conectarse
const supabaseUrl = 'https://jkqckwzyfhkycgtsilku.supabase.co';

// Clave pública (anon key) — segura de exponer en el frontend
// El control de acceso real se maneja mediante las políticas RLS en la base de datos
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprcWNrd3p5ZmhreWNndHNpbGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MDk1ODgsImV4cCI6MjA5ODM4NTU4OH0.fnWTmaMFx-Eq7QaPxFtXltIEwgjuka1VpU_Y5hvGDaA';

// Se crea y exporta el cliente — todos los archivos JS lo importan desde aquí
// Esto centraliza la conexión en un solo lugar
export const supabase = createClient(supabaseUrl, supabaseKey);