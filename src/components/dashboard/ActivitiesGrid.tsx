"use client";

import { useRouter } from "next/navigation";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { formatDistance, formatDuration, formatElevation, formatPace } from "@/lib/format";
import { getActivityIcon, formatActivityType } from "@/lib/activityIcons";
import type { ActivityRecord } from "@/lib/queries";

export interface ActivitiesGridProps {
  rows: ActivityRecord[];
  loading?: boolean;
  /** Rows per page. */
  pageSize?: number;
  /** Show the DataGrid toolbar (quick filter, column menu, export). */
  showToolbar?: boolean;
}

const columns: GridColDef<ActivityRecord>[] = [
  {
    field: "startDate",
    headerName: "Date",
    type: "date",
    width: 110,
    valueGetter: (value: string) => new Date(value),
    valueFormatter: (value: Date) =>
      value.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }),
  },
  {
    field: "name",
    headerName: "Name",
    flex: 1,
    minWidth: 180,
  },
  {
    field: "type",
    headerName: "Type",
    width: 140,
    valueFormatter: (value: string) => formatActivityType(value),
    renderCell: (params) => (
      <span>
        {getActivityIcon(params.row.type)} {formatActivityType(params.row.type)}
      </span>
    ),
  },
  {
    field: "distance",
    headerName: "Distance",
    type: "number",
    width: 100,
    valueFormatter: (value: number) => (value > 0 ? formatDistance(value) : "—"),
  },
  {
    field: "movingTime",
    headerName: "Time",
    type: "number",
    width: 90,
    valueFormatter: (value: number) => formatDuration(value),
  },
  {
    field: "pace",
    headerName: "Pace",
    type: "number",
    width: 110,
    sortable: true,
    valueGetter: (_value, row) =>
      row.distance >= 100 ? row.movingTime / (row.distance / 1000) : null,
    valueFormatter: (_value, row) => formatPace(row.distance, row.movingTime),
  },
  {
    field: "totalElevationGain",
    headerName: "Elevation",
    type: "number",
    width: 100,
    valueFormatter: (value: number) => (value > 0 ? formatElevation(value) : "—"),
  },
  {
    field: "averageHeartrate",
    headerName: "Avg HR",
    type: "number",
    width: 90,
    valueFormatter: (value: number | null) => (value ? `${Math.round(value)} bpm` : "—"),
  },
];

/**
 * Activity table built on MUI X DataGrid — sorting, filtering, and pagination
 * for free. Row click navigates to the activity detail page. Part of the
 * dashboard component kit.
 */
export function ActivitiesGrid({
  rows,
  loading = false,
  pageSize = 10,
  showToolbar = false,
}: ActivitiesGridProps) {
  const router = useRouter();

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      density="compact"
      disableRowSelectionOnClick
      showToolbar={showToolbar}
      onRowClick={(params) => router.push(`/activities/${params.row.id}`)}
      pageSizeOptions={[10, 25, 50]}
      initialState={{
        pagination: { paginationModel: { pageSize } },
        sorting: { sortModel: [{ field: "startDate", sort: "desc" }] },
      }}
      sx={{
        border: 0,
        backgroundColor: "transparent",
        "--DataGrid-containerBackground": "transparent",
        "& .MuiDataGrid-row": { cursor: "pointer" },
        "& .MuiDataGrid-cell": { fontSize: "0.8125rem" },
        "& .MuiDataGrid-columnHeaderTitle": { fontSize: "0.75rem", fontWeight: 500 },
      }}
    />
  );
}
