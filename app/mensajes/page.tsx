import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendMessageAction, deleteMessageAction } from "./actions";
import PostContent from "@/app/components/PostContent";

export const metadata = { title: "Mensajes privados - Kontakt" };

export default async function MensajesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    carpeta?: string;
    ver?: string;
    para?: string;
    re?: string;
    error?: string;
    ok?: string;
  }>;
}) {
  const { carpeta = "entrada", ver, para, re, error, ok } =
    (await searchParams) ?? {};

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/ingresar");
  }

  // Contadores
  const { count: noLeidosCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("deleted_by_recipient", false)
    .is("read_at", null);

  const { count: entradaCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", user.id)
    .eq("deleted_by_recipient", false);

  const { count: enviadosCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("sender_id", user.id)
    .eq("deleted_by_sender", false);

  // Amigos confirmados para selector al redactar
  const { data: amistades } = await supabase
    .from("friendships")
    .select(`
      requester_id,
      addressee_id,
      requester:requester_id (username, display_name),
      addressee:addressee_id (username, display_name)
    `)
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const amigos = (amistades || []).map((f: any) => {
    const raw = f.requester_id === user.id ? f.addressee : f.requester;
    return Array.isArray(raw) ? raw[0] : raw;
  });

  // Si se está viendo un mensaje puntual
  let mensajeActual: any = null;
  if (ver) {
    const { data: m } = await supabase
      .from("messages")
      .select(`
        id,
        subject,
        body,
        created_at,
        read_at,
        sender_id,
        recipient_id,
        sender:sender_id (id, username, display_name, avatar_url),
        recipient:recipient_id (id, username, display_name, avatar_url)
      `)
      .eq("id", ver)
      .single();

    if (m && (m.sender_id === user.id || m.recipient_id === user.id)) {
      mensajeActual = m;
      // Marcar como leído si es el destinatario
      if (m.recipient_id === user.id && !m.read_at) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("id", m.id);
      }
    }
  }

  // Lista de mensajes para Entrada o Enviados
  let mensajesLista: any[] = [];
  if (!ver && carpeta === "entrada") {
    const { data } = await supabase
      .from("messages")
      .select(`
        id,
        subject,
        created_at,
        read_at,
        sender:sender_id (id, username, display_name, avatar_url)
      `)
      .eq("recipient_id", user.id)
      .eq("deleted_by_recipient", false)
      .order("created_at", { ascending: false });
    mensajesLista = data ?? [];
  } else if (!ver && carpeta === "enviados") {
    const { data } = await supabase
      .from("messages")
      .select(`
        id,
        subject,
        created_at,
        read_at,
        recipient:recipient_id (id, username, display_name, avatar_url)
      `)
      .eq("sender_id", user.id)
      .eq("deleted_by_sender", false)
      .order("created_at", { ascending: false });
    mensajesLista = data ?? [];
  }

  return (
    <div className="cols">
      {/* Columna Lateral: Carpetas y Redactar */}
      <div className="col-side">
        <div className="box">
          <h2>Mensajería privada</h2>
          <div className="box-body">
            <p>
              <Link
                className="btn"
                href="/mensajes?carpeta=redactar"
                style={{ display: "block", textAlign: "center", marginBottom: 10 }}
              >
                ✏️ Redactar nuevo
              </Link>
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: 0, lineHeight: "2" }}>
              <li
                style={{
                  fontWeight: carpeta === "entrada" && !ver ? "bold" : "normal",
                  background: carpeta === "entrada" && !ver ? "var(--azul-cla)" : "transparent",
                  padding: "2px 6px",
                  borderRadius: 2,
                }}
              >
                📥 <Link href="/mensajes?carpeta=entrada">Bandeja de entrada</Link>{" "}
                {Boolean(noLeidosCount) && (
                  <span
                    style={{
                      background: "#c00",
                      color: "#fff",
                      fontSize: 9,
                      padding: "1px 5px",
                      borderRadius: 10,
                      fontWeight: "bold",
                    }}
                  >
                    {noLeidosCount}
                  </span>
                )}
                {!noLeidosCount && entradaCount ? `(${entradaCount})` : ""}
              </li>

              <li
                style={{
                  fontWeight: carpeta === "enviados" && !ver ? "bold" : "normal",
                  background: carpeta === "enviados" && !ver ? "var(--azul-cla)" : "transparent",
                  padding: "2px 6px",
                  borderRadius: 2,
                }}
              >
                📤 <Link href="/mensajes?carpeta=enviados">Mensajes enviados</Link>{" "}
                {enviadosCount ? `(${enviadosCount})` : ""}
              </li>
            </ul>
          </div>
        </div>

        {/* Amigos para redactar rápido */}
        {amigos.length > 0 && (
          <div className="box">
            <h2>Escribir a un amigo</h2>
            <div className="box-body">
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 11, lineHeight: "1.8" }}>
                {amigos.slice(0, 8).map((a: any) => (
                  <li key={a.username}>
                    •{" "}
                    <Link href={`/mensajes?carpeta=redactar&para=${encodeURIComponent(a.username)}`}>
                      {a.display_name} (@{a.username})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Columna Principal */}
      <div className="col-main">
        {error && <div className="msg-error">{error}</div>}
        {ok && <div className="msg-ok">{ok}</div>}

        {/* 1. Vista de lectura de un mensaje */}
        {ver && mensajeActual && (
          <div className="box">
            <h2>Mensaje: {mensajeActual.subject}</h2>
            <div className="box-body">
              <div
                style={{
                  borderBottom: "1px dotted var(--borde)",
                  paddingBottom: 8,
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>
                    <strong>De:</strong>{" "}
                    <Link href={`/u/${mensajeActual.sender?.username}`}>
                      {mensajeActual.sender?.display_name} (@{mensajeActual.sender?.username})
                    </Link>
                  </span>
                  <span style={{ color: "#666", fontSize: 10 }}>
                    {new Date(mensajeActual.created_at).toLocaleString("es-AR", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                <div>
                  <strong>Para:</strong>{" "}
                  <Link href={`/u/${mensajeActual.recipient?.username}`}>
                    {mensajeActual.recipient?.display_name} (@{mensajeActual.recipient?.username})
                  </Link>
                </div>
              </div>

              {/* Contenido del mensaje */}
              <div style={{ minHeight: 80, fontSize: 12, lineHeight: "1.5" }}>
                <PostContent text={mensajeActual.body} />
              </div>

              <hr style={{ border: 0, borderTop: "1px solid var(--borde)", margin: "14px 0" }} />

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {mensajeActual.recipient_id === user.id && (
                  <Link
                    className="btn"
                    href={`/mensajes?carpeta=redactar&para=${encodeURIComponent(
                      mensajeActual.sender?.username
                    )}&re=${encodeURIComponent(
                      mensajeActual.subject.startsWith("Re:")
                        ? mensajeActual.subject
                        : `Re: ${mensajeActual.subject}`
                    )}`}
                  >
                    ↩ Responder
                  </Link>
                )}

                <form action={deleteMessageAction}>
                  <input type="hidden" name="message_id" value={mensajeActual.id} />
                  <input
                    type="hidden"
                    name="carpeta"
                    value={mensajeActual.recipient_id === user.id ? "entrada" : "enviados"}
                  />
                  <button type="submit" className="mini" style={{ color: "#c00" }}>
                    🗑️ Eliminar mensaje
                  </button>
                </form>

                <Link
                  href={`/mensajes?carpeta=${mensajeActual.recipient_id === user.id ? "entrada" : "enviados"}`}
                  style={{ marginLeft: "auto" }}
                >
                  Volver a la lista
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* 2. Redactar mensaje */}
        {!ver && carpeta === "redactar" && (
          <div className="box">
            <h2>Redactar mensaje privado</h2>
            <div className="box-body">
              <form action={sendMessageAction}>
                <label htmlFor="para">Para (nombre de usuario):</label>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontWeight: "bold", color: "var(--azul-osc)" }}>@</span>
                  <input
                    type="text"
                    id="para"
                    name="para"
                    defaultValue={para ?? ""}
                    placeholder="usuario_destinatario"
                    required
                    style={{ flex: 1 }}
                  />
                </div>

                <label htmlFor="subject">Asunto:</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  defaultValue={re ?? ""}
                  placeholder="¿De qué trata este mensaje?"
                  maxLength={100}
                />

                <label htmlFor="body">Mensaje:</label>
                <textarea
                  id="body"
                  name="body"
                  rows={6}
                  placeholder="Escribí tu mensaje acá... Podés incluir enlaces, fotos o videos."
                  required
                />

                <p style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                  <button type="submit">Enviar mensaje privado</button>
                  <Link href="/mensajes">Cancelar</Link>
                </p>
              </form>
            </div>
          </div>
        )}

        {/* 3. Bandeja de entrada */}
        {!ver && carpeta === "entrada" && (
          <div className="box">
            <h2>Bandeja de entrada ({mensajesLista.length})</h2>
            <div className="box-body">
              {mensajesLista.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "#666" }}>
                  <p>No tenés mensajes en tu bandeja de entrada.</p>
                  <p>
                    <Link className="btn" href="/mensajes?carpeta=redactar">
                      Escribile un mensaje a un amigo
                    </Link>
                  </p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "var(--azul-cla)", textAlign: "left" }}>
                      <th style={{ padding: "4px 6px", borderBottom: "1px solid var(--borde)", width: 24 }}></th>
                      <th style={{ padding: "4px 6px", borderBottom: "1px solid var(--borde)", width: 140 }}>De</th>
                      <th style={{ padding: "4px 6px", borderBottom: "1px solid var(--borde)" }}>Asunto</th>
                      <th style={{ padding: "4px 6px", borderBottom: "1px solid var(--borde)", width: 120, textAlign: "right" }}>Fecha</th>
                      <th style={{ padding: "4px 6px", borderBottom: "1px solid var(--borde)", width: 40, textAlign: "center" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mensajesLista.map((m: any) => {
                      const remitente = Array.isArray(m.sender) ? m.sender[0] : m.sender;
                      const esNuevo = !m.read_at;
                      const fecha = new Date(m.created_at).toLocaleString("es-AR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      });

                      return (
                        <tr
                          key={m.id}
                          style={{
                            borderBottom: "1px dotted var(--borde)",
                            background: esNuevo ? "#fffde6" : "transparent",
                            fontWeight: esNuevo ? "bold" : "normal",
                          }}
                        >
                          <td style={{ padding: "6px 4px", textAlign: "center" }}>
                            {esNuevo ? "✉️" : "📭"}
                          </td>
                          <td style={{ padding: "6px 4px" }}>
                            <Link href={`/u/${remitente?.username}`}>
                              {remitente?.display_name || remitente?.username}
                            </Link>
                          </td>
                          <td style={{ padding: "6px 4px" }}>
                            <Link href={`/mensajes?ver=${m.id}`} style={{ fontWeight: esNuevo ? "bold" : "normal" }}>
                              {m.subject || "(Sin asunto)"}
                            </Link>
                          </td>
                          <td style={{ padding: "6px 4px", textAlign: "right", color: "#666", fontSize: 10 }}>
                            {fecha}
                          </td>
                          <td style={{ padding: "6px 4px", textAlign: "center" }}>
                            <form action={deleteMessageAction}>
                              <input type="hidden" name="message_id" value={m.id} />
                              <input type="hidden" name="carpeta" value="entrada" />
                              <button type="submit" className="mini" title="Eliminar mensaje" style={{ color: "#c00" }}>
                                ✕
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* 4. Mensajes enviados */}
        {!ver && carpeta === "enviados" && (
          <div className="box">
            <h2>Mensajes enviados ({mensajesLista.length})</h2>
            <div className="box-body">
              {mensajesLista.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0", color: "#666" }}>
                  <p>Todavía no enviaste ningún mensaje.</p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "var(--azul-cla)", textAlign: "left" }}>
                      <th style={{ padding: "4px 6px", borderBottom: "1px solid var(--borde)", width: 140 }}>Para</th>
                      <th style={{ padding: "4px 6px", borderBottom: "1px solid var(--borde)" }}>Asunto</th>
                      <th style={{ padding: "4px 6px", borderBottom: "1px solid var(--borde)", width: 120, textAlign: "right" }}>Fecha</th>
                      <th style={{ padding: "4px 6px", borderBottom: "1px solid var(--borde)", width: 40, textAlign: "center" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mensajesLista.map((m: any) => {
                      const destinatario = Array.isArray(m.recipient) ? m.recipient[0] : m.recipient;
                      const fecha = new Date(m.created_at).toLocaleString("es-AR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      });

                      return (
                        <tr key={m.id} style={{ borderBottom: "1px dotted var(--borde)" }}>
                          <td style={{ padding: "6px 4px" }}>
                            <Link href={`/u/${destinatario?.username}`}>
                              {destinatario?.display_name || destinatario?.username}
                            </Link>
                          </td>
                          <td style={{ padding: "6px 4px" }}>
                            <Link href={`/mensajes?ver=${m.id}`}>
                              {m.subject || "(Sin asunto)"}
                            </Link>
                          </td>
                          <td style={{ padding: "6px 4px", textAlign: "right", color: "#666", fontSize: 10 }}>
                            {fecha}
                          </td>
                          <td style={{ padding: "6px 4px", textAlign: "center" }}>
                            <form action={deleteMessageAction}>
                              <input type="hidden" name="message_id" value={m.id} />
                              <input type="hidden" name="carpeta" value="enviados" />
                              <button type="submit" className="mini" title="Eliminar mensaje" style={{ color: "#c00" }}>
                                ✕
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
