// design-system-kit 0.28.21 · profile shadcn · kit extension (replaces the stock file)
/**
 * Stock base-nova (shadcn 4.21.1, 2026-10-07) + TTT baseline:
 * - "use client" added.
 * - AccordionTrigger: outline-none and focus ring utilities removed in favour of the global :focus-visible rule, inset with focus-visible:-outline-offset-2.
 * - AccordionTrigger: disabled state aria-disabled:cursor-not-allowed aria-disabled:text-label-disable (was opacity-50 + pointer-events-none).
 * - AccordionContent: the panel itself transitions height on --accordion-panel-height (motion-safe:) instead of tw-animate's Radix-only accordion keyframes.
 * + TTT kit extensions:
 * - Accordion variant flush | separated (Divider rows): data-variant on the root. flush (default) is stock's divider rows (not-last:border-b); separated stacks bordered rounded-lg items on bg-card with gap-2 and a px-4 inset.
 */
"use client";

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { cn } from "cn";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

function Accordion({
  className,
  variant = "flush",
  ...props
}: AccordionPrimitive.Root.Props & {
  variant?: "flush" | "separated";
}) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      data-variant={variant}
      className={cn(
        "group/accordion flex w-full flex-col data-[variant=separated]:gap-2",
        className,
      )}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        "not-last:border-b group-data-[variant=separated]/accordion:rounded-lg group-data-[variant=separated]/accordion:border group-data-[variant=separated]/accordion:bg-card",
        className,
      )}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex flex-1 group-data-[variant=separated]/accordion:px-4 items-start justify-between rounded-lg border border-transparent py-2.5 text-left text-sm font-medium transition-all hover:underline focus-visible:-outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:text-label-disable **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
        />
        <ChevronUpIcon
          data-slot="accordion-trigger-icon"
          className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="h-(--accordion-panel-height) overflow-hidden text-sm data-ending-style:h-0 data-starting-style:h-0 motion-safe:transition-[height] motion-safe:duration-normal motion-safe:ease-standard"
      {...props}
    >
      <div
        className={cn(
          "pt-0 pb-2.5 group-data-[variant=separated]/accordion:px-4 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
