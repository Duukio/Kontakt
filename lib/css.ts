// Validación del CSS personalizado de los perfiles.
// Devuelve null si es seguro, o un mensaje de error en español.
//
// El CSS se muestra anidado dentro de ".perfil-custom { ... }", así que:
//  - se prohíbe "&" (permitiría apuntar a elementos fuera del perfil con :has)
//  - se exigen llaves balanceadas (para que no pueda "salirse" del bloque)
//  - se prohíben url(), @import, etc. (sin recursos externos ni rastreo)

const PROHIBIDO =
  /url\s*\(|image-set|image\s*\(|cross-fade|element\s*\(|src\s*\(|expression|javascript:|vbscript|behavior|binding|@import|@namespace|@font-face|@charset|@property|\\|\/\*|\*\/|[<>&]/i;

export function validarCss(css: string): string | null {
  if (css.length > 5000) return "El CSS no puede superar los 5000 caracteres.";

  if (PROHIBIDO.test(css)) {
    return "El CSS contiene algo no permitido: url(), @import, @font-face, comentarios, barras invertidas, & o los símbolos < >.";
  }

  // Se sacan los textos entre comillas; si quedan comillas sueltas, se rechaza
  const sinTextos = css.replace(/"[^"\n]*"|'[^'\n]*'/g, " ");
  if (/["']/.test(sinTextos)) return "Hay comillas sin cerrar en el CSS.";

  let nivel = 0;
  for (const c of sinTextos) {
    if (c === "{") nivel++;
    if (c === "}") nivel--;
    if (nivel < 0) return "Hay una llave } de más en el CSS.";
  }
  if (nivel !== 0) return "Falta cerrar una llave { en el CSS.";

  return null;
}
