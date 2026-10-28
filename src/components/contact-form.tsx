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
        title="Hablemos"
        description="Cuéntanos qué necesitas sobre vender, comprar o asesorar una empresa. Una persona del equipo de Relify lee cada mensaje."
        topics={topics}
        email={shellCopy.helpEmail}
        onSubmit={(message) => sendContactMessage(message)}
      />
    </ArcScope>
  );
}
