import Link from "next/link";

export const metadata = { title: "Acerca de - Kontakt" };

export default function AcercaPage() {
  return (
    <div className="box">
      <h2>Acerca de Kontakt</h2>
      <div className="box-body">
        <h1>Kontakt.net — Mantené el contacto con tus amigos</h1>
        <p>
          Kontakt es una red social nostálgica inspirada en la era dorada de la web de los años 2000.
          Fue creada para compartir con amigos de verdad, sin algoritmos invasivos ni distracciones.
        </p>
        <p>
          En Kontakt podés personalizar tu perfil con tu propio estilo, compartir tus pensamientos en tu muro,
          conectar con amigos y disfrutar de una web más simple y divertida.
        </p>
        <p style={{ marginTop: 14 }}>
          <Link className="btn" href="/">Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
