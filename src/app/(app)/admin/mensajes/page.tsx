import { Suspense } from "react";
import type { Metadata } from "next";
import { Mail, MessageSquare } from "lucide-react";
import { AdminListSkeleton } from "@/components/page-skeletons";
import { EmptySkeleton } from "@/components/ui/empty-skeleton";
import { SignedInPage } from "@/components/signed-in-page";
import { listPublicInbox } from "@/server/publicInbox";
import { requireRole } from "@/server/requireRole";

export const metadata: Metadata = { title: "Mensajes", robots: { index: false, follow: false } };

const when = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" });

async function Inbox() {
  await requireRole("admin");
  const { messages, subscribers } = await listPublicInbox();

  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="contact-title">
        <h2 id="contact-title" className="text-lg font-semibold">
          Contacto <span className="ml-1 text-sm font-normal text-muted-foreground">{messages.length}</span>
        </h2>
        {messages.length === 0 ? (
          <EmptySkeleton icon={MessageSquare} title="Sin mensajes de contacto" text="Aquí aparecerá cada mensaje que llegue desde el formulario de /contacto, con su remitente, tema y fecha." />
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {messages.map((item) => (
              <li key={item.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium">
                    {item.name} · <a className="text-[#0f6e73] underline-offset-4 hover:underline" href={`mailto:${item.email}`}>{item.email}</a>
                  </p>
                  <p className="text-xs text-muted-foreground">{when.format(item.createdAt)}</p>
                </div>
                <p className="mt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">{item.topic}</p>
                <p className="mt-2 text-sm leading-6 whitespace-pre-line">{item.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="newsletter-title">
        <h2 id="newsletter-title" className="text-lg font-semibold">
          Suscriptores del diario <span className="ml-1 text-sm font-normal text-muted-foreground">{subscribers.length}</span>
        </h2>
        {subscribers.length === 0 ? (
          <EmptySkeleton icon={Mail} variant="rows" title="Sin suscriptores todavía" text="Cuando alguien se apunte al diario, verás aquí su correo y la fecha de alta." />
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
            {subscribers.map((item) => (
              <li key={item.email} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span>{item.email}</span>
                <span className="text-xs text-muted-foreground">{when.format(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function AdminMessagesPage() {
  return (
    <SignedInPage title="Mensajes">
      <Suspense fallback={<AdminListSkeleton kind="messages" />}>
        <Inbox />
      </Suspense>
    </SignedInPage>
  );
}
