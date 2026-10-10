"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TIPOS = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export default function BannerUploader({
  userId,
  bannerUrl,
}: {
  userId: string;
  bannerUrl: string | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(bannerUrl);
  const [subiendo, setSubiendo] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [mostrarInputUrl, setMostrarInputUrl] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "error" | "ok"; texto: string } | null>(null);

  async function actualizarBannerEnPerfil(nuevaUrl: string | null) {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ banner_url: nuevaUrl })
      .eq("id", userId);

    if (error) {
      if (error.message.includes("banner_url")) {
        setMsg({
          tipo: "error",
          texto:
            "Falta crear la columna en Supabase. Ejecutá en el SQL Editor: ALTER TABLE profiles ADD COLUMN banner_url text;",
        });
      } else {
        setMsg({ tipo: "error", texto: "No se pudo actualizar el banner en tu perfil." });
      }
      return false;
    }

    setUrl(nuevaUrl);
    setMsg({ tipo: "ok", texto: nuevaUrl ? "¡Banner actualizado!" : "Banner eliminado." });
    router.refresh();
    return true;
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!TIPOS.includes(file.type)) {
      setMsg({ tipo: "error", texto: "Solo se aceptan imágenes JPG, PNG, GIF o WebP." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setMsg({ tipo: "error", texto: "El banner no puede pesar más de 5 MB." });
      return;
    }

    setSubiendo(true);
    setMsg(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const ruta = `${userId}/banner_${Date.now()}.${ext}`;

    const { error: errorSubida } = await supabase.storage
      .from("avatars")
      .upload(ruta, file, { upsert: true, contentType: file.type });

    if (errorSubida) {
      setSubiendo(false);
      setMsg({ tipo: "error", texto: "No se pudo subir la imagen. Probá de nuevo o pegá un enlace." });
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(ruta);
    const nueva = data.publicUrl;

    await actualizarBannerEnPerfil(nueva);
    setSubiendo(false);
  }

  async function onGuardarUrl(e: React.FormEvent) {
    e.preventDefault();
    const u = inputUrl.trim();
    if (!u) return;

    setSubiendo(true);
    setMsg(null);
    const ok = await actualizarBannerEnPerfil(u);
    setSubiendo(false);
    if (ok) {
      setInputUrl("");
      setMostrarInputUrl(false);
    }
  }

  async function onEliminarBanner() {
    if (!confirm("¿Seguro que querés quitar el banner de tu perfil?")) return;
    setSubiendo(true);
    setMsg(null);
    await actualizarBannerEnPerfil(null);
    setSubiendo(false);
  }

  return (
    <div>
      {/* Vista previa del banner */}
      <div
        style={{
          width: "100%",
          height: 120,
          background: url
            ? `#eaf2fc url(${url}) center/cover no-repeat`
            : "linear-gradient(#e1ecf8, #c8ddf4)",
          border: "1px solid var(--borde)",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--azul-osc)",
          fontWeight: "bold",
          fontSize: 12,
          marginBottom: 8,
          overflow: "hidden",
        }}
      >
        {!url && <span>(Sin banner configurado)</span>}
      </div>

      {msg && (
        <div className={msg.tipo === "error" ? "msg-error" : "msg-ok"} style={{ marginTop: 6 }}>
          {msg.texto}
        </div>
      )}

      {/* Acciones para el banner */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
        <label
          htmlFor="banner-file"
          className="btn"
          style={{
            cursor: subiendo ? "not-allowed" : "pointer",
            margin: 0,
            display: "inline-block",
          }}
        >
          {subiendo ? "Subiendo..." : "📁 Subir banner desde PC"}
        </label>
        <input
          id="banner-file"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          style={{ display: "none" }}
          onChange={onFileChange}
          disabled={subiendo}
        />

        <button
          type="button"
          className="mini"
          onClick={() => setMostrarInputUrl(!mostrarInputUrl)}
          disabled={subiendo}
        >
          🔗 Pegar link de imagen
        </button>

        {url && (
          <button
            type="button"
            className="mini"
            onClick={onEliminarBanner}
            disabled={subiendo}
            style={{ color: "#c00", marginLeft: "auto" }}
          >
            ❌ Quitar banner
          </button>
        )}
      </div>

      {mostrarInputUrl && (
        <form onSubmit={onGuardarUrl} style={{ marginTop: 8, display: "flex", gap: 6 }}>
          <input
            type="url"
            placeholder="https://ejemplo.com/banner.jpg"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn" disabled={subiendo}>
            Guardar
          </button>
          <button
            type="button"
            className="mini"
            onClick={() => setMostrarInputUrl(false)}
          >
            Cancelar
          </button>
        </form>
      )}

      <p className="ayuda" style={{ marginTop: 6 }}>
        Recomendado: 800x200 píxeles. Formatos JPG, PNG, GIF o WebP.
      </p>
    </div>
  );
}
