-- ============================================================
-- KONTAKT — SCRIPTS SQL DE SUPABASE
-- ============================================================

-- 1. Ampliar límite de publicaciones a 1000 caracteres (para links, videos e imágenes):
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_body_check;
ALTER TABLE posts ADD CONSTRAINT posts_body_check CHECK (char_length(body) >= 1 AND char_length(body) <= 1000);

-- 2. Habilitar soporte de banner panorámico de perfil:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url text;

-- 3. Bucket de almacenamiento 'avatars' para fotos de perfil y fotos compartidas:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true, 5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 5242880;

-- Políticas de seguridad para storage.objects en el bucket 'avatars':
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'avatars_select') THEN
    CREATE POLICY "avatars_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'avatars_insert_own') THEN
    CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'avatars_update_own') THEN
    CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'avatars_delete_own') THEN
    CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);
  END IF;
END $$;
