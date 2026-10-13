import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { replyTopicAction } from "@/app/actions/communities";
import PostContent from "@/app/components/PostContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const { topicId } = await params;
  const supabase = await createClient();
  const { data: topic } = await supabase.from("community_topics").select("title").eq("id", topicId).maybeSingle();
  return {
    title: topic ? `${topic.title} - Foros Kontakt` : "Tema de Foro - Kontakt",
  };
}

export default async function TemaDetallePage({
  params,
}: {
  params: Promise<{ id: string; topicId: string }>;
}) {
  const { id: communityId, topicId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Obtener comunidad
  const { data: com } = await supabase
    .from("communities")
    .select("id, name")
    .eq("id", communityId)
    .maybeSingle();

  if (!com) notFound();

  // Obtener tema
  const { data: topic } = await supabase
    .from("community_topics")
    .select(`
      id,
      title,
      created_at,
      author:author_id (id, username, display_name, avatar_url)
    `)
    .eq("id", topicId)
    .maybeSingle();

  if (!topic) notFound();

  const author = Array.isArray(topic.author) ? topic.author[0] : topic.author;

  // Obtener posts / respuestas del tema
  const { data: postsData } = await supabase
    .from("community_posts")
    .select(`
      id,
      body,
      created_at,
      author:author_id (id, username, display_name, avatar_url)
    `)
    .eq("topic_id", topicId)
    .order("created_at", { ascending: true });

  const posts = (postsData || []).map((p: any) => ({
    ...p,
    author: Array.isArray(p.author) ? p.author[0] : p.author,
  }));

  return (
    <div style={{ maxWidth: 840, margin: "0 auto" }}>
      {/* Navegación estilo migas de pan */}
      <div style={{ fontSize: 11, marginBottom: 8 }}>
        <Link href="/comunidades">Comunidades</Link> »{" "}
        <Link href={`/comunidades/${communityId}`}>{com.name}</Link> »{" "}
        <span style={{ fontWeight: "bold" }}>{topic.title}</span>
      </div>

      <div className="box">
        <h2>💬 Tema: {topic.title}</h2>
        <div className="box-body" style={{ padding: 0 }}>
          {/* Lista de mensajes estilo clásico foro vBulletin/phpBB */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {posts.map((p: any, idx: number) => {
              const pAuthor = p.author;
              const inicial = pAuthor?.display_name?.[0] || pAuthor?.username?.[0] || "?";
              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    borderBottom: "1px solid var(--borde)",
                    background: idx % 2 === 0 ? "#fdfdfd" : "#f7fafe",
                  }}
                >
                  {/* Info autor a la izquierda */}
                  <div
                    style={{
                      width: 130,
                      padding: 10,
                      borderRight: "1px solid var(--borde)",
                      textAlign: "center",
                      background: "#f3f7fd",
                    }}
                  >
                    <div className="avatar" style={{ width: 44, height: 44, margin: "0 auto 6px", fontSize: 16 }}>
                      {pAuthor?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pAuthor.avatar_url} alt="" />
                      ) : (
                        inicial
                      )}
                    </div>
                    <div style={{ fontWeight: "bold", fontSize: 11 }}>
                      <Link href={`/u/${pAuthor?.username}`}>{pAuthor?.display_name || pAuthor?.username}</Link>
                    </div>
                    <div style={{ fontSize: 10, color: "#666" }}>@{pAuthor?.username}</div>
                  </div>

                  {/* Cuerpo del mensaje */}
                  <div style={{ flex: 1, padding: 10, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: "#888", borderBottom: "1px dotted #ccc", paddingBottom: 4, marginBottom: 8 }}>
                      Publicado el {new Date(p.created_at).toLocaleString()} • #{idx + 1}
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                      <PostContent text={p.body} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Formulario de respuesta rápida */}
          {user ? (
            <div style={{ padding: 12, background: "#f0f4fa", borderTop: "1px solid var(--borde)" }}>
              <h3 style={{ fontSize: 12, margin: "0 0 6px 0" }}>Responder en este tema</h3>
              <form action={replyTopicAction}>
                <input type="hidden" name="community_id" value={communityId} />
                <input type="hidden" name="topic_id" value={topicId} />
                <textarea
                  name="body"
                  rows={4}
                  required
                  placeholder="Escribí tu respuesta..."
                  style={{ width: "100%", fontSize: 11, marginBottom: 6 }}
                />
                <button type="submit" className="btn">
                  Enviar respuesta
                </button>
              </form>
            </div>
          ) : (
            <div style={{ padding: 10, textAlign: "center", fontSize: 11 }}>
              <Link href="/ingresar">Ingresá</Link> para responder en este tema.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
