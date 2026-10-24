import { Logo } from "@/components/logo";

export type SkeletonVariant = "dashboard" | "grid" | "table" | "detail" | "list";

function Bone({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#e9edf2] motion-reduce:animate-none ${className}`} />;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-[#e6e9f0] bg-white p-5 ${className}`}>{children}</div>;
}

function Lines({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, index) => (
        <Bone key={index} className={index % 3 === 2 ? "h-4 w-2/3" : "h-4 w-full"} />
      ))}
    </div>
  );
}

function Body({ variant }: { variant: SkeletonVariant }) {
  if (variant === "dashboard") {
    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Card key={index}>
              <Bone className="h-3 w-24" />
              <Bone className="mt-4 h-8 w-20" />
            </Card>
          ))}
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-[2fr_1fr]">
          <Card>
            <Bone className="h-5 w-40" />
            <Bone className="mt-5 h-48 w-full" />
          </Card>
          <Card>
            <Bone className="h-5 w-32" />
            <div className="mt-5">
              <Lines count={5} />
            </div>
          </Card>
        </div>
      </>
    );
  }

  if (variant === "grid") {
    return (
      <>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Bone key={index} className="h-10 w-32 rounded-full" />
          ))}
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Card key={index} className="p-0">
              <Bone className="h-36 w-full rounded-t-2xl rounded-b-none" />
              <div className="p-5">
                <Bone className="h-5 w-3/4" />
                <Bone className="mt-3 h-4 w-1/2" />
                <Bone className="mt-5 h-9 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </>
    );
  }

  if (variant === "table") {
    return (
      <Card className="p-0">
        <div className="flex items-center gap-3 border-b border-[#eef0f3] p-4">
          <Bone className="h-10 w-64" />
          <Bone className="ml-auto h-10 w-28 rounded-full" />
        </div>
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 border-b border-[#f1f3f6] px-4 py-4 last:border-b-0">
            <Bone className="size-9 shrink-0 rounded-full" />
            <Bone className="h-4 w-1/4" />
            <Bone className="hidden h-4 w-1/5 md:block" />
            <Bone className="ml-auto h-6 w-20 rounded-full" />
          </div>
        ))}
      </Card>
    );
  }

  if (variant === "list") {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index}>
            <div className="flex items-center gap-3">
              <Bone className="size-10 shrink-0 rounded-full" />
              <div className="flex-1">
                <Bone className="h-5 w-1/3" />
                <Bone className="mt-2 h-4 w-1/2" />
              </div>
              <Bone className="h-9 w-24 rounded-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
      <Card>
        <Bone className="h-6 w-1/2" />
        <div className="mt-6">
          <Lines count={8} />
        </div>
      </Card>
      <Card>
        <Bone className="h-5 w-32" />
        <div className="mt-5">
          <Lines count={4} />
        </div>
      </Card>
    </div>
  );
}

/** Full-shell placeholder used by route `loading.tsx` files while a signed-in page streams. */
export function PageSkeleton({ variant }: { variant: SkeletonVariant }) {
  return (
    <div className="shell min-h-screen bg-public-paper font-public text-public-ink" aria-busy="true">
      <aside className="shell-sidebar" data-open="false" aria-hidden>
        <div className="flex items-center justify-between px-4 pt-5 pb-2">
          <Logo />
          <Bone className="size-8 rounded-full" />
        </div>
        <div className="flex flex-col gap-2 px-3 pt-5">
          {Array.from({ length: 7 }, (_, index) => (
            <Bone key={index} className="h-10 w-full" />
          ))}
        </div>
      </aside>
      <main className="shell-main">
        <div className="shell-content">
          <span className="sr-only" role="status">
            Cargando…
          </span>
          <Bone className="mb-6 h-8 w-56" />
          <Body variant={variant} />
        </div>
      </main>
    </div>
  );
}
