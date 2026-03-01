"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import Link from "next/link";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Eye, PencilLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";

type CellValue = ReactNode;

export type TableDataRow = Record<string, CellValue> & {
  id?: string | number;
  _viewHref?: string;
  _editHref?: string;
};

const columnHelper = createColumnHelper<TableDataRow>();

export function GenericDataTable({
  columns,
  rows,
  showActions = true,
  emptyMessage = "No records found.",
}: {
  columns: string[];
  rows: TableDataRow[];
  showActions?: boolean;
  emptyMessage?: string;
}) {
  const tableColumns = useMemo(() => {
    const mapped: ColumnDef<TableDataRow, CellValue>[] = columns.map((column) =>
      columnHelper.accessor((row) => row[column], {
        id: column,
        header: () => column,
        cell: (info) => info.getValue() ?? "-",
      }),
    );

    if (showActions) {
      mapped.push(
        columnHelper.display({
          id: "actions",
          header: () => "Actions",
          cell: (info) => {
            const row = info.row.original;
            return (
              <div className="flex items-center gap-2 whitespace-nowrap">
                {row._viewHref ? (
                  <Link href={row._viewHref}>
                    <Button size="sm" variant="ghost" className="h-8 rounded-[10px] border border-[var(--edge)] px-3">
                      <Eye className="size-3.5" />
                      View
                    </Button>
                  </Link>
                ) : null}
                {row._editHref ? (
                  <Link href={row._editHref}>
                    <Button size="sm" variant="secondary" className="h-8 rounded-[10px] px-3">
                      <PencilLine className="size-3.5" />
                      Edit
                    </Button>
                  </Link>
                ) : null}
                {!row._viewHref && !row._editHref ? <span className="small text-[var(--muted-text)]">-</span> : null}
              </div>
            );
          },
        }),
      );
    }

    return mapped;
  }, [columns, showActions]);

  // TanStack Table's hook is intentionally used here for dynamic table state.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)]">
      <div className="max-h-[560px] overflow-auto">
        <Table>
          <thead className="sticky top-0 z-10 bg-[var(--surface)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell className="text-[var(--muted-text)]" colSpan={tableColumns.length}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : null}
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
