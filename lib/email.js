import { Resend } from "resend";
import { publicAppBaseUrl } from "@/lib/public-app-url";
import {
  construirUrlWhatsappClaves,
  LOTERIA_INTERNA,
} from "@/lib/club-gomez/claves-whatsapp";
import { periodoDe } from "@/lib/club-gomez/claves-pool";
import {
  agruparPremiosDesdeFilas,
  beneficiosFallbackDesdeCatalogo,
  labelPeriodoEs,
} from "@/lib/club-gomez/beneficios-catalog";
import { supabaseAdmin, supabaseMissingEnv } from "@/lib/supabase";

export function resendFromAddress() {
  const f =
    process.env.RESEND_EMAIL_FROM?.trim() || process.env.EMAIL_FROM?.trim();
  if (f) return f;
  return "Club Gómez <onboarding@resend.dev>";
}

/** Logo jpg compacto en HTTPS publico (Gmail no carga localhost). */
function clubLogoUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL?.trim(),
    "https://clubgomez.co",
    "https://clubgomez.vercel.app",
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    const base = raw.replace(/\/$/, "");
    if (base.startsWith("https://")) {
      return `${base}/club-gomez/logo-mark.jpg`;
    }
  }
  return "https://clubgomez.co/club-gomez/logo-mark.jpg";
}

const C_LIME = "#B8E351";
const C_LIME_DARK = "#5a7a12";
const C_INK = "#111827";
const C_MUTED = "#4b5563";
const C_BG = "#f3f4f6";
const C_CARD = "#ffffff";
const C_DARK = "#0a0c08";
const WA_NUMBER = "3137453511";
const WA_LINK = "https://wa.me/573137453511";
const SUPPORT_EMAIL = "soporte@clubgomez.com";
const COPYRIGHT = "© 2026 Club Gómez — Todos los derechos reservados";

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY no configurado");
  }
  return new Resend(apiKey);
}

function getResend() {
  return getResendClient();
}

function formatPrecio(n) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function firstName(nombre) {
  return String(nombre || "Miembro").trim().split(/\s+/)[0] || "Miembro";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderClavesHtml(claves) {
  const list = Array.isArray(claves) ? claves : [];
  if (list.length === 0) {
    return `<p style="margin:0;font-family:Arial,sans-serif;font-size:15px;color:${C_MUTED};">Pendiente de asignación</p>`;
  }
  const rows = [];
  for (let i = 0; i < list.length; i += 3) {
    const chunk = list.slice(i, i + 3);
    const cells = chunk
      .map(
        (n) =>
          `<td style="padding:6px;"><div style="background:${C_DARK};color:${C_LIME};border:2px solid ${C_LIME};border-radius:10px;font-family:Consolas,'Courier New',monospace;font-size:20px;font-weight:800;letter-spacing:2px;padding:14px 12px;text-align:center;min-width:78px;">${escapeHtml(n)}</div></td>`
      )
      .join("");
    rows.push(`<tr>${cells}</tr>`);
  }
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">${rows.join("")}</table>`;
}

/** Premios/fechas del mes para el correo (panel o catálogo). */
async function cargarBeneficiosMesCorreo() {
  const candidatos = [periodoDe(), "2026-10"];
  try {
    if (!supabaseMissingEnv && supabaseAdmin) {
      for (const periodo of candidatos) {
        const { data: filas, error } = await supabaseAdmin
          .from("sorteos_beneficio")
          .select(
            "id, periodo, fecha_sorteo, premio, descripcion, slug, imagen_key, destacado, estado, loteria"
          )
          .eq("periodo", periodo)
          .order("fecha_sorteo", { ascending: true });
        if (error || !filas?.length) continue;
        const grouped = agruparPremiosDesdeFilas(filas);
        const lista = (grouped.grid || grouped.items || []).filter(
          (b) => b?.nombre
        );
        if (lista.length) {
          return {
            periodo,
            periodoLabel: labelPeriodoEs(periodo),
            lista,
          };
        }
      }
    }
  } catch (err) {
    console.warn("[email] beneficios mes:", err?.message || err);
  }

  const periodo = "2026-10";
  const grouped = beneficiosFallbackDesdeCatalogo(periodo);
  return {
    periodo,
    periodoLabel: labelPeriodoEs(periodo),
    lista: (grouped.grid || grouped.items || []).filter((b) => b?.nombre),
  };
}

function renderBeneficiosMesHtml(lista) {
  if (!lista?.length) return "";
  const rows = lista
    .map((b) => {
      const fechas = Array.isArray(b.fechas) ? b.fechas.join(" · ") : "";
      return `<tr>
<td style="padding:10px 0;border-bottom:1px solid #e5e7eb;vertical-align:top;">
<p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${C_INK};line-height:1.35;">${escapeHtml(b.nombre)}</p>
<p style="margin:0;font-size:13px;color:${C_LIME_DARK};font-weight:600;">${escapeHtml(fechas || "Fecha por confirmar")}</p>
</td>
</tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">${rows}</table>`;
}

function renderAliadosComercialesHtml() {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">
<tr>
<td style="padding:12px 0;border-bottom:1px solid #e5e7eb;vertical-align:top;">
<p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${C_INK};">Veterinaria Caobos</p>
<p style="margin:0;font-size:13px;color:${C_MUTED};line-height:1.5;"><strong style="color:${C_LIME_DARK};">30%</strong> en servicios (atención a cachorros) · <strong style="color:${C_LIME_DARK};">20%</strong> en alimento y medicinas</p>
</td>
</tr>
<tr>
<td style="padding:12px 0;vertical-align:top;">
<p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${C_INK};">Plásticos Los Pochos</p>
<p style="margin:0;font-size:13px;color:${C_MUTED};line-height:1.5;"><strong style="color:${C_LIME_DARK};">5%</strong> en todo lo relacionado en plásticos · Cenabastos, Galpón Azul</p>
</td>
</tr>
</table>`;
}

function emailShell({ preheader, title, bodyHtml }) {
  const logo = clubLogoUrl();
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || "Club Gómez"}</title>
</head>
<body style="margin:0;padding:0;background:${C_BG};">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C_BG};">
<tr>
<td align="center" style="padding:28px 12px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:${C_CARD};border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
<tr>
<td align="center" style="background:${C_DARK};padding:28px 24px 22px;">
<img src="${logo}" alt="Club Gómez" width="72" height="72" style="display:block;margin:0 auto 12px;border:0;border-radius:12px;" />
<p style="margin:0;font-family:Arial,'Segoe UI',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${C_LIME};">Club Gómez</p>
${title ? `<p style="margin:14px 0 0;font-family:Arial,'Segoe UI',sans-serif;font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;">${title}</p>` : ""}
</td>
</tr>
<tr>
<td style="padding:28px 28px 8px;font-family:Arial,'Segoe UI',sans-serif;font-size:16px;line-height:1.55;color:${C_INK};">
${bodyHtml}
</td>
</tr>
<tr>
<td style="padding:8px 28px 28px;font-family:Arial,'Segoe UI',sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td align="center" style="border-top:1px solid #e5e7eb;padding-top:18px;font-size:13px;line-height:1.7;color:${C_MUTED};">
<a href="${WA_LINK}" style="color:${C_LIME_DARK};font-weight:600;text-decoration:none;">WhatsApp ${WA_NUMBER}</a>
&nbsp;·&nbsp;
<a href="mailto:${SUPPORT_EMAIL}" style="color:${C_LIME_DARK};font-weight:600;text-decoration:none;">${SUPPORT_EMAIL}</a>
<p style="margin:12px 0 0;font-size:11px;color:#9ca3af;">${COPYRIGHT}</p>
</td></tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;
}

function btnPrimary(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto;">
<tr><td bgcolor="${C_LIME}" style="border-radius:10px;">
<a href="${href}" target="_blank" style="display:inline-block;padding:14px 26px;font-family:Arial,'Segoe UI',sans-serif;font-size:15px;font-weight:800;color:${C_DARK};text-decoration:none;">${label}</a>
</td></tr></table>`;
}

function btnSecondary(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto;">
<tr><td style="border-radius:10px;border:2px solid ${C_LIME_DARK};">
<a href="${href}" target="_blank" style="display:inline-block;padding:12px 24px;font-family:Arial,'Segoe UI',sans-serif;font-size:14px;font-weight:700;color:${C_LIME_DARK};text-decoration:none;">${label}</a>
</td></tr></table>`;
}

export async function buildTicketCompraEmail(
  participante,
  rifa,
  boletos,
  options = {}
) {
  const appUrl = publicAppBaseUrl();
  const portalUrl = `${appUrl}/miembro`;
  const beneficiosUrl = `${appUrl}/beneficios`;
  const aliadosUrl = `${appUrl}/#aliados`;
  const claves = boletos || [];
  const waClavesUrl = construirUrlWhatsappClaves(
    {
      nombre: participante?.nombre,
      planNombre: rifa?.nombre,
      claves,
    },
    { incluirMotilon: true }
  );

  const beneficiosMes = await cargarBeneficiosMesCorreo();
  const beneficiosHtml = renderBeneficiosMesHtml(beneficiosMes.lista);
  const periodoLabel = beneficiosMes.periodoLabel || "este mes";
  const aliadosHtml = renderAliadosComercialesHtml();

  const bodyHtml = `
<p style="margin:0 0 16px;">Hola <strong>${escapeHtml(participante?.nombre || "Miembro")}</strong>,</p>
<p style="margin:0 0 20px;color:${C_MUTED};">Tu membresía quedó activa. Con ella participas en <strong style="color:${C_INK};">todos los beneficios del mes</strong> mientras tu plan esté vigente.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:22px;">
<tr><td style="padding:16px 18px;font-size:15px;line-height:1.7;color:${C_INK};">
<strong style="color:${C_LIME_DARK};">Plan:</strong> ${escapeHtml(rifa?.nombre || "—")}<br/>
<strong style="color:${C_LIME_DARK};">Oportunidades:</strong> ${participante?.cantidad_boletos ?? claves.length ?? 0}<br/>
<strong style="color:${C_LIME_DARK};">Periodo:</strong> ${escapeHtml(periodoLabel)}<br/>
<strong style="color:${C_LIME_DARK};">Referencia:</strong> ${escapeHtml(LOTERIA_INTERNA)}<br/>
<strong style="color:${C_LIME_DARK};">Total:</strong> ${formatPrecio(participante?.total_pagado)}
</td></tr>
</table>

<p style="margin:0 0 10px;font-size:14px;font-weight:800;color:${C_INK};letter-spacing:0.04em;text-transform:uppercase;">Cómo funciona tu mes</p>
<p style="margin:0 0 22px;font-size:14px;color:${C_MUTED};line-height:1.6;">Tu membresía cubre el mes en curso (${escapeHtml(periodoLabel)}). Mientras esté activa, quedas participando en los beneficios y entregas publicados para ese periodo. Al renovar, entras al siguiente mes con nuevas oportunidades.</p>

<p style="margin:0 0 10px;font-size:14px;font-weight:800;color:${C_INK};letter-spacing:0.04em;text-transform:uppercase;">Beneficios de ${escapeHtml(periodoLabel)}</p>
<p style="margin:0 0 12px;font-size:14px;color:${C_MUTED};line-height:1.55;">Con tu membresía activa estás participando en todos estos beneficios, con sus fechas:</p>
${beneficiosHtml || `<p style="margin:0 0 16px;color:${C_MUTED};">Pronto publicamos las fechas del mes en la web.</p>`}
<p style="margin:0 0 22px;font-size:13px;color:${C_MUTED};">También puedes verlos aquí: <a href="${beneficiosUrl}" style="color:${C_LIME_DARK};font-weight:700;text-decoration:none;">clubgomez.co/beneficios</a></p>

<p style="margin:0 0 10px;font-size:14px;font-weight:800;color:${C_INK};letter-spacing:0.04em;text-transform:uppercase;">Aliados comerciales</p>
<p style="margin:0 0 12px;font-size:14px;color:${C_MUTED};line-height:1.55;">Como miembro también tienes descuentos en nuestros aliados. Presenta tu membresía al canjear:</p>
${aliadosHtml}
<p style="margin:0 0 22px;font-size:13px;color:${C_MUTED};">Detalle y más aliados: <a href="${aliadosUrl}" style="color:${C_LIME_DARK};font-weight:700;text-decoration:none;">clubgomez.co/#aliados</a></p>

<p style="margin:0 0 12px;font-size:14px;font-weight:800;color:${C_INK};text-align:center;letter-spacing:0.04em;text-transform:uppercase;">Tus oportunidades</p>
<div style="margin:0 0 24px;">${renderClavesHtml(claves)}</div>
<p style="margin:0 0 20px;font-size:13px;color:${C_MUTED};text-align:center;">Guarda este correo. Es tu comprobante y el detalle de tus oportunidades del mes.</p>
${btnPrimary(waClavesUrl, "Enviar por WhatsApp")}
${btnSecondary(portalUrl, "Ir a mi cuenta")}
`;

  const subject = `Membresía activa Club Gómez — ${rifa?.nombre || "Plan"}`;
  const html = emailShell({
    preheader: `Membresía activa — beneficios, aliados y oportunidades`,
    title: "Membresía activada",
    bodyHtml,
  });

  return {
    subject,
    html,
    periodoLabel,
    toHint: options.useParticipantEmail ? participante?.email : null,
  };
}

export async function enviarTicketCompra(participante, rifa, boletos, options = {}) {
  const resend = getResend();
  const built = await buildTicketCompraEmail(participante, rifa, boletos, options);

  const to =
    options.useParticipantEmail === true
      ? participante.email
      : process.env.NODE_ENV === "development" && process.env.RESEND_TEST_EMAIL
        ? process.env.RESEND_TEST_EMAIL
        : participante.email;

  const { data, error } = await resend.emails.send({
    from: resendFromAddress(),
    to: [to],
    subject: built.subject,
    html: built.html,
  });
  if (error) throw new Error(error.message);
  return data;
}

export function buildBienvenidaEmail(miembro) {
  const appUrl = publicAppBaseUrl();
  const loginUrl = `${appUrl}/miembro/login`;
  const planesUrl = `${appUrl}/#membresias`;
  const name = firstName(miembro?.nombre);

  const bodyHtml = `
<p style="margin:0 0 16px;">Hola <strong>${escapeHtml(name)}</strong>,</p>
<p style="margin:0 0 20px;color:${C_MUTED};">Tu cuenta ya está creada. Puedes entrar cuando quieras; la membresía la activas después, cuando elijas tu plan.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:22px;">
<tr><td style="padding:16px 18px;font-size:15px;line-height:1.7;color:${C_INK};">
<strong style="color:${C_LIME_DARK};">Email de acceso:</strong> ${escapeHtml(miembro?.email || "")}<br/>
<strong style="color:${C_LIME_DARK};">Estado:</strong> Cuenta lista · Sin plan aún
</td></tr>
</table>
<p style="margin:0 0 20px;color:${C_MUTED};font-size:15px;">Cuando actives un plan (Élite, Selecto o Esencial) recibirás tus oportunidades y los beneficios del mes por este mismo correo.</p>
${btnPrimary(loginUrl, "Entrar a mi cuenta")}
${btnSecondary(planesUrl, "Ver planes y suscribirme")}
`;

  return {
    subject: "Bienvenido a Club Gómez — tu cuenta está lista",
    html: emailShell({
      preheader: "Tu cuenta Club Gómez está lista",
      title: "¡Bienvenido al Club!",
      bodyHtml,
    }),
  };
}

export async function enviarBienvenidaRegistro(miembro) {
  if (!miembro?.email) throw new Error("Email del miembro requerido");

  const resend = getResend();
  const built = buildBienvenidaEmail(miembro);

  const to =
    process.env.NODE_ENV === "development" && process.env.RESEND_TEST_EMAIL
      ? process.env.RESEND_TEST_EMAIL
      : miembro.email;

  const { data, error } = await resend.emails.send({
    from: resendFromAddress(),
    to: [to],
    subject: built.subject,
    html: built.html,
  });
  if (error) throw new Error(error.message);
  return data;
}

export function generarHtmlEmailGanador(participante, rifa, numeroBoleto) {
  const bodyHtml = `
<p style="margin:0 0 16px;">Hola <strong>${escapeHtml(participante?.nombre || "miembro")}</strong>,</p>
<p style="margin:0 0 20px;color:${C_MUTED};">Tu oportunidad coincidió con el resultado del beneficio del Club.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:20px;">
<tr><td style="padding:16px 18px;font-size:15px;line-height:1.7;color:${C_INK};">
<strong style="color:${C_LIME_DARK};">Premio / beneficio:</strong> ${escapeHtml(rifa?.nombre || "Beneficio del Club")}
</td></tr>
</table>
<p style="margin:0 0 10px;font-size:13px;font-weight:800;text-align:center;text-transform:uppercase;letter-spacing:0.04em;color:${C_INK};">Oportunidad favorecida</p>
<div style="margin:0 0 24px;">${renderClavesHtml([numeroBoleto || "—"])}</div>
<p style="margin:0 0 8px;font-weight:800;color:${C_INK};">Próximos pasos</p>
<p style="margin:0 0 6px;color:${C_MUTED};font-size:15px;">1. Responde este correo o escríbenos por WhatsApp</p>
<p style="margin:0 0 6px;color:${C_MUTED};font-size:15px;">2. Ten a la mano tu documento de identidad</p>
<p style="margin:0 0 20px;color:${C_MUTED};font-size:15px;">3. Coordinamos contigo la entrega del beneficio</p>
${btnPrimary(WA_LINK, "Escribir por WhatsApp")}
<p style="margin:16px 0 0;font-size:12px;color:#9ca3af;text-align:center;">La entrega se hace previa verificación de identidad.</p>
`;

  return emailShell({
    preheader: `Resultado: ${rifa?.nombre || "beneficio Club Gómez"}`,
    title: "¡Resultaste favorecido!",
    bodyHtml,
  });
}

export async function enviarEmailGanador(participante, rifa, numeroBoleto) {
  const resend = getResend();
  const to =
    process.env.NODE_ENV === "development" && process.env.RESEND_TEST_EMAIL
      ? process.env.RESEND_TEST_EMAIL
      : participante.email;

  const { data, error } = await resend.emails.send({
    from: resendFromAddress(),
    to: [to],
    subject: `Club Gómez — Resultado: ${rifa?.nombre || "Beneficio"}`,
    html: generarHtmlEmailGanador(participante, rifa, numeroBoleto),
  });
  if (error) throw new Error(error.message);
  return data;
}

export function buildFelicitacionCumpleanosEmail(miembro) {
  const portalUrl = `${publicAppBaseUrl()}/miembro`;
  const name = firstName(miembro?.nombre);

  const bodyHtml = `
<p style="margin:0 0 16px;">Hola <strong>${escapeHtml(name)}</strong>,</p>
<p style="margin:0 0 16px;color:${C_MUTED};">Hoy el Club Gómez celebra contigo.</p>
<p style="margin:0 0 16px;color:${C_MUTED};">Gracias por ser parte de esta comunidad. Que este año te traiga más momentos buenos, más logros y más beneficios del Club.</p>
<p style="margin:0 0 24px;color:${C_MUTED};">Con cariño,<br/><strong style="color:${C_LIME_DARK};">El equipo Club Gómez</strong></p>
${btnPrimary(portalUrl, "Ir a mi cuenta")}
`;

  return {
    subject: `¡Feliz cumpleaños, ${name}! — Club Gómez`,
    html: emailShell({
      preheader: `¡Feliz cumpleaños, ${name}!`,
      title: `¡Feliz cumpleaños, ${name}!`,
      bodyHtml,
    }),
  };
}

export async function enviarFelicitacionCumpleanos(miembro) {
  if (!miembro?.email) throw new Error("Email del miembro requerido");

  const resend = getResend();
  const built = buildFelicitacionCumpleanosEmail(miembro);

  const to =
    process.env.NODE_ENV === "development" && process.env.RESEND_TEST_EMAIL
      ? process.env.RESEND_TEST_EMAIL
      : miembro.email;

  const { data, error } = await resend.emails.send({
    from: resendFromAddress(),
    to: [to],
    subject: built.subject,
    html: built.html,
  });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Preview de plantillas para el panel admin (sin enviar).
 * @param {"claves"|"bienvenida"|"cumpleanos"|"ganador"} tipo
 */
export async function buildEmailPreview(tipo, opts = {}) {
  const nombre = String(opts.nombre || "Miembro Prueba").trim();
  const email = String(opts.email || "preview@clubgomez.co").trim();

  if (tipo === "claves") {
    return buildTicketCompraEmail(
      {
        id: "preview",
        nombre,
        email,
        cantidad_boletos: 3,
        total_pagado: 30000,
      },
      { nombre: "Plan Esencial" },
      ["2441", "5531", "3007"],
      { useParticipantEmail: true }
    );
  }

  if (tipo === "bienvenida") {
    return buildBienvenidaEmail({ nombre, email });
  }

  if (tipo === "cumpleanos") {
    return buildFelicitacionCumpleanosEmail({ nombre, email });
  }

  if (tipo === "ganador") {
    const html = generarHtmlEmailGanador(
      { nombre, email },
      { nombre: "TV KALLEY 50\" 4K-UHD Smart TV" },
      "2441"
    );
    return {
      subject: `Club Gómez — Resultado: TV KALLEY 50"`,
      html,
    };
  }

  throw new Error("tipo inválido");
}
