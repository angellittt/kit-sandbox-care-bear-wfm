import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkforce } from "../workforce-context";

type Option = { value: string; label: string };

/** A labelled Select with its description and required-field error wired up. */
const PickerField = ({
  id,
  label,
  placeholder,
  options,
  value,
  onValueChange,
  description,
  error,
  triggerRef,
}: {
  id: string;
  label: string;
  placeholder: string;
  options: Option[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  description?: React.ReactNode;
  /** Shown, and the field marked invalid, when set. */
  error?: string;
  triggerRef: React.Ref<HTMLButtonElement>;
}) => {
  const errorId = React.useId();
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select value={value} onValueChange={onValueChange} items={options}>
        <SelectTrigger
          id={id}
          ref={triggerRef}
          className="w-full"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  );
};

/** Holds the picks; the dialog remounts it on every open so it starts fresh. */
const AssignMissionForm = ({
  initialBearId,
  initialMissionId,
  onDone,
}: {
  initialBearId?: string;
  initialMissionId?: string;
  onDone: () => void;
}) => {
  const { bears, missions, assign, bearById } = useWorkforce();
  const [bearId, setBearId] = React.useState(initialBearId ?? null);
  const [missionId, setMissionId] = React.useState(initialMissionId ?? null);
  const [submitted, setSubmitted] = React.useState(false);
  const missionRef = React.useRef<HTMLButtonElement>(null);
  const bearRef = React.useRef<HTMLButtonElement>(null);

  const openMissions = missions.filter((m) => m.status !== "completed");
  const availableBears = bears.filter(
    (b) => b.status === "available" || b.id === initialBearId,
  );
  const mission = openMissions.find((m) => m.id === missionId);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!missionId || !bearId) {
      (missionId ? bearRef : missionRef).current?.focus();
      return;
    }
    assign(missionId, bearId);
    toast.success(`${bearById(bearId)?.name} assigned`, {
      description: mission?.title,
    });
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6">
      <DialogHeader>
        <DialogTitle>Assign a mission</DialogTitle>
        <DialogDescription>
          Send an available bear where caring is needed.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <PickerField
          id="assign-mission"
          label="Mission"
          placeholder="Choose a mission"
          options={openMissions.map((m) => ({ value: m.id, label: m.title }))}
          value={missionId}
          onValueChange={setMissionId}
          triggerRef={missionRef}
          description={
            mission?.requiredPowers.length
              ? `Needs: ${mission.requiredPowers.join(", ")}`
              : undefined
          }
          error={submitted && !missionId ? "Choose a mission" : undefined}
        />
        <PickerField
          id="assign-bear"
          label="Bear"
          placeholder="Choose a bear"
          options={availableBears.map((b) => ({ value: b.id, label: b.name }))}
          value={bearId}
          onValueChange={setBearId}
          triggerRef={bearRef}
          description="Only bears marked available are listed."
          error={submitted && !bearId ? "Choose a bear" : undefined}
        />
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" type="button" />}>
          Cancel
        </DialogClose>
        <Button type="submit">Assign</Button>
      </DialogFooter>
    </form>
  );
};

/**
 * Pairs an open mission with an available bear. Pass `bearId` or `missionId`
 * to start with one side already chosen.
 */
export const AssignMissionDialog = ({
  open,
  onOpenChange,
  bearId,
  missionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bearId?: string;
  missionId?: string;
}) => {
  // A new key per opening resets the form, even while the last one animates out.
  const [formKey, setFormKey] = React.useState(0);
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setFormKey((key) => key + 1);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <AssignMissionForm
          key={formKey}
          initialBearId={bearId}
          initialMissionId={missionId}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};
