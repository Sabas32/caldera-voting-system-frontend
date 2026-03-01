import { GenericDataTable, type TableDataRow } from "@/components/tables/shared";

export function ElectionsTable({
  columns,
  rows,
  showActions,
}: {
  columns: string[];
  rows: TableDataRow[];
  showActions?: boolean;
}) {
  return <GenericDataTable columns={columns} rows={rows} showActions={showActions} />;
}
