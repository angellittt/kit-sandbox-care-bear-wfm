import { AvatarGroup } from "@/components/ui/avatar";
import type { Mission } from "../data";
import { href } from "../routes";
import { useWorkforce } from "../workforce-context";
import { BearAvatar } from "./badges";

/** The bears on a mission as a linked avatar stack, or a note when there are none. */
export const MissionCrew = ({ mission }: { mission: Mission }) => {
  const { bearById } = useWorkforce();
  const crew = mission.bearIds.flatMap((id) => bearById(id) ?? []);
  if (crew.length === 0) {
    return <span className="text-sm text-muted-foreground">Unassigned</span>;
  }
  return (
    <AvatarGroup>
      {crew.map((bear) => (
        <a
          key={bear.id}
          href={href.bear(bear.id)}
          aria-label={bear.name}
          className="rounded-full"
        >
          <BearAvatar bear={bear} size="sm" />
        </a>
      ))}
    </AvatarGroup>
  );
};
