import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Buscar usuarios - Kontakt" };

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const termino = (q ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let perfiles: any[] = [];

  if (termino) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, location")
      .or(`username.ilike.%${termino}%,display_name.ilike.%${termino}%`)
      .limit(30);

    perfiles = data ?? [];
  } else {
    // Si no buscó nada aún, mostrar los últimos usuarios registrados
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio, location")
      .limit(12);

    perfiles = data ?? [];
  }

  return (
    <div className="cols">
      <div className="col-side">
        <div className="box">
          <h2>Buscar en Kontakt</h2>
          <div className="box-body">
            <form action="/buscar" method="GET">
              <label htmlFor="q">Buscar por nombre o usuario:</label>
              <input
                type="text"
                id="q"
                name="q"
                defaultValue={termino}
                placeholder="Ej: juan, ana_99..."
                required
              />
              <p style={{ marginTop: 8 }}>
                <button type="submit" style={{ width: "100%" }}>
                  🔍 Buscar
                </button>
              </p>
            </form>
          </div>
        </div>

        <div className="box">
          <h2>Consejo</h2>
          <div className="box-body">
            <p className="ayuda">
              Podés buscar tanto por nombre para mostrar como por nombre de usuario (@usuario).
            </p>
          </div>
        </div>
      </div>

      <div className="col-main">
        <div className="box">
          <h2>
            {termino
              ? `Resultados de búsqueda para "${termino}" (${perfiles.length})`
              : `Usuarios registrados en Kontakt (${perfiles.length})`}
          </h2>
          <div className="box-body">
            {perfiles.length === 0 ? (
              <p style={{ textAlign: "center", padding: "20px 0", color: "#666" }}>
                No se encontraron usuarios que coincidan con <strong>{termino}</strong>.
              </p>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 12,
                }}
              >
                {perfiles.map((p) => {
                  const inicial = p.display_name?.charAt(0) || p.username?.charAt(0) || "?";
                  const esPropio = user?.id === p.id;

                  return (
                    <div
                      key={p.id}
                      style={{
                        border: "1px solid var(--borde)",
                        padding: 10,
                        background: "#fff",
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      <div className="avatar" style={{ width: 56, height: 56, fontSize: 24, flexShrink: 0 }}>
                        {p.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatar_url} alt="" />
                        ) : (
                          inicial
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ display: "block", fontSize: 12, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          <Link href={`/u/${p.username}`}>{p.display_name}</Link>
                        </strong>
                        <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>
                          @{p.username}
                        </div>

                        {p.location && (
                          <div style={{ fontSize: 10, color: "#444", marginBottom: 4 }}>
                            📍 {p.location}
                          </div>
                        )}

                        <div style={{ marginTop: 6 }}>
                          <Link className="btn" href={`/u/${p.username}`} style={{ fontSize: 10, padding: "2px 8px" }}>
                            {esPropio ? "Ver mi perfil" : "Ver perfil"}
                          </Link>
                        </div>
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
