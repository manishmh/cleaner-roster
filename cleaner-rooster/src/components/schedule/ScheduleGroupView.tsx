"use client";

import { ChevronDownIcon, ChevronRightIcon, PrinterIcon } from "@/icons";
import React, { useState } from "react";
import Button from "../ui/button/Button";
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

interface GroupedScheduleData {
  name: string;
  count: number;
  schLength: string;
  log: string;
  payLength: string;
  trlDistance: string;
  trlTime: string;
  items: ScheduleItem[];
}

interface ScheduleGroupViewProps {
  data: GroupedScheduleData[];
  viewType: "group-by-staff" | "group-by-client";
  onDownloadGroup: (groupData: GroupedScheduleData) => void;
}

export default function ScheduleGroupView({ data, viewType, onDownloadGroup }: ScheduleGroupViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };



  return (
    <div className="space-y-4">
      {/* Group Summary Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05] bg-gray-50 dark:bg-gray-800/50">
              <TableRow>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                  <div className="w-6"></div> {/* Space for expand icon */}
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                  Name
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                  Count
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                  Sch Length
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                  Log Length
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                  Pay Length
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                  TrlDist.
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                  TrlTime
                </TableCell>
                <TableCell isHeader className="px-4 py-3 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {data.map((group) => (
                <React.Fragment key={group.name}>
                  <TableRow className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <TableCell className="px-4 py-3">
                      <button
                        onClick={() => toggleGroup(group.name)}
                        className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        {expandedGroups.has(group.name) ? (
                          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                      <button
                        onClick={() => toggleGroup(group.name)}
                        className="text-left hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                      >
                        {group.name}
                      </button>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {group.count}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {group.schLength}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {group.log}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {group.payLength}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {group.trlDistance}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                      {group.trlTime}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownloadGroup(group)}
                        startIcon={<PrinterIcon className="h-3 w-3" />}
                        className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
                      >
                        Print
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Group Details */}
                  {expandedGroups.has(group.name) && (
                    <TableRow>
                      <TableCell colSpan={9} className="px-0 py-0">
                        <div className="bg-gray-50 dark:bg-gray-800/30 p-4">
                          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                            <div className="max-w-full overflow-x-auto">
                              <Table>
                                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                                  <TableRow>
                                    <TableCell isHeader className="px-4 py-2 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                                      Shift
                                    </TableCell>
                                    <TableCell isHeader className="px-4 py-2 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                                      {viewType === "group-by-staff" ? "Client" : "Staff"}
                                    </TableCell>
                                    <TableCell isHeader className="px-4 py-2 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                                      Date
                                    </TableCell>
                                    <TableCell isHeader className="px-4 py-2 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                                      Time
                                    </TableCell>
                                    <TableCell isHeader className="px-4 py-2 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                                      Scheduled Time
                                    </TableCell>
                                    <TableCell isHeader className="px-4 py-2 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                                      Break
                                    </TableCell>
                                    <TableCell isHeader className="px-4 py-2 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                                      Log
                                    </TableCell>
                                    <TableCell isHeader className="px-4 py-2 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                                      Sch/Log Length
                                    </TableCell>
                                    <TableCell isHeader className="px-4 py-2 font-medium text-gray-600 text-start text-xs dark:text-gray-300">
                                      Pay Length
                                    </TableCell>
                                  </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                                  {group.items.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                                      <TableCell className="px-4 py-2 text-xs text-gray-900 dark:text-gray-100">
                                        {item.shift}
                                      </TableCell>
                                      <TableCell className="px-4 py-2 text-xs text-gray-900 dark:text-gray-100">
                                        {viewType === "group-by-staff" ? item.client : item.staff}
                                      </TableCell>
                                      <TableCell className="px-4 py-2 text-xs text-gray-900 dark:text-gray-100">
                                        {item.date}
                                      </TableCell>
                                      <TableCell className="px-4 py-2 text-xs text-gray-900 dark:text-gray-100">
                                        {item.time}
                                      </TableCell>
                                      <TableCell className="px-4 py-2 text-xs text-gray-900 dark:text-gray-100">
                                        {item.scheduledTime}
                                      </TableCell>
                                      <TableCell className="px-4 py-2 text-xs text-gray-900 dark:text-gray-100">
                                        {item.break !== "00:00" ? item.break : "..."}
                                      </TableCell>
                                      <TableCell className="px-4 py-2 text-xs text-gray-900 dark:text-gray-100">
                                        {item.log}
                                      </TableCell>
                                      <TableCell className="px-4 py-2 text-xs text-gray-900 dark:text-gray-100">
                                        {item.schLogLength}
                                      </TableCell>
                                      <TableCell className="px-4 py-2 text-xs text-gray-900 dark:text-gray-100">
                                        {item.payLength}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 