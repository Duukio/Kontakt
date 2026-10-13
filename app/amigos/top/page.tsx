import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setTopFriendAction, removeTopFriendAction } from "@/app/actions/topFriends";

export const metadata = { title: "Elegir Top 8 amigos - Kontakt" };

export default async function TopAmigosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/ingresar");

  // Obtener perfil actual
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  // Obtener amigos mutuos aceptados
  const { data: amistadesData } = await supabase
    .from("friendships")
    .select(`
      id,
      requester_id,
      addressee_id,
      requester:requester_id (id, username, display_name, avatar_url),
      addressee:addressee_id (id, username, display_name, avatar_url)
    `)
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const amigos = (amistadesData || []).map((f: any) => {
    const raw = f.requester_id === user.id ? f.addressee : f.requester;
    const info = Array.isArray(raw) ? raw[0] : raw;
    return info;
  }).filter(Boolean);

  // Obtener configuración actual del Top 8
  const { data: currentTop } = await supabase
    .from("top_friends")
    .select(`
      position,
      friend_id,
      friend:friend_id (id, username, display_name, avatar_url)
    `)
    .eq("user_id", user.id)
    .order("position", { ascending: true });

  const topMap = new Map<number, any>();
  (currentTop || []).forEach((item: any) => {
    const f = Array.isArray(item.friend) ? item.friend[0] : item.friend;
    topMap.set(item.position, f);
  });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div className="box">
        <h2>★ Configurar mis Top 8 Amigos (Estilo MySpace)</h2>
        <div className="box-body">
          <p style={{ fontSize: 11, color: "#444", marginBottom: 12 }}>
            Elegí a tus 8 mejores amigos para que aparezcan destacados en tu perfil público en una cuadrícula retro de 2x4.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((slot) => {
              const assigned = topMap.get(slot);
              return (
                <div
                  key={slot}
                  style={{
                    background: "#f8fafd",
                    border: "1px solid var(--borde)",
                    padding: 8,
                    textAlign: "center",
                    borderRadius: 2,
                  }}
                >
                  <div style={{ fontWeight: "bold", fontSize: 11, marginBottom: 6, color: "var(--azul-osc)" }}>
                    #{slot} Favorito
                  </div>

                  {assigned ? (
                    <div>
                      <div className="avatar" style={{ width: 48, height: 48, margin: "0 auto 6px", fontSize: 18 }}>
                        {assigned.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={assigned.avatar_url} alt="" />
                        ) : (
                          assigned.display_name?.[0] || assigned.username?.[0]
                        )}
                      </div>
                      <div style={{ fontWeight: "bold", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {assigned.display_name}
                      </div>
                      <div style={{ fontSize: 10, color: "#666", marginBottom: 6 }}>
                        @{assigned.username}
                      </div>

                      <form action={removeTopFriendAction}>
                        <input type="hidden" name="position" value={slot} />
                        <button type="submit" className="mini" style={{ background: "#f2dede", borderColor: "#ebccd1", color: "#a94442" }}>
                          Quitar
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          margin: "0 auto 6px",
                          border: "1px dashed #7f9db9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#999",
                          fontSize: 20,
                        }}
                      >
                        +
                      </div>
                      <form action={setTopFriendAction}>
                        <input type="hidden" name="position" value={slot} />
                        <select
                          name="friend_id"
                          required
                          style={{ width: "100%", fontSize: 10, marginBottom: 4 }}
                          defaultValue=""
                        >
                          <option value="" disabled>
                            -- Elegir amigo --
                          </option>
                          {amigos.map((a: any) => (
                            <option key={a.id} value={a.id}>
                              {a.display_name} (@{a.username})
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="mini" style={{ width: "100%" }}>
                          Asignar
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: "right", borderTop: "1px solid var(--borde)", paddingTop: 8 }}>
            <Link className="btn" href={`/u/${profile?.username}`}>
              ← Volver a mi perfil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
