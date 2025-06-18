"use client";

import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../ui/table";

interface ScheduleItem {
  id: number;
  shift: string; // Shift name/title
  staff: string; // Staff names
  client: string; // Client name
  date: string; // Date in format like "02 Jun"
  time: string; // Start time
  scheduledTime: string; // Scheduled duration
  loggedTime?: string; // Logged duration
  break: string; // Break/pause time
  log: string; // Log in time
  schLogLength: string; // Scheduled/Logged length
  payLength: string; // Pay length
  trlDistance: string; // Travel distance
  trlTime: string; // Travel time
  // Removed status column as requested
}

interface ScheduleIndividualViewProps {
  data: ScheduleItem[];
}

export default function ScheduleIndividualView({ data }: ScheduleIndividualViewProps) {

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="w-full overflow-x-auto">
        <div className="min-w-[800px] max-h-[600px] overflow-y-auto">
          <Table className="table-fixed">
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-gray-800/50">
              <TableRow>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-600 text-start text-xs dark:text-gray-300 w-[20%]">
                  Shift
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-600 text-start text-xs dark:text-gray-300 w-[15%]">
                  Staff
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-600 text-start text-xs dark:text-gray-300 w-[15%]">
                  Client
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-600 text-start text-xs dark:text-gray-300 w-[12.5%]">
                  Sch
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-600 text-start text-xs dark:text-gray-300 w-[12.5%]">
                  Break
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-600 text-start text-xs dark:text-gray-300 w-[12.5%]">
                  Log
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-600 text-start text-xs dark:text-gray-300 w-[12.5%]">
                  Sch / Log Length
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No schedule data found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 w-[20%]">
                      {item.shift}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 w-[15%]">
                      {item.staff}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 w-[15%]">
                      {item.client}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 w-[12.5%]">
                      <div>
                        <div>{item.date}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.time}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 w-[12.5%]">
                      {item.break}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 w-[12.5%]">
                      {item.log}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 w-[12.5%]">
                      {item.schLogLength}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 