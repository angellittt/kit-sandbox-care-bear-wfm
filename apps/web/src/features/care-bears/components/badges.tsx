import {
  CakeIcon,
  CloudRainIcon,
  CloverIcon,
  Flower2Icon,
  HeartHandshakeIcon,
  HeartIcon,
  LockKeyholeIcon,
  LollipopIcon,
  MoonStarIcon,
  MusicIcon,
  RainbowIcon,
  StarIcon,
  SunIcon,
  TrophyIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type {
  Bear,
  BearStatus,
  BellyBadge,
  MissionPriority,
  MissionStatus,
} from "../data";
import { bearStatusMeta, missionStatusMeta, priorityMeta } from "../status";

export const BearStatusBadge = ({ status }: { status: BearStatus }) => {
  const meta = bearStatusMeta.get(status);
  return <Badge tone={meta?.tone}>{meta?.label}</Badge>;
};

export const MissionStatusBadge = ({ status }: { status: MissionStatus }) => {
  const meta = missionStatusMeta.get(status);
  return <Badge tone={meta?.tone}>{meta?.label}</Badge>;
};

export const PriorityBadge = ({ priority }: { priority: MissionPriority }) => {
  const meta = priorityMeta.get(priority);
  return (
    <Badge
      tone={meta?.tone}
      variant={priority === "low" ? "outline" : undefined}
    >
      {meta?.label}
    </Badge>
  );
};

export const BellyBadgeIcon = ({
  badge,
  className,
}: {
  badge: BellyBadge;
  className?: string;
}) => {
  const props = { className, "aria-hidden": true };
  switch (badge) {
    case "heart":
      return <HeartIcon {...props} />;
    case "rainbow":
      return <RainbowIcon {...props} />;
    case "rain-cloud":
      return <CloudRainIcon {...props} />;
    case "sun":
      return <SunIcon {...props} />;
    case "clover":
      return <CloverIcon {...props} />;
    case "twin-hearts":
      return <HeartHandshakeIcon {...props} />;
    case "lollipops":
      return <LollipopIcon {...props} />;
    case "shooting-star":
      return <StarIcon {...props} />;
    case "moon":
      return <MoonStarIcon {...props} />;
    case "cupcake":
      return <CakeIcon {...props} />;
    case "flowers":
      return <Flower2Icon {...props} />;
    case "trophy":
      return <TrophyIcon {...props} />;
    case "music":
      return <MusicIcon {...props} />;
    case "padlock":
      return <LockKeyholeIcon {...props} />;
  }
};

/** A bear's avatar: their belly badge on their tone. */
export const BearAvatar = ({
  bear,
  size,
}: {
  bear: Pick<Bear, "name" | "bellyBadge" | "tone">;
  size?: "sm" | "default" | "lg";
}) => (
  <Avatar tone={bear.tone} size={size} title={bear.name}>
    <AvatarFallback>
      <BellyBadgeIcon
        badge={bear.bellyBadge}
        className={size === "lg" ? "size-(--icon-md)" : "size-(--icon-sm)"}
      />
    </AvatarFallback>
  </Avatar>
);
