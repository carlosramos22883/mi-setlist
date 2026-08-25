// ============================================================
// EMAIL TEMPLATE — la plantilla base de TODOS los correos
// ============================================================
import { designTokens as t } from '../common/design-tokens';

// Layout con header de marca + contenido
// Ahora recibe la URL del logo para pintarlo en el header
export function emailLayout(
  title: string,
  content: string,
  logoUrl: string,
): string {
  return `
  <div style="margin:0; padding:24px; background-color:${t.bg}; font-family:Arial, Helvetica, sans-serif;">
    <div style="max-width:560px; margin:0 auto; background:${t.surface}; border-radius:16px; overflow:hidden;">
      <div style="background:${t.primary}; padding:20px 24px; text-align:center;">
        <img src="${logoUrl}" alt="Mi SetList"
             style="width:64px; height:64px; border-radius:16px;" />
        <h1 style="margin:8px 0 0; font-size:20px; color:#FFFFFF;">Mi SetList</h1>
      </div>
      <div style="padding:24px;">
        <h2 style="margin:0 0 12px; font-size:18px; color:${t.text};">${title}</h2>
        ${content}
        <p style="margin:24px 0 0; font-size:12px; color:${t.textSecondary};">
          Mi SetList — Tu repertorio, en tu bolsillo.
        </p>
      </div>
    </div>
  </div>`;
}

// Botón redondeado idéntico al de la app
export function emailButton(url: string, label: string): string {
  return `
  <a href="${url}"
     style="display:inline-block; background:${t.primary}; color:#FFFFFF; text-decoration:none;
            padding:12px 28px; border-radius:9999px; font-weight:bold; font-size:14px;">
    ${label}
  </a>`;
}
