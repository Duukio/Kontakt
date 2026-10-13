"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function HeartbeatTracker({ userId }: { userId: string }) {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    // Actualización inmediata al cargar
    const sendPulse = async () => {
      try {
        await supabase
          .from("profiles")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", userId);
      } catch (err) {
        // Silencioso
      }
    };

    sendPulse();

    // Pulso periódico cada 60 segundos
    const interval = setInterval(sendPulse, 60 * 1000);

    // Cuando el usuario vuelve a enfocar la pestaña
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendPulse();
      }
    };

    window.addEventListener("focus", sendPulse);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", sendPulse);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [userId]);

  return null;
}
