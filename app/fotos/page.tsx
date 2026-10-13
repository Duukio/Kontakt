import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deletePhotoAction } from "./actions";
import PhotoUploader from "./PhotoUploader";
import { parseEmoticons } from "@/lib/emoticons";

export const metadata = { title: "Fotolog - Kontakt" };

export default async function FotosPage({
  searchParams,
}: {
  searchParams?: Promise<{ u?: string; foto?: string; error?: string; ok?: string }>;
}) {
  const { u, foto: fotoId, error, ok } = (await searchParams) ?? {};

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si se especificó un usuario por username
  let targetProfile: any = null;
  if (u) {
    const { data: p } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("username", u)
      .maybeSingle();
    targetProfile = p;
  } else if (user) {
    const { data: p } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    targetProfile = p;
  }

  // Consulta de fotos
  let query = supabase
    .from("photos")
    .select(`
      id,
      url,
      caption,
      created_at,
      owner_id,
      owner:owner_id (
        id,
        username,
        display_name,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false });

  if (targetProfile) {
    query = query.eq("owner_id", targetProfile.id);
  }

  const { data: photosData } = await query.limit(30);
  const fotos = (photosData ?? []).map((f) => {
    const ownerObj = Array.isArray(f.owner) ? f.owner[0] : f.owner;
    return {
      ...f,
      owner: ownerObj as { id: string; username: string; display_name: string | null; avatar_url: string | null } | null,
    };
  });

  // Foto seleccionada actualmente (por fotoId o la más reciente)
  const fotoActual = fotoId
    ? fotos.find((f) => f.id === fotoId) || fotos[0]
    : fotos[0];

  const esMiFotolog = user && targetProfile && user.id === targetProfile.id;

  return (
    <div className="cols">
      {/* Columna lateral: Datos del Fotolog y subida */}
      <div className="col-side">
        <div className="box">
          <h2>Fotos</h2>
          <div className="box-body">
            {targetProfile ? (
              <div style={{ textAlign: "center" }}>
                <p>
                  <strong>
                    <Link href={`/u/${targetProfile.username}`}>{targetProfile.display_name}</Link>
                  </strong>
                </p>
                <p className="ayuda">@{targetProfile.username}</p>
                <p><strong>Total de fotos:</strong> {fotos.length}</p>
                {!esMiFotolog && user && (
                  <p>
                    <Link className="btn" href="/fotos">
                      Ver mis fotos
                    </Link>
                  </p>
                )}
              </div>
            ) : (
              <p>Fotos recientes de toda la comunidad de Kontakt.</p>
            )}
          </div>
        </div>

        {/* Formulario de subida si es tu propio fotolog */}
        {user && (!targetProfile || esMiFotolog) && (
          <div className="box">
            <h2>Subir nueva foto</h2>
            <div className="box-body">
              <PhotoUploader userId={user.id} />
            </div>
          </div>
        )}
      </div>

      {/* Columna principal: Foto destacada e historial */}
      <div className="col-main">
        {error && <div className="msg-error">{error}</div>}
        {ok && <div className="msg-ok">{ok}</div>}

        {fotoActual ? (
          <div className="box">
            <h2>
              Foto de{" "}
              {fotoActual.owner?.display_name ?? fotoActual.owner?.username ?? "Usuario"}
            </h2>
            <div className="box-body" style={{ textAlign: "center" }}>
              {/* Marco clásico Fotolog */}
              <div
                style={{
                  background: "#fff",
                  border: "2px solid #333",
                  padding: 8,
                  display: "inline-block",
                  maxWidth: "100%",
                  boxShadow: "3px 3px 6px rgba(0,0,0,0.2)",
                  marginBottom: 12,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fotoActual.url}
                  alt={fotoActual.caption || "Fotolog"}
                  style={{
                    maxHeight: 460,
                    maxWidth: "100%",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
              </div>

              {/* Pie de foto */}
              {fotoActual.caption && (
                <div
                  style={{
                    fontSize: 13,
                    margin: "8px 0 12px",
                    fontWeight: "bold",
                    color: "var(--azul-osc)",
                    lineHeight: "1.4",
                  }}
                >
                  {parseEmoticons(fotoActual.caption)}
                </div>
              )}

              <div style={{ fontSize: 10, color: "#666", marginBottom: 8 }}>
                Publicada el{" "}
                {new Date(fotoActual.created_at).toLocaleString("es-AR", {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </div>

              {user && user.id === fotoActual.owner_id && (
                <form action={deletePhotoAction} style={{ marginTop: 6 }}>
                  <input type="hidden" name="photo_id" value={fotoActual.id} />
                  <button type="submit" className="mini" style={{ color: "#c00" }}>
                    🗑️ Eliminar esta foto
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <div className="box">
            <h2>Fotolog</h2>
            <div className="box-body" style={{ textAlign: "center", padding: "30px 0" }}>
              <p>Todavía no hay fotos publicadas en este Fotolog.</p>
            </div>
          </div>
        )}

        {/* Tira de fotos anteriores / historial (Gold Camera) */}
        {fotos.length > 1 && (
          <div className="box">
            <h2>Historial de fotos ({fotos.length})</h2>
            <div className="box-body">
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                  padding: "4px 0",
                }}
              >
                {fotos.map((f: any) => {
                  const esActiva = f.id === fotoActual?.id;
                  const targetUrl = targetProfile
                    ? `/fotos?u=${targetProfile.username}&foto=${f.id}`
                    : `/fotos?foto=${f.id}`;

                  return (
                    <Link
                      key={f.id}
                      href={targetUrl}
                      style={{
                        display: "inline-block",
                        border: esActiva ? "2px solid var(--azul)" : "1px solid var(--borde)",
                        padding: 2,
                        background: "#fff",
                        flexShrink: 0,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.url}
                        alt=""
                        style={{
                          width: 64,
                          height: 64,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
