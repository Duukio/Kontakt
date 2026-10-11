-- Ejecutá esto en el SQL Editor de tu panel de Supabase para permitir publicaciones de hasta 1000 caracteres (para que entren links, fotos y videos):
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_body_check;
ALTER TABLE posts ADD CONSTRAINT posts_body_check CHECK (char_length(body) >= 1 AND char_length(body) <= 1000);
