import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kontakt - Mantené el contacto con tus amigos",
  description: "La red social para mantener el contacto con tus amigos.",
};

import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let noLeidos = 0;
  let notifsCount = 0;
  if (user) {
    const [msgRes, notifRes] = await Promise.all([
      supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("deleted_by_recipient", false)
        .is("read_at", null),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null),
      supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("id", user.id),
    ]);
    noLeidos = msgRes.count ?? 0;
    notifsCount = notifRes.count ?? 0;
  }

  return (
    <html lang="es">
      <body>
        <div id="page">
          <div id="header">
            <Link href="/" className="logo">
              Kontakt
            </Link>
            <div className="tagline">Mantené el contacto con tus amigos</div>
          </div>

          <ul id="nav">
            <li><Link href="/">Inicio</Link></li>
            {user ? (
              <>
                <li><Link href="/perfil">Mi perfil</Link></li>
                <li><Link href="/editar-perfil">Editar perfil</Link></li>
                <li><Link href="/amigos">Amigos</Link></li>
                <li>
                  <Link href="/mensajes">
                    Mensajes {noLeidos > 0 && <span style={{ color: "#c00", fontWeight: "bold" }}>({noLeidos})</span>}
                  </Link>
                </li>
                <li>
                  <Link href="/notificaciones">
                    Novedades {notifsCount > 0 && <span style={{ color: "#c00", fontWeight: "bold" }}>({notifsCount})</span>}
                  </Link>
                </li>
                <li><Link href="/fotos">Fotolog</Link></li>
                <li><Link href="/comunidades">Comunidades</Link></li>
                <li><Link href="/buscar">Buscar</Link></li>
                <li className="nav-right">
                  <form action={logout}>
                    <button type="submit" className="linkbtn">Salir</button>
                  </form>
                </li>
              </>
            ) : (
              <>
                <li><Link href="/ingresar">Ingresar</Link></li>
                <li><Link href="/registro">Registrate</Link></li>
              </>
            )}
          </ul>

          <div id="content">{children}</div>

          <div id="footer">
            <p>
              <Link href="/acerca">Acerca de</Link> |{" "}
              <Link href="/terminos">Términos</Link> |{" "}
              <Link href="/privacidad">Privacidad</Link> |{" "}
              <Link href="/ayuda">Ayuda</Link>
            </p>
            <p>Kontakt &copy; 2026 - Mejor visto en 1024x768</p>
            <a className="badge" href="https://2204355.com/" target="_blank" rel="noopener noreferrer">
              KONTAKT 100%
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
