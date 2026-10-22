import type * as React from "react";

export const PageHeader = ({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="flex flex-col gap-1">
      <h1 className="type-title-3">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);
