import Link from "next/link";
import PostContent from "./PostContent";
import { parseEmoticons } from "@/lib/emoticons";
import {
  toggleLikeAction,
  createCommentAction,
  deleteCommentAction,
} from "@/app/actions/social";

interface PostCardProps {
  post: any;
  currentUserId?: string;
  path: string;
  onDeletePostAction: (formData: FormData) => void | Promise<void>;
  deletePostExtraFields?: { name: string; value: string }[];
}

export default function PostCard({
  post,
  currentUserId,
  path,
  onDeletePostAction,
  deletePostExtraFields = [],
}: PostCardProps) {
  const autor = Array.isArray(post.author) ? post.author[0] : post.author;
  const destinatario = Array.isArray(post.wall_owner)
    ? post.wall_owner[0]
    : post.wall_owner;
  const inicialAutor =
    autor?.display_name?.charAt(0) || autor?.username?.charAt(0) || "?";

  const fecha = new Date(post.created_at).toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const esMuroAjeno =
    post.wall_owner_id &&
    post.wall_owner_id !== post.author_id &&
    destinatario;

  const puedeBorrarPost =
    currentUserId &&
    (currentUserId === post.author_id || currentUserId === post.wall_owner_id);

  // Likes
  const likes: any[] = post.likes ?? [];
  const leDiLike = currentUserId
    ? likes.some((l) => l.user_id === currentUserId)
    : false;
  const cantLikes = likes.length;

  // Comentarios
  const comments: any[] = post.comments ?? [];

  return (
    <div
      className="post"
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "10px 0",
        borderBottom: "1px dotted var(--borde)",
      }}
    >
      {/* Avatar */}
      <div
        className="avatar"
        style={{ width: 44, height: 44, fontSize: 20, flexShrink: 0 }}
      >
        {autor?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={autor.avatar_url} alt="" />
        ) : (
          inicialAutor
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Cabecera del post */}
        <div
          className="post-meta"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            <strong>
              <Link href={`/u/${autor?.username}`}>
                {autor?.display_name ?? autor?.username ?? "Usuario"}
              </Link>
            </strong>
            {esMuroAjeno && (
              <>
                {" "}➔{" "}
                <strong>
                  <Link href={`/u/${destinatario?.username}`}>
                    {destinatario?.display_name ?? destinatario?.username}
                  </Link>
                </strong>
              </>
            )}
            {" "}• <span style={{ color: "#777" }}>{fecha}</span>
          </span>

          {puedeBorrarPost && (
            <form action={onDeletePostAction}>
              <input type="hidden" name="post_id" value={post.id} />
              {deletePostExtraFields.map((f) => (
                <input key={f.name} type="hidden" name={f.name} value={f.value} />
              ))}
              <button
                type="submit"
                className="mini"
                title="Eliminar publicación"
                style={{ color: "#c00" }}
              >
                Borrar
              </button>
            </form>
          )}
        </div>

        {/* Cuerpo del post */}
        <div style={{ marginTop: 4, fontSize: 12 }}>
          <PostContent text={post.body} />
        </div>

        {/* Barra de Me Gusta y Contador */}
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 11,
          }}
        >
          {currentUserId ? (
            <form action={toggleLikeAction}>
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="path" value={path} />
              <button
                type="submit"
                className="mini"
                style={{
                  fontWeight: leDiLike ? "bold" : "normal",
                  color: leDiLike ? "#c00" : "var(--azul-osc)",
                }}
              >
                {leDiLike ? "❤️ Te gusta esto" : "🤍 Me gusta"}
              </button>
            </form>
          ) : null}

          {cantLikes > 0 && (
            <span style={{ color: "#666" }}>
              👍 {cantLikes} {cantLikes === 1 ? "persona" : "personas"}
            </span>
          )}

          <span style={{ color: "#888" }}>
            💬 {comments.length} {comments.length === 1 ? "comentario" : "comentarios"}
          </span>
        </div>

        {/* Sección de Comentarios estilo 2004 */}
        <div
          style={{
            marginTop: 8,
            paddingLeft: 8,
            borderLeft: "2px solid var(--borde)",
            background: "#f9fbfe",
            borderRadius: 2,
            padding: "6px 8px",
          }}
        >
          {comments.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
              {comments.map((c: any) => {
                const autorC = Array.isArray(c.author) ? c.author[0] : c.author;
                const inicialC =
                  autorC?.display_name?.charAt(0) || autorC?.username?.charAt(0) || "?";
                const puedeBorrarC =
                  currentUserId && (currentUserId === c.author_id || puedeBorrarPost);

                return (
                  <div
                    key={c.id}
                    style={{
                      display: "flex",
                      gap: 6,
                      fontSize: 11,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      className="avatar"
                      style={{ width: 22, height: 22, fontSize: 10, flexShrink: 0 }}
                    >
                      {autorC?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={autorC.avatar_url} alt="" />
                      ) : (
                        inicialC
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>
                        <Link href={`/u/${autorC?.username}`}>
                          {autorC?.display_name ?? autorC?.username}
                        </Link>
                      </strong>
                      : <span>{parseEmoticons(c.body)}</span>
                    </div>

                    {puedeBorrarC && (
                      <form action={deleteCommentAction}>
                        <input type="hidden" name="comment_id" value={c.id} />
                        <input type="hidden" name="path" value={path} />
                        <button
                          type="submit"
                          className="mini"
                          style={{ fontSize: 9, color: "#999" }}
                          title="Borrar comentario"
                        >
                          ✕
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Formulario para agregar comentario */}
          {currentUserId ? (
            <form action={createCommentAction} style={{ display: "flex", gap: 4 }}>
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="path" value={path} />
              <input
                type="text"
                name="body"
                placeholder="Escribe un comentario... (máx 300)"
                maxLength={300}
                required
                style={{
                  flex: 1,
                  padding: "2px 6px",
                  fontSize: 11,
                  background: "#fff",
                }}
              />
              <button type="submit" className="btn" style={{ padding: "2px 8px", fontSize: 10 }}>
                Comentar
              </button>
            </form>
          ) : (
            <p style={{ margin: 0, fontSize: 10, color: "#666" }}>
              <Link href="/ingresar">Iniciá sesión</Link> para comentar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
