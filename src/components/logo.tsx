import Image from "next/image";

type LogoSize = "md" | "lg";

export function Logo({ size = "md" }: { size?: LogoSize }) {
  const height = size === "lg" ? "h-11" : "h-8";

  return (
    <Image
      src="/brand/full-logo.svg"
      alt=""
      width={279}
      height={107}
      unoptimized
      className={`${height} w-auto`}
    />
  );
}
