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

  // Obtener posts del muro
  const { data: posts } = await supabase
    .from("posts")
    .select(`
      id,
      body,
      created_at,
      author_id,
      profiles:author_id (
        username,
        display_name,
        avatar_url
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
                <Link className="btn" href="/editar-perfil" style={{ display: "block" }}>
                  Editar mi perfil
                </Link>
              ) : user ? (
                <div>
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
                      <p style={{ color: "green", fontWeight: "bold" }}>✓ Son amigos</p>
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
                posts.map((post: any) => {
                  const autor = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
                  const fecha = new Date(post.created_at).toLocaleString("es-AR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  });
                  const puedeBorrar = user && (user.id === post.author_id || user.id === profile.id);

                  return (
                    <div key={post.id} className="post">
                      <div className="post-meta" style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>
                          <strong>
                            <Link href={`/u/${autor?.username}`}>
                              {autor?.display_name ?? autor?.username ?? "Usuario"}
                            </Link>
                          </strong>{" "}
                          escribió el {fecha}:
                        </span>
                        {puedeBorrar && (
                          <form action={deletePost}>
                            <input type="hidden" name="post_id" value={post.id} />
                            <input type="hidden" name="username" value={profile.username} />
                            <button type="submit" className="mini">Borrar</button>
                          </form>
                        )}
                      </div>
                      <div className="post-body">
                        <PostContent text={post.body} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
