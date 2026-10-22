import { AppShell } from "@/features/care-bears/components/app-shell";
import { BearProfilePage } from "@/features/care-bears/pages/bear-profile-page";
import { BearsPage } from "@/features/care-bears/pages/bears-page";
import { DashboardPage } from "@/features/care-bears/pages/dashboard-page";
import { MissionsPage } from "@/features/care-bears/pages/missions-page";
import { href, useRoute, type Route } from "@/features/care-bears/routes";
import { useWorkforce } from "@/features/care-bears/workforce-context";
import { WorkforceProvider } from "@/features/care-bears/workforce-provider";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const Crumbs = ({ route }: { route: Route }) => {
  const { bearById } = useWorkforce();
  if (route.name === "bear") {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href={href.bears}>Bears</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {bearById(route.id)?.name ?? "Not found"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }
  const title =
    route.name === "bears"
      ? "Bears"
      : route.name === "missions"
        ? "Missions"
        : "Overview";
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

const Page = ({ route }: { route: Route }) => {
  switch (route.name) {
    case "bears":
      return <BearsPage />;
    case "bear":
      return <BearProfilePage key={route.id} bearId={route.id} />;
    case "missions":
      return <MissionsPage />;
    case "dashboard":
      return <DashboardPage />;
  }
};

const App = () => {
  const route = useRoute();
  return (
    <WorkforceProvider>
      <AppShell route={route} header={<Crumbs route={route} />}>
        <Page route={route} />
      </AppShell>
    </WorkforceProvider>
  );
};

export default App;
