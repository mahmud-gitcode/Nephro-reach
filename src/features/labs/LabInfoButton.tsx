"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { labDefinition } from "./labDefinitions";

/** The ⓘ beside a lab name: what the test measures, in plain words. */
export function LabInfoButton({
  id,
  name,
  isEs,
}: {
  id: string;
  name: string;
  isEs: boolean;
}) {
  const [open, setOpen] = useState(false);
  const definition = labDefinition(id);
  if (!definition) return null;
  return (
    <>
      <Button
        variant="neutral"
        appearance="ghost"
        size="small"
        iconOnly
        aria-label={isEs ? `Qué es ${name}` : `What is ${name}?`}
        onClick={() => setOpen(true)}
      >
        <Info />
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="small"
        title={name}
        footer={
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={() => setOpen(false)}
          >
            {isEs ? "Cerrar" : "Close"}
          </Button>
        }
      >
        <p className="text-body-md text-fg-secondary">
          {isEs ? definition.es : definition.en}
        </p>
        <p className="mt-stack-md text-caption text-fg-muted">
          {isEs
            ? "Educación general. Hable de sus resultados con su equipo de atención."
            : "General education. Talk with your care team about your own results."}
        </p>
      </Modal>
    </>
  );
}
