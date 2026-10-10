"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TIPOS = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

export default function AvatarUploader({
  userId,
  avatarUrl,
  inicial,
}: {
  userId: string;
  avatarUrl: string | null;
  inicial: string;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(avatarUrl);
  const [subiendo, setSubiendo] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "error" | "ok"; texto: string } | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!TIPOS.includes(file.type)) {
      setMsg({ tipo: "error", texto: "Solo se aceptan imágenes JPG, PNG, GIF o WebP." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setMsg({ tipo: "error", texto: "La imagen no puede pesar más de 2 MB." });
      return;
    }

    setSubiendo(true);
    setMsg(null);

    const supabase = createClient();
    const ruta = `${userId}/avatar`;

    const { error: errorSubida } = await supabase.storage
      .from("avatars")
      .upload(ruta, file, { upsert: true, contentType: file.type, cacheControl: "3600" });

    if (errorSubida) {
      setSubiendo(false);
      setMsg({ tipo: "error", texto: "No se pudo subir la imagen. Probá de nuevo." });
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(ruta);
    const nueva = `${data.publicUrl}?v=${Date.now()}`;

    const { error: errorPerfil } = await supabase
      .from("profiles")
      .update({ avatar_url: nueva })
      .eq("id", userId);

    setSubiendo(false);

    if (errorPerfil) {
      setMsg({ tipo: "error", texto: "La imagen se subió, pero no se pudo guardar en tu perfil." });
      return;
    }

    setUrl(nueva);
    setMsg({ tipo: "ok", texto: "¡Foto actualizada!" });
    router.refresh();
  }

  return (
    <div>
      <div className="avatar" style={{ maxWidth: 160 }}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Tu foto de perfil" />
        ) : (
          inicial
        )}
      </div>

      {msg && (
        <div className={msg.tipo === "error" ? "msg-error" : "msg-ok"} style={{ marginTop: 8 }}>
          {msg.texto}
        </div>
      )}

      <label htmlFor="avatar-file">{url ? "Cambiar foto:" : "Subir foto:"}</label>
      <input
        id="avatar-file"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={onChange}
        disabled={subiendo}
      />
      <p className="ayuda">JPG, PNG, GIF o WebP. Máximo 2 MB.</p>
      {subiendo && <p>Subiendo...</p>}
    </div>
  );
}
