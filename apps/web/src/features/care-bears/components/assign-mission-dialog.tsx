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

/**
 * Pairs an open mission with an available bear. Pass `bearId` or `missionId`
 * to start with one side already chosen.
 */
export const AssignMissionDialog = ({
  open,
  onOpenChange,
  bearId: initialBearId,
  missionId: initialMissionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bearId?: string;
  missionId?: string;
}) => {
  const { bears, missions, assign, bearById } = useWorkforce();
  const [bearId, setBearId] = React.useState<string | null>(
    initialBearId ?? null,
  );
  const [missionId, setMissionId] = React.useState<string | null>(
    initialMissionId ?? null,
  );
  const [submitted, setSubmitted] = React.useState(false);
  const missionRef = React.useRef<HTMLButtonElement>(null);
  const bearRef = React.useRef<HTMLButtonElement>(null);
  const missionErrorId = React.useId();
  const bearErrorId = React.useId();

  // Reset to the caller's starting point each time the dialog opens.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setBearId(initialBearId ?? null);
      setMissionId(initialMissionId ?? null);
      setSubmitted(false);
    }
  }

  const openMissions = missions.filter((m) => m.status !== "completed");
  const availableBears = bears.filter(
    (b) => b.status === "available" || b.id === initialBearId,
  );
  const mission = openMissions.find((m) => m.id === missionId);

  const missionInvalid = submitted && !missionId;
  const bearInvalid = submitted && !bearId;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!missionId) {
      missionRef.current?.focus();
      return;
    }
    if (!bearId) {
      bearRef.current?.focus();
      return;
    }
    assign(missionId, bearId);
    toast.success(`${bearById(bearId)?.name} assigned`, {
      description: mission?.title,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} noValidate className="grid gap-6">
          <DialogHeader>
            <DialogTitle>Assign a mission</DialogTitle>
            <DialogDescription>
              Send an available bear where caring is needed.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={missionInvalid || undefined}>
              <FieldLabel htmlFor="assign-mission">Mission</FieldLabel>
              <Select
                value={missionId}
                onValueChange={(value) => setMissionId(value)}
                items={openMissions.map((m) => ({
                  value: m.id,
                  label: m.title,
                }))}
              >
                <SelectTrigger
                  id="assign-mission"
                  ref={missionRef}
                  className="w-full"
                  aria-invalid={missionInvalid || undefined}
                  aria-describedby={missionInvalid ? missionErrorId : undefined}
                >
                  <SelectValue placeholder="Choose a mission" />
                </SelectTrigger>
                <SelectContent>
                  {openMissions.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mission && mission.requiredPowers.length > 0 && (
                <FieldDescription>
                  Needs: {mission.requiredPowers.join(", ")}
                </FieldDescription>
              )}
              {missionInvalid && (
                <FieldError id={missionErrorId}>Choose a mission</FieldError>
              )}
            </Field>
            <Field data-invalid={bearInvalid || undefined}>
              <FieldLabel htmlFor="assign-bear">Bear</FieldLabel>
              <Select
                value={bearId}
                onValueChange={(value) => setBearId(value)}
                items={availableBears.map((b) => ({
                  value: b.id,
                  label: b.name,
                }))}
              >
                <SelectTrigger
                  id="assign-bear"
                  ref={bearRef}
                  className="w-full"
                  aria-invalid={bearInvalid || undefined}
                  aria-describedby={bearInvalid ? bearErrorId : undefined}
                >
                  <SelectValue placeholder="Choose a bear" />
                </SelectTrigger>
                <SelectContent>
                  {availableBears.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Only bears marked available are listed.
              </FieldDescription>
              {bearInvalid && (
                <FieldError id={bearErrorId}>Choose a bear</FieldError>
              )}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button type="submit">Assign</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
