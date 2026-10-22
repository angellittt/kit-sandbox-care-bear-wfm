import { SearchIcon, SearchXIcon } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Tabs, TabsCount, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BearAvatar, BearStatusBadge } from "../components/badges";
import { EnergyMeter } from "../components/energy-meter";
import { PageHeader } from "../components/page-header";
import type { BearStatus } from "../data";
import { href } from "../routes";
import { bearStatusMeta, bearStatuses } from "../status";
import { useWorkforce } from "../workforce-context";

type Filter = BearStatus | "all";

export const BearsPage = () => {
  const { bears, currentMissionFor } = useWorkforce();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");

  const needle = query.trim().toLowerCase();
  const matches = bears.filter(
    (bear) =>
      !needle ||
      [
        bear.name,
        bear.role,
        ...bear.specialties,
        ...bear.powers.map((p) => p.name),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
  );
  const visible =
    filter === "all" ? matches : matches.filter((b) => b.status === filter);

  return (
    <>
      <PageHeader
        title="Bears"
        description="Profiles, powers and availability for the whole team."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
        >
          <TabsList aria-label="Filter by status">
            <TabsTrigger value="all">
              All <TabsCount>{matches.length}</TabsCount>
            </TabsTrigger>
            {bearStatuses.map((status) => (
              <TabsTrigger key={status} value={status}>
                {bearStatusMeta.get(status)?.label}
                <TabsCount>
                  {matches.filter((b) => b.status === status).length}
                </TabsCount>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <InputGroup className="w-full sm:w-64">
          <InputGroupAddon>
            <SearchIcon aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label="Search by name, power or specialty"
            placeholder="Name, power or specialty"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
      </div>

      {visible.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>No bears match</EmptyTitle>
            <EmptyDescription>
              Try another name, power or status.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Clear filters
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul
          aria-label="Bear profiles"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {visible.map((bear) => {
            const mission = currentMissionFor(bear.id);
            return (
              <li key={bear.id}>
                <Card
                  variant="raised"
                  interactive
                  className="relative h-full has-focus-visible:outline-2 has-focus-visible:outline-focus-ring"
                >
                  <CardHeader className="grid-cols-[auto_1fr_auto] items-center gap-x-3">
                    <BearAvatar bear={bear} size="lg" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <CardTitle className="truncate">
                        {/* Stretched link: the whole card is the target. */}
                        <a
                          href={href.bear(bear.id)}
                          className="after:absolute after:inset-0 focus-visible:outline-none"
                        >
                          {bear.name}
                        </a>
                      </CardTitle>
                      <CardDescription className="truncate">
                        {bear.role}
                      </CardDescription>
                    </div>
                    <BearStatusBadge status={bear.status} />
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-3">
                    <p className="line-clamp-2 text-muted-foreground">
                      {bear.bio}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {bear.powers.slice(1).map((power) => (
                        <Badge key={power.name} variant="outline">
                          {power.name}
                        </Badge>
                      ))}
                    </div>
                    <EnergyMeter value={bear.energy} className="mt-auto" />
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground">
                    <span className="truncate">
                      {mission ? `On: ${mission.title}` : "No current mission"}
                    </span>
                  </CardFooter>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};
