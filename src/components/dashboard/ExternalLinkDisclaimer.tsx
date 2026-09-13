"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ExternalLink as ExternalLinkIcon, ShieldAlert, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Gates every outbound link behind a disclaimer.
 *
 * Confirming opens the destination in a brand new tab (never an iframe or a
 * framed view), so the patient always sees the external site's real URL in
 * their browser. Link text stays plain text — no external logos or branding —
 * so nothing implies a partnership or endorsement.
 */

type ExternalLinkContextValue = {
  /** Ask the user to confirm before leaving for `url`. */
  requestExternalNavigation: (url: string) => void;
};

const ExternalLinkContext = createContext<ExternalLinkContextValue | undefined>(
  undefined,
);

function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function ExternalLinkProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const requestExternalNavigation = useCallback((url: string) => {
    setPendingUrl(url);
  }, []);

  const value = useMemo(
    () => ({ requestExternalNavigation }),
    [requestExternalNavigation],
  );

  const handleClose = () => setPendingUrl(null);

  const handleConfirm = () => {
    if (pendingUrl) {
      window.open(pendingUrl, "_blank", "noopener,noreferrer");
    }
    setPendingUrl(null);
  };

  return (
    <ExternalLinkContext.Provider value={value}>
      {children}

      {pendingUrl ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="external-link-title"
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50">
                  <ShieldAlert className="h-5 w-5 text-amber-600" />
                </span>
                <div>
                  <h2
                    id="external-link-title"
                    className="text-lg font-bold text-slate-900"
                  >
                    {isEs
                      ? "Está saliendo de NephroReach"
                      : "You are leaving NephroReach"}
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {isEs
                      ? "Este enlace abre un sitio web externo en una pestaña nueva."
                      : "This link opens an external website in a new tab."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                aria-label={isEs ? "Cerrar" : "Close"}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Show the real destination so the patient knows where they land */}
            <div className="mt-4 space-y-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {isEs ? "Destino" : "Destination"}
              </p>
              <p className="text-sm font-bold text-slate-900">
                {hostnameOf(pendingUrl)}
              </p>
              <p className="break-all text-xs font-medium text-slate-500">
                {pendingUrl}
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                {isEs ? "Aviso de Enlaces Externos" : "External Links Disclaimer"}
              </p>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-amber-900">
                {isEs
                  ? "La plataforma NephroReach contiene enlaces a sitios web externos que no son proporcionados ni mantenidos por NephroReach, ni están afiliados a NephroReach de ninguna manera. Tenga en cuenta que NephroReach no garantiza la exactitud, relevancia, vigencia ni integridad de la información en estos sitios web externos. La inclusión de cualquier enlace no implica respaldo por parte de NephroReach."
                  : "The NephroReach platform contains links to external websites that are not provided, maintained by, or in any way affiliated with NephroReach. Please note that NephroReach does not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites. The inclusion of any link does not imply endorsement by NephroReach."}
              </p>
            </div>

            <p className="mt-3 text-xs font-medium leading-relaxed text-slate-500">
              {isEs
                ? "En caso de emergencia, llame al 911. Consulte siempre a su equipo de nefrología antes de actuar sobre cualquier información encontrada en línea."
                : "In an emergency, call 911. Always talk to your nephrology team before acting on information you find online."}
            </p>

            <div className="mt-5 flex flex-col-reverse items-stretch gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
              >
                {isEs ? "Cancelar" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-2xs transition-colors hover:bg-blue-700 cursor-pointer"
              >
                <ExternalLinkIcon className="h-4 w-4" />
                {isEs ? "Continuar al sitio" : "Continue to site"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ExternalLinkContext.Provider>
  );
}

export function useExternalLink() {
  const context = useContext(ExternalLinkContext);
  if (!context) {
    throw new Error("useExternalLink must be used within an ExternalLinkProvider");
  }
  return context;
}

/**
 * Drop-in replacement for an `<a>` pointing off-platform. Keeps a real href so
 * the URL is visible on hover and copyable, but routes the click through the
 * disclaimer first.
 */
export function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { requestExternalNavigation } = useExternalLink();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => {
        event.preventDefault();
        requestExternalNavigation(href);
      }}
      className={className}
    >
      {children}
    </a>
  );
}
