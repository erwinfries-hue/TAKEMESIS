import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { InfoIcon } from "@/components/icons/notice-icons";

export function ReportStatusNotice({
  heading,
  body,
  supportEmail,
  supportNote,
}: {
  heading: string;
  body: string;
  supportEmail?: Dictionary["legalPage"]["supportEmail"];
  supportNote?: string;
}) {
  return (
    <div
      role="status"
      className="flex w-full max-w-xl flex-col gap-3 rounded-xl border border-brand-neutral-200 bg-white p-6 text-left"
    >
      <div className="flex items-start gap-2">
        <InfoIcon className="mt-1 h-5 w-5 shrink-0 text-brand-teal-600" />
        <h1 className="text-xl font-semibold text-brand-navy-900">{heading}</h1>
      </div>
      <p className="text-sm text-brand-neutral-600">{body}</p>
      {supportEmail && supportNote && (
        <p className="text-sm text-brand-neutral-600">
          {supportNote}{" "}
          <a href={`mailto:${supportEmail}`} className="text-brand-teal-700 underline">
            {supportEmail}
          </a>
        </p>
      )}
    </div>
  );
}
