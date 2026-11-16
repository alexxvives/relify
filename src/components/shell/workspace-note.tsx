import Link from "next/link";

export function WorkspaceNote({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <section className="rounded-2xl border border-[#e7eaee] bg-white px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-[#2b3b4a]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#64748b]">{body}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-6 inline-flex h-11 items-center rounded-full bg-[#465ab4] px-5 text-sm font-medium text-white"
        >
          {action.label}
        </Link>
      ) : null}
    </section>
  );
}
