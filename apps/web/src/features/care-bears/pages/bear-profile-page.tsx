import {
  CalendarIcon,
  ChevronDownIcon,
  HeartIcon,
  HomeIcon,
  MapPinIcon,
  PlusIcon,
  SearchXIcon,
  TrophyIcon,
  ZapIcon,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssignMissionDialog } from "../components/assign-mission-dialog";
import {
  BearAvatar,
  BearStatusBadge,
  BellyBadgeIcon,
  MissionStatusBadge,
  PriorityBadge,
} from "../components/badges";
import { BearLink } from "../components/bear-link";
import { EnergyMeter } from "../components/energy-meter";
import type { Bear, BearStatus } from "../data";
import { formatMonthYear, formatNumber, formatRange } from "../format";
import { href } from "../routes";
import { bearStatusMeta, bearStatuses } from "../status";
import { useWorkforce } from "../workforce-context";

const Stat = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-center gap-3">
    <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-(--icon-md)">
      {icon}
    </span>
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  </div>
);

const CurrentDeployment = ({
  bear,
  onAssign,
}: {
  bear: Bear;
  onAssign: () => void;
}) => {
  const { currentMissionFor, bearById } = useWorkforce();
  const mission = currentMissionFor(bear.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current deployment</CardTitle>
        <CardDescription>
          {mission ? mission.location : "Not on a mission right now"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mission ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="type-headline-2">{mission.title}</span>
                <PriorityBadge priority={mission.priority} />
                <MissionStatusBadge status={mission.status} />
              </div>
              <p className="text-muted-foreground">{mission.summary}</p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <Stat
                icon={<CalendarIcon />}
                label="Window"
                value={formatRange(mission.start, mission.due)}
              />
              <Stat
                icon={<MapPinIcon />}
                label="Location"
                value={mission.location}
              />
            </div>
            <Progress value={mission.progress} className="gap-1.5">
              <ProgressLabel className="text-xs">
                Mission progress
              </ProgressLabel>
              <ProgressValue className="text-xs" />
            </Progress>
            {mission.bearIds.length > 1 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">
                  Deployed with
                </span>
                <div className="flex flex-wrap gap-4">
                  {mission.bearIds
                    .filter((id) => id !== bear.id)
                    .flatMap((id) => bearById(id) ?? [])
                    .map((teammate) => (
                      <BearLink key={teammate.id} bear={teammate} />
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Empty className="p-6">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MapPinIcon />
              </EmptyMedia>
              <EmptyTitle>No active mission</EmptyTitle>
              <EmptyDescription>
                {bear.status === "available"
                  ? `${bear.name} is ready to be deployed.`
                  : `${bear.name} is ${bearStatusMeta.get(bear.status)?.label.toLowerCase()}. Set them to available before assigning.`}
              </EmptyDescription>
            </EmptyHeader>
            {bear.status === "available" && (
              <EmptyContent>
                <Button onClick={onAssign}>
                  <PlusIcon data-icon="inline-start" />
                  Assign mission
                </Button>
              </EmptyContent>
            )}
          </Empty>
        )}
      </CardContent>
    </Card>
  );
};

const PowersCard = ({ bear }: { bear: Bear }) => (
  <Card>
    <CardHeader>
      <CardTitle>Powers</CardTitle>
      <CardDescription>Proficiency from field reports</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-5">
      {bear.powers.map((power) => (
        <div key={power.name} className="flex flex-col gap-1.5">
          <Progress value={power.level} className="gap-1.5">
            <ProgressLabel className="inline-flex items-center gap-1.5">
              <ZapIcon
                className="size-(--icon-sm) text-muted-foreground"
                aria-hidden
              />
              {power.name}
            </ProgressLabel>
            <ProgressValue />
          </Progress>
          <p className="text-xs text-muted-foreground">{power.description}</p>
        </div>
      ))}
    </CardContent>
  </Card>
);

const DeploymentHistory = ({ bear }: { bear: Bear }) => {
  const { missionsFor } = useWorkforce();
  const history = missionsFor(bear.id)
    .slice()
    .sort((a, b) => b.start.localeCompare(a.start));

  if (history.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No deployments logged yet</EmptyTitle>
          <EmptyDescription>
            Missions {bear.name} joins will show up here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Card>
      <CardContent>
        <Table density="compact">
          <TableHeader>
            <TableRow>
              <TableHead>Mission</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dates</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((mission) => (
              <TableRow key={mission.id}>
                <TableCell>
                  <span className="flex flex-col">
                    <span className="font-medium">{mission.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {mission.location}
                    </span>
                  </span>
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={mission.priority} />
                </TableCell>
                <TableCell>
                  <MissionStatusBadge status={mission.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatRange(mission.start, mission.due)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export const BearProfilePage = ({ bearId }: { bearId: string }) => {
  const { bearById, setStatus, missionsFor } = useWorkforce();
  const [assignOpen, setAssignOpen] = React.useState(false);
  const bear = bearById(bearId);

  if (!bear) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon />
          </EmptyMedia>
          <EmptyTitle>Bear not found</EmptyTitle>
          <EmptyDescription>
            No one on the roster goes by “{bearId}”.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="outline"
            nativeButton={false}
            render={<a href={href.bears}>Back to all bears</a>}
          />
        </EmptyContent>
      </Empty>
    );
  }

  const deployments = missionsFor(bear.id).length;

  return (
    <>
      <Card variant="raised">
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start gap-4">
            <BearAvatar bear={bear} size="lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="type-title-3">{bear.name}</h1>
                <BearStatusBadge status={bear.status} />
              </div>
              <p className="text-muted-foreground">
                {bear.role} · {bear.homeBase}
              </p>
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <BellyBadgeIcon
                  badge={bear.bellyBadge}
                  className="size-(--icon-xs)"
                />
                Belly badge: {bear.bellyBadgeLabel}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" />}>
                  Set status
                  <ChevronDownIcon data-icon="inline-end" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Status</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={bear.status}
                      onValueChange={(value) =>
                        setStatus(bear.id, value as BearStatus)
                      }
                    >
                      {bearStatuses.map((status) => (
                        <DropdownMenuRadioItem key={status} value={status}>
                          {bearStatusMeta.get(status)?.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={() => setAssignOpen(true)}
                disabled={bear.status !== "available"}
              >
                <PlusIcon data-icon="inline-start" />
                Assign mission
              </Button>
            </div>
          </div>
          <p className="max-w-prose">{bear.bio}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <EnergyMeter value={bear.energy} className="self-center" />
            <Stat
              icon={<TrophyIcon />}
              label="Missions completed"
              value={formatNumber(bear.missionsCompleted)}
            />
            <Stat
              icon={<HeartIcon />}
              label="Hearts helped"
              value={formatNumber(bear.heartsHelped)}
            />
            <Stat
              icon={<HomeIcon />}
              label="On the team since"
              value={formatMonthYear(bear.joined)}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList variant="line">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Deployment history</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-2">
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="flex flex-col gap-4 lg:col-span-3">
              <CurrentDeployment
                bear={bear}
                onAssign={() => setAssignOpen(true)}
              />
              <Card>
                <CardHeader>
                  <CardTitle>Specialties</CardTitle>
                  <CardDescription>
                    What dispatch reaches for {bear.name.split(" ")[0]} for
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {bear.specialties.map((specialty) => (
                    <Badge key={specialty} tone="primary">
                      {specialty}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <PowersCard bear={bear} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="history" className="flex flex-col gap-2 pt-2">
          <p className="text-muted-foreground">
            {deployments} {deployments === 1 ? "mission" : "missions"} on
            record.
          </p>
          <DeploymentHistory bear={bear} />
        </TabsContent>
      </Tabs>

      <AssignMissionDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        bearId={bear.id}
      />
    </>
  );
};
