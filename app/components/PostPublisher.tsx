"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface PostPublisherProps {
  action: (formData: FormData) => void | Promise<void>;
  placeholder?: string;
  buttonText?: string;
  hiddenInputs?: { name: string; value: string }[];
  userId?: string;
}

export default function PostPublisher({
  action,
  placeholder = "¿Qué estás pensando hoy?",
  buttonText = "Publicar",
  hiddenInputs = [],
  userId,
}: PostPublisherProps) {
  const [text, setText] = useState("");
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [modalType, setModalType] = useState<"image" | "video" | "link" | null>(null);
  const [modalUrl, setModalUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function insertarTexto(nuevo: string) {
    setText((prev) => {
      const espacio = prev.length > 0 && !prev.endsWith("\n") && !prev.endsWith(" ") ? " " : "";
      return prev + espacio + nuevo;
    });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("La imagen no puede superar los 5 MB.");
      return;
    }

    setSubiendoFoto(true);
    setErrorMsg("");

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "jpg";
      const uId = userId || "public";
      const ruta = `${uId}/post_${Date.now()}.${ext}`;

      const { error: errorUpload } = await supabase.storage
        .from("avatars")
        .upload(ruta, file, { upsert: true, contentType: file.type });

      if (errorUpload) {
        setErrorMsg("No se pudo subir la foto. También podés pegar el enlace directo.");
        setSubiendoFoto(false);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(ruta);
      if (data?.publicUrl) {
        insertarTexto(data.publicUrl);
      }
    } catch {
      setErrorMsg("Ocurrió un error al subir el archivo.");
    } finally {
      setSubiendoFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleModalInsert(e: React.FormEvent) {
    e.preventDefault();
    const url = modalUrl.trim();
    if (!url) return;

    insertarTexto(url);
    setModalUrl("");
    setModalType(null);
  }

  return (
    <div>
      <form action={action}>
        {hiddenInputs.map((h) => (
          <input key={h.name} type="hidden" name={h.name} value={h.value} />
        ))}

        <textarea
          name="body"
          rows={3}
          maxLength={1000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          required
          style={{ width: "100%", resize: "vertical" }}
        />

        {/* Barra de herramientas para multimedia */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginTop: 4,
            padding: "4px 6px",
            background: "#f4f7fb",
            border: "1px solid var(--borde)",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 10, color: "#555", fontWeight: "bold" }}>Adjuntar:</span>

          {/* Subir archivo desde PC */}
          <button
            type="button"
            className="mini"
            onClick={() => fileInputRef.current?.click()}
            disabled={subiendoFoto}
            style={{ cursor: "pointer", fontWeight: "bold" }}
          >
            📁 {subiendoFoto ? "Subiendo..." : "Subir foto"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />

          {/* Pegar link de imagen */}
          <button
            type="button"
            className="mini"
            onClick={() => {
              setModalType(modalType === "image" ? null : "image");
              setModalUrl("");
            }}
            style={{ cursor: "pointer" }}
          >
            🖼️ Link de imagen
          </button>

          {/* Insertar video */}
          <button
            type="button"
            className="mini"
            onClick={() => {
              setModalType(modalType === "video" ? null : "video");
              setModalUrl("");
            }}
            style={{ cursor: "pointer" }}
          >
            🎬 Video (YouTube / MP4)
          </button>

          {/* Insertar link */}
          <button
            type="button"
            className="mini"
            onClick={() => {
              setModalType(modalType === "link" ? null : "link");
              setModalUrl("");
            }}
            style={{ cursor: "pointer" }}
          >
            🔗 Link web
          </button>

          <span style={{ marginLeft: "auto", fontSize: 10, color: text.length > 900 ? "#c00" : "#777" }}>
            {text.length}/1000
          </span>
        </div>

        {/* Mini barra de inserción de URL */}
        {modalType && (
          <div
            style={{
              marginTop: 6,
              padding: 6,
              background: "#fff",
              border: "1px solid var(--borde)",
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            <input
              type="url"
              placeholder={
                modalType === "image"
                  ? "https://ejemplo.com/foto.jpg"
                  : modalType === "video"
                  ? "https://www.youtube.com/watch?v=..."
                  : "https://ejemplo.com"
              }
              value={modalUrl}
              onChange={(e) => setModalUrl(e.target.value)}
              style={{ flex: 1 }}
              autoFocus
            />
            <button
              type="button"
              className="btn"
              onClick={handleModalInsert}
              style={{ padding: "2px 8px", fontSize: 10 }}
            >
              Insertar
            </button>
            <button
              type="button"
              className="mini"
              onClick={() => setModalType(null)}
              style={{ fontSize: 10 }}
            >
              Cancelar
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="msg-error" style={{ marginTop: 6, fontSize: 11 }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button type="submit" disabled={subiendoFoto || text.trim().length === 0}>
            {buttonText}
          </button>
        </div>
      </form>
    </div>
  );
}
