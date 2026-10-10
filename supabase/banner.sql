-- Ejecutá esto en el SQL Editor de tu panel de Supabase para habilitar el banner de perfil:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url text;
