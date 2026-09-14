"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { Button, Modal } from "@/components/ui";
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

export function ExternalLinkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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
        // This dialog is the last thing a member sees before leaving the
        // product, so it is exactly the one that has to trap focus.
        <Modal
          open
          onClose={handleClose}
          size="wide"
          title={
            isEs
              ? "Está saliendo de NephroReach"
              : "You are leaving NephroReach"
          }
          description={
            isEs
              ? "Este enlace abre un sitio web externo en una pestaña nueva."
              : "This link opens an external website in a new tab."
          }
          footer={
            <>
              <Button
                variant="neutral"
                appearance="fill-stroke"
                onClick={handleClose}
              >
                {isEs ? "Cancelar" : "Cancel"}
              </Button>
              <Button onClick={handleConfirm}>
                <ExternalLinkIcon aria-hidden="true" />
                {isEs ? "Continuar al sitio" : "Continue to site"}
              </Button>
            </>
          }
        >
          <div>
            {/* Show the real destination so the patient knows where they land */}
            <div className="space-y-stack-xs rounded-control border border-line bg-surface-sunken p-inset-sm">
              <p className="text-overline text-fg-muted">
                {isEs ? "Destino" : "Destination"}
              </p>
              <p className="text-label-md text-fg">{hostnameOf(pendingUrl)}</p>
              <p className="text-caption break-all text-fg-muted">
                {pendingUrl}
              </p>
            </div>

            <div className="mt-stack-lg rounded-control border border-warning-line bg-warning-surface p-inset-sm">
              <p className="text-overline text-warning">
                {isEs
                  ? "Aviso de Enlaces Externos"
                  : "External Links Disclaimer"}
              </p>
              <p className="mt-stack-xs text-caption text-fg-secondary">
                {isEs
                  ? "La plataforma NephroReach contiene enlaces a sitios web externos que no son proporcionados ni mantenidos por NephroReach, ni están afiliados a NephroReach de ninguna manera. Tenga en cuenta que NephroReach no garantiza la exactitud, relevancia, vigencia ni integridad de la información en estos sitios web externos. La inclusión de cualquier enlace no implica respaldo por parte de NephroReach."
                  : "The NephroReach platform contains links to external websites that are not provided, maintained by, or in any way affiliated with NephroReach. Please note that NephroReach does not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites. The inclusion of any link does not imply endorsement by NephroReach."}
              </p>
            </div>

            <p className="mt-stack-md text-caption text-fg-muted">
              {isEs
                ? "En caso de emergencia, llame al 911. Consulte siempre a su equipo de nefrología antes de actuar sobre cualquier información encontrada en línea."
                : "In an emergency, call 911. Always talk to your nephrology team before acting on information you find online."}
            </p>
          </div>
        </Modal>
      ) : null}
    </ExternalLinkContext.Provider>
  );
}

export function useExternalLink() {
  const context = useContext(ExternalLinkContext);
  if (!context) {
    throw new Error(
      "useExternalLink must be used within an ExternalLinkProvider",
    );
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
