import type { ColumnDef } from "@tanstack/react-table";
import { MapPinIcon, PlusIcon, SearchIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  useDataTable,
} from "@/components/ui/data-table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
import { AssignMissionDialog } from "../components/assign-mission-dialog";
import {
  BearStatusBadge,
  MissionStatusBadge,
  PriorityBadge,
} from "../components/badges";
import { BearLink } from "../components/bear-link";
import { EnergyMeter } from "../components/energy-meter";
import { MissionCrew } from "../components/mission-crew";
import { PageHeader } from "../components/page-header";
import { LOW_ENERGY_THRESHOLD, type Bear } from "../data";
import { formatRange } from "../format";
import { href } from "../routes";
import { bearStatusMeta, bearStatuses, priorityRank } from "../status";
import { useWorkforce } from "../workforce-context";

const StatCard = ({
  label,
  value,
  detail,
}: {
  label: string;
  value: React.ReactNode;
  detail: React.ReactNode;
}) => (
  <Card size="sm">
    <CardHeader>
      <CardDescription>{label}</CardDescription>
      <div className="type-title-2 tabular-nums">{value}</div>
    </CardHeader>
    <CardContent className="text-xs text-muted-foreground">
      {detail}
    </CardContent>
  </Card>
);

const RosterTable = () => {
  const { bears, currentMissionFor } = useWorkforce();

  const columns = React.useMemo<ColumnDef<Bear>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>Bear</DataTableColumnHeader>
        ),
        cell: ({ row }) => <BearLink bear={row.original} />,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <BearStatusBadge status={row.original.status} />,
      },
      {
        id: "mission",
        header: "Mission",
        cell: ({ row }) => {
          const mission = currentMissionFor(row.original.id);
          return mission ? (
            <span className="flex flex-col">
              <span className="max-w-64 truncate">{mission.title}</span>
              <span className="text-xs text-muted-foreground">
                {mission.location}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        accessorKey: "energy",
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            Caring energy
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <EnergyMeter
            value={row.original.energy}
            showLabel={false}
            className="w-32"
          />
        ),
      },
      {
        accessorKey: "missionsCompleted",
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            Missions
          </DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <span className="tabular-nums">{row.original.missionsCompleted}</span>
        ),
      },
    ],
    [currentMissionFor],
  );

  const table = useDataTable({
    data: bears,
    columns,
    pageSize: 8,
    enableRowSelection: false,
    globalFilterFn: "includesString",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roster</CardTitle>
        <CardDescription>
          Every bear, where they are and how they're doing.
        </CardDescription>
        <CardAction>
          <InputGroup className="w-56">
            <InputGroupAddon>
              <SearchIcon aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              aria-label="Search bears"
              placeholder="Search bears"
              value={
                (table.getState().globalFilter as string | undefined) ?? ""
              }
              onChange={(event) => table.setGlobalFilter(event.target.value)}
            />
          </InputGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <DataTable
          table={table}
          density="compact"
          strings={{ empty: "No bears match that search" }}
        />
        <DataTablePagination table={table} pageSizes={[]} />
      </CardContent>
    </Card>
  );
};

export const DashboardPage = () => {
  const { bears, missions } = useWorkforce();
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [assignMissionId, setAssignMissionId] = React.useState<string>();

  const deployed = bears.filter((b) => b.status === "deployed").length;
  const available = bears.filter((b) => b.status === "available").length;
  const unassigned = missions.filter((m) => m.status === "unassigned");
  const active = missions
    .filter((m) => m.status === "in-progress" || m.status === "scheduled")
    .slice()
    .sort(
      (a, b) =>
        (priorityRank.get(a.priority) ?? 0) -
          (priorityRank.get(b.priority) ?? 0) || a.due.localeCompare(b.due),
    );
  const avgEnergy = Math.round(
    bears.reduce((sum, b) => sum + b.energy, 0) / bears.length,
  );
  const lowEnergy = bears
    .filter((b) => b.energy < LOW_ENERGY_THRESHOLD)
    .slice()
    .sort((a, b) => a.energy - b.energy);

  const openAssign = (missionId?: string) => {
    setAssignMissionId(missionId);
    setAssignOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Workforce overview"
        description="Who's caring where across Care-a-Lot and Earth."
        actions={
          <Button onClick={() => openAssign()}>
            <PlusIcon data-icon="inline-start" />
            Assign mission
          </Button>
        }
      />

      <section
        aria-label="Key numbers"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="On deployment"
          value={`${deployed} / ${bears.length}`}
          detail={`${Math.round((deployed / bears.length) * 100)}% of the team is out caring`}
        />
        <StatCard
          label="Available now"
          value={available}
          detail="Ready for a new mission"
        />
        <StatCard
          label="Missions needing a bear"
          value={unassigned.length}
          detail={
            unassigned.length > 0 ? (
              <a href={href.missions} className="underline underline-offset-4">
                Review unassigned missions
              </a>
            ) : (
              "Every open mission is staffed"
            )
          }
        />
        <StatCard
          label="Average caring energy"
          value={`${avgEnergy}%`}
          detail={`${lowEnergy.length} bears below ${LOW_ENERGY_THRESHOLD}%`}
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 lg:self-start">
          <CardHeader>
            <CardTitle>Active deployments</CardTitle>
            <CardDescription>
              In-progress and scheduled missions, most urgent first.
            </CardDescription>
            <CardAction>
              <Button
                variant="ghost"
                size="sm"
                render={<a href={href.missions}>All missions</a>}
                nativeButton={false}
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y">
              {active.map((mission) => (
                <li
                  key={mission.id}
                  className="flex flex-wrap items-center gap-x-6 gap-y-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-1 basis-64 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{mission.title}</span>
                      <PriorityBadge priority={mission.priority} />
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPinIcon className="size-(--icon-xs)" aria-hidden />
                      {mission.location} ·{" "}
                      {formatRange(mission.start, mission.due)}
                    </span>
                  </div>
                  <MissionCrew mission={mission} />
                  <div className="flex w-36 flex-col gap-1">
                    <MissionStatusBadge status={mission.status} />
                    <Progress
                      value={mission.progress}
                      aria-label={`${mission.title} progress`}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Team availability</CardTitle>
              <CardDescription>
                {bears.length} bears on the roster
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {bearStatuses.map((status) => {
                const count = bears.filter((b) => b.status === status).length;
                return (
                  <div key={status} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <BearStatusBadge status={status} />
                      <span className="tabular-nums text-muted-foreground">
                        {count}
                      </span>
                    </div>
                    <Progress
                      value={(count / bears.length) * 100}
                      aria-label={`${bearStatusMeta.get(status)?.label} share of team`}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Needs a recharge</CardTitle>
              <CardDescription>
                Caring energy below {LOW_ENERGY_THRESHOLD}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lowEnergy.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Everyone's energy is healthy.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {lowEnergy.map((bear) => (
                    <li key={bear.id} className="flex flex-col gap-2">
                      <BearLink bear={bear} />
                      <EnergyMeter value={bear.energy} showLabel={false} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {unassigned.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Waiting for a bear</CardTitle>
                <CardDescription>
                  {unassigned.length} missions have no one assigned
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-3">
                  {unassigned.map((mission) => (
                    <li
                      key={mission.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          {mission.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Needs {mission.requiredPowers.join(", ")}
                        </span>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAssign(mission.id)}
                        aria-label={`Assign a bear to ${mission.title}`}
                      >
                        Assign
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <RosterTable />

      <AssignMissionDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        missionId={assignMissionId}
      />
    </>
  );
};
