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
    parent: "Ein Produkt von AXIA4 by EF.",
    disclaimer:
      "TEKMESIS bietet allgemeine wissenschaftliche Informationen und evidenzbasierte Orientierung für Fragen des Lebens. Es ersetzt keine individuelle Fachberatung.",
  },
  en: {
    signature: "TEKMESIS – FROM STUDIES TO CLARITY.",
    parent: "A product of AXIA4 by EF.",
    disclaimer:
      "TEKMESIS provides general scientific information and evidence-based orientation for life questions. It does not replace individual professional advice.",
  },
  fr: {
    signature: "TEKMESIS – FROM STUDIES TO CLARITY.",
    parent: "Un produit d'AXIA4 by EF.",
    disclaimer:
      "TEKMESIS propose des informations scientifiques générales et une orientation fondée sur des preuves pour des questions de vie. Cela ne remplace pas un conseil professionnel individuel.",
  },
} as const;

/** Same navy/teal/neutral tokens as globals.css (--color-navy-900, --color-teal-600, --color-neutral-*), inlined because email clients don't load stylesheets. */
const COLOR = {
  navy900: "#0b2540",
  teal600: "#0a7f8c",
  teal700: "#0a6570",
  neutral600: "#4c5966",
  neutral400: "#8a97a3",
  neutral200: "#dde3e8",
  neutral50: "#f8fafb",
};

const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** A pill-shaped call-to-action link styled as a button — table-based email HTML has no other reliable way to render a button across clients. */
function emailButton(url: string, label: string): string {
  return `<a href="${url}" style="display:inline-block;background-color:${COLOR.teal600};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:600;font-size:14px;">${label}</a>`;
}

function emailLink(url: string, label: string): string {
  return `<a href="${url}" style="color:${COLOR.teal700};">${label}</a>`;
}

function wrapEmail(locale: Locale, bodyHtml: string, bodyText: string): { html: string; text: string } {
  const footer = FOOTER[locale];
  const html = `<div style="background-color:${COLOR.neutral50};padding:32px 16px;font-family:${FONT_STACK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${COLOR.neutral200};">
    <tr>
      <td style="background-color:${COLOR.navy900};padding:20px 32px;">
        <span style="color:#ffffff;font-size:18px;font-weight:600;letter-spacing:0.02em;">TEKMESIS</span>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;color:${COLOR.navy900};font-size:15px;line-height:1.6;">
        ${bodyHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 32px;">
        <hr style="border:none;border-top:1px solid ${COLOR.neutral200};margin:0 0 16px;" />
        <p style="margin:0;color:${COLOR.neutral600};font-size:13px;">${footer.signature}<br/>${footer.parent}</p>
        <p style="margin:12px 0 0;color:${COLOR.neutral400};font-size:11px;line-height:1.5;">${footer.disclaimer}</p>
      </td>
    </tr>
  </table>
</div>`;
  return { html, text: `${bodyText}\n\n${footer.signature}\n${footer.parent}\n\n${footer.disclaimer}` };
}

export function buildReportReadyEmail(params: ReportEmailParams): EmailContent {
  const { locale, reportUrl, supportEmail } = params;

  if (locale === "de") {
    const bodyHtml = `<p style="margin:0 0 16px;">Hallo,</p><p style="margin:0 0 24px;">dein Evidence Report ist fertig und über den folgenden sicheren Link abrufbar:</p><p style="margin:0 0 20px;">${emailButton(reportUrl, "Report ansehen")}</p><p style="margin:0 0 20px;font-size:13px;color:${COLOR.neutral600};">Falls der Button nicht funktioniert: ${emailLink(reportUrl, reportUrl)}</p><p style="margin:0 0 16px;">Dieser Link ist persönlich — bitte nur mit Personen teilen, denen du vertraust.</p><p style="margin:0;">Fragen oder Hinweise? Schreib uns an ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
    const bodyText = `Hallo,\n\ndein Evidence Report ist fertig und über den folgenden sicheren Link abrufbar:\n${reportUrl}\n\nDieser Link ist persönlich — bitte nur mit Personen teilen, denen du vertraust.\n\nFragen oder Hinweise? Schreib uns an ${supportEmail}.`;
    return { subject: "Dein TEKMESIS Evidence Report ist bereit", ...wrapEmail(locale, bodyHtml, bodyText) };
  }

  if (locale === "fr") {
    const bodyHtml = `<p style="margin:0 0 16px;">Bonjour,</p><p style="margin:0 0 24px;">ton Evidence Report est prêt et accessible via le lien sécurisé suivant :</p><p style="margin:0 0 20px;">${emailButton(reportUrl, "Voir le rapport")}</p><p style="margin:0 0 20px;font-size:13px;color:${COLOR.neutral600};">Si le bouton ne fonctionne pas : ${emailLink(reportUrl, reportUrl)}</p><p style="margin:0 0 16px;">Ce lien est personnel — merci de ne le partager qu'avec des personnes de confiance.</p><p style="margin:0;">Des questions ou remarques ? Écris-nous à ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
    const bodyText = `Bonjour,\n\nton Evidence Report est prêt et accessible via le lien sécurisé suivant :\n${reportUrl}\n\nCe lien est personnel — merci de ne le partager qu'avec des personnes de confiance.\n\nDes questions ou remarques ? Écris-nous à ${supportEmail}.`;
    return { subject: "Ton Evidence Report TEKMESIS est prêt", ...wrapEmail(locale, bodyHtml, bodyText) };
  }

  const bodyHtml = `<p style="margin:0 0 16px;">Hi,</p><p style="margin:0 0 24px;">your Evidence Report is ready and available via the following secure link:</p><p style="margin:0 0 20px;">${emailButton(reportUrl, "View report")}</p><p style="margin:0 0 20px;font-size:13px;color:${COLOR.neutral600};">If the button doesn't work: ${emailLink(reportUrl, reportUrl)}</p><p style="margin:0 0 16px;">This link is personal — please only share it with people you trust.</p><p style="margin:0;">Questions or feedback? Write to us at ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
  const bodyText = `Hi,\n\nyour Evidence Report is ready and available via the following secure link:\n${reportUrl}\n\nThis link is personal — please only share it with people you trust.\n\nQuestions or feedback? Write to us at ${supportEmail}.`;
  return { subject: "Your TEKMESIS Evidence Report is ready", ...wrapEmail(locale, bodyHtml, bodyText) };
}

export function buildReportFailedEmail(params: ReportEmailParams): EmailContent {
  const { locale, supportEmail } = params;

  if (locale === "de") {
    const bodyHtml = `<p style="margin:0 0 16px;">Hallo,</p><p style="margin:0 0 16px;">bei der Erstellung deines Evidence Reports ist eine Verzögerung aufgetreten. Wir arbeiten daran und melden uns, sobald er bereit ist. Deine Zahlung bleibt gültig.</p><p style="margin:0;">Fragen? Schreib uns an ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
    const bodyText = `Hallo,\n\nbei der Erstellung deines Evidence Reports ist eine Verzögerung aufgetreten. Wir arbeiten daran und melden uns, sobald er bereit ist. Deine Zahlung bleibt gültig.\n\nFragen? Schreib uns an ${supportEmail}.`;
    return { subject: "Verzögerung bei deinem TEKMESIS Report", ...wrapEmail(locale, bodyHtml, bodyText) };
  }

  if (locale === "fr") {
    const bodyHtml = `<p style="margin:0 0 16px;">Bonjour,</p><p style="margin:0 0 16px;">un retard est survenu lors de la génération de ton Evidence Report. Nous y travaillons et te contacterons dès qu'il sera prêt. Ton paiement reste valable.</p><p style="margin:0;">Des questions ? Écris-nous à ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
    const bodyText = `Bonjour,\n\nun retard est survenu lors de la génération de ton Evidence Report. Nous y travaillons et te contacterons dès qu'il sera prêt. Ton paiement reste valable.\n\nDes questions ? Écris-nous à ${supportEmail}.`;
    return { subject: "Retard concernant ton rapport TEKMESIS", ...wrapEmail(locale, bodyHtml, bodyText) };
  }

  const bodyHtml = `<p style="margin:0 0 16px;">Hi,</p><p style="margin:0 0 16px;">there's been a delay generating your Evidence Report. We're on it and will follow up once it's ready. Your payment remains valid.</p><p style="margin:0;">Questions? Write to us at ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
  const bodyText = `Hi,\n\nthere's been a delay generating your Evidence Report. We're on it and will follow up once it's ready. Your payment remains valid.\n\nQuestions? Write to us at ${supportEmail}.`;
  return { subject: "Delay with your TEKMESIS report", ...wrapEmail(locale, bodyHtml, bodyText) };
}

export interface UpdateCheckStudySummary {
  title: string | null;
  venue: string | null;
  year: number | null;
  sourceUrl: string | null;
  doi: string | null;
}

export interface UpdateCheckResultEmailParams {
  locale: Locale;
  reportUrl: string;
  supportEmail: string;
  newStudies: UpdateCheckStudySummary[];
}

const UPDATE_CHECK_NOT_REPORTED: Record<Locale, string> = {
  de: "nicht angegeben",
  en: "not reported",
  fr: "non indiqué",
};

function studyLinkUrl(study: UpdateCheckStudySummary): string | null {
  return study.sourceUrl ?? (study.doi ? `https://doi.org/${study.doi}` : null);
}

/** One list item per newly found study — title, venue/year, and a link when available. Never anything beyond what the source record itself provided (no AI synthesis was run on these — see update-check.ts). */
function studyListItem(study: UpdateCheckStudySummary, locale: Locale): string {
  const notReported = UPDATE_CHECK_NOT_REPORTED[locale];
  const title = study.title ?? notReported;
  const detail = [study.venue, study.year ? String(study.year) : null].filter(Boolean).join(", ");
  const url = studyLinkUrl(study);
  const titlePart = url ? emailLink(url, title) : title;
  return `<li style="margin:0 0 10px;">${titlePart}${detail ? ` — ${detail}` : ""}</li>`;
}

/**
 * Result of a one-time, user-triggered Evidenz-Update-Check (decision #7) —
 * never a recurring/automatic send (CLAUDE.md: "No subscription in MVP").
 * Deliberately lists only the same directly-sourced fields update-check.ts
 * returns (title, venue, year, link) — these studies were only screened/
 * included by the search pipeline, never run through AI extraction or
 * synthesis like the original report's profiles were, so the email says so
 * explicitly rather than implying a new full analysis.
 */
export function buildUpdateCheckResultEmail(params: UpdateCheckResultEmailParams): EmailContent {
  const { locale, reportUrl, supportEmail, newStudies } = params;
  const list = newStudies.map((study) => studyListItem(study, locale)).join("");

  if (locale === "de") {
    const intro =
      newStudies.length > 0
        ? `<p style="margin:0 0 16px;">bei einer erneuten automatischen Prüfung haben wir ${newStudies.length} möglicherweise neue Studie${newStudies.length === 1 ? "" : "n"} zu deiner Frage gefunden:</p><ul style="margin:0 0 20px;padding-left:20px;">${list}</ul><p style="margin:0 0 20px;font-size:13px;color:${COLOR.neutral600};">Diese Liste stammt direkt aus unserer automatischen Quellensuche und wurde noch nicht wie dein ursprünglicher Report inhaltlich ausgewertet oder zusammengefasst. Für eine vollständige Auswertung müsstest du einen neuen Report erstellen.</p>`
        : `<p style="margin:0 0 20px;">bei einer erneuten automatischen Prüfung haben wir keine neuen Studien zu deiner Frage gefunden.</p>`;
    const bodyHtml = `<p style="margin:0 0 16px;">Hallo,</p>${intro}<p style="margin:0 0 20px;">${emailButton(reportUrl, "Deinen Report ansehen")}</p><p style="margin:0;">Fragen oder Hinweise? Schreib uns an ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
    const textList = newStudies
      .map((s) => `- ${s.title ?? "nicht angegeben"}${s.venue ? `, ${s.venue}` : ""}${s.year ? ` (${s.year})` : ""}`)
      .join("\n");
    const bodyText =
      newStudies.length > 0
        ? `Hallo,\n\nbei einer erneuten automatischen Prüfung haben wir ${newStudies.length} möglicherweise neue Studie(n) zu deiner Frage gefunden:\n${textList}\n\nDiese Liste wurde noch nicht inhaltlich ausgewertet. Für eine vollständige Auswertung müsstest du einen neuen Report erstellen.\n\nDein Report: ${reportUrl}\n\nFragen oder Hinweise? Schreib uns an ${supportEmail}.`
        : `Hallo,\n\nbei einer erneuten automatischen Prüfung haben wir keine neuen Studien zu deiner Frage gefunden.\n\nDein Report: ${reportUrl}\n\nFragen oder Hinweise? Schreib uns an ${supportEmail}.`;
    return {
      subject: newStudies.length > 0 ? "Neue Studien zu deiner TEKMESIS-Frage gefunden" : "Update-Check: keine neuen Studien gefunden",
      ...wrapEmail(locale, bodyHtml, bodyText),
    };
  }

  if (locale === "fr") {
    const intro =
      newStudies.length > 0
        ? `<p style="margin:0 0 16px;">lors d'une nouvelle vérification automatique, nous avons trouvé ${newStudies.length} étude${newStudies.length === 1 ? "" : "s"} potentiellement nouvelle${newStudies.length === 1 ? "" : "s"} pour ta question :</p><ul style="margin:0 0 20px;padding-left:20px;">${list}</ul><p style="margin:0 0 20px;font-size:13px;color:${COLOR.neutral600};">Cette liste provient directement de notre recherche automatique et n'a pas encore été analysée ou synthétisée comme ton rapport initial. Pour une analyse complète, il faudrait générer un nouveau rapport.</p>`
        : `<p style="margin:0 0 20px;">lors d'une nouvelle vérification automatique, nous n'avons trouvé aucune nouvelle étude pour ta question.</p>`;
    const bodyHtml = `<p style="margin:0 0 16px;">Bonjour,</p>${intro}<p style="margin:0 0 20px;">${emailButton(reportUrl, "Voir ton rapport")}</p><p style="margin:0;">Des questions ou remarques ? Écris-nous à ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
    const textList = newStudies
      .map((s) => `- ${s.title ?? "non indiqué"}${s.venue ? `, ${s.venue}` : ""}${s.year ? ` (${s.year})` : ""}`)
      .join("\n");
    const bodyText =
      newStudies.length > 0
        ? `Bonjour,\n\nlors d'une nouvelle vérification automatique, nous avons trouvé ${newStudies.length} étude(s) potentiellement nouvelle(s) pour ta question :\n${textList}\n\nCette liste n'a pas encore été analysée. Pour une analyse complète, il faudrait générer un nouveau rapport.\n\nTon rapport : ${reportUrl}\n\nDes questions ou remarques ? Écris-nous à ${supportEmail}.`
        : `Bonjour,\n\nlors d'une nouvelle vérification automatique, nous n'avons trouvé aucune nouvelle étude pour ta question.\n\nTon rapport : ${reportUrl}\n\nDes questions ou remarques ? Écris-nous à ${supportEmail}.`;
    return {
      subject: newStudies.length > 0 ? "Nouvelles études trouvées pour ta question TEKMESIS" : "Vérification : aucune nouvelle étude trouvée",
      ...wrapEmail(locale, bodyHtml, bodyText),
    };
  }

  const intro =
    newStudies.length > 0
      ? `<p style="margin:0 0 16px;">a fresh automatic check found ${newStudies.length} possibly new stud${newStudies.length === 1 ? "y" : "ies"} for your question:</p><ul style="margin:0 0 20px;padding-left:20px;">${list}</ul><p style="margin:0 0 20px;font-size:13px;color:${COLOR.neutral600};">This list comes directly from our automatic source search and hasn't been analyzed or synthesized like your original report. A full analysis would require generating a new report.</p>`
      : `<p style="margin:0 0 20px;">a fresh automatic check found no new studies for your question.</p>`;
  const bodyHtml = `<p style="margin:0 0 16px;">Hi,</p>${intro}<p style="margin:0 0 20px;">${emailButton(reportUrl, "View your report")}</p><p style="margin:0;">Questions or feedback? Write to us at ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
  const textList = newStudies
    .map((s) => `- ${s.title ?? "not reported"}${s.venue ? `, ${s.venue}` : ""}${s.year ? ` (${s.year})` : ""}`)
    .join("\n");
  const bodyText =
    newStudies.length > 0
      ? `Hi,\n\na fresh automatic check found ${newStudies.length} possibly new stud${newStudies.length === 1 ? "y" : "ies"} for your question:\n${textList}\n\nThis list hasn't been analyzed yet. A full analysis would require generating a new report.\n\nYour report: ${reportUrl}\n\nQuestions or feedback? Write to us at ${supportEmail}.`
      : `Hi,\n\na fresh automatic check found no new studies for your question.\n\nYour report: ${reportUrl}\n\nQuestions or feedback? Write to us at ${supportEmail}.`;
  return {
    subject: newStudies.length > 0 ? "New studies found for your TEKMESIS question" : "Update check: no new studies found",
    ...wrapEmail(locale, bodyHtml, bodyText),
  };
}

export function buildRefundConfirmationEmail(params: ReportEmailParams): EmailContent {
  const { locale, supportEmail } = params;

  if (locale === "de") {
    const bodyHtml = `<p style="margin:0 0 16px;">Hallo,</p><p style="margin:0 0 16px;">wir bestätigen die Rückerstattung deiner Zahlung. Die Gutschrift erfolgt über deinen ursprünglichen Zahlungsweg.</p><p style="margin:0;">Fragen? Schreib uns an ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
    const bodyText = `Hallo,\n\nwir bestätigen die Rückerstattung deiner Zahlung. Die Gutschrift erfolgt über deinen ursprünglichen Zahlungsweg.\n\nFragen? Schreib uns an ${supportEmail}.`;
    return { subject: "Rückerstattung bestätigt", ...wrapEmail(locale, bodyHtml, bodyText) };
  }

  if (locale === "fr") {
    const bodyHtml = `<p style="margin:0 0 16px;">Bonjour,</p><p style="margin:0 0 16px;">nous confirmons le remboursement de ton paiement. Le montant sera crédité via ton moyen de paiement d'origine.</p><p style="margin:0;">Des questions ? Écris-nous à ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
    const bodyText = `Bonjour,\n\nnous confirmons le remboursement de ton paiement. Le montant sera crédité via ton moyen de paiement d'origine.\n\nDes questions ? Écris-nous à ${supportEmail}.`;
    return { subject: "Remboursement confirmé", ...wrapEmail(locale, bodyHtml, bodyText) };
  }

  const bodyHtml = `<p style="margin:0 0 16px;">Hi,</p><p style="margin:0 0 16px;">we confirm the refund of your payment. It will be credited back via your original payment method.</p><p style="margin:0;">Questions? Write to us at ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
  const bodyText = `Hi,\n\nwe confirm the refund of your payment. It will be credited back via your original payment method.\n\nQuestions? Write to us at ${supportEmail}.`;
  return { subject: "Refund confirmed", ...wrapEmail(locale, bodyHtml, bodyText) };
}

export interface TopicDigestSubscriptionEmailParams {
  locale: Locale;
  topicNames: string[];
  browseUrl: string;
  unsubscribeUrl: string;
  supportEmail: string;
}

function topicListItems(topicNames: string[]): string {
  return topicNames.map((name) => `<li style="margin:0 0 6px;">${name}</li>`).join("");
}

/**
 * Sent right after a successful POST /api/topics/subscribe — both for a
 * brand-new signup and for adding a further topic to an existing
 * subscription, since the unsubscribe link can only ever be produced fresh
 * (topics/unsubscribe-token.ts: it's re-derived from the subscription id,
 * never stored), so every subscribe action gets one.
 */
export function buildTopicDigestConfirmationEmail(
  params: TopicDigestSubscriptionEmailParams,
): EmailContent {
  const { locale, topicNames, browseUrl, unsubscribeUrl, supportEmail } = params;
  const list = topicListItems(topicNames);

  if (locale === "de") {
    const bodyHtml = `<p style="margin:0 0 16px;">Hallo,</p><p style="margin:0 0 12px;">du bist jetzt für den TEKMESIS Themen-Digest angemeldet, zu diesen Themen:</p><ul style="margin:0 0 20px;padding-left:20px;">${list}</ul><p style="margin:0 0 20px;font-size:13px;color:${COLOR.neutral600};">Sobald unsere automatische Quellensuche neue Studien zu einem deiner Themen findet, schicken wir dir eine Zusammenfassung — höchstens einmal pro Woche, nie öfter, und nur wenn es wirklich etwas Neues gibt.</p><p style="margin:0 0 20px;">${emailLink(browseUrl, "Weitere Themen entdecken")}</p><p style="margin:0;">Nicht mehr interessiert? ${emailLink(unsubscribeUrl, "Abmelden")}. Fragen? Schreib uns an ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
    const bodyText = `Hallo,\n\ndu bist jetzt für den TEKMESIS Themen-Digest angemeldet, zu diesen Themen:\n${topicNames.map((n) => `- ${n}`).join("\n")}\n\nSobald unsere automatische Quellensuche neue Studien zu einem deiner Themen findet, schicken wir dir eine Zusammenfassung — höchstens einmal pro Woche, nie öfter, und nur wenn es wirklich etwas Neues gibt.\n\nWeitere Themen: ${browseUrl}\n\nAbmelden: ${unsubscribeUrl}\n\nFragen? Schreib uns an ${supportEmail}.`;
    return { subject: "Angemeldet: TEKMESIS Themen-Digest", ...wrapEmail(locale, bodyHtml, bodyText) };
  }

  if (locale === "fr") {
    const bodyHtml = `<p style="margin:0 0 16px;">Bonjour,</p><p style="margin:0 0 12px;">tu es maintenant inscrit·e au digest thématique TEKMESIS pour ces thèmes :</p><ul style="margin:0 0 20px;padding-left:20px;">${list}</ul><p style="margin:0 0 20px;font-size:13px;color:${COLOR.neutral600};">Dès que notre recherche automatique trouve de nouvelles études pour l'un de tes thèmes, nous t'envoyons un résumé — au maximum une fois par semaine, jamais plus, et seulement s'il y a vraiment du nouveau.</p><p style="margin:0 0 20px;">${emailLink(browseUrl, "Découvrir d'autres thèmes")}</p><p style="margin:0;">Plus intéressé·e ? ${emailLink(unsubscribeUrl, "Se désabonner")}. Des questions ? Écris-nous à ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
    const bodyText = `Bonjour,\n\ntu es maintenant inscrit·e au digest thématique TEKMESIS pour ces thèmes :\n${topicNames.map((n) => `- ${n}`).join("\n")}\n\nDès que notre recherche automatique trouve de nouvelles études pour l'un de tes thèmes, nous t'envoyons un résumé — au maximum une fois par semaine, jamais plus, et seulement s'il y a vraiment du nouveau.\n\nDécouvrir d'autres thèmes : ${browseUrl}\n\nSe désabonner : ${unsubscribeUrl}\n\nDes questions ? Écris-nous à ${supportEmail}.`;
    return { subject: "Inscription confirmée : digest thématique TEKMESIS", ...wrapEmail(locale, bodyHtml, bodyText) };
  }

  const bodyHtml = `<p style="margin:0 0 16px;">Hi,</p><p style="margin:0 0 12px;">you're now signed up for the TEKMESIS topic digest, for these topics:</p><ul style="margin:0 0 20px;padding-left:20px;">${list}</ul><p style="margin:0 0 20px;font-size:13px;color:${COLOR.neutral600};">Once our automatic source search finds new studies for one of your topics, we'll send you a summary — at most once a week, never more often, and only when there's genuinely something new.</p><p style="margin:0 0 20px;">${emailLink(browseUrl, "Discover more topics")}</p><p style="margin:0;">No longer interested? ${emailLink(unsubscribeUrl, "Unsubscribe")}. Questions? Write to us at ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
  const bodyText = `Hi,\n\nyou're now signed up for the TEKMESIS topic digest, for these topics:\n${topicNames.map((n) => `- ${n}`).join("\n")}\n\nOnce our automatic source search finds new studies for one of your topics, we'll send you a summary — at most once a week, never more often, and only when there's genuinely something new.\n\nMore topics: ${browseUrl}\n\nUnsubscribe: ${unsubscribeUrl}\n\nQuestions? Write to us at ${supportEmail}.`;
  return { subject: "Subscribed: TEKMESIS topic digest", ...wrapEmail(locale, bodyHtml, bodyText) };
}

export interface TopicDigestSection {
  topicName: string;
  studies: UpdateCheckStudySummary[];
}

export interface TopicDigestEmailParams {
  locale: Locale;
  sections: TopicDigestSection[];
  browseUrl: string;
  unsubscribeUrl: string;
  supportEmail: string;
}

function digestSectionHtml(section: TopicDigestSection, locale: Locale): string {
  const items = section.studies.map((study) => studyListItem(study, locale)).join("");
  return `<h3 style="margin:20px 0 8px;font-size:15px;color:${COLOR.navy900};">${section.topicName}</h3><ul style="margin:0 0 12px;padding-left:20px;">${items}</ul>`;
}

function digestSectionText(section: TopicDigestSection, notReported: string): string {
  const lines = section.studies
    .map((s) => `  - ${s.title ?? notReported}${s.venue ? `, ${s.venue}` : ""}${s.year ? ` (${s.year})` : ""}`)
    .join("\n");
  return `${section.topicName}:\n${lines}`;
}

/**
 * Weekly Themen-Digest (docs/OPEN_RISKS.md item #25's 2026-08-04 decision).
 * Only ever called by run-digest.ts when at least one subscribed topic has
 * new studies — an empty-everywhere week sends nothing, so this template
 * never needs a "nothing found" branch. Like buildUpdateCheckResultEmail,
 * lists only directly-sourced fields (title, venue, year, link): every
 * studies-cache entry does carry an AI extraction (studies/types.ts
 * requires it on upsert), but that extraction was written for whichever
 * original report first surfaced the study, not for this digest's topic in
 * general — presenting it as this topic's finding here would risk exactly
 * the "present a protocol as completed evidence"-style overclaiming
 * CLAUDE.md rules out. Recipients who want the full analysis are pointed to
 * generating their own report instead.
 */
export function buildTopicDigestEmail(params: TopicDigestEmailParams): EmailContent {
  const { locale, sections, browseUrl, unsubscribeUrl, supportEmail } = params;
  const totalCount = sections.reduce((sum, section) => sum + section.studies.length, 0);
  const html = sections.map((section) => digestSectionHtml(section, locale)).join("");

  if (locale === "de") {
    const notReported = "nicht angegeben";
    const text = sections.map((s) => digestSectionText(s, notReported)).join("\n\n");
    const bodyHtml = `<p style="margin:0 0 16px;">Hallo,</p><p style="margin:0 0 16px;">unsere automatische Quellensuche hat ${totalCount} möglicherweise neue Studie${totalCount === 1 ? "" : "n"} zu deinen abonnierten Themen gefunden:</p>${html}<p style="margin:20px 0 20px;font-size:13px;color:${COLOR.neutral600};">Diese Liste stammt direkt aus unserer automatischen Quellensuche und wurde nicht speziell für dieses Thema inhaltlich ausgewertet. Für eine vollständige Auswertung zu einer konkreten Frage erstellst du am besten einen eigenen Report.</p><p style="margin:0 0 20px;">${emailButton(browseUrl, "Themen entdecken")}</p><p style="margin:0;">Nicht mehr interessiert? ${emailLink(unsubscribeUrl, "Abmelden")}. Fragen? Schreib uns an ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
    const bodyText = `Hallo,\n\nunsere automatische Quellensuche hat ${totalCount} möglicherweise neue Studie(n) zu deinen abonnierten Themen gefunden:\n\n${text}\n\nDiese Liste wurde nicht inhaltlich ausgewertet. Für eine vollständige Auswertung erstellst du am besten einen eigenen Report.\n\nThemen entdecken: ${browseUrl}\n\nAbmelden: ${unsubscribeUrl}\n\nFragen? Schreib uns an ${supportEmail}.`;
    return { subject: "Neue Studien zu deinen TEKMESIS-Themen", ...wrapEmail(locale, bodyHtml, bodyText) };
  }

  if (locale === "fr") {
    const notReported = "non indiqué";
    const text = sections.map((s) => digestSectionText(s, notReported)).join("\n\n");
    const bodyHtml = `<p style="margin:0 0 16px;">Bonjour,</p><p style="margin:0 0 16px;">notre recherche automatique a trouvé ${totalCount} étude${totalCount === 1 ? "" : "s"} potentiellement nouvelle${totalCount === 1 ? "" : "s"} pour tes thèmes abonnés :</p>${html}<p style="margin:20px 0 20px;font-size:13px;color:${COLOR.neutral600};">Cette liste provient directement de notre recherche automatique et n'a pas été analysée spécifiquement pour ce thème. Pour une analyse complète d'une question précise, génère plutôt ton propre rapport.</p><p style="margin:0 0 20px;">${emailButton(browseUrl, "Découvrir les thèmes")}</p><p style="margin:0;">Plus intéressé·e ? ${emailLink(unsubscribeUrl, "Se désabonner")}. Des questions ? Écris-nous à ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
    const bodyText = `Bonjour,\n\nnotre recherche automatique a trouvé ${totalCount} étude(s) potentiellement nouvelle(s) pour tes thèmes abonnés :\n\n${text}\n\nCette liste n'a pas été analysée. Pour une analyse complète, génère plutôt ton propre rapport.\n\nDécouvrir les thèmes : ${browseUrl}\n\nSe désabonner : ${unsubscribeUrl}\n\nDes questions ? Écris-nous à ${supportEmail}.`;
    return { subject: "Nouvelles études pour tes thèmes TEKMESIS", ...wrapEmail(locale, bodyHtml, bodyText) };
  }

  const notReported = "not reported";
  const text = sections.map((s) => digestSectionText(s, notReported)).join("\n\n");
  const bodyHtml = `<p style="margin:0 0 16px;">Hi,</p><p style="margin:0 0 16px;">our automatic source search found ${totalCount} possibly new stud${totalCount === 1 ? "y" : "ies"} for your subscribed topics:</p>${html}<p style="margin:20px 0 20px;font-size:13px;color:${COLOR.neutral600};">This list comes directly from our automatic source search and hasn't been analyzed specifically for this topic. For a full analysis of a specific question, generate your own report instead.</p><p style="margin:0 0 20px;">${emailButton(browseUrl, "Discover topics")}</p><p style="margin:0;">No longer interested? ${emailLink(unsubscribeUrl, "Unsubscribe")}. Questions? Write to us at ${emailLink(`mailto:${supportEmail}`, supportEmail)}.</p>`;
  const bodyText = `Hi,\n\nour automatic source search found ${totalCount} possibly new stud${totalCount === 1 ? "y" : "ies"} for your subscribed topics:\n\n${text}\n\nThis list hasn't been analyzed. For a full analysis, generate your own report instead.\n\nDiscover topics: ${browseUrl}\n\nUnsubscribe: ${unsubscribeUrl}\n\nQuestions? Write to us at ${supportEmail}.`;
  return { subject: "New studies for your TEKMESIS topics", ...wrapEmail(locale, bodyHtml, bodyText) };
}
