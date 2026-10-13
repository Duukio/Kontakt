import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { joinCommunityAction, leaveCommunityAction, createTopicAction } from "@/app/actions/communities";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: com } = await supabase.from("communities").select("name").eq("id", id).maybeSingle();
  return {
    title: com ? `${com.name} - Kontakt` : "Comunidad - Kontakt",
  };
}

export default async function ComunidadDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Obtener datos de la comunidad
  const { data: com } = await supabase
    .from("communities")
    .select(`
      id,
      name,
      description,
      category,
      avatar_url,
      created_at,
      creator_id,
      creator:creator_id (id, username, display_name)
    `)
    .eq("id", id)
    .maybeSingle();

  if (!com) notFound();

  const creator = Array.isArray(com.creator) ? com.creator[0] : com.creator;

  // Cantidad de miembros y verificar membresía del usuario actual
  const { count: miembrosCount } = await supabase
    .from("community_members")
    .select("*", { count: "exact", head: true })
    .eq("community_id", id);

  let esMiembro = false;
  if (user) {
    const { data: m } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("community_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    esMiembro = Boolean(m);
  }

  // Tópicos / Temas de discusión del foro
  const { data: topicsData } = await supabase
    .from("community_topics")
    .select(`
      id,
      title,
      created_at,
      author:author_id (id, username, display_name)
    `)
    .eq("community_id", id)
    .order("created_at", { ascending: false });

  const topics = (topicsData || []).map((t: any) => ({
    ...t,
    author: Array.isArray(t.author) ? t.author[0] : t.author,
  }));

  return (
    <div className="cols">
      {/* Columna Lateral: Info de la comunidad */}
      <div className="col-side">
        <div className="box">
          <h2>Comunidad</h2>
          <div className="box-body" style={{ textAlign: "center" }}>
            <div
              style={{
                width: 90,
                height: 90,
                margin: "0 auto 10px",
                background: "#cfdcf5",
                border: "1px solid #7f9db9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: "bold",
                color: "var(--azul-osc)",
              }}
            >
              {com.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={com.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                com.name.charAt(0).toUpperCase()
              )}
            </div>

            <h3 style={{ margin: "4px 0", fontSize: 13 }}>{com.name}</h3>
            <div style={{ fontSize: 11, color: "#666", marginBottom: 8 }}>
              {com.category} • {miembrosCount ?? 0} miembros
            </div>

            {user && (
              <div style={{ marginTop: 10 }}>
                {esMiembro ? (
                  <form action={leaveCommunityAction}>
                    <input type="hidden" name="community_id" value={com.id} />
                    <button type="submit" className="mini" style={{ width: "100%" }}>
                      Dejar comunidad
                    </button>
                  </form>
                ) : (
                  <form action={joinCommunityAction}>
                    <input type="hidden" name="community_id" value={com.id} />
                    <button type="submit" className="btn" style={{ width: "100%" }}>
                      ＋ Unirme a esta comunidad
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="box">
          <h2>Detalles</h2>
          <div className="box-body" style={{ fontSize: 11 }}>
            <p><strong>Fundador:</strong> <Link href={`/u/${creator?.username}`}>{creator?.display_name || creator?.username}</Link></p>
            <p><strong>Fecha:</strong> {new Date(com.created_at).toLocaleDateString()}</p>
            <p style={{ marginTop: 8, fontStyle: "italic", color: "#444" }}>
              {com.description}
            </p>
          </div>
        </div>
      </div>

      {/* Columna Principal: Foros y Debates */}
      <div className="col-main">
        {/* Formulario para iniciar nuevo tema */}
        {esMiembro ? (
          <div className="box">
            <h2>Iniciar un nuevo tema de discusión</h2>
            <div className="box-body">
              <form action={createTopicAction}>
                <input type="hidden" name="community_id" value={com.id} />
                <label htmlFor="title">Título del tema:</label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  placeholder="Ej: ¿Qué opinan del nuevo disco?"
                  style={{ width: "100%", marginBottom: 6 }}
                />
                <label htmlFor="body">Mensaje inicial:</label>
                <textarea
                  id="body"
                  name="body"
                  rows={3}
                  required
                  placeholder="Escribí tu mensaje o pregunta para el foro..."
                  style={{ width: "100%", marginBottom: 6 }}
                />
                <button type="submit" className="btn">
                  Publicar tema
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="msg-ok" style={{ marginBottom: 12 }}>
            ¡Unite a la comunidad para poder abrir temas y participar en los debates!
          </div>
        )}

        {/* Lista de temas del foro */}
        <div className="box">
          <h2>Foro de discusión ({topics.length} temas)</h2>
          <div className="box-body" style={{ padding: 0 }}>
            {topics.length === 0 ? (
              <div style={{ padding: 12, color: "#666", fontStyle: "italic", textAlign: "center" }}>
                Aún no hay temas creados en este foro.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#e8eff9", borderBottom: "1px solid #c0d3eb", textAlign: "left" }}>
                    <th style={{ padding: "6px 8px" }}>Tema</th>
                    <th style={{ padding: "6px 8px" }}>Iniciado por</th>
                    <th style={{ padding: "6px 8px" }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {topics.map((t: any) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #eef2f7" }}>
                      <td style={{ padding: "8px" }}>
                        <Link href={`/comunidades/${com.id}/tema/${t.id}`} style={{ fontWeight: "bold" }}>
                          💬 {t.title}
                        </Link>
                      </td>
                      <td style={{ padding: "8px" }}>
                        <Link href={`/u/${t.author?.username}`}>
                          {t.author?.display_name || t.author?.username}
                        </Link>
                      </td>
                      <td style={{ padding: "8px", color: "#888", fontSize: 10 }}>
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
