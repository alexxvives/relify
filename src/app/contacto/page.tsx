import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escribe al equipo de Relify sobre la compraventa de tu empresa.",
  alternates: { canonical: "/contacto" },
};

export default function ContactPage() {
  return (
    <PublicSite>
      <main className="mx-auto w-full max-w-[1440px] px-5 sm:px-8">
        <ContactForm />
      </main>
    </PublicSite>
  );
}
