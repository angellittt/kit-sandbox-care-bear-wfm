import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  useDataTable,
} from "@/components/ui/data-table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsCount, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssignMissionDialog } from "../components/assign-mission-dialog";
import { MissionStatusBadge, PriorityBadge } from "../components/badges";
import { MissionCrew } from "../components/mission-crew";
import { PageHeader } from "../components/page-header";
import type { Mission, MissionStatus } from "../data";
import { formatRange } from "../format";
import { missionStatusMeta, priorityRank } from "../status";
import { useWorkforce } from "../workforce-context";

type Filter = MissionStatus | "all";

const filters: Filter[] = [
  "all",
  "unassigned",
  "in-progress",
  "scheduled",
  "completed",
];

export const MissionsPage = () => {
  const { missions } = useWorkforce();
  const [filter, setFilter] = React.useState<Filter>("all");
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [assignMissionId, setAssignMissionId] = React.useState<string>();

  const openAssign = (missionId?: string) => {
    setAssignMissionId(missionId);
    setAssignOpen(true);
  };

  const columns = React.useMemo<ColumnDef<Mission>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>Mission</DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <span className="flex max-w-80 flex-col">
            <span className="truncate font-medium">{row.original.title}</span>
            <span className="truncate text-xs text-muted-foreground">
              {row.original.location}
            </span>
          </span>
        ),
      },
      {
        accessorKey: "priority",
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>
            Priority
          </DataTableColumnHeader>
        ),
        sortingFn: (a, b) =>
          (priorityRank.get(a.original.priority) ?? 0) -
          (priorityRank.get(b.original.priority) ?? 0),
        cell: ({ row }) => <PriorityBadge priority={row.original.priority} />,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <MissionStatusBadge status={row.original.status} />,
      },
      {
        id: "crew",
        header: "Bears",
        cell: ({ row }) => <MissionCrew mission={row.original} />,
      },
      {
        accessorKey: "due",
        header: ({ column }) => (
          <DataTableColumnHeader column={column}>Dates</DataTableColumnHeader>
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {formatRange(row.original.start, row.original.due)}
          </span>
        ),
      },
      {
        accessorKey: "progress",
        header: "Progress",
        cell: ({ row }) => (
          <Progress
            value={row.original.progress}
            aria-label={`${row.original.title} progress`}
            className="w-24"
          />
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) =>
          row.original.status === "completed" ? null : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAssign(row.original.id)}
              aria-label={`Assign a bear to ${row.original.title}`}
            >
              Assign
            </Button>
          ),
      },
    ],
    [],
  );

  const rows = React.useMemo(
    () =>
      filter === "all" ? missions : missions.filter((m) => m.status === filter),
    [missions, filter],
  );

  const table = useDataTable({
    data: rows,
    columns,
    pageSize: 10,
    enableRowSelection: false,
    initialState: { sorting: [{ id: "priority", desc: false }] },
  });

  return (
    <>
      <PageHeader
        title="Missions"
        description="Every caring call, from first report to happy ending."
        actions={
          <Button onClick={() => openAssign()}>
            <PlusIcon data-icon="inline-start" />
            Assign mission
          </Button>
        }
      />

      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as Filter)}
      >
        <TabsList aria-label="Filter by status">
          {filters.map((value) => (
            <TabsTrigger key={value} value={value}>
              {value === "all" ? "All" : missionStatusMeta.get(value)?.label}
              <TabsCount>
                {value === "all"
                  ? missions.length
                  : missions.filter((m) => m.status === value).length}
              </TabsCount>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <DataTable
            table={table}
            strings={{ empty: "No missions with this status" }}
          />
          <DataTablePagination table={table} pageSizes={[]} />
        </CardContent>
      </Card>

      <AssignMissionDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        missionId={assignMissionId}
      />
    </>
  );
};
