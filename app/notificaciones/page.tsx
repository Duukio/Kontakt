import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  markAllNotificationsReadAction,
  deleteNotificationAction,
} from "./actions";

export const metadata = { title: "Notificaciones - Kontakt" };

export default async function NotificacionesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  const { data: notificationsData } = await supabase
    .from("notifications")
    .select(`
      id,
      type,
      read_at,
      created_at,
      actor:actor_id (
        id,
        username,
        display_name,
        avatar_url
      ),
      post:post_id (
        id,
        body
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const notifs = notificationsData ?? [];
  const noLeidas = notifs.filter((n) => !n.read_at);

  return (
    <div className="cols">
      <div className="col-side">
        <div className="box">
          <h2>Notificaciones</h2>
          <div className="box-body">
            <p><strong>Total:</strong> {notifs.length}</p>
            <p><strong>Sin leer:</strong> {noLeidas.length}</p>

            {noLeidas.length > 0 && (
              <form action={markAllNotificationsReadAction} style={{ marginTop: 10 }}>
                <button type="submit" className="btn" style={{ width: "100%" }}>
                  ✓ Marcar todas leídas
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="col-main">
        <div className="box">
          <h2>Tus novedades recientes ({notifs.length})</h2>
          <div className="box-body">
            {notifs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "#666" }}>
                <p>No tenés notificaciones pendientes.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {notifs.map((n: any) => {
                  const actor = Array.isArray(n.actor) ? n.actor[0] : n.actor;
                  const post = Array.isArray(n.post) ? n.post[0] : n.post;
                  const esNueva = !n.read_at;
                  const fecha = new Date(n.created_at).toLocaleString("es-AR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  });
                  const inicial =
                    actor?.display_name?.charAt(0) || actor?.username?.charAt(0) || "?";

                  let icono = "🔔";
                  let texto = "";

                  if (n.type === "like") {
                    icono = "❤️";
                    texto = "le gustó tu publicación";
                  } else if (n.type === "comment") {
                    icono = "💬";
                    texto = "comentó tu publicación";
                  } else if (n.type === "friend_request") {
                    icono = "👥";
                    texto = "te envió una solicitud de amistad";
                  } else if (n.type === "friend_accepted") {
                    icono = "🤝";
                    texto = "aceptó tu solicitud de amistad";
                  } else if (n.type === "wall_post") {
                    icono = "📝";
                    texto = "escribió en tu muro";
                  } else {
                    texto = `interactuó con vos (${n.type})`;
                  }

                  return (
                    <div
                      key={n.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        background: esNueva ? "#fffde6" : "#fff",
                        border: "1px solid var(--borde)",
                        borderRadius: 2,
                        fontWeight: esNueva ? "bold" : "normal",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{icono}</span>

                      <div
                        className="avatar"
                        style={{ width: 32, height: 32, fontSize: 14, flexShrink: 0 }}
                      >
                        {actor?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={actor.avatar_url} alt="" />
                        ) : (
                          inicial
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0, fontSize: 11 }}>
                        <div>
                          <strong>
                            <Link href={`/u/${actor?.username}`}>
                              {actor?.display_name ?? actor?.username ?? "Alguien"}
                            </Link>
                          </strong>{" "}
                          {texto}
                          {post && (
                            <span style={{ color: "#666", fontStyle: "italic", marginLeft: 4 }}>
                              &quot;{post.body.length > 40 ? `${post.body.slice(0, 40)}...` : post.body}&quot;
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 9, color: "#888", marginTop: 2 }}>{fecha}</div>
                      </div>

                      <form action={deleteNotificationAction}>
                        <input type="hidden" name="notification_id" value={n.id} />
                        <button
                          type="submit"
                          className="mini"
                          style={{ color: "#999" }}
                          title="Eliminar notificación"
                        >
                          ✕
                        </button>
                      </form>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
