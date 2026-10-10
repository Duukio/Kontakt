import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Si un formulario se envía por GET (p. ej. antes de hidratar React),
  // las credenciales quedarían en la URL. Las quitamos y redirigimos.
  const { searchParams } = request.nextUrl;
  if (request.method === "GET" && searchParams.has("password")) {
    const url = request.nextUrl.clone();
    url.search = "";
    url.pathname = "/ingresar";
    url.searchParams.set("error", "Reintentá ingresar: esperá a que cargue la página.");
    return NextResponse.redirect(url);
  }
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
