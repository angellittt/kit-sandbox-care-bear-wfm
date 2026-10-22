// design-system-kit 0.28.21 · profile shadcn · stock component (base-nova + baseline only)
/**
 * Stock base-nova (shadcn 4.21.1, 2026-10-07) + TTT baseline:
 * - Control gets `data-slot="slider-control"`.
 * - Thumb `bg-white` -> `bg-thumb-normal` (the thumb token: light in every theme, as stock's white is).
 * - Name: `aria-label` also goes to each thumb (Base UI leaves it on the Root's `role=group`, so the thumbs' range inputs had no name; `aria-labelledby` and a `FieldLabel` already reach them), and `getAriaLabel` / `getAriaValueText` pass through to the thumbs, to name a range's thumbs apart and give the value a unit.
 * - Thumbs: a number `value` or `defaultValue` renders one thumb (stock counts thumbs only from an array, so `defaultValue={30}` rendered two, as if no value were given); `[min, max]` stays for neither.
 * - Focus: thumb `focus-visible:ring-3 focus-visible:outline-hidden` -> `has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring` (keyboard focus lands on the thumb's visually hidden range input, so the global rule alone draws nothing visible).
 */
import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { cn } from "cn";

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  "aria-label": ariaLabel,
  getAriaLabel,
  getAriaValueText,
  ...props
}: SliderPrimitive.Root.Props &
  Pick<SliderPrimitive.Thumb.Props, "getAriaLabel" | "getAriaValueText">) {
  const given = value ?? defaultValue;
  const _values = Array.isArray(given)
    ? given
    : typeof given === "number"
      ? [given]
      : [min, max];

  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      aria-label={ariaLabel}
      {...props}
    >
      <SliderPrimitive.Control
        data-slot="slider-control"
        className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col"
      >
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-muted select-none data-horizontal:h-1 data-horizontal:w-full data-vertical:h-full data-vertical:w-1"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            aria-label={ariaLabel}
            getAriaLabel={getAriaLabel}
            getAriaValueText={getAriaValueText}
            className="relative block size-3 shrink-0 rounded-full border border-ring bg-thumb-normal ring-ring/50 transition-[color,box-shadow] select-none after:absolute after:-inset-2 hover:ring-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring active:ring-3 disabled:pointer-events-none disabled:opacity-50"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export { Slider };
