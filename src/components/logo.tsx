import Image from "next/image";

type LogoSize = "md" | "lg";

/** Relify wordmark. `tone="light"` is the white wordmark for dark surfaces (signed-in sidebar). */
export function Logo({ size = "md", tone = "dark" }: { size?: LogoSize; tone?: "dark" | "light" }) {
  const height = size === "lg" ? "h-11" : "h-8";

  return (
    <Image
      src={tone === "light" ? "/brand/full-logo-white.svg" : "/brand/full-logo.svg"}
      alt=""
      width={294}
      height={107}
      unoptimized
      className={`${height} w-auto`}
    />
  );
}
