import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Comunidades y Foros - Kontakt" };

export default async function ComunidadesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Obtener comunidades con recuento o datos de creador
  const { data: comunidadesData } = await supabase
    .from("communities")
    .select(`
      id,
      name,
      description,
      category,
      avatar_url,
      created_at,
      creator:creator_id (id, username, display_name)
    `)
    .order("created_at", { ascending: false });

  const comunidades = (comunidadesData || []).map((c: any) => ({
    ...c,
    creator: Array.isArray(c.creator) ? c.creator[0] : c.creator,
  }));

  return (
    <div className="cols">
      {/* Columna Lateral */}
      <div className="col-side">
        <div className="box">
          <h2>Comunidades</h2>
          <div className="box-body">
            <p style={{ fontSize: 11, color: "#555" }}>
              Encontrá gente con tus mismos gustos, debatí en los foros temáticos o creá tu propio grupo estilo Orkut.
            </p>
            {user && (
              <div style={{ marginTop: 10 }}>
                <Link className="btn" href="/comunidades/crear" style={{ display: "block", textAlign: "center" }}>
                  ＋ Crear una comunidad
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="box">
          <h2>Categorías Populares</h2>
          <div className="box-body">
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 11, lineHeight: "1.8" }}>
              <li>🎸 Música &amp; Bandas</li>
              <li>💻 Computación &amp; Software</li>
              <li>🎮 Videojuegos retro</li>
              <li>🎬 Cine y Animación</li>
              <li>💬 Amigos y Charlas</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Columna Principal: Lista de Comunidades */}
      <div className="col-main">
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
              Directorio de Comunidades ({comunidades.length})
            </h2>
            {user && (
              <Link href="/comunidades/crear" style={{ fontSize: 10, color: "#fff", textDecoration: "underline" }}>
                [Nueva Comunidad]
              </Link>
            )}
          </div>
          <div className="box-body">
            {comunidades.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#666" }}>
                <p>Todavía no hay comunidades creadas en Kontakt.</p>
                {user && (
                  <Link className="btn" href="/comunidades/crear">
                    ¡Sé el primero en crear una!
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {comunidades.map((c: any) => (
                  <div
                    key={c.id}
                    style={{
                      display: "flex",
                      gap: 12,
                      background: "#f9fbfe",
                      border: "1px solid #d3e0f0",
                      padding: 10,
                      borderRadius: 2,
                    }}
                  >
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        background: "#cfdcf5",
                        border: "1px solid #7f9db9",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                        fontWeight: "bold",
                        color: "var(--azul-osc)",
                      }}
                    >
                      {c.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.avatar_url}
                          alt=""
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        c.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <h3 style={{ margin: 0, fontSize: 13 }}>
                          <Link href={`/comunidades/${c.id}`} style={{ color: "var(--azul-osc)" }}>
                            {c.name}
                          </Link>
                        </h3>
                        <span style={{ fontSize: 10, background: "#e8eff9", padding: "1px 6px", border: "1px solid #c0d3eb" }}>
                          {c.category}
                        </span>
                      </div>
                      <p style={{ margin: "4px 0", fontSize: 11, color: "#444", lineHeight: 1.4 }}>
                        {c.description}
                      </p>
                      <div style={{ fontSize: 10, color: "#888" }}>
                        Creada por{" "}
                        <Link href={`/u/${c.creator?.username}`}>
                          {c.creator?.display_name || c.creator?.username}
                        </Link>{" "}
                        • {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
