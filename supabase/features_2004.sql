-- ============================================================
-- KONTAKT — TABLAS Y MIGRACIONES PARA FUNCIONALIDADES 2004
-- ============================================================

-- 1. TOP 8 AMIGOS (Estilo MySpace)
CREATE TABLE IF NOT EXISTS public.top_friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  position smallint NOT NULL CHECK (position >= 1 AND position <= 8),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, position),
  UNIQUE(user_id, friend_id),
  CHECK (user_id <> friend_id)
);

ALTER TABLE public.top_friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "top_friends_select_all" ON public.top_friends
  FOR SELECT USING (true);

CREATE POLICY "top_friends_insert_owner" ON public.top_friends
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "top_friends_update_owner" ON public.top_friends
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "top_friends_delete_owner" ON public.top_friends
  FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- 2. TESTIMONIOS / LIBRO DE VISITAS (Estilo Orkut)
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) >= 2 AND char_length(body) <= 1500),
  status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (author_id <> recipient_id)
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "testimonials_select" ON public.testimonials
  FOR SELECT USING (
    status = 'accepted' OR 
    (auth.uid() IS NOT NULL AND (auth.uid() = recipient_id OR auth.uid() = author_id))
  );

CREATE POLICY "testimonials_insert" ON public.testimonials
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "testimonials_update_recipient" ON public.testimonials
  FOR UPDATE TO authenticated USING (auth.uid() = recipient_id);

CREATE POLICY "testimonials_delete" ON public.testimonials
  FOR DELETE TO authenticated USING (auth.uid() = recipient_id OR auth.uid() = author_id);


-- 3. COMUNIDADES Y FOROS (Estilo Orkut / Foros 2004)
CREATE TABLE IF NOT EXISTS public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 60),
  description text NOT NULL CHECK (char_length(description) <= 1000),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  avatar_url text,
  category text NOT NULL DEFAULT 'General',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_members (
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.community_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) >= 3 AND char_length(title) <= 120),
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.community_topics(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Comunidades RLS
CREATE POLICY "communities_select_all" ON public.communities FOR SELECT USING (true);
CREATE POLICY "communities_insert_auth" ON public.communities FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "communities_delete_creator" ON public.communities FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Miembros RLS
CREATE POLICY "community_members_select" ON public.community_members FOR SELECT USING (true);
CREATE POLICY "community_members_insert" ON public.community_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "community_members_delete" ON public.community_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Temas/Tópicos RLS
CREATE POLICY "community_topics_select" ON public.community_topics FOR SELECT USING (true);
CREATE POLICY "community_topics_insert" ON public.community_topics FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- Respuestas RLS
CREATE POLICY "community_posts_select" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "community_posts_insert" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);


-- 4. BLOQUEO DE USUARIOS
CREATE TABLE IF NOT EXISTS public.blocks (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, blocked_user_id),
  CHECK (user_id <> blocked_user_id)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_select_own" ON public.blocks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "blocks_insert_own" ON public.blocks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "blocks_delete_own" ON public.blocks FOR DELETE TO authenticated USING (auth.uid() = user_id);
