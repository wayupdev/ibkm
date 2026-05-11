import Image from "next/image";
import { cn } from "@/lib/utils";

export default function Logo({
  size = "md",
  variant = "color",
  withTagline = false,
}: {
  size?: "sm" | "md" | "lg";
  variant?: "color" | "white";
  withTagline?: boolean;
}) {
  const height = size === "sm" ? 36 : size === "lg" ? 72 : 48;
  const width = Math.round(height * (424 / 154)); // logo aspect ratio

  return (
    <div className="flex items-center gap-4">
      <Image
        src="/brand/logo-km.png"
        alt="Inspired by KM"
        width={width}
        height={height}
        priority
        className={cn(variant === "white" && "brightness-0 invert")}
      />
      {withTagline && (
        <span className="tagline hidden sm:inline">
          Apprendre · Comprendre · Partager · Transmettre
        </span>
      )}
    </div>
  );
}
