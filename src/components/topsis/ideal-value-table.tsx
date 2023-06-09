"use client";

import { roundNumber } from "@/lib/topsis";
import { IdealValueId } from "@/types";

interface IdealValueProps {
  data: IdealValueId[] | undefined;
}

export function IdealValueTable({ data }: IdealValueProps) {
  const columns = data
    ?.sort((a, b) => {
      const numA = parseInt(a.id.slice(1));
      const numB = parseInt(b.id.slice(1));

      return numA - numB;
    })
    .map((column) => column.id);

  return (
    <div className="border rounded p-2 ">
      <div className="max-w-full overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {columns?.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {columns?.map((column) => {
                const value = data?.find(
                  (item) => item.id === column
                )?.idealValue;

                return (
                  <td
                    className="text-left md:text-center px-[15px]"
                    key={column}
                  >
                    {roundNumber(value ?? 0)}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
