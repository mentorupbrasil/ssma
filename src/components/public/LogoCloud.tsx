import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { cn } from "@/lib/utils";

export type ClientWordmark = {
  primary: string;
  secondary?: string;
  alt: string;
};

type LogoCloudProps = React.ComponentProps<"div"> & {
  wordmarks: readonly ClientWordmark[];
  variant?: "light" | "dark";
};

export function LogoCloud({
  className,
  wordmarks,
  variant = "light",
  ...props
}: LogoCloudProps) {
  return (
    <div
      {...props}
      className={cn(
        "overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]",
        className
      )}
    >
      <InfiniteSlider gap={48} reverse speed={80} speedOnHover={25}>
        {wordmarks.map((mark) => (
          <div
            key={mark.alt}
            aria-label={mark.alt}
            className={cn(
              "logo-cloud-mark flex shrink-0 items-baseline gap-1.5 whitespace-nowrap select-none",
              variant === "dark" && "logo-cloud-mark--dark"
            )}
          >
            <span className="logo-cloud-mark-primary">{mark.primary}</span>
            {mark.secondary ? (
              <span className="logo-cloud-mark-secondary">{mark.secondary}</span>
            ) : null}
          </div>
        ))}
      </InfiniteSlider>
    </div>
  );
}
