import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptFriendshipAction, removeFriendshipAction } from "./actions";

export const metadata = { title: "Mis amigos - Kontakt" };

export default async function AmigosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/ingresar");
  }

  // Solicitudes recibidas pendientes
  const { data: recibidasData } = await supabase
    .from("friendships")
    .select(`
      id,
      created_at,
      requester:requester_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Solicitudes enviadas pendientes
  const { data: enviadasData } = await supabase
    .from("friendships")
    .select(`
      id,
      created_at,
      addressee:addressee_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .eq("requester_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Amigos aceptados
  const { data: amistadesData } = await supabase
    .from("friendships")
    .select(`
      id,
      requester_id,
      addressee_id,
      created_at,
      requester:requester_id (
        id,
        username,
        display_name,
        avatar_url,
        bio
      ),
      addressee:addressee_id (
        id,
        username,
        display_name,
        avatar_url,
        bio
      )
    `)
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const amigos = (amistadesData || []).map((f: any) => {
    const raw = f.requester_id === user.id ? f.addressee : f.requester;
    const info = Array.isArray(raw) ? raw[0] : raw;
    return {
      friendshipId: f.id,
      ...info,
    };
  });

  const solicitudesRecibidas = recibidasData || [];
  const solicitudesEnviadas = enviadasData || [];

  return (
    <div className="cols">
      {/* Columna Lateral: Resumen y Solicitudes */}
      <div className="col-side">
        <div className="box">
          <h2>Amigos en Kontakt</h2>
          <div className="box-body">
            <p><strong>Total de amigos:</strong> {amigos.length}</p>
            <p>
              <Link className="btn" href="/buscar" style={{ display: "block", textAlign: "center" }}>
                🔍 Buscar más personas
              </Link>
            </p>
          </div>
        </div>

        {/* Solicitudes de amistad recibidas */}
        {solicitudesRecibidas.length > 0 && (
          <div className="box">
            <h2>Solicitudes pendientes ({solicitudesRecibidas.length})</h2>
            <div className="box-body">
              {solicitudesRecibidas.map((req: any) => {
                const solicitante = Array.isArray(req.requester) ? req.requester[0] : req.requester;
                const inicial = solicitante?.display_name?.charAt(0) || solicitante?.username?.charAt(0) || "?";

                return (
                  <div
                    key={req.id}
                    style={{
                      borderBottom: "1px dotted var(--borde)",
                      paddingBottom: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <div className="avatar" style={{ width: 36, height: 36, fontSize: 16 }}>
                        {solicitante?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={solicitante.avatar_url} alt="" />
                        ) : (
                          inicial
                        )}
                      </div>
                      <div>
                        <strong>
                          <Link href={`/u/${solicitante?.username}`}>{solicitante?.display_name}</Link>
                        </strong>
                        <div style={{ fontSize: 10, color: "#666" }}>@{solicitante?.username}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 4 }}>
                      <form action={acceptFriendshipAction} style={{ flex: 1 }}>
                        <input type="hidden" name="friendship_id" value={req.id} />
                        <button type="submit" className="btn" style={{ width: "100%", padding: "2px 6px" }}>
                          Aceptar
                        </button>
                      </form>
                      <form action={removeFriendshipAction}>
                        <input type="hidden" name="friendship_id" value={req.id} />
                        <button type="submit" className="mini" style={{ padding: "4px 6px" }}>
                          Rechazar
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Solicitudes enviadas */}
        {solicitudesEnviadas.length > 0 && (
          <div className="box">
            <h2>Solicitudes enviadas ({solicitudesEnviadas.length})</h2>
            <div className="box-body">
              {solicitudesEnviadas.map((req: any) => {
                const destinatario = Array.isArray(req.addressee) ? req.addressee[0] : req.addressee;

                return (
                  <div
                    key={req.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px dotted var(--borde)",
                      paddingBottom: 4,
                      marginBottom: 4,
                    }}
                  >
                    <span>
                      <Link href={`/u/${destinatario?.username}`}>
                        {destinatario?.display_name || destinatario?.username}
                      </Link>
                    </span>
                    <form action={removeFriendshipAction}>
                      <input type="hidden" name="friendship_id" value={req.id} />
                      <button type="submit" className="mini">Cancelar</button>
                    </form>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Columna Principal: Lista de Amigos */}
      <div className="col-main">
        <div className="box">
          <h2>Todos mis amigos ({amigos.length})</h2>
          <div className="box-body">
            {amigos.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p>Todavía no agregaste amigos a tu lista.</p>
                <p>
                  <Link className="btn" href="/buscar">
                    Buscar amigos en Kontakt
                  </Link>
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 12,
                }}
              >
                {amigos.map((amigo: any) => {
                  const inicial = amigo?.display_name?.charAt(0) || amigo?.username?.charAt(0) || "?";

                  return (
                    <div
                      key={amigo.friendshipId}
                      style={{
                        border: "1px solid var(--borde)",
                        padding: 8,
                        background: "#fff",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                      }}
                    >
                      <div className="avatar" style={{ width: 80, height: 80, fontSize: 36, marginBottom: 6 }}>
                        {amigo?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={amigo.avatar_url} alt="" />
                        ) : (
                          inicial
                        )}
                      </div>

                      <strong>
                        <Link href={`/u/${amigo?.username}`} style={{ fontSize: 12 }}>
                          {amigo?.display_name}
                        </Link>
                      </strong>
                      <span style={{ fontSize: 10, color: "#666", marginBottom: 6 }}>
                        @{amigo?.username}
                      </span>

                      {amigo?.bio && (
                        <p style={{ fontSize: 10, color: "#444", marginBottom: 8, fontStyle: "italic" }}>
                          {amigo.bio.length > 50 ? `${amigo.bio.slice(0, 50)}...` : amigo.bio}
                        </p>
                      )}

                      <div style={{ marginTop: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                        <Link className="btn" href={`/u/${amigo?.username}`} style={{ fontSize: 10, padding: "2px 8px" }}>
                          Ver muro
                        </Link>
                        <form action={removeFriendshipAction}>
                          <input type="hidden" name="friendship_id" value={amigo.friendshipId} />
                          <button
                            type="submit"
                            className="mini"
                            title="Eliminar de mi lista de amigos"
                            style={{ fontSize: 10 }}
                          >
                            Eliminar
                          </button>
                        </form>
                      </div>
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
