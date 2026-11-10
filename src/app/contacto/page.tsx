import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Briefcase, Building2, HelpCircle, Mail, Users } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { PublicSite } from "@/components/public-site";
import { shellCopy } from "@/lib/shell";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escribe al equipo de Relify sobre la venta, la compra o el asesoramiento de una empresa.",
  alternates: { canonical: "/contacto" },
};

const audiences = [
  {
    icon: Building2,
    title: "Empresas",
    body: "Quieres vender tu empresa o una parte y tienes dudas sobre la valoración, la ficha o la confidencialidad.",
    href: "/empresas",
    faq: "/empresas#preguntas",
  },
  {
    icon: Briefcase,
    title: "Compradores",
    body: "Buscas una empresa que comprar y quieres saber cómo acceder a fichas, documentos y vendedores.",
    href: "/inversores",
    faq: "/inversores#preguntas",
  },
  {
    icon: Users,
    title: "Asesores",
    body: "Acompañas operaciones de compraventa y quieres ofrecer tus servicios dentro de Relify.",
    href: "/asesores",
    faq: "/asesores#preguntas",
  },
];

export default function ContactPage() {
  return (
    <PublicSite>
      <main>
        <section className="bg-gradient-to-b from-[#dceff0] to-transparent text-[#12343a]">
          <div className="mx-auto w-full max-w-[1440px] px-5 pt-8 pb-10 sm:px-8 sm:pt-16 sm:pb-16 lg:pt-20">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2f939b]">Contacto</p>
            <h1 className="releva-page-title mt-3 max-w-3xl text-balance">¿En qué podemos ayudarte?</h1>
            <p className="mt-4 max-w-2xl text-pretty text-[16px] leading-7 text-[#12343a]/75 sm:text-lg">
              Vendas, compres o asesores una empresa, escríbenos.
              <span className="hidden sm:inline"> Una persona del equipo de Relify lee cada mensaje y te responde por email.</span>
            </p>
            <div className="mt-6 flex w-full flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <a href="#formulario" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#12343a] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1c4a52] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f939b] sm:w-auto">
                Escribir un mensaje <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <a href={shellCopy.helpEmailHref} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#12343a]/25 bg-white/60 px-5 text-sm font-semibold text-[#12343a] transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2f939b] sm:w-auto">
                <Mail className="size-4" aria-hidden="true" /> {shellCopy.helpEmail}
              </a>
            </div>
          </div>
        </section>

        <section aria-labelledby="perfiles" className="mx-auto w-full max-w-[1440px] px-5 py-14 sm:px-8">
          <h2 id="perfiles" className="text-2xl font-semibold tracking-tight text-[#12343a]">Elige tu caso</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">Antes de escribir, quizá tu respuesta ya esté en las preguntas frecuentes de tu perfil.</p>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {audiences.map(({ icon: Icon, title, body, href, faq }) => (
              <li key={title} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
                <span className="grid size-11 place-items-center rounded-xl bg-[#e6f4f5] text-[#12343a]"><Icon className="size-5" aria-hidden="true" /></span>
                <h3 className="mt-4 text-lg font-semibold text-[#12343a]">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                <div className="mt-5 flex flex-col gap-1 text-sm font-semibold sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2">
                  <Link href={faq} className="inline-flex min-h-11 items-center gap-1.5 text-[#2f939b] hover:underline"><HelpCircle className="size-4" aria-hidden="true" />Preguntas frecuentes</Link>
                  <Link href={href} className="inline-flex min-h-11 items-center gap-1.5 text-[#12343a] hover:underline">Cómo funciona<ArrowRight className="size-4" aria-hidden="true" /></Link>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section id="formulario" className="mx-auto w-full max-w-[1440px] scroll-mt-24 px-5 pb-20 sm:px-8">
          <ContactForm />
        </section>
      </main>
    </PublicSite>
  );
}
