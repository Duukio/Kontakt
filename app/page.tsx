import Link from "next/link";
import { login } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { createFeedPost, deleteFeedPost } from "@/app/feed/actions";
import PostPublisher from "@/app/components/PostPublisher";
import PostCard from "@/app/components/PostCard";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ filtro?: string; p?: string; error?: string; ok?: string }>;
}) {
  const { filtro = "amigos", p = "1", error, ok } = (await searchParams) ?? {};
  const pagina = Math.max(1, parseInt(p, 10) || 1);
  const limit = 15;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Obtener amistades para armar el feed de amigos
    const { data: amistades } = await supabase
      .from("friendships")
      .select("requester_id, addressee_id")
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

    const amigosIds = (amistades || []).map((f) =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    );
    const idsFeed = [user.id, ...amigosIds];

    // Obtener amigos conectados recientemente (últimos 15 minutos)
    const quinceMinutosAtras = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    let amigosOnline: { id: string; username: string; display_name: string | null; avatar_url: string | null; last_seen_at: string | null }[] = [];
    if (amigosIds.length > 0) {
      const { data: onlineData } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, last_seen_at")
        .in("id", amigosIds)
        .gte("last_seen_at", quinceMinutosAtras)
        .order("last_seen_at", { ascending: false })
        .limit(6);
      amigosOnline = onlineData ?? [];
    }

    // Cantidad de solicitudes pendientes para avisarle en la barra lateral
    const { count: solicitudesCount } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("addressee_id", user.id)
      .eq("status", "pending");

    // Cantidad de posts del usuario
    const { count: misPostsCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", user.id);

    // Cargar publicaciones según el filtro
    let query = supabase
      .from("posts")
      .select(`
        id,
        body,
        created_at,
        author_id,
        wall_owner_id,
        author:author_id (
          id,
          username,
          display_name,
          avatar_url
        ),
        wall_owner:wall_owner_id (
          id,
          username,
          display_name
        ),
        likes:likes (user_id),
        comments:comments (
          id,
          author_id,
          body,
          created_at,
          author:author_id (id, username, display_name, avatar_url)
        )
      `)
      .order("created_at", { ascending: false })
      .range((pagina - 1) * limit, pagina * limit - 1);

    if (filtro !== "todos") {
      query = query.in("author_id", idsFeed);
    }

    const { data: posts } = await query;
    const listaPosts = posts ?? [];

    const inicial = profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || "U";

    return (
      <div className="cols">
        {/* Columna Lateral: Tarjeta de Usuario y Atajos */}
        <div className="col-side">
          <div className="box">
            <h2>Mi cuenta</h2>
            <div className="box-body" style={{ textAlign: "center" }}>
              <div className="avatar" style={{ margin: "0 auto 10px" }}>
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt={profile.display_name} />
                ) : (
                  inicial
                )}
              </div>
              <h3 className="perfil-nombre" style={{ margin: "4px 0" }}>{profile?.display_name}</h3>
              <p className="perfil-usuario" style={{ marginBottom: 12 }}>@{profile?.username}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Link className="btn" href={`/u/${profile?.username}`}>
                  Ver mi perfil
                </Link>
                <Link className="btn" href="/editar-perfil">
                  Editar mi perfil / foto
                </Link>
              </div>
            </div>
          </div>

          <div className="box">
            <h2>Mis estadísticas</h2>
            <div className="box-body">
              <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: "1.8" }}>
                <li>
                  👥 <strong>Amigos:</strong>{" "}
                  <Link href="/amigos">{amigosIds.length}</Link>
                </li>
                <li>
                  📝 <strong>Mis posts:</strong> {misPostsCount ?? 0}
                </li>
                {Boolean(solicitudesCount) && (
                  <li style={{ marginTop: 4, background: "#fffbe0", padding: "2px 4px", border: "1px solid #e6db55" }}>
                    🔔 <strong>
                      <Link href="/amigos">¡{solicitudesCount} solicitud{solicitudesCount === 1 ? "" : "es"} pendiente{solicitudesCount === 1 ? "" : "s"}!</Link>
                    </strong>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Amigos En Línea (estilo MSN Messenger / 2004) */}
          <div className="box">
            <h2>🟢 En línea ahora ({amigosOnline.length})</h2>
            <div className="box-body" style={{ fontSize: 11 }}>
              {amigosOnline.length === 0 ? (
                <div style={{ color: "#777", fontStyle: "italic" }}>
                  Ningún amigo conectado en este momento.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {amigosOnline.map((a) => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {a.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.avatar_url}
                          alt={a.username}
                          style={{ width: 22, height: 22, objectFit: "cover", border: "1px solid #7f9db9" }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            background: "#cfdcf5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: "bold",
                            border: "1px solid #7f9db9",
                          }}
                        >
                          {(a.display_name || a.username)[0].toUpperCase()}
                        </div>
                      )}
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <Link href={`/u/${a.username}`} style={{ fontWeight: "bold" }}>
                          {a.display_name || a.username}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Principal: Publicador y Feed */}
        <div className="col-main">
          {error && <div className="msg-error">{error}</div>}
          {ok && <div className="msg-ok">{ok}</div>}

          {/* Caja para Publicar Estado */}
          <div className="box">
            <h2>¿Qué estás pensando hoy?</h2>
            <div className="box-body">
              <PostPublisher
                action={createFeedPost}
                userId={user.id}
                placeholder={`¿Qué hay de nuevo, ${profile?.display_name}? Compartilo con tus amigos...`}
                buttonText="Publicar estado"
              />
            </div>
          </div>

          {/* Feed de Noticias */}
          <div className="box">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "linear-gradient(#6da8ee, var(--azul))",
                padding: "4px 8px",
                borderBottom: "1px solid var(--azul-osc)",
              }}
            >
              <h2 style={{ margin: 0, padding: 0, background: "none", border: 0, color: "#fff" }}>
                Muro de novedades
              </h2>
              <div style={{ fontSize: 10 }}>
                <Link
                  href="/?filtro=amigos"
                  style={{
                    color: filtro === "amigos" ? "#fff" : "#cfdcf5",
                    fontWeight: filtro === "amigos" ? "bold" : "normal",
                    textDecoration: filtro === "amigos" ? "underline" : "none",
                    marginRight: 8,
                  }}
                >
                  Amigos ({amigosIds.length})
                </Link>
                |
                <Link
                  href="/?filtro=todos"
                  style={{
                    color: filtro === "todos" ? "#fff" : "#cfdcf5",
                    fontWeight: filtro === "todos" ? "bold" : "normal",
                    textDecoration: filtro === "todos" ? "underline" : "none",
                    marginLeft: 8,
                  }}
                >
                  Toda la comunidad
                </Link>
              </div>
            </div>

            <div className="box-body">
              {listaPosts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "#666" }}>
                  {filtro === "amigos" ? (
                    <>
                      <p>Todavía no hay publicaciones de tus amigos.</p>
                      <p style={{ marginTop: 8 }}>
                        <Link className="btn" href="/?filtro=todos">
                          Ver publicaciones de la comunidad
                        </Link>{" "}
                        o{" "}
                        <Link className="btn" href="/buscar">
                          Buscar amigos
                        </Link>
                      </p>
                    </>
                  ) : (
                    <p>Todavía no hay publicaciones en la comunidad. ¡Sé el primero en publicar arriba!</p>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {listaPosts.map((post: any) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={user.id}
                        path={`/?filtro=${filtro}&p=${pagina}`}
                        onDeletePostAction={deleteFeedPost}
                      />
                    ))}
                  </div>

                  {/* Paginación */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 14,
                      paddingTop: 8,
                      borderTop: "1px dotted var(--borde)",
                    }}
                  >
                    {pagina > 1 ? (
                      <Link className="btn" href={`/?filtro=${filtro}&p=${pagina - 1}`}>
                        « Anterior
                      </Link>
                    ) : (
                      <span />
                    )}

                    <span style={{ fontSize: 10, color: "#666" }}>Página {pagina}</span>

                    {listaPosts.length === limit ? (
                      <Link className="btn" href={`/?filtro=${filtro}&p=${pagina + 1}`}>
                        Siguiente »
                      </Link>
                    ) : (
                      <span />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vista para usuarios no logueados (Landing retro de Kontakt)
  return (
    <div className="cols">
      <div className="col-side">
        <div className="box">
          <h2>Ingresar</h2>
          <div className="box-body">
            <form action={login}>
              <label htmlFor="email">Email:</label>
              <input type="email" id="email" name="email" required />

              <label htmlFor="password">Contraseña:</label>
              <input type="password" id="password" name="password" required />

              <p style={{ marginTop: 8 }}>
                <button type="submit">Ingresar</button>
              </p>
            </form>
          </div>
        </div>
      </div>

      <div className="col-main">
        <div className="box">
          <h2>Bienvenido a Kontakt</h2>
          <div className="box-body">
            <h1>Mantené el contacto con tus amigos</h1>
            <p>Kontakt te permite:</p>
            <ul>
              <li>Crear tu perfil y personalizarlo a tu gusto</li>
              <li>Agregar amigos y escribir en sus muros</li>
              <li>Compartir tu estado y tus fotos</li>
              <li>Mandar mensajes privados</li>
            </ul>
            <p>
              <Link className="btn" href="/registro">¡Registrate gratis!</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}