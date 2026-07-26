import type { Locale } from "@/lib/i18n/config";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface ReportEmailParams {
  locale: Locale;
  reportUrl: string;
  supportEmail: string;
}

/**
 * Deliberately never includes the original question or any report content
 * — docs/11: "neutral subject ... no unnecessary sensitive question
 * details". Subjects and bodies stay generic regardless of topic.
 */
const FOOTER = {
  de: {
    signature: "TEKMESIS – FROM STUDIES TO CLARITY.",
    parent: "Ein Produkt von AXIA4 Digital.",
    disclaimer:
      "TEKMESIS bietet allgemeine wissenschaftliche Informationen und evidenzbasierte Orientierung für Fragen des Lebens. Es ersetzt keine individuelle Fachberatung.",
  },
  en: {
    signature: "TEKMESIS – FROM STUDIES TO CLARITY.",
    parent: "A product of AXIA4 Digital.",
    disclaimer:
      "TEKMESIS provides general scientific information and evidence-based orientation for life questions. It does not replace individual professional advice.",
  },
} as const;

function wrapEmail(locale: Locale, bodyHtml: string, bodyText: string): { html: string; text: string } {
  const footer = FOOTER[locale];
  return {
    html: `<div>${bodyHtml}<hr/><p>${footer.signature}<br/>${footer.parent}</p><p style="font-size:12px;color:#666;">${footer.disclaimer}</p></div>`,
    text: `${bodyText}\n\n${footer.signature}\n${footer.parent}\n\n${footer.disclaimer}`,
  };
}

export function buildReportReadyEmail(params: ReportEmailParams): EmailContent {
  const { locale, reportUrl, supportEmail } = params;

  if (locale === "de") {
    const bodyHtml = `<p>Hallo,</p><p>dein Evidence Report ist fertig und über den folgenden sicheren Link abrufbar:</p><p><a href="${reportUrl}">${reportUrl}</a></p><p>Dieser Link ist persönlich — bitte nur mit Personen teilen, denen du vertraust.</p><p>Fragen oder Hinweise? Schreib uns an <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>`;
    const bodyText = `Hallo,\n\ndein Evidence Report ist fertig und über den folgenden sicheren Link abrufbar:\n${reportUrl}\n\nDieser Link ist persönlich — bitte nur mit Personen teilen, denen du vertraust.\n\nFragen oder Hinweise? Schreib uns an ${supportEmail}.`;
    return { subject: "Dein TEKMESIS Evidence Report ist bereit", ...wrapEmail(locale, bodyHtml, bodyText) };
  }

  const bodyHtml = `<p>Hi,</p><p>your Evidence Report is ready and available via the following secure link:</p><p><a href="${reportUrl}">${reportUrl}</a></p><p>This link is personal — please only share it with people you trust.</p><p>Questions or feedback? Write to us at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>`;
  const bodyText = `Hi,\n\nyour Evidence Report is ready and available via the following secure link:\n${reportUrl}\n\nThis link is personal — please only share it with people you trust.\n\nQuestions or feedback? Write to us at ${supportEmail}.`;
  return { subject: "Your TEKMESIS Evidence Report is ready", ...wrapEmail(locale, bodyHtml, bodyText) };
}

export function buildReportFailedEmail(params: ReportEmailParams): EmailContent {
  const { locale, supportEmail } = params;

  if (locale === "de") {
    const bodyHtml = `<p>Hallo,</p><p>bei der Erstellung deines Evidence Reports ist eine Verzögerung aufgetreten. Wir arbeiten daran und melden uns, sobald er bereit ist. Deine Zahlung bleibt gültig.</p><p>Fragen? Schreib uns an <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>`;
    const bodyText = `Hallo,\n\nbei der Erstellung deines Evidence Reports ist eine Verzögerung aufgetreten. Wir arbeiten daran und melden uns, sobald er bereit ist. Deine Zahlung bleibt gültig.\n\nFragen? Schreib uns an ${supportEmail}.`;
    return { subject: "Verzögerung bei deinem TEKMESIS Report", ...wrapEmail(locale, bodyHtml, bodyText) };
  }

  const bodyHtml = `<p>Hi,</p><p>there's been a delay generating your Evidence Report. We're on it and will follow up once it's ready. Your payment remains valid.</p><p>Questions? Write to us at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>`;
  const bodyText = `Hi,\n\nthere's been a delay generating your Evidence Report. We're on it and will follow up once it's ready. Your payment remains valid.\n\nQuestions? Write to us at ${supportEmail}.`;
  return { subject: "Delay with your TEKMESIS report", ...wrapEmail(locale, bodyHtml, bodyText) };
}

export function buildRefundConfirmationEmail(params: ReportEmailParams): EmailContent {
  const { locale, supportEmail } = params;

  if (locale === "de") {
    const bodyHtml = `<p>Hallo,</p><p>wir bestätigen die Rückerstattung deiner Zahlung. Die Gutschrift erfolgt über deinen ursprünglichen Zahlungsweg.</p><p>Fragen? Schreib uns an <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>`;
    const bodyText = `Hallo,\n\nwir bestätigen die Rückerstattung deiner Zahlung. Die Gutschrift erfolgt über deinen ursprünglichen Zahlungsweg.\n\nFragen? Schreib uns an ${supportEmail}.`;
    return { subject: "Rückerstattung bestätigt", ...wrapEmail(locale, bodyHtml, bodyText) };
  }

  const bodyHtml = `<p>Hi,</p><p>we confirm the refund of your payment. It will be credited back via your original payment method.</p><p>Questions? Write to us at <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>`;
  const bodyText = `Hi,\n\nwe confirm the refund of your payment. It will be credited back via your original payment method.\n\nQuestions? Write to us at ${supportEmail}.`;
  return { subject: "Refund confirmed", ...wrapEmail(locale, bodyHtml, bodyText) };
}
