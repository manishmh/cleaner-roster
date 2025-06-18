import { locationApi, shiftApi, type CreateShiftData, type Location } from "@/lib/api";
import React, { useMemo, useState } from 'react';
import { toast } from "sonner";
import { CalendarEvent } from "../../Calendar";

interface RepeatTabContentProps {
  event: CalendarEvent;
  onRefetch?: () => Promise<void>;
  onClose?: () => void;
}

interface RepeatDay {
  day: string;
  rosteredUpto: string;
  rosteredDate: Date;
  selected: boolean;
}



const RepeatTabContent: React.FC<RepeatTabContentProps> = ({ event, onRefetch, onClose }) => {
  const [closeDate, setCloseDate] = useState('');
  const [creationEnabled, setCreationEnabled] = useState(false);
  const [selectedDays, setSelectedDays] = useState<RepeatDay[]>([]);
  const [showCloseDatePicker, setShowCloseDatePicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Parse event date and time
  const parseEventDate = (date: string | number | Date | undefined): Date => {
    if (!date) return new Date();
    if (typeof date === 'string' || typeof date === 'number') return new Date(date);
    return date;
  };

  const getValidDate = (val: unknown): string | number | Date | undefined => {
    if (Array.isArray(val)) return undefined;
    return val as string | number | Date | undefined;
  };

  const eventStart = parseEventDate(getValidDate(event.start));
  const eventEnd = parseEventDate(getValidDate(event.end));
  
  // Calculate shift length
  const shiftLength = useMemo(() => {
    const diff = (eventEnd.getTime() - eventStart.getTime()) / 1000;
    const hours = Math.floor(diff / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, "0");
    const seconds = Math.floor(diff % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, [eventStart, eventEnd]);

  // Get shift time (06:00 format)
  const shiftTime = eventStart.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });

  // Calculate event duration in milliseconds
  const eventDuration = eventEnd.getTime() - eventStart.getTime();

  // Generate working days (Monday to Friday) starting from next working day
  const generateWorkingDays = useMemo(() => {
    const days: RepeatDay[] = [];
    const currentDate = new Date(eventStart);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Find next working day
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // Skip to next working day if it's weekend
    while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    
    // Generate 5 working days
    for (let i = 0; i < 5; i++) {
      // Skip weekends
      while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      
      const dayName = dayNames[nextDate.getDay()];
      const rosteredDate = nextDate.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      
      days.push({
        day: dayName,
        rosteredUpto: `${rosteredDate} ${shiftTime}`,
        rosteredDate: new Date(nextDate),
        selected: false
      });
      
      // Move to next day
      nextDate.setDate(nextDate.getDate() + 1);
    }
    
    return days;
  }, [eventStart, shiftTime]);

  // Initialize selected days
  React.useEffect(() => {
    setSelectedDays(generateWorkingDays);
  }, [generateWorkingDays]);

  // Handle checkbox change for individual days
  const handleDayToggle = (index: number) => {
    if (!creationEnabled) {
      toast.error("Please enable recurring shift creation first by clicking 'Enable Creation' button");
      return;
    }
    
    setSelectedDays(prev => 
      prev.map((day, i) => 
        i === index ? { ...day, selected: !day.selected } : day
      )
    );
  };

  // Handle select all checkbox
  const handleSelectAll = (checked: boolean) => {
    if (!creationEnabled) {
      toast.error("Please enable recurring shift creation first by clicking 'Enable Creation' button");
      return;
    }
    
    setSelectedDays(prev => 
      prev.map(day => ({ ...day, selected: checked }))
    );
  };

  // Handle enable creation button
  const handleEnableCreation = () => {
    setCreationEnabled(true);
    setShowCloseDatePicker(true);
    toast.success("Recurring shift creation enabled! Please select a close date.");
  };

  // Check if all days are selected
  const allSelected = selectedDays.every(day => day.selected);
  const someSelected = selectedDays.some(day => day.selected);

  // Generate recurring dates based on selected days and close date
  const generateRecurringDates = (selectedDayNames: string[], endDate: Date) => {
    const recurringDates: Date[] = [];
    const shiftDate = new Date(eventStart); // Use the shift's date as starting point
    const dayNameToNumber: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    // Set end date to end of day to ensure inclusive comparison
    const endDateInclusive = new Date(endDate);
    endDateInclusive.setHours(23, 59, 59, 999);

    selectedDayNames.forEach(dayName => {
      const targetDayNumber = dayNameToNumber[dayName];
      const nextDate = new Date(shiftDate);
      nextDate.setDate(nextDate.getDate() + 1); // Start from day after the shift date
      
      // Find the next occurrence of this day
      while (nextDate.getDay() !== targetDayNumber) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      
      // Generate all occurrences until close date (INCLUDING close date)
      while (nextDate <= endDateInclusive) {
        recurringDates.push(new Date(nextDate));
        nextDate.setDate(nextDate.getDate() + 7); // Move to next week
      }
    });

    return recurringDates.sort((a, b) => a.getTime() - b.getTime());
  };

  // Handle create recurring shifts
  const handleCreateRecurringShifts = async () => {
    if (!creationEnabled) {
      toast.error("Please enable recurring shift creation first");
      return;
    }

    if (!closeDate) {
      toast.error("Please select a close date");
      return;
    }

    const selectedDaysList = selectedDays.filter(day => day.selected);
    if (selectedDaysList.length === 0) {
      toast.error('Please select at least one day to create recurring shifts.');
      return;
    }

    setIsCreating(true);
    
    // Force refresh calendar data to ensure we have the latest staff assignments
    if (onRefetch) {
      console.log('Refreshing calendar data before creating recurring shifts...');
      await onRefetch();
    }
    
    // Get fresh shift data from the API to ensure we have the latest staff assignments
    let freshEventData = event;
    try {
      const shiftId = parseInt(event.id || '0');
      if (shiftId > 0) {
        const response = await shiftApi.getById(shiftId);
        if (response.success && response.data) {
          const freshShift = response.data.data;
          console.log('Fresh shift data from API:', freshShift);
          
          // Convert fresh shift data to event format with proper staff assignments
          const supervisorIds = (freshShift.staff || [])
            .filter(s => s.roleInShift === 'supervisor')
            .map(s => s.id.toString());
          const teamMemberIds = (freshShift.staff || [])
            .filter(s => s.roleInShift === 'team_member')
            .map(s => s.id.toString());
          const assignedStaffIds = (freshShift.staff || [])
            .filter(s => s.roleInShift === 'assigned')
            .map(s => s.id.toString());

          freshEventData = {
            ...event,
            extendedProps: {
              ...event.extendedProps,
              staffIds: [], // Keep empty - we use supervisorIds and teamMemberIds instead
              supervisorIds: supervisorIds,
              teamMemberIds: teamMemberIds.length > 0 ? teamMemberIds : assignedStaffIds,
            }
          };
          console.log('Updated event data with fresh staff assignments:', freshEventData.extendedProps);
        }
      }
    } catch (error) {
      console.error('Failed to fetch fresh shift data:', error);
      // Continue with original event data if fetch fails
    }
    
    try {
      const endDate = new Date(closeDate);
      const selectedDayNames = selectedDaysList.map(day => day.day);
      const recurringDates = generateRecurringDates(selectedDayNames, endDate);

      if (recurringDates.length === 0) {
        toast.error("No valid dates found for the selected days and close date");
        setIsCreating(false);
        return;
      }

      // Create shift data for each recurring date
      const shiftPromises = recurringDates.map(async (date) => {
        const startDateTime = new Date(date);
        startDateTime.setHours(eventStart.getHours(), eventStart.getMinutes(), eventStart.getSeconds());
        
        const endDateTime = new Date(startDateTime.getTime() + eventDuration);

        // Handle location creation if original shift has location
        let locationIds: number[] = [];
        if (freshEventData.extendedProps?.location && freshEventData.extendedProps?.includeLocation) {
          try {
            // Try to find existing location first
            const locationsResponse = await locationApi.getAll();
            let locationId: number | null = null;
            
            if (locationsResponse.success && locationsResponse.data) {
              const existingLocation = locationsResponse.data.data.find(
                (loc: Location) => loc.unit === freshEventData.extendedProps.location?.unit && 
                       loc.name === freshEventData.extendedProps.location?.name
              );
              locationId = existingLocation?.id || null;
            }

            // If location not found, create it
            if (!locationId) {
              const createResponse = await locationApi.create({
                unit: freshEventData.extendedProps.location.unit,
                name: freshEventData.extendedProps.location.name,
                accuracy: parseInt(freshEventData.extendedProps.location.accuracy),
                comment: freshEventData.extendedProps.location.comment,
              });
              
              if (createResponse.success && createResponse.data) {
                locationId = createResponse.data.data.id;
              }
            }

            if (locationId) {
              locationIds = [locationId];
            }
          } catch (error) {
            console.error('Error handling location for recurring shift:', error);
          }
        }

        // Extract staff data properly - no duplicates
        const supervisorIds = (freshEventData.extendedProps?.supervisorIds || [])
          .filter(id => id !== null && id !== undefined && id !== '')
          .map(id => parseInt(String(id)))
          .filter(id => !isNaN(id));

        const teamMemberIds = (freshEventData.extendedProps?.teamMemberIds || [])
          .filter(id => id !== null && id !== undefined && id !== '')
          .map(id => parseInt(String(id)))
          .filter(id => !isNaN(id));

        // staffIds should be empty - we use supervisorIds and teamMemberIds instead
        const staffIds: number[] = [];

        console.log('Copying staff data from fresh event data:', {
          assignmentType: freshEventData.extendedProps?.assignmentType,
          originalStaffIds: freshEventData.extendedProps?.staffIds,
          originalSupervisorIds: freshEventData.extendedProps?.supervisorIds,
          originalTeamMemberIds: freshEventData.extendedProps?.teamMemberIds,
          processedStaffIds: staffIds,
          processedSupervisorIds: supervisorIds,
          processedTeamMemberIds: teamMemberIds,
        });

        const shiftData: CreateShiftData = {
          title: `${freshEventData.title} (Recurring)`,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          theme: (freshEventData.extendedProps?.theme as 'Danger' | 'Warning' | 'Success' | 'Primary') || 'Primary',
          assignmentType: freshEventData.extendedProps?.assignmentType || 'individual',
          isPublished: freshEventData.extendedProps?.isPublished || false,
          includeLocation: freshEventData.extendedProps?.includeLocation || false,
          shiftInstructions: freshEventData.extendedProps?.shiftInstructions || '',
          staffIds: [], // Keep empty - backend uses supervisorIds and teamMemberIds
          clientIds: freshEventData.extendedProps?.clientIds?.map((id: string) => parseInt(id)).filter(id => !isNaN(id)) || [],
          teamIds: freshEventData.extendedProps?.teamIds?.map((id: string) => parseInt(id)).filter(id => !isNaN(id)) || [],
          locationIds: locationIds,
          supervisorIds: supervisorIds,
          teamMemberIds: teamMemberIds,
        };

        console.log('Creating recurring shift with data:', shiftData);
        console.log('Staff assignment summary:', {
          hasStaffIds: staffIds.length > 0,
          hasSupervisorIds: supervisorIds.length > 0,
          hasTeamMemberIds: teamMemberIds.length > 0,
          staffCount: staffIds.length,
          supervisorCount: supervisorIds.length,
          teamMemberCount: teamMemberIds.length
        });

        return shiftApi.create(shiftData);
      });

      // Create all shifts in parallel
      const results = await Promise.all(shiftPromises);
      const successCount = results.filter(result => result.success).length;

      if (successCount > 0) {
        toast.success(`Successfully created ${successCount} recurring shifts!`);
        
        // Refetch calendar data to show new shifts
        if (onRefetch) {
          await onRefetch();
        }

        // Close the modal to show calendar
        if (onClose) {
          onClose();
        }

        // Reset form
        setSelectedDays(prev => prev.map(day => ({ ...day, selected: false })));
        setCreationEnabled(false);
        setShowCloseDatePicker(false);
        setCloseDate('');
      } else {
        toast.error("Failed to create recurring shifts");
      }
    } catch (error) {
      console.error('Error creating recurring shifts:', error);
      toast.error("Failed to create recurring shifts");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Top Section */}
      <div className="space-y-4">
        {/* Note */}
        <div className="text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2 dark:text-blue-200 dark:bg-gray-800 dark:border-gray-700 text-xs">
          <strong>Note:</strong> Select the shifts to make the permanent changes. This will effect all the shifts from the date selected when prompt.
        </div>

        {/* Repeat and Enable Creation */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
          <span className="text-gray-700 dark:text-gray-200 font-medium">Repeat: Weekly</span>
          
          {!creationEnabled ? (
            <button
              onClick={handleEnableCreation}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
            >
              Enable Creation
            </button>
          ) : (
            <span className="text-green-600 dark:text-green-400 font-medium">✓ Creation Enabled</span>
          )}
        </div>

        {/* Close Date Picker - Only show when creation is enabled */}
        {showCloseDatePicker && (
          <div className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Close Date (Required):</label>
            <input
              type="date"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
              className="border rounded px-3 py-1 text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              min={new Date().toISOString().split('T')[0]}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Recurring shifts will be created until this date
            </span>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        {/* Table Header */}
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid gap-4 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200" style={{ gridTemplateColumns: '50px 100px 150px 1fr 100px 80px' }}>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected && !allSelected;
                }}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div>Day</div>
            <div>Rostered Upto</div>
            <div>Details</div>
            <div>Length</div>
            <div>Action</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {selectedDays.map((dayData, index) => (
            <div key={index} className="grid gap-4 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800" style={{ gridTemplateColumns: '50px 100px 150px 1fr 100px 80px' }}>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={dayData.selected}
                  onChange={() => handleDayToggle(index)}
                  className="text-blue-600 focus:ring-blue-500"
                />
              </div>
              <div className="text-gray-900 dark:text-gray-100 font-medium">
                {dayData.day}
              </div>
              <div className="text-gray-700 dark:text-gray-300">
                {dayData.rosteredUpto}
              </div>
              <div className="text-gray-700 dark:text-gray-300">
                {event.title || 'Residential Cleaning'} (Shift ID) Tracey Lucas(S)
              </div>
              <div className="text-gray-700 dark:text-gray-300">
                {shiftLength}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                -
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex justify-end">
        <div className="flex gap-2">
          <button 
            className={`px-4 py-2 rounded text-sm font-medium ${
              !creationEnabled || !closeDate || isCreating
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            onClick={handleCreateRecurringShifts}
            disabled={!creationEnabled || !closeDate || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Recurring Shifts'}
          </button>
          <button 
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium"
            onClick={() => {
              setSelectedDays(prev => prev.map(day => ({ ...day, selected: false })));
              setCreationEnabled(false);
              setShowCloseDatePicker(false);
              setCloseDate('');
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RepeatTabContent;
