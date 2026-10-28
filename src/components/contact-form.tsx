"use client";

import { ArcScope } from "@/components/arc/arc-scope";
import { ContactSection } from "@/components/arc/blocks/contact-section/contact-section";
import { sendContactMessage } from "@/app/contacto/actions";
import { shellCopy } from "@/lib/shell";

const topics = ["Vender mi empresa", "Comprar una empresa", "Asesores", "Otro"];

export function ContactForm() {
  return (
    <ArcScope>
      <ContactSection
        variant="form"
        title="Escríbenos"
        description="Elige el tema y cuéntanos tu caso. Guardamos tu mensaje y te respondemos al email que indiques."
        topics={topics}
        email={shellCopy.helpEmail}
        onSubmit={(message) => sendContactMessage(message)}
      />
    </ArcScope>
  );
}
