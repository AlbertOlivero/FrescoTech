import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const env = (name: string) => Deno.env.get(name) || "";

const supabase = createClient(
  env("SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY"),
);

type AlertRow = {
  customer_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  equipment_id: string;
  maintenance_service_id: string;
  brand: string;
  equipment_type: string;
  location: string;
  last_maintenance?: string | null;
  recommended_months?: number | null;
  status: "AL_DIA" | "PROXIMO" | "VENCIDO" | string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value?: string | null) {
  if (!value) return "Sin registro";

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function normalizePhone(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function publicSiteUrl() {
  return env("PUBLIC_SITE_URL").trim().replace(/\/$/, "");
}

function emailLogoUrl() {
  const explicit = env("EMAIL_LOGO_URL").trim();
  if (explicit) return explicit;

  const site = publicSiteUrl();
  if (site.startsWith("https://")) {
    return `${site}/nexter-mark.png`;
  }

  return "";
}

function statusTheme(status: string) {
  if (status === "VENCIDO") {
    return {
      label: "MANTENIMIENTO VENCIDO",
      eyebrow: "ALERTA DE MANTENIMIENTO",
      title: "Llegó la fecha de tu mantenimiento",
      subject: "Nexter Ingeniería | Llegó la fecha de tu mantenimiento",
      description:
        "Tu equipo ya llegó a la fecha recomendada de mantenimiento. Te recomendamos agendar el servicio para mantener su buen rendimiento y prevenir averías.",
      badgeBg: "#fff1f2",
      badgeText: "#be123c",
      badgeBorder: "#fecdd3",
      iconBg: "#ffe4e6",
      icon: "!",
    };
  }

  return {
    label: "PRÓXIMO A VENCER",
    eyebrow: "RECORDATORIO DE MANTENIMIENTO",
    title: "Tu próximo mantenimiento se acerca",
    subject: "Nexter Ingeniería | Tu próximo mantenimiento se acerca",
    description:
      "Tu equipo se está acercando a la fecha recomendada de mantenimiento. Puedes reservar con tiempo y elegir el día que mejor te convenga.",
    badgeBg: "#fffbeb",
    badgeText: "#b45309",
    badgeBorder: "#fde68a",
    iconBg: "#fef3c7",
    icon: "!",
  };
}

function brandHeader() {
  const logoUrl = emailLogoUrl();

  const mark = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" width="54" height="54" alt="Nexter Ingeniería" style="display:block;width:54px;height:54px;border:0;outline:none;text-decoration:none;object-fit:contain;" />`
    : `<div style="width:54px;height:54px;line-height:54px;text-align:center;border-radius:15px;background:#ffffff;color:#0b74c9;font-size:24px;font-weight:800;">N</div>`;

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="padding:25px 28px;background:#ffffff;border-bottom:1px solid #e2e8f0;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="vertical-align:middle;padding-right:12px;">${mark}</td>
              <td style="vertical-align:middle;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:23px;line-height:24px;font-weight:800;color:#0877d8;letter-spacing:-0.5px;">Nexter</div>
                <div style="font-family:Arial,Helvetica,sans-serif;margin-top:1px;font-size:21px;line-height:22px;font-weight:800;color:#ff6715;letter-spacing:-0.4px;">Ingeniería</div>
                <div style="margin-top:6px;font-size:9px;line-height:12px;font-weight:700;color:#64748b;letter-spacing:1.45px;">CLIMATIZACIÓN · SERVICIO · MANTENIMIENTO</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function clientEmailHtml(row: AlertRow, lookupLink: string, waLink: string) {
  const theme = statusTheme(row.status);
  const name = escapeHtml(row.full_name);
  const equipment = `${escapeHtml(row.brand)} · ${escapeHtml(row.equipment_type)}`;
  const location = escapeHtml(row.location);
  const lastMaintenance = formatDate(row.last_maintenance);
  const recommended = row.recommended_months
    ? `Cada ${escapeHtml(row.recommended_months)} meses`
    : "Según recomendación técnica";

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(theme.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f8fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(theme.description)}</div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f8fb;">
    <tr>
      <td align="center" style="padding:30px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 12px 36px rgba(15,23,42,.08);">
          <tr><td>${brandHeader()}</td></tr>

          <tr>
            <td style="padding:30px 30px 10px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <div style="width:44px;height:44px;line-height:44px;text-align:center;border-radius:14px;background:${theme.iconBg};color:${theme.badgeText};font-size:22px;font-weight:800;">${theme.icon}</div>
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-size:11px;line-height:16px;font-weight:800;letter-spacing:1.2px;color:${theme.badgeText};">${escapeHtml(theme.eyebrow)}</div>
                    <div style="margin-top:2px;font-size:25px;line-height:31px;font-weight:800;color:#0b356d;">${escapeHtml(theme.title)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:14px 30px 0;">
              <p style="margin:0 0 12px;font-size:16px;line-height:25px;color:#334155;">Hola, <strong style="color:#0f172a;">${name}</strong>.</p>
              <p style="margin:0;font-size:15px;line-height:24px;color:#475569;">${escapeHtml(theme.description)}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:24px 30px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e2e8f0;border-radius:18px;background:#f8fafc;">
                <tr>
                  <td style="padding:20px;">
                    <div style="margin-bottom:14px;font-size:11px;line-height:15px;font-weight:800;letter-spacing:1.2px;color:#64748b;">DETALLES DEL EQUIPO</div>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#64748b;">Equipo</td>
                        <td align="right" style="padding:5px 0;font-size:14px;font-weight:700;color:#0f172a;">${equipment}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#64748b;">Ubicación</td>
                        <td align="right" style="padding:5px 0;font-size:14px;font-weight:700;color:#0f172a;">${location}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#64748b;">Último mantenimiento</td>
                        <td align="right" style="padding:5px 0;font-size:14px;font-weight:700;color:#0f172a;">${escapeHtml(lastMaintenance)}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#64748b;">Frecuencia</td>
                        <td align="right" style="padding:5px 0;font-size:14px;font-weight:700;color:#0f172a;">${recommended}</td>
                      </tr>
                    </table>

                    <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e2e8f0;">
                      <span style="display:inline-block;padding:8px 12px;border:1px solid ${theme.badgeBorder};border-radius:999px;background:${theme.badgeBg};color:${theme.badgeText};font-size:11px;font-weight:800;letter-spacing:.6px;">${theme.label}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:26px 30px 8px;text-align:center;">
              <a href="${escapeHtml(waLink)}" style="display:inline-block;padding:14px 22px;border-radius:13px;background:#16a34a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;box-shadow:0 6px 14px rgba(22,163,74,.18);">Agendar por WhatsApp</a>
              <div style="height:10px;"></div>
              <a href="${escapeHtml(lookupLink)}" style="display:inline-block;padding:11px 18px;color:#0877d8;text-decoration:none;font-size:13px;font-weight:700;">Ver estado de mi equipo →</a>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 30px 30px;">
              <div style="border-top:1px solid #e2e8f0;padding-top:18px;text-align:center;font-size:12px;line-height:19px;color:#94a3b8;">
                <strong style="color:#475569;">Nexter Ingeniería</strong><br />
                Instalación · Mantenimiento · Climatización<br />
                Este mensaje fue generado como recordatorio de mantenimiento de tu equipo.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function adminEmailHtml(row: AlertRow) {
  const theme = statusTheme(row.status);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f8fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding:26px 12px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,.08);">
          <tr><td>${brandHeader()}</td></tr>

          <tr>
            <td style="padding:28px 30px;">
              <div style="font-size:12px;font-weight:800;letter-spacing:1px;color:${theme.badgeText};">ALERTA ADMINISTRATIVA · ${theme.label}</div>
              <h2 style="margin:7px 0 18px;font-size:24px;line-height:30px;color:#0b356d;">${escapeHtml(row.full_name)}</h2>

              <div style="padding:18px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;font-size:14px;line-height:23px;color:#475569;">
                <strong style="color:#0f172a;">Contacto:</strong> ${escapeHtml(row.phone || "Sin teléfono")} · ${escapeHtml(row.email || "Sin correo")}<br />
                <strong style="color:#0f172a;">Equipo:</strong> ${escapeHtml(row.brand)} ${escapeHtml(row.equipment_type)}<br />
                <strong style="color:#0f172a;">Ubicación:</strong> ${escapeHtml(row.location)}<br />
                <strong style="color:#0f172a;">Último mantenimiento:</strong> ${escapeHtml(formatDate(row.last_maintenance))}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!to || !env("RESEND_API_KEY")) {
    return {
      ok: false,
      skipped: true,
      reason: "missing_recipient_or_resend_key",
      providerId: null as string | null,
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env("ALERT_FROM_EMAIL"),
      to: [to],
      subject,
      html,
    }),
  });

  const bodyText = await response.text();

  if (!response.ok) {
    console.error("Resend error", response.status, bodyText);

    return {
      ok: false,
      skipped: false,
      status: response.status,
      body: bodyText,
      providerId: null as string | null,
    };
  }

  let providerId: string | null = null;

  try {
    const parsed = JSON.parse(bodyText);
    providerId = typeof parsed?.id === "string" ? parsed.id : null;
  } catch (_) {
    // Provider id is optional.
  }

  return { ok: true, skipped: false, providerId };
}

async function sendWhatsAppTemplate(to: string, variables: string[]) {
  const token = env("WHATSAPP_ACCESS_TOKEN");
  const phoneId = env("WHATSAPP_PHONE_NUMBER_ID");
  const template = env("WHATSAPP_TEMPLATE_NAME");

  if (!to || !token || !phoneId || !template) {
    return { ok: false, skipped: true, providerId: null as string | null };
  }

  const clean = normalizePhone(to);

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${phoneId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: clean,
        type: "template",
        template: {
          name: template,
          language: {
            code: env("WHATSAPP_TEMPLATE_LANGUAGE") || "es",
          },
          components: [
            {
              type: "body",
              parameters: variables.map((text) => ({
                type: "text",
                text,
              })),
            },
          ],
        },
      }),
    },
  );

  const bodyText = await response.text();

  if (!response.ok) {
    console.error("WhatsApp error", response.status, bodyText);

    return {
      ok: false,
      skipped: false,
      providerId: null as string | null,
    };
  }

  let providerId: string | null = null;

  try {
    const parsed = JSON.parse(bodyText);
    providerId = parsed?.messages?.[0]?.id ?? null;
  } catch (_) {}

  return { ok: true, skipped: false, providerId };
}

async function notificationAlreadySent(
  maintenanceServiceId: string,
  status: string,
  channel: "EMAIL" | "WHATSAPP",
  target: "CLIENT" | "ADMIN",
) {
  const { data, error } = await supabase
    .from("maintenance_notification_log")
    .select("id")
    .eq("maintenance_service_id", maintenanceServiceId)
    .eq("status", status)
    .eq("channel", channel)
    .eq("target", target)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function markNotificationSent(args: {
  row: AlertRow;
  channel: "EMAIL" | "WHATSAPP";
  target: "CLIENT" | "ADMIN";
  recipient: string;
  providerId?: string | null;
}) {
  const { error } = await supabase.from("maintenance_notification_log").insert({
    customer_id: args.row.customer_id,
    equipment_id: args.row.equipment_id,
    maintenance_service_id: args.row.maintenance_service_id,
    status: args.row.status,
    channel: args.channel,
    target: args.target,
    recipient: args.recipient || null,
    provider_message_id: args.providerId || null,
  });

  if (error && error.code !== "23505") throw error;
}

Deno.serve(async () => {
  const { data, error } = await supabase.rpc("maintenance_alert_candidates");

  if (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  let processed = 0;
  let skippedAlreadySent = 0;
  let clientEmailsSent = 0;
  let adminEmailsSent = 0;
  let clientWhatsAppsSent = 0;
  let adminWhatsAppsSent = 0;
  const errors: string[] = [];

  for (const rawRow of data ?? []) {
    const row = rawRow as AlertRow;
    const theme = statusTheme(row.status);
    const lookup = row.email || row.phone || "";
    const lookupParam = row.email ? "correo" : "telefono";
    const siteUrl = publicSiteUrl();

    const lookupLink = siteUrl
      ? `${siteUrl}/estado?${lookupParam}=${encodeURIComponent(lookup)}`
      : "#";

    const waMessage =
      `Hola Nexter Ingeniería, quiero agendar mantenimiento para mi ${row.brand} ${row.equipment_type} ubicado en ${row.location}. Mi nombre es ${row.full_name}.`;

    const waLink =
      `https://wa.me/${normalizePhone(env("WHATSAPP_NUMBER"))}?text=${encodeURIComponent(waMessage)}`;

    let rowDidWork = false;

    // CLIENTE - EMAIL
    if (row.email) {
      try {
        const sent = await notificationAlreadySent(
          row.maintenance_service_id,
          row.status,
          "EMAIL",
          "CLIENT",
        );

        if (sent) {
          skippedAlreadySent++;
        } else {
          const result = await sendEmail(
            row.email,
            theme.subject,
            clientEmailHtml(row, lookupLink, waLink),
          );

          if (result.ok) {
            await markNotificationSent({
              row,
              channel: "EMAIL",
              target: "CLIENT",
              recipient: row.email,
              providerId: result.providerId,
            });

            clientEmailsSent++;
            rowDidWork = true;
          } else if (!result.skipped) {
            errors.push(`Cliente ${row.full_name}: correo no enviado`);
          }
        }
      } catch (e) {
        errors.push(
          `Cliente ${row.full_name}: ${
            e instanceof Error ? e.message : String(e)
          }`,
        );
      }
    }

    // CLIENTE - WHATSAPP
    if (row.phone) {
      try {
        const sent = await notificationAlreadySent(
          row.maintenance_service_id,
          row.status,
          "WHATSAPP",
          "CLIENT",
        );

        if (sent) {
          skippedAlreadySent++;
        } else {
          const result = await sendWhatsAppTemplate(row.phone, [
            row.full_name,
            `${row.brand} ${row.equipment_type}`,
            row.location,
            theme.label,
          ]);

          if (result.ok) {
            await markNotificationSent({
              row,
              channel: "WHATSAPP",
              target: "CLIENT",
              recipient: row.phone,
              providerId: result.providerId,
            });

            clientWhatsAppsSent++;
            rowDidWork = true;
          }
        }
      } catch (e) {
        errors.push(
          `WhatsApp cliente ${row.full_name}: ${
            e instanceof Error ? e.message : String(e)
          }`,
        );
      }
    }

    // ADMIN - EMAIL: solo VENCIDO
    if (row.status === "VENCIDO" && env("TECHNICIAN_EMAIL")) {
      try {
        const sent = await notificationAlreadySent(
          row.maintenance_service_id,
          row.status,
          "EMAIL",
          "ADMIN",
        );

        if (sent) {
          skippedAlreadySent++;
        } else {
          const result = await sendEmail(
            env("TECHNICIAN_EMAIL"),
            `Nexter Ingeniería | ${theme.label}: ${row.full_name}`,
            adminEmailHtml(row),
          );

          if (result.ok) {
            await markNotificationSent({
              row,
              channel: "EMAIL",
              target: "ADMIN",
              recipient: env("TECHNICIAN_EMAIL"),
              providerId: result.providerId,
            });

            adminEmailsSent++;
            rowDidWork = true;
          } else if (!result.skipped) {
            errors.push(`Admin: alerta de ${row.full_name} no enviada`);
          }
        }
      } catch (e) {
        errors.push(
          `Admin ${row.full_name}: ${
            e instanceof Error ? e.message : String(e)
          }`,
        );
      }
    }

    // ADMIN - WHATSAPP: solo VENCIDO
    if (row.status === "VENCIDO" && env("ADMIN_WHATSAPP")) {
      try {
        const sent = await notificationAlreadySent(
          row.maintenance_service_id,
          row.status,
          "WHATSAPP",
          "ADMIN",
        );

        if (sent) {
          skippedAlreadySent++;
        } else {
          const result = await sendWhatsAppTemplate(env("ADMIN_WHATSAPP"), [
            row.full_name,
            `${row.brand} ${row.equipment_type}`,
            row.location,
            theme.label,
          ]);

          if (result.ok) {
            await markNotificationSent({
              row,
              channel: "WHATSAPP",
              target: "ADMIN",
              recipient: env("ADMIN_WHATSAPP"),
              providerId: result.providerId,
            });

            adminWhatsAppsSent++;
            rowDidWork = true;
          }
        }
      } catch (e) {
        errors.push(
          `WhatsApp admin ${row.full_name}: ${
            e instanceof Error ? e.message : String(e)
          }`,
        );
      }
    }

    if (rowDidWork) processed++;
  }

  return new Response(
    JSON.stringify({
      ok: errors.length === 0,
      candidates: (data ?? []).length,
      processed,
      skippedAlreadySent,
      clientEmailsSent,
      adminEmailsSent,
      clientWhatsAppsSent,
      adminWhatsAppsSent,
      errors,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
});
