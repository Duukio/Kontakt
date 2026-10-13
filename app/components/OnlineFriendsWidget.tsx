"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export interface AmigoOnline {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  last_seen_at: string | null;
}

export default function OnlineFriendsWidget({
  initialFriends,
  amigosIds,
}: {
  initialFriends: AmigoOnline[];
  amigosIds: string[];
}) {
  const [amigosOnline, setAmigosOnline] = useState<AmigoOnline[]>(initialFriends);

  useEffect(() => {
    if (amigosIds.length === 0) return;

    const supabase = createClient();

    // Función para refrescar amigos en línea
    const refrescar = async () => {
      // Consideramos online a quienes estuvieron activos en los últimos 4 minutos
      const limiteOnline = new Date(Date.now() - 4 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, last_seen_at")
        .in("id", amigosIds)
        .gte("last_seen_at", limiteOnline)
        .order("last_seen_at", { ascending: false })
        .limit(8);

      if (data) {
        setAmigosOnline(data);
      }
    };

    // Polling cada 30 segundos
    const interval = setInterval(refrescar, 30 * 1000);

    // Escuchar cambios en profiles en tiempo real si Supabase Realtime está activo
    const channel = supabase
      .channel("online-presence-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          if (amigosIds.includes(payload.new?.id)) {
            refrescar();
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [amigosIds]);

  return (
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
  );
}
