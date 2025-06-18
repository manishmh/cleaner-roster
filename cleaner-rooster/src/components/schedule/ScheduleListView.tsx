"use client";

import { useCalendarClient } from "@/components/calendar/CalendarClientContext";
import { useSidebar } from "@/context/SidebarContext";
import { useStaff } from "@/context/StaffContext";
import { DownloadIcon, SearchIcon } from "@/icons";
import { shiftApi, type Shift } from "@/lib/api";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import Button from "../ui/button/Button";
import ScheduleGroupView from "./ScheduleGroupView";
import ScheduleIndividualView from "./ScheduleIndividualView";
import ScheduleSearchFilters from "./ScheduleSearchFilters";

export interface ScheduleSearchFilters {
  fromDate: string;
  toDate: string;
  staff: string;
  client: string;
  viewType: "individual" | "group-by-staff" | "group-by-client";
}

export interface ScheduleItem {
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

export interface GroupedScheduleData {
  name: string;
  count: number;
  schLength: string;
  log: string;
  payLength: string;
  trlDistance: string;
  trlTime: string;
  items: ScheduleItem[];
}

export default function ScheduleListView() {
  const { closeSidebar } = useSidebar();
  const { staff: allStaff, isLoading: isLoadingStaff } = useStaff();
  const { clientList: allClients, loading: isLoadingClients } = useCalendarClient();
  
  const [filters, setFilters] = useState<ScheduleSearchFilters>({
    fromDate: "",
    toDate: "",
    staff: "none",
    client: "none",
    viewType: "individual"
  });

  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedScheduleData[]>([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(true);

  // Close sidebar by default when component mounts
  useEffect(() => {
    closeSidebar();
  }, [closeSidebar]);

  // Fetch shifts data
  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setIsLoadingShifts(true);
        const response = await shiftApi.getAll();
        if (response.success && response.data) {
          setAllShifts(response.data.data);
        } else {
          console.error('Failed to fetch shifts:', response.error);
          toast.error('Failed to load shifts');
        }
      } catch (error) {
        console.error('Error fetching shifts:', error);
        toast.error('Failed to load shifts');
      } finally {
        setIsLoadingShifts(false);
      }
    };

    fetchShifts();
  }, []);

  // Create supervisor and client options from real data
  const supervisorOptions = [
    { value: "none", label: "None" },
    { value: "all", label: "All Supervisors" },
    ...allStaff
      .filter(staff => staff.role === 'supervisor')
      .map(staff => ({
        value: staff.id.toString(),
        label: staff.name
      }))
  ];

  const clientOptions = [
    { value: "none", label: "None" },
    { value: "all", label: "All Clients" },
    ...allClients.map(client => ({
      value: client.id.toString(),
      label: client.name
    }))
  ];

  // Helper function to convert shift to schedule item
  const convertShiftToScheduleItem = (shift: Shift): ScheduleItem => {
    // Get staff names
    const staffNames = shift.staff?.map(s => s.name).join(', ') || 'Unassigned';
    
    // Get client name
    const clientName = shift.clients?.[0]?.name || 'No Client';
    
    // Format date
    const shiftDate = new Date(shift.startTime);
    const formattedDate = shiftDate.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short' 
    });
    
    // Format time
    const formattedTime = shiftDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    // Calculate durations
    const startTime = new Date(shift.startTime);
    const endTime = new Date(shift.endTime);
    const scheduledDuration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes
    const scheduledHours = Math.floor(scheduledDuration / 60);
    const scheduledMinutes = scheduledDuration % 60;
    const scheduledTimeStr = `${scheduledHours.toString().padStart(2, '0')}:${scheduledMinutes.toString().padStart(2, '0')}`;
    
    // Calculate logged duration if available
    let loggedTimeStr = '00:00';
    if (shift.loggedInTime && shift.loggedOutTime) {
      const loggedStart = new Date(shift.loggedInTime);
      const loggedEnd = new Date(shift.loggedOutTime);
      const loggedDuration = Math.round((loggedEnd.getTime() - loggedStart.getTime()) / (1000 * 60));
      const loggedHours = Math.floor(loggedDuration / 60);
      const loggedMinutes = loggedDuration % 60;
      loggedTimeStr = `${loggedHours.toString().padStart(2, '0')}:${loggedMinutes.toString().padStart(2, '0')}`;
    }
    
    // Calculate pause time
    let pauseTimeStr = '00:00';
    if (shift.pauseLog) {
      try {
        const pauseEntries = JSON.parse(shift.pauseLog);
        let totalPauseTime = 0;
        pauseEntries.forEach((entry: { pausedAt?: string; resumedAt?: string }) => {
          if (entry.pausedAt && entry.resumedAt) {
            const pausedAt = new Date(entry.pausedAt);
            const resumedAt = new Date(entry.resumedAt);
            totalPauseTime += resumedAt.getTime() - pausedAt.getTime();
          }
        });
        const pauseMinutes = Math.round(totalPauseTime / (1000 * 60));
        const pauseHours = Math.floor(pauseMinutes / 60);
        const pauseMins = pauseMinutes % 60;
        pauseTimeStr = `${pauseHours.toString().padStart(2, '0')}:${pauseMins.toString().padStart(2, '0')}`;
      } catch (error) {
        console.error('Error parsing pause log:', error);
      }
    }
    
    // Log in time
    const logInTime = shift.loggedInTime 
      ? new Date(shift.loggedInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      : '...';

    // Pay length (typically the lesser of scheduled or logged time)
    const payLength = shift.loggedInTime && shift.loggedOutTime ? 
      (scheduledTimeStr <= loggedTimeStr ? scheduledTimeStr : loggedTimeStr) : 
      scheduledTimeStr;

    return {
      id: shift.id,
      shift: shift.title,
      staff: staffNames,
      client: clientName,
      date: formattedDate,
      time: formattedTime,
      scheduledTime: scheduledTimeStr,
      loggedTime: loggedTimeStr,
      break: pauseTimeStr,
      log: logInTime,
      schLogLength: `${scheduledTimeStr} / ${loggedTimeStr}`,
      payLength: payLength,
      trlDistance: '0', // TODO: Implement travel distance calculation
      trlTime: '00:00' // TODO: Implement travel time calculation
    };
  };

  // Helper function to match client names
  const matchesClient = (shift: Shift, selectedClient: string): boolean => {
    if (selectedClient === "all") return true;
    if (selectedClient === "none") return false;
    
    const clientId = parseInt(selectedClient);
    return shift.clients?.some(client => client.id === clientId) || false;
  };

  // Helper function to match staff names
  const matchesStaff = (shift: Shift, selectedStaff: string): boolean => {
    if (selectedStaff === "all") return true;
    if (selectedStaff === "none") return false;
    
    const staffId = parseInt(selectedStaff);
    return shift.staff?.some(staff => staff.id === staffId) || false;
  };
    
  // Helper function to check if shift is within date range
  const isWithinDateRange = (shift: Shift, fromDate: string, toDate: string): boolean => {
    if (!fromDate || !toDate) return true;
    
    const shiftDate = new Date(shift.startTime);
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    // Set time to start/end of day for proper comparison
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    
    return shiftDate >= from && shiftDate <= to;
  };

  // Filter and group data based on view type and selections
  useEffect(() => {
    if (isLoadingShifts || isLoadingStaff || isLoadingClients) return;

    // Filter shifts based on date range
    const filteredShifts = allShifts.filter(shift => 
      isWithinDateRange(shift, filters.fromDate, filters.toDate)
    );

    // Apply filters for individual view
    if (filters.viewType === "individual") {
      // Handle different combinations for individual view using UNION logic
      if (filters.staff === "none" && filters.client === "none") {
        // Display no results
        setScheduleData([]);
        return;
      }

      // Apply staff filter
      let staffFilteredShifts: Shift[] = [];
      if (filters.staff === "all") {
        // All staff - include all data
        staffFilteredShifts = [...filteredShifts];
      } else if (filters.staff !== "none") {
        // Specific staff - filter by that staff member
        staffFilteredShifts = filteredShifts.filter(shift => 
          matchesStaff(shift, filters.staff)
        );
      }

      // Apply client filter
      let clientFilteredShifts: Shift[] = [];
      if (filters.client === "all") {
        // All clients - include all data
        clientFilteredShifts = [...filteredShifts];
      } else if (filters.client !== "none") {
        // Specific client - filter by that client
        clientFilteredShifts = filteredShifts.filter(shift => 
          matchesClient(shift, filters.client)
        );
      }

      // Now apply the union logic based on what's selected
      let finalShifts: Shift[] = [];

      if (filters.staff !== "none" && filters.client !== "none") {
        // Both staff and client are selected - show intersection (shifts that match BOTH criteria)
        if (filters.staff === "all" && filters.client === "all") {
          // All staff + All clients = All data
          finalShifts = [...filteredShifts];
        } else if (filters.staff === "all") {
          // All staff + Specific client = All staff working for that client
          finalShifts = clientFilteredShifts;
        } else if (filters.client === "all") {
          // Specific staff + All clients = All clients for that staff
          finalShifts = staffFilteredShifts;
        } else {
          // Specific staff + Specific client = Intersection of both
          finalShifts = filteredShifts.filter(shift => 
            matchesStaff(shift, filters.staff) && matchesClient(shift, filters.client)
          );
        }
      } else if (filters.staff !== "none") {
        // Only staff is selected, client is none
        finalShifts = staffFilteredShifts;
      } else if (filters.client !== "none") {
        // Only client is selected, staff is none
        finalShifts = clientFilteredShifts;
      }

      // Convert to schedule items
      const scheduleItems = finalShifts.map(convertShiftToScheduleItem);
      setScheduleData(scheduleItems);
      return;
    }

    // For group views
    const grouped: { [key: string]: ScheduleItem[] } = {};
    
    if (filters.viewType === "group-by-staff") {
      if (filters.staff === "none") {
        setGroupedData([]);
        return;
      }

      filteredShifts.forEach(shift => {
        // Handle multiple staff members by splitting and creating entries for each
        const staffMembers = shift.staff || [];
        staffMembers.forEach(staffMember => {
          // If specific staff is selected, only include that staff member
          if (filters.staff !== "all") {
            const staffId = parseInt(filters.staff);
            if (staffMember.id !== staffId) {
              return;
            }
          }
          
          const groupKey = staffMember.name || "Unassigned";
          if (!grouped[groupKey]) {
            grouped[groupKey] = [];
          }
          grouped[groupKey].push(convertShiftToScheduleItem(shift));
        });
      });
    } else if (filters.viewType === "group-by-client") {
      if (filters.client === "none") {
        setGroupedData([]);
        return;
      }

      filteredShifts.forEach(shift => {
        // If specific client is selected, only include that client
        if (filters.client !== "all") {
          if (!matchesClient(shift, filters.client)) {
            return;
          }
        }
        
        const groupKey = shift.clients?.[0]?.name || "No Client";
        if (!grouped[groupKey]) {
          grouped[groupKey] = [];
        }
        grouped[groupKey].push(convertShiftToScheduleItem(shift));
      });
    }

    const groupedArray: GroupedScheduleData[] = Object.entries(grouped).map(([name, items]) => {
      // Calculate actual totals from the items
      const totalSchLength = items.reduce((acc, item) => {
        const [sch] = item.schLogLength.split(' / ');
        const [hours, minutes] = sch.split(':').map(Number);
        return acc + (hours * 60) + minutes;
      }, 0);
      
      const totalLogLength = items.reduce((acc, item) => {
        const [, log] = item.schLogLength.split(' / ');
        const [hours, minutes] = log.split(':').map(Number);
        return acc + (hours * 60) + minutes;
      }, 0);
      
      const schLengthFormatted = `${Math.floor(totalSchLength / 60).toString().padStart(2, '0')}:${(totalSchLength % 60).toString().padStart(2, '0')}`;
      const logLengthFormatted = `${Math.floor(totalLogLength / 60).toString().padStart(2, '0')}:${(totalLogLength % 60).toString().padStart(2, '0')}`;
      
      // Calculate pay length as the minimum of scheduled and logged lengths
      const totalPayLength = Math.min(totalSchLength, totalLogLength);
      const payLengthFormatted = `${Math.floor(totalPayLength / 60).toString().padStart(2, '0')}:${(totalPayLength % 60).toString().padStart(2, '0')}`;
      
      return {
        name,
        count: items.length,
        schLength: schLengthFormatted,
        log: logLengthFormatted,
        payLength: payLengthFormatted,
        trlDistance: "0",
        trlTime: "00:00",
        items
      };
    });

    setGroupedData(groupedArray);
  }, [filters, allShifts, isLoadingShifts, isLoadingStaff, isLoadingClients]);

  const shouldShowEmptyState = () => {
    if (filters.viewType === "individual") {
      return filters.staff === "none" && filters.client === "none";
    } else if (filters.viewType === "group-by-staff") {
      return filters.staff === "none";
    } else if (filters.viewType === "group-by-client") {
      return filters.client === "none";
    }
    return false;
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${filename}`);
  };

  const downloadIndividualReport = () => {
    const headers = ["Shift", "Staff", "Client", "Date", "Time", "Scheduled Time", "Break", "Log", "Sch/Log Length"];
    const csvContent = [
      headers.join(","),
      ...scheduleData.map(item => [
        `"${item.shift}"`,
        `"${item.staff}"`,
        `"${item.client}"`,
        item.date,
        item.time,
        item.scheduledTime,
        item.break,
        item.log,
        item.schLogLength
      ].join(","))
    ].join("\n");
    
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `Individual_Report_${currentDate}.csv`;
    downloadCSV(csvContent, filename);
  };

  const downloadGroupReport = () => {
    let csvContent = "";
    const currentDate = new Date().toISOString().split('T')[0];
    
    groupedData.forEach((group, index) => {
      if (index > 0) csvContent += "\n\n";
      
      // Group header
      csvContent += `Group: ${group.name}\n`;
      csvContent += `Count: ${group.count}, Sch Length: ${group.schLength}, Log: ${group.log}\n\n`;
      
      // Group details
      const headers = ["Shift", "Staff", "Client", "Date", "Time", "Scheduled Time", "Break", "Log", "Sch/Log Length"];
      csvContent += headers.join(",") + "\n";
      
      group.items.forEach(item => {
        csvContent += [
          `"${item.shift}"`,
          `"${item.staff}"`,
          `"${item.client}"`,
          item.date,
          item.time,
          item.scheduledTime,
          item.break,
          item.log,
          item.schLogLength
        ].join(",") + "\n";
      });
    });
    
    const filename = `Group_Report_${currentDate}.csv`;
    downloadCSV(csvContent, filename);
  };

  const handleDownloadReport = () => {
    // Check if there's any data to download
    if (filters.viewType === "individual") {
      if (scheduleData.length === 0) {
        toast.error("No data selected. Please select staff or client options to download.");
        return;
      }
      downloadIndividualReport();
    } else {
      if (groupedData.length === 0) {
        toast.error("No data selected. Please select staff or client options to download.");
        return;
      }
      downloadGroupReport();
    }
  };

  const handleDownloadGroup = (groupData: GroupedScheduleData) => {
    const headers = ["Shift", "Staff", "Client", "Date", "Time", "Scheduled Time", "Break", "Log", "Sch/Log Length"];
    const csvContent = [
      headers.join(","),
      ...groupData.items.map(item => [
        `"${item.shift}"`,
        `"${item.staff}"`,
        `"${item.client}"`,
        item.date,
        item.time,
        item.scheduledTime,
        item.break,
        item.log,
        item.schLogLength
      ].join(","))
    ].join("\n");
    
    const currentDate = new Date().toISOString().split('T')[0];
    const groupName = groupData.name.replace(/\s+/g, '').substring(0, 20);
    const filename = `${groupName}_Report_${currentDate}.csv`;
    downloadCSV(csvContent, filename);
  };

  if (isLoadingShifts || isLoadingStaff || isLoadingClients) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-600 rounded-full mx-auto mb-4"></div>
              <p>Loading schedule data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <ScheduleSearchFilters
        filters={filters}
        onFiltersChange={setFilters}
        supervisorOptions={supervisorOptions}
        clientOptions={clientOptions}
      />

      {/* Results Section */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header with Download Button */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {filters.fromDate && filters.toDate && `${filters.fromDate} to ${filters.toDate}`}
            </h2>
            {!shouldShowEmptyState() && filters.viewType !== "individual" && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Total Shifts: {scheduleData.length}
              </p>
            )}
          </div>
          {!shouldShowEmptyState() && (
            <Button
              variant="outline"
              onClick={handleDownloadReport}
              startIcon={<DownloadIcon className="h-4 w-4" />}
              className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
            >
              Download
            </Button>
          )}
        </div>

        {/* Content based on view type */}
        {shouldShowEmptyState() ? (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Selection Made</h3>
              <p>Please select staff or client options above to view schedule data.</p>
            </div>
          </div>
        ) : filters.viewType === "individual" ? (
          <ScheduleIndividualView data={scheduleData} />
        ) : (
          <ScheduleGroupView 
            data={groupedData} 
            viewType={filters.viewType}
            onDownloadGroup={handleDownloadGroup}
          />
        )}
      </div>
    </div>
  );
} 