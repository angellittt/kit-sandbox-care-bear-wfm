import type { Bear } from "../data";
import { href } from "../routes";
import { BearAvatar } from "./badges";

/** Avatar, name and role, linking to the bear's profile. */
export const BearLink = ({
  bear,
  showRole = true,
}: {
  bear: Bear;
  showRole?: boolean;
}) => (
  <a
    href={href.bear(bear.id)}
    className="group/bear-link inline-flex items-center gap-3 rounded-md"
  >
    <BearAvatar bear={bear} size="sm" />
    <span className="flex flex-col leading-tight">
      <span className="font-medium group-hover/bear-link:underline">
        {bear.name}
      </span>
      {showRole && (
        <span className="text-xs text-muted-foreground">{bear.role}</span>
      )}
    </span>
  </a>
);
