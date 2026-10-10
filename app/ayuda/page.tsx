import Link from "next/link";

export const metadata = { title: "Centro de Ayuda - Kontakt" };

export default function AyudaPage() {
  return (
    <div className="box">
      <h2>Centro de Ayuda</h2>
      <div className="box-body">
        <h1>Preguntas Frecuentes</h1>
        
        <h3>¿Cómo cambio mi foto de perfil?</h3>
        <p>
          Hacé clic en <strong><Link href="/editar-perfil">Editar perfil</Link></strong> en la barra de navegación superior.
          En el recuadro izquierdo podés elegir una imagen (JPG, PNG, GIF o WebP de hasta 2 MB) y se subirá automáticamente.
        </p>

        <h3>¿Cómo agrego a otros usuarios como amigos?</h3>
        <p>
          Podés usar la sección <strong><Link href="/buscar">Buscar</Link></strong> para encontrar a tus amigos por su nombre
          o nombre de usuario, entrar a su perfil y hacer clic en <em>&quot;+ Agregar a amigos&quot;</em>.
        </p>

        <h3>¿Cómo funciona el CSS personalizado de mi perfil?</h3>
        <p>
          En <strong><Link href="/editar-perfil">Editar perfil</Link></strong> tenés un campo para ingresar código CSS propio.
          Ese estilo solo afectará la caja de tu perfil para darle colores o fuentes retro a tu gusto.
        </p>

        <p style={{ marginTop: 14 }}>
          <Link className="btn" href="/">Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
