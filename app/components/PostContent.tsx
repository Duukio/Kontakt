import React from "react";

const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/gi;

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/shorts/")[1]?.split("/")[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return url;
      }
    }
    if (parsed.hostname === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0]?.split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {}
  return null;
}

function isImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    return (
      /\.(jpeg|jpg|png|gif|webp|svg)(\?.*)?$/i.test(path) ||
      parsed.hostname.includes("i.imgur.com") ||
      parsed.hostname.includes("media.giphy.com") ||
      parsed.hostname.includes("images.unsplash.com")
    );
  } catch {
    return false;
  }
}

function isDirectVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(path);
  } catch {
    return false;
  }
}

export default function PostContent({ text }: { text: string }) {
  if (!text) return null;

  const matches = text.match(URL_REGEX) || [];
  const mediaItems: { type: "youtube" | "image" | "video"; url: string }[] = [];

  for (const url of matches) {
    const yt = getYouTubeEmbedUrl(url);
    if (yt) {
      if (!mediaItems.some((m) => m.url === yt)) {
        mediaItems.push({ type: "youtube", url: yt });
      }
      continue;
    }

    if (isImageUrl(url)) {
      if (!mediaItems.some((m) => m.url === url)) {
        mediaItems.push({ type: "image", url });
      }
      continue;
    }

    if (isDirectVideoUrl(url)) {
      if (!mediaItems.some((m) => m.url === url)) {
        mediaItems.push({ type: "video", url });
      }
      continue;
    }
  }

  // Segmentar el texto para convertir links en enlaces clickeables
  const parts = text.split(URL_REGEX);

  return (
    <div>
      <div style={{ wordBreak: "break-word", whiteSpace: "pre-wrap", lineHeight: "1.45" }}>
        {parts.map((part, index) => {
          if (URL_REGEX.test(part)) {
            // Reset regex state
            URL_REGEX.lastIndex = 0;
            return (
              <a
                key={index}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontWeight: "bold" }}
              >
                {part}
              </a>
            );
          }
          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </div>

      {mediaItems.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 8 }}>
          {mediaItems.map((item, idx) => {
            if (item.type === "youtube") {
              return (
                <div
                  key={idx}
                  style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: 440,
                    aspectRatio: "16/9",
                    background: "#000",
                    border: "1px solid var(--borde)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <iframe
                    src={item.url}
                    title="Video de YouTube"
                    style={{ width: "100%", height: "100%", border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              );
            }

            if (item.type === "video") {
              return (
                <div key={idx} style={{ maxWidth: 440 }}>
                  <video
                    src={item.url}
                    controls
                    style={{
                      maxWidth: "100%",
                      maxHeight: 320,
                      border: "1px solid var(--borde)",
                      borderRadius: 2,
                      background: "#000",
                    }}
                  />
                </div>
              );
            }

            if (item.type === "image") {
              return (
                <div key={idx} style={{ maxWidth: "100%" }}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt="Imagen compartida"
                      style={{
                        maxWidth: "100%",
                        maxHeight: 360,
                        objectFit: "contain",
                        border: "1px solid var(--borde)",
                        borderRadius: 2,
                        background: "#f4f6fa",
                        display: "block",
                      }}
                    />
                  </a>
                </div>
              );
            }

            return null;
          })}
        </div>
      )}
    </div>
  );
}
