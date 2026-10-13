"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadPhotoAction } from "./actions";

export default function PhotoUploader({ userId }: { userId: string }) {
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Solo se permiten archivos de imagen.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("La imagen no puede superar los 5 MB.");
      return;
    }

    setSubiendo(true);
    setErrorMsg("");

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const ruta = `${userId}/fotolog_${Date.now()}.${ext}`;

      const { error: errUpload } = await supabase.storage
        .from("avatars")
        .upload(ruta, file, { upsert: true, contentType: file.type });

      if (errUpload) {
        setErrorMsg("Error al subir archivo. Podés ingresar un enlace directo abajo.");
        setSubiendo(false);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(ruta);
      setUrl(data.publicUrl);
    } catch {
      setErrorMsg("Ocurrió un error inesperado al subir la foto.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <form action={uploadPhotoAction}>
      <input type="hidden" name="url" value={url} />

      <label>Elegir foto para tu Album de Fotos:</label>
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={subiendo}
        >
          {subiendo ? "Subiendo..." : "📁 Elegir desde mi PC"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFile}
        />
        <span style={{ fontSize: 10, color: "#666" }}>o pegar link:</span>
        <input
          type="url"
          placeholder="https://ejemplo.com/foto.jpg"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ flex: 1, minWidth: 160 }}
        />
      </div>

      {url && (
        <div style={{ marginBottom: 10, textAlign: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Vista previa"
            style={{
              maxHeight: 220,
              maxWidth: "100%",
              border: "1px solid var(--borde)",
              background: "#fff",
              padding: 4,
            }}
          />
        </div>
      )}

      <label htmlFor="caption">Pie de foto (máx. 200 caracteres):</label>
      <textarea
        id="caption"
        name="caption"
        rows={2}
        maxLength={200}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Escribí una dedicatoria o comentario para esta foto..."
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#666", marginTop: 2 }}>
        <span>Podés usar emoticones como :) :D &lt;3</span>
        <span>{caption.length}/200</span>
      </div>

      {errorMsg && <div className="msg-error" style={{ marginTop: 6 }}>{errorMsg}</div>}

      <p style={{ marginTop: 10 }}>
        <button type="submit" disabled={!url || subiendo}>
          Publicar en mis Fotos
        </button>
      </p>
    </form>
  );
}
