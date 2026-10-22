import { BatteryLowIcon } from "lucide-react";
import { cn } from "cn";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { LOW_ENERGY_THRESHOLD } from "../data";

/** Caring energy as a meter; low energy adds an icon and a word, not just colour. */
export const EnergyMeter = ({
  value,
  label = "Caring energy",
  showLabel = true,
  className,
}: {
  value: number;
  label?: string;
  showLabel?: boolean;
  className?: string;
}) => {
  const low = value < LOW_ENERGY_THRESHOLD;
  return (
    <Progress
      value={value}
      aria-label={showLabel ? undefined : label}
      className={cn(
        "gap-1.5",
        low && "[&_[data-slot=progress-indicator]]:bg-status-cautionary",
        className,
      )}
    >
      {showLabel && <ProgressLabel className="text-xs">{label}</ProgressLabel>}
      <ProgressValue className={cn("text-xs", !showLabel && "ml-0")}>
        {(formatted) => (
          <span className="inline-flex items-center gap-1">
            {low && (
              <>
                <BatteryLowIcon
                  className="size-(--icon-xs) text-status-cautionary"
                  aria-hidden
                />
                <span className="text-status-cautionary">Low</span>
              </>
            )}
            {formatted}
          </span>
        )}
      </ProgressValue>
    </Progress>
  );
};
