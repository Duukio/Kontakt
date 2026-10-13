import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createPost,
  deletePost,
  sendFriendRequest,
  acceptFriendship,
  removeFriendship,
} from "./actions";
import PostPublisher from "@/app/components/PostPublisher";
import PostContent from "@/app/components/PostContent";
import PostCard from "@/app/components/PostCard";
import { submitTestimonialAction, deleteTestimonialAction } from "@/app/actions/testimonials";
import { addFriendToTopAction } from "@/app/actions/topFriends";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return {
    title: `${username} - Kontakt`,
  };
}

export default async function PerfilUsuario({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{ error?: string; ok?: string }>;
}) {
  const { username } = await params;
  const { error, ok } = (await searchParams) ?? {};

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Obtener perfil del usuario visitado
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  const esPropio = user?.id === profile.id;

  // Obtener posts del muro con likes y comentarios
  const { data: posts } = await supabase
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
    .eq("wall_owner_id", profile.id)
    .order("created_at", { ascending: false });

  // Si no es el propio usuario y está logueado, chequear amistad
  let amistad: { id: string; requester_id: string; addressee_id: string; status: string } | null = null;
  if (user && !esPropio) {
    const { data } = await supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status")
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
      )
      .maybeSingle();
    amistad = data;
  }

  // Verificar si este usuario ya está en el Top 8 del usuario logueado
  let estaEnMiTop8 = false;
  if (user && !esPropio) {
    const { data: topCheck } = await supabase
      .from("top_friends")
      .select("position")
      .eq("user_id", user.id)
      .eq("friend_id", profile.id)
      .maybeSingle();
    estaEnMiTop8 = Boolean(topCheck);
  }

  // Obtener Top 8 Amigos del perfil
  const { data: topFriendsData } = await supabase
    .from("top_friends")
    .select(`
      position,
      friend:friend_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq("user_id", profile.id)
    .order("position", { ascending: true });

  const topFriends = (topFriendsData || []).map((t: any) => ({
    position: t.position,
    friend: Array.isArray(t.friend) ? t.friend[0] : t.friend,
  }));

  // Obtener testimonios/libro de visitas
  const { data: testimonialsData } = await supabase
    .from("testimonials")
    .select(`
      id,
      body,
      created_at,
      author_id,
      author:author_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq("recipient_id", profile.id)
    .order("created_at", { ascending: false });

  const testimonials = (testimonialsData || []).map((t: any) => ({
    ...t,
    author: Array.isArray(t.author) ? t.author[0] : t.author,
  }));

  const inicial = profile.display_name?.charAt(0) || profile.username.charAt(0);

  return (
    <div className="perfil-custom">
      {profile.custom_css && (
        <style
          dangerouslySetInnerHTML={{
            __html: `.perfil-custom { ${profile.custom_css} }`,
          }}
        />
      )}

      {error && <div className="msg-error" style={{ marginBottom: 12 }}>{error}</div>}
      {ok && <div className="msg-ok" style={{ marginBottom: 12 }}>{ok}</div>}

      {/* Banner de perfil */}
      {profile.banner_url && (
        <div
          className="box"
          style={{
            marginBottom: 12,
            overflow: "hidden",
            padding: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              height: 180,
              background: `#eaf2fc url(${profile.banner_url}) center/cover no-repeat`,
            }}
          />
        </div>
      )}

      <div className="cols">
        {/* Columna Lateral */}
        <div className="col-side">
        <div className="box">
          <h2>Foto de perfil</h2>
          <div className="box-body" style={{ textAlign: "center" }}>
            <div className="avatar" style={{ margin: "0 auto 10px" }}>
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile.display_name} />
              ) : (
                inicial
              )}
            </div>

            <h3 className="perfil-nombre">{profile.display_name}</h3>
            <p className="perfil-usuario">@{profile.username}</p>

            <div style={{ marginTop: 10 }}>
              {esPropio ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <Link className="btn" href="/editar-perfil" style={{ display: "block" }}>
                    Editar mi perfil
                  </Link>
                  <Link
                    className="btn"
                    href={`/fotos?u=${profile.username}`}
                    style={{ display: "block", textAlign: "center" }}
                  >
                    📸 Mi Fotos
                  </Link>
                </div>
              ) : user ? (
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <Link
                      className="btn"
                      href={`/fotos?u=${profile.username}`}
                      style={{ display: "block", textAlign: "center", padding: "2px 6px" }}
                    >
                      📸 Ver Fotos
                    </Link>
                  </div>
                  {!amistad && (
                    <form action={sendFriendRequest}>
                      <input type="hidden" name="to" value={profile.id} />
                      <input type="hidden" name="username" value={profile.username} />
                      <button type="submit" className="btn" style={{ width: "100%" }}>
                        + Agregar a amigos
                      </button>
                    </form>
                  )}

                  {amistad && amistad.status === "pending" && amistad.requester_id === user.id && (
                    <div>
                      <p className="ayuda">Solicitud enviada</p>
                      <form action={removeFriendship}>
                        <input type="hidden" name="friendship_id" value={amistad.id} />
                        <input type="hidden" name="username" value={profile.username} />
                        <button type="submit" className="mini">Cancelar solicitud</button>
                      </form>
                    </div>
                  )}

                  {amistad && amistad.status === "pending" && amistad.addressee_id === user.id && (
                    <div>
                      <p className="ayuda">¡Te envió una solicitud!</p>
                      <form action={acceptFriendship} style={{ marginBottom: 4 }}>
                        <input type="hidden" name="friendship_id" value={amistad.id} />
                        <input type="hidden" name="username" value={profile.username} />
                        <button type="submit" className="btn" style={{ width: "100%" }}>
                          Aceptar solicitud
                        </button>
                      </form>
                      <form action={removeFriendship}>
                        <input type="hidden" name="friendship_id" value={amistad.id} />
                        <input type="hidden" name="username" value={profile.username} />
                        <button type="submit" className="mini">Rechazar</button>
                      </form>
                    </div>
                  )}

                  {amistad && amistad.status === "accepted" && (
                    <div>
                      <p style={{ color: "green", fontWeight: "bold", margin: "4px 0" }}>✓ Son amigos</p>
                      
                      {/* Botón para Añadir o Quitar del Top 8 */}
                      <form action={addFriendToTopAction} style={{ marginBottom: 6 }}>
                        <input type="hidden" name="friend_id" value={profile.id} />
                        <input type="hidden" name="return_path" value={`/u/${profile.username}`} />
                        <button
                          type="submit"
                          className="btn"
                          style={{
                            width: "100%",
                            background: estaEnMiTop8 ? "linear-gradient(#f7e1b5, #e0be75)" : undefined,
                            borderColor: estaEnMiTop8 ? "#c49f48" : undefined,
                            color: estaEnMiTop8 ? "#4a3500" : undefined,
                          }}
                        >
                          {estaEnMiTop8 ? "★ Quitar de mi Top 8" : "★ Añadir a mi Top 8"}
                        </button>
                      </form>

                      <form action={removeFriendship}>
                        <input type="hidden" name="friendship_id" value={amistad.id} />
                        <input type="hidden" name="username" value={profile.username} />
                        <button type="submit" className="mini">Eliminar de amigos</button>
                      </form>
                    </div>
                  )}

                  <div style={{ marginTop: 8 }}>
                    <Link
                      className="btn"
                      href={`/mensajes?carpeta=redactar&para=${encodeURIComponent(profile.username)}`}
                      style={{ display: "block", textAlign: "center", padding: "2px 6px" }}
                    >
                      ✉️ Enviar mensaje
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Ahora estoy escuchando (Música retro de perfil) */}
        {profile.profile_song_url && (
          <div className="box">
            <h2>🎵 Escuchando</h2>
            <div className="box-body" style={{ textAlign: "center" }}>
              <PostContent text={profile.profile_song_url} />
            </div>
          </div>
        )}

        {/* Información personal */}
        <div className="box">
          <h2>Información</h2>
          <div className="box-body">
            <dl className="info">
              {profile.location && (
                <>
                  <dt>Ubicación:</dt>
                  <dd>{profile.location}</dd>
                </>
              )}
              {profile.relationship_status && (
                <>
                  <dt>Situación sentimental:</dt>
                  <dd>{profile.relationship_status}</dd>
                </>
              )}
              {profile.interests && (
                <>
                  <dt>Intereses:</dt>
                  <dd>{profile.interests}</dd>
                </>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Columna Principal */}
      <div className="col-main">
        {error && <div className="msg-error">{error}</div>}
        {ok && <div className="msg-ok">{ok}</div>}

        {profile.bio && (
          <div className="box">
            <h2>Sobre mí</h2>
            <div className="box-body">
              <p style={{ whiteSpace: "pre-wrap" }}>{profile.bio}</p>
            </div>
          </div>
        )}

        {/* Top 8 Amigos (Estilo MySpace) */}
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
              ★ Top 8 Amigos de {profile.display_name}
            </h2>
            {esPropio && (
              <Link href="/amigos/top" style={{ fontSize: 10, color: "#fff", textDecoration: "underline" }}>
                [Editar Top 8]
              </Link>
            )}
          </div>
          <div className="box-body">
            {topFriends.length === 0 ? (
              <div style={{ color: "#777", fontSize: 11, fontStyle: "italic" }}>
                {esPropio ? (
                  <span>
                    No seleccionaste a tus 8 mejores amigos aún.{" "}
                    <Link href="/amigos/top">¡Hacé clic acá para elegirlos!</Link>
                  </span>
                ) : (
                  <span>Este usuario no ha configurado sus Top 8 amigos todavía.</span>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 8,
                  textAlign: "center",
                }}
              >
                {topFriends.map((tf: any) => {
                  const f = tf.friend;
                  if (!f) return null;
                  const fInicial = f.display_name?.[0] || f.username?.[0] || "?";
                  return (
                    <div
                      key={tf.position}
                      style={{
                        background: "#f9fbfe",
                        border: "1px solid #d0ddec",
                        padding: 6,
                        borderRadius: 2,
                      }}
                    >
                      <Link href={`/u/${f.username}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <div
                          className="avatar"
                          style={{
                            width: 50,
                            height: 50,
                            margin: "0 auto 4px",
                            fontSize: 18,
                            border: "1px solid #7f9db9",
                          }}
                        >
                          {f.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={f.avatar_url} alt="" />
                          ) : (
                            fInicial
                          )}
                        </div>
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: 11,
                            color: "var(--azul-osc)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {f.display_name || f.username}
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Testimonios y Libro de visitas (Estilo Orkut) */}
        <div className="box">
          <h2>💌 Libro de Visitas &amp; Testimonios ({testimonials.length})</h2>
          <div className="box-body">
            {/* Formulario para dejar testimonio */}
            {user && !esPropio ? (
              <form action={submitTestimonialAction} style={{ marginBottom: 14 }}>
                <input type="hidden" name="recipient_id" value={profile.id} />
                <input type="hidden" name="recipient_username" value={profile.username} />
                <textarea
                  name="body"
                  rows={3}
                  maxLength={1500}
                  required
                  placeholder={`Escribile un testimonio de amistad o dedicatoria a ${profile.display_name}...`}
                  style={{ width: "100%", fontSize: 11, marginBottom: 4 }}
                />
                <button type="submit" className="mini">
                  💌 Dejar testimonio
                </button>
              </form>
            ) : null}

            {testimonials.length === 0 ? (
              <div style={{ color: "#777", fontSize: 11, fontStyle: "italic" }}>
                Aún no hay testimonios en este perfil.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {testimonials.map((t: any) => (
                  <div
                    key={t.id}
                    style={{
                      background: "#fffdf0",
                      border: "1px solid #f0e7be",
                      padding: 8,
                      borderRadius: 2,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div className="avatar" style={{ width: 26, height: 26, fontSize: 12 }}>
                          {t.author?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={t.author.avatar_url} alt="" />
                          ) : (
                            t.author?.display_name?.[0] || t.author?.username?.[0] || "?"
                          )}
                        </div>
                        <Link href={`/u/${t.author?.username}`} style={{ fontWeight: "bold", fontSize: 11 }}>
                          {t.author?.display_name || t.author?.username}
                        </Link>
                      </div>
                      <div style={{ fontSize: 10, color: "#888" }}>
                        {new Date(t.created_at).toLocaleDateString()}
                        {(user?.id === t.author_id || esPropio) && (
                          <form action={deleteTestimonialAction} style={{ display: "inline", marginLeft: 8 }}>
                            <input type="hidden" name="testimonial_id" value={t.id} />
                            <input type="hidden" name="username" value={profile.username} />
                            <button
                              type="submit"
                              style={{
                                background: "none",
                                border: 0,
                                color: "#c00",
                                fontSize: 10,
                                cursor: "pointer",
                                padding: 0,
                              }}
                            >
                              [borrar]
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, lineHeight: 1.4 }}>
                      <PostContent text={t.body} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Muro */}
        <div className="box">
          <h2>Muro de {profile.display_name}</h2>
          <div className="box-body">
            {user ? (
              <div style={{ marginBottom: 16 }}>
                <PostPublisher
                  action={createPost}
                  userId={user.id}
                  placeholder={`Dejale un mensaje a ${profile.display_name}...`}
                  buttonText="Publicar en el muro"
                  hiddenInputs={[
                    { name: "wall_owner_id", value: profile.id },
                    { name: "username", value: profile.username },
                  ]}
                />
              </div>
            ) : (
              <p>
                <Link href="/ingresar">Ingresá</Link> para escribir en este muro.
              </p>
            )}

            <hr style={{ border: 0, borderTop: "1px solid var(--borde)", margin: "12px 0" }} />

            <div>
              {!posts || posts.length === 0 ? (
                <p style={{ color: "#666" }}>Todavía no hay publicaciones en este muro.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {posts.map((post: any) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={user?.id}
                      path={`/u/${profile.username}`}
                      onDeletePostAction={deletePost}
                      deletePostExtraFields={[{ name: "username", value: profile.username }]}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
