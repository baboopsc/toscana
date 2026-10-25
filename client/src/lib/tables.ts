import { useGetAreasQuery } from '../api/api';

/** URL'deki masa numarasından masa adını bulur ("S12"). */
export function useTable(tableId: number) {
  const { data: areas, isLoading } = useGetAreasQuery();
  for (const area of areas ?? []) {
    const table = area.tables.find((t) => t.id === tableId);
    if (table) return { table, areaName: area.name, isLoading };
  }
  return { table: undefined, areaName: undefined, isLoading };
}

export function parseTableId(value: string | undefined): number {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : 0;
}
