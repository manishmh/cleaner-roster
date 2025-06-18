import TeamDetailsModal from "@/components/calendar/TeamDetailsModal";
import { type Client, type Location, type Shift, type ShiftTeamWrapper, type Staff, type Team, locationApi, shiftApi } from "@/lib/api";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CalendarEvent } from "../../Calendar";
import { useCalendarClient } from "../../CalendarClientContext";
import LocationModal from "./LocationModal";

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"));
const lengthHours = Array.from({ length: 23 }, (_, i) => (i + 1).toString().padStart(2, "0"));

interface ShiftTabContentProps {
  event: CalendarEvent;
  onUpdate: (updatedEvent: CalendarEvent) => void;
  shiftData?: Shift | null;
  allStaff?: Staff[];
  allClients?: Client[];
  allLocations?: Location[];
  allTeams?: Team[];
  updateShift?: (shiftData: Partial<Shift>) => Promise<void>;
}

function parseEventDate(date: string | number | Date | undefined): Date {
  if (!date) return new Date();
  if (typeof date === 'string' || typeof date === 'number') return new Date(date);
  return date;
}



const ShiftTabContent: React.FC<ShiftTabContentProps> = ({ 
  event, 
  onUpdate, 
  shiftData, 
  allStaff = [], 
  allClients = [], 
  allLocations = [], // eslint-disable-line @typescript-eslint/no-unused-vars
  allTeams = [], 
  updateShift // eslint-disable-line @typescript-eslint/no-unused-vars
}) => {
  // Pre-fill from event data
  function getValidDate(val: unknown): string | number | Date | undefined {
    if (Array.isArray(val)) return undefined;
    return val as string | number | Date | undefined;
  }

  const { clientList } = useCalendarClient();

  // Use real staff data from backend
  const supervisorList = allStaff.filter(staff => 
    staff.role.toLowerCase().includes('supervisor') || 
    staff.role.toLowerCase().includes('manager')
  );

  const staffList = allStaff;

  // Get team members from shift data with roles
  const getTeamMembers = () => {
    if (shiftData?.staff) {
      return shiftData.staff.map(staffMember => ({
        id: staffMember.id,
        name: staffMember.name,
        role: staffMember.roleInShift === 'supervisor' ? 'Supervisor' : 'Staff',
        isSupervisor: staffMember.roleInShift === 'supervisor'
      }));
    }
    
    // Fallback to event data if shift data not available
    const supervisors = event.extendedProps.staffIds || [];
    const teamMembers = event.extendedProps.teamIds || [];
    
    const supervisorNames = supervisors.map(id => {
      const supervisor = supervisorList.find(s => s.id.toString() === id);
      return supervisor ? { 
        id: supervisor.id,
        name: supervisor.name, 
        role: 'Supervisor' as const,
        isSupervisor: true
      } : null;
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    const teamMemberNames = teamMembers.map(id => {
      const member = staffList.find(s => s.id.toString() === id);
      return member ? { 
        id: member.id,
        name: member.name, 
        role: 'Staff' as const,
        isSupervisor: false
      } : null;
    }).filter((item): item is NonNullable<typeof item> => item !== null);

    return [...supervisorNames, ...teamMemberNames];
  };

  // Get teams data
  const getTeamsData = (): Team[] => {
    if (shiftData?.teams && shiftData.teams.length > 0) {
      // Handle the wrapped team structure from backend
      const teams = shiftData.teams.map((teamWrapper: ShiftTeamWrapper | Team) => {
        // Check if it's the wrapped structure with shift_teams and teams
        if ('teams' in teamWrapper) {
          return {
            id: teamWrapper.teams.id,
            name: teamWrapper.teams.name,
            description: teamWrapper.teams.description,
            createdAt: teamWrapper.teams.createdAt,
            updatedAt: teamWrapper.teams.updatedAt,
          } as Team;
        }
        // If it's already a plain team object
        return teamWrapper as Team;
      });
      console.log('Processed teams:', teams);
      return teams;
    }
    
    // Fallback to event data
    if (event.extendedProps.teamIds && event.extendedProps.teamIds.length > 0) {
      const teams = event.extendedProps.teamIds.map(teamId => {
        const team = allTeams.find(t => t.id.toString() === teamId);
        return team;
      }).filter((team): team is Team => team !== undefined);
      console.log('Fallback teams from event:', teams);
      return teams;
    }
    console.log('No teams found');
    return [];
  };

  // Get client name from shift data
  const getClientName = () => {
    if (shiftData?.clients && shiftData.clients.length > 0) {
      return shiftData.clients[0].name;
    }
    
    // Fallback to event data
    if (event.extendedProps.clientIds && event.extendedProps.clientIds.length > 0) {
      const clientId = event.extendedProps.clientIds[0];
      const client = allClients.find(c => c.id.toString() === clientId) || 
                    clientList.find(c => c.id.toString() === clientId);
      return client ? client.name : "Client";
    }
    return "Client";
  };

  // Get location data
  const getLocationData = () => {
    console.log('Getting location data...');
    console.log('shiftData:', shiftData);
    console.log('event.extendedProps.location:', event.extendedProps.location);
    
    if (shiftData?.locations && shiftData.locations.length > 0) {
      console.log('Using shift data locations:', shiftData.locations);
      const locationWrapper = shiftData.locations[0];
      
      // Check if it's the wrapped structure
      if ('locations' in locationWrapper) {
        return {
          unit: locationWrapper.locations.unit,
          name: locationWrapper.locations.name,
          accuracy: locationWrapper.locations.accuracy.toString(),
          comment: locationWrapper.locations.comment,
          address: locationWrapper.locations.address,
          formattedAddress: locationWrapper.locations.formattedAddress,
        };
      }
      
      // If it's already a plain location object
      const location = locationWrapper as Location;
      return {
        unit: location.unit,
        name: location.name,
        accuracy: location.accuracy.toString(),
        comment: location.comment,
        address: location.address,
        formattedAddress: location.formattedAddress,
      };
    }
    
    // Fallback to event data
    if (event.extendedProps.location) {
      console.log('Using event location:', event.extendedProps.location);
      return event.extendedProps.location;
    }
    console.log('No location found');
    return null;
  };

  const teamMembers = getTeamMembers();
  const initialTeamsData = getTeamsData();
  const isTeamAssignment = event.extendedProps.assignmentType === 'team';
  const clientName = getClientName();
  const locationData = getLocationData();

  // State for teams data to allow real-time updates
  const [teamsData, setTeamsData] = useState<Team[]>(initialTeamsData);

  // Update teams data when shift data changes
  useEffect(() => {
    setTeamsData(getTeamsData());
  }, [shiftData?.teams, event.extendedProps.teamIds]);

  const eventStart = parseEventDate(getValidDate(event.start));
  const eventEnd = parseEventDate(getValidDate(event.end));
  const today = eventStart.toISOString().split('T')[0];
  const timeNow = eventStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const length = (() => {
    const diff = (eventEnd.getTime() - eventStart.getTime()) / 1000;
    const h = Math.floor(diff / 3600).toString().padStart(2, "0");
    const m = Math.floor((diff % 3600) / 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  })();

  const [date, setDate] = useState(today);
  const [time, setTime] = useState(timeNow);
  const [lengthState, setLengthState] = useState(length);
  const [selectedLocation, setSelectedLocation] = useState<{
    unit: string;
    name: string;
    accuracy: string;
    comment?: string;
    address?: string;
    formattedAddress?: string;
  } | null>(locationData);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showLengthPicker, setShowLengthPicker] = useState(false);
  const [tempTimeHour, setTempTimeHour] = useState<string>(time.split(":")[0]);
  const [tempTimeMinute, setTempTimeMinute] = useState<string>(time.split(":")[1]);
  const [tempLengthHour, setTempLengthHour] = useState<string>(length.split(":")[0]);
  const [tempLengthMinute, setTempLengthMinute] = useState<string>(length.split(":")[1]);

  // Separate refs for each picker
  const timePickerRef = useRef<HTMLDivElement>(null);
  const lengthPickerRef = useRef<HTMLDivElement>(null);

  // New state for grid pickers
  const [showTimeHourGrid, setShowTimeHourGrid] = useState(false);
  const [showTimeMinuteGrid, setShowTimeMinuteGrid] = useState(false);
  const [showLengthHourGrid, setShowLengthHourGrid] = useState(false);
  const [showLengthMinuteGrid, setShowLengthMinuteGrid] = useState(false);

  // Update event when date/time/length changes
  const updateEventDateTime = async (newDate: string, newTime: string, newLength: string) => {
    if (!newDate || !newTime || !newLength) return;
    
    try {
      const [lengthHours, lengthMinutes] = newLength.split(':').map(Number);
      const startDateTime = new Date(`${newDate}T${newTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + (lengthHours * 60 + lengthMinutes) * 60 * 1000);
      
      // Update the event locally first
      onUpdate({
        ...event,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
      });

      // Update in backend if we have shift data
      if (shiftData?.id) {
        await shiftApi.update(shiftData.id, {
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        });
        toast.success("Shift time updated successfully!");
      }
    } catch (error) {
      console.error('Error updating shift time:', error);
      toast.error("Failed to update shift time");
    }
  };

  // Location modal handlers
  const handleLocationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowLocationModal(true);
  };
  const handleCloseLocationModal = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setShowLocationModal(false);
  };

  const handleLocationSelect = async (location: { 
    unit: string; 
    name: string; 
    accuracy: string; 
    comment?: string;
    address?: string;
    formattedAddress?: string;
  }) => {
    try {
      // First, try to find the location in the database by unit and name
      const locationsResponse = await locationApi.getAll();
      let locationId: number | null = null;
      
      if (locationsResponse.success && locationsResponse.data) {
        const existingLocation = locationsResponse.data.data.find(
          loc => loc.unit === location.unit && loc.name === location.name
        );
        locationId = existingLocation?.id || null;
      }

      // If location not found in database, create it
      if (!locationId) {
        const createResponse = await locationApi.create({
          unit: location.unit,
          name: location.name,
          accuracy: parseInt(location.accuracy),
          comment: location.comment,
        });
        
        if (createResponse.success && createResponse.data) {
          locationId = createResponse.data.data.id;
        }
      }

      if (locationId && shiftData?.id) {
        // Update shift location in backend
        await shiftApi.updateLocation(shiftData.id, locationId);
        toast.success("Location updated successfully!");
      }

      // Update local state
      setSelectedLocation(location);
      setShowLocationModal(false);
      
      // Update the event with the new location
      onUpdate({
        ...event,
        extendedProps: {
          ...event.extendedProps,
          location: location,
        },
      });
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error("Failed to update location");
    }
  };

  // Team modal handlers
  const handleViewTeams = () => {
    setShowTeamModal(true);
  };

  const handleRemoveTeam = async (teamId: number) => {
    try {
      if (shiftData?.id) {
        // Remove team from shift via API
        await shiftApi.removeTeam(shiftData.id, teamId);
        
        // Update the event to remove the team from the UI
        const updatedTeamIds = event.extendedProps.teamIds?.filter(id => id !== teamId.toString()) || [];
        onUpdate({
          ...event,
          extendedProps: {
            ...event.extendedProps,
            teamIds: updatedTeamIds,
          },
        });
        
        // Update local teams data immediately for real-time UI update
        setTeamsData(prevTeams => prevTeams.filter(team => team.id !== teamId));
        
        toast.success("Team removed successfully!");
        // Don't close the modal - keep it open to show updated team list
      }
    } catch (error) {
      console.error('Error removing team:', error);
      toast.error("Failed to remove team");
    }
  };

  // Time Picker Handlers
  const handleTimeBoxClick = () => setShowTimePicker(true);
  const handleTimeSelect = () => {
    const newTime = `${tempTimeHour}:${tempTimeMinute}`;
    setTime(newTime);
    setShowTimePicker(false);
    updateEventDateTime(date, newTime, lengthState);
  };
  const handleTimeClear = () => {
    setTime("");
    setTempTimeHour("00");
    setTempTimeMinute("00");
    setShowTimePicker(false);
  };

  // Length Picker Handlers
  const handleLengthBoxClick = () => setShowLengthPicker(true);
  const handleLengthSelect = () => {
    const newLength = `${tempLengthHour}:${tempLengthMinute}`;
    setLengthState(newLength);
    setShowLengthPicker(false);
    updateEventDateTime(date, time, newLength);
  };
  const handleLengthClear = () => {
    setLengthState("");
    setTempLengthHour("01");
    setTempLengthMinute("00");
    setShowLengthPicker(false);
  };

  // Date change handler
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    updateEventDateTime(newDate, time, lengthState);
  };

  // Helper to render a grid
  const renderGrid = (options: string[], onSelect: (v: string) => void, selected: string) => (
    <div className="grid grid-cols-6 gap-1 p-2 bg-white dark:bg-gray-900 border rounded shadow z-30 absolute bottom-full mb-1 md:mt-1">
      {options.map(opt => (
        <button
          key={opt}
          className={`px-1 py-1 rounded text-xs ${selected === opt ? "bg-blue-500 text-white" : "hover:bg-blue-100 dark:hover:bg-gray-800"}`}
          onClick={() => onSelect(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );

  // Click outside to close pickers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        showTimePicker &&
        timePickerRef.current &&
        !timePickerRef.current.contains(event.target as Node)
      ) {
        setShowTimePicker(false);
      }
      if (
        showLengthPicker &&
        lengthPickerRef.current &&
        !lengthPickerRef.current.contains(event.target as Node)
      ) {
        setShowLengthPicker(false);
      }
    }
    if (showTimePicker || showLengthPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTimePicker, showLengthPicker]);

  // Update state if event changes
  useEffect(() => {
    setDate(eventStart.toISOString().split('T')[0]);
    setTime(eventStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    setLengthState(length);
    setSelectedLocation(getLocationData());
  }, [event, shiftData]);

  // Update location when shift data changes (for immediate updates after creation)
  useEffect(() => {
    const newLocationData = getLocationData();
    setSelectedLocation(newLocationData);
  }, [shiftData?.locations]);

  // Separate supervisors and team members
  const supervisors = teamMembers.filter(member => member.isSupervisor);
  const regularMembers = teamMembers.filter(member => !member.isSupervisor);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Note Section */}
      <div className="mb-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2 dark:text-blue-200 dark:bg-gray-800 dark:border-gray-700">
        <strong>Note:</strong> Any change in this section will only affect the selected shift. Try Repeat for group change.
      </div>

      {/* Team/Assignment Display */}
      {isTeamAssignment && (teamMembers.length > 0 || teamsData.length > 0) && (
        <div className="border rounded-lg p-3 md:p-4 bg-white shadow-sm mb-2 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
            <div className="font-semibold text-gray-700 dark:text-gray-100 text-sm md:text-base">
              {clientName} - Team Assignment
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleViewTeams}
                className="px-2 py-1 rounded bg-green-500 text-white text-xs font-medium hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-600"
              >
                ViewTeams
              </button>
            </div>
          </div>

          {/* Teams Display */}
          {teamsData.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Teams:</h4>
              <div className="flex flex-wrap gap-1">
                {teamsData.map((team, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                    {team.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Staff Display - Supervisors First, Then Team Members */}
          {teamMembers.length > 0 && (
            <div className="space-y-2">
              {/* Supervisors */}
              {supervisors.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Supervisors ({supervisors.length}):
                  </h4>
                  <div className="space-y-1">
                    {supervisors.map((member, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pl-2">
                        <div className="text-gray-800 dark:text-gray-100 text-sm">{member.name}</div>
                        <div className="text-orange-600 dark:text-orange-400 text-xs font-medium bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded">
                          {member.role}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Members */}
              {regularMembers.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Team Members ({regularMembers.length}):
                  </h4>
                  <div className="space-y-1">
                    {regularMembers.map((member, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pl-2">
                        <div className="text-gray-800 dark:text-gray-100 text-sm">{member.name}</div>
                        <div className="text-green-600 dark:text-green-400 text-xs font-medium bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                          {member.role}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Individual Assignment Display */}
      {!isTeamAssignment && teamMembers.length > 0 && (
        <div className="border rounded-lg p-3 md:p-4 bg-white shadow-sm mb-2 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
            <div className="font-semibold text-gray-700 dark:text-gray-100 text-sm md:text-base">
              {clientName} - Individual Assignment
            </div>
          </div>
          <div className="space-y-1">
            {teamMembers.map((member, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div className="text-gray-800 dark:text-gray-100 text-sm md:text-base">{member.name}</div>
                <div className="text-gray-500 dark:text-gray-400 text-xs font-medium">{member.role}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date / Time / Length Fields */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-2">
        <div className="flex-1 min-w-0">
          <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Date:</label>
          <input
            type="date"
            className="border rounded px-3 py-1 text-sm w-full md:w-40 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            value={date}
            onChange={handleDateChange}
          />
        </div>
        <div className="relative flex-1 min-w-0" ref={timePickerRef}>
          <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Time:</label>
          <button
            type="button"
            className="border rounded px-3 py-1 text-sm w-full md:w-40 text-left bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            onClick={handleTimeBoxClick}
          >
            {time ? time : <span className="text-gray-400 dark:text-gray-500">Select time</span>}
          </button>
          {showTimePicker && (
            <div className="absolute z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 pb-3 rounded shadow-lg mt-1 w-full md:w-56 left-0 md:left-auto" onClick={e => e.stopPropagation()}>
              <div className="relative">
                <div className="flex gap-2 items-center p-3 pb-0 ">
                  <button
                    className="border rounded px-3 py-1 w-14 text-center text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    onClick={() => {
                      setShowTimeHourGrid(v => !v);
                      setShowTimeMinuteGrid(false);
                    }}
                  >
                    {tempTimeHour}
                  </button>
                  hr
                  <span>:</span>
                  <button
                    className="border rounded px-2 py-1 w-14 text-center text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    onClick={() => {
                      setShowTimeMinuteGrid(v => !v);
                      setShowTimeHourGrid(false);
                    }}
                  >
                    {tempTimeMinute}
                  </button>
                  min
                </div>
                {showTimeHourGrid && renderGrid(hours, h => { setTempTimeHour(h); setShowTimeHourGrid(false); }, tempTimeHour)}
                {showTimeMinuteGrid && renderGrid(minutes, m => { setTempTimeMinute(m); setShowTimeMinuteGrid(false); }, tempTimeMinute)}
              </div>
              <div className="flex gap-2 mt-2 px-3 ">
                <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600 text-xs" onClick={handleTimeSelect}>Set</button>
                <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-xs" onClick={handleTimeClear}>Clear</button>
              </div>
            </div>
          )}
        </div>
        <div className="relative flex-1 min-w-0" ref={lengthPickerRef}>
          <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Length:</label>
          <button
            type="button"
            className="border rounded px-3 py-1 text-sm w-full md:w-40 text-left bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            onClick={handleLengthBoxClick}
          >
            {lengthState ? `${lengthState} hr` : <span className="text-gray-400 dark:text-gray-500">Select length</span>}
          </button>
          {showLengthPicker && (
            <div className="absolute z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg mt-1 pb-3 w-full md:w-56 left-0 md:left-auto" onClick={e => e.stopPropagation()}>
              <div className="relative">
                <div className="flex gap-2 items-center p-3 pb-0">
                  <button
                    className="border rounded px-2 py-1 w-14 text-center text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    onClick={() => {
                      setShowLengthHourGrid(v => !v);
                      setShowLengthMinuteGrid(false);
                    }}
                  >
                    {tempLengthHour}
                  </button>
                  <span className="">hr</span>
                  <button
                    className="border rounded px-2 py-1 w-14 text-center text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    onClick={() => {
                      setShowLengthMinuteGrid(v => !v);
                      setShowLengthHourGrid(false);
                    }}
                  >
                    {tempLengthMinute}
                  </button>
                  <span className="">min</span>
                </div>
              </div>
              {showLengthHourGrid && renderGrid(lengthHours, h => { setTempLengthHour(h); setShowLengthHourGrid(false); }, tempLengthHour)}
              {showLengthMinuteGrid && renderGrid(minutes, m => { setTempLengthMinute(m); setShowLengthMinuteGrid(false); }, tempLengthMinute)}
              <div className="flex gap-2 mt-2 px-3">
                <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600 text-xs" onClick={handleLengthSelect}>Set</button>
                <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-xs" onClick={handleLengthClear}>Clear</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location Button */}
      <div className="mb-2">
        <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Location:</label>
        <button
          type="button"
          className="flex items-center gap-2 text-sm px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 w-full sm:w-auto"
          onClick={handleLocationClick}
        >
          <span role="img" aria-label="location">📍</span> Select Location
        </button>
        
        {/* Current Location Display */}
        {selectedLocation && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Current Location:
            </div>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
              <div><strong>Unit:</strong> {selectedLocation.unit}</div>
              <div><strong>Address:</strong> {selectedLocation.formattedAddress || selectedLocation.address || selectedLocation.name}</div>
              <div><strong>Accuracy:</strong> {selectedLocation.accuracy}%</div>
              {selectedLocation.comment && (
                <div><strong>Comment:</strong> {selectedLocation.comment}</div>
              )}
            </div>
          </div>
        )}
        
        {showLocationModal && (
          <LocationModal 
            handleCloseLocationModal={handleCloseLocationModal} 
            onSelect={handleLocationSelect}
          />
        )}
      </div>

      {/* Team Details Modal */}
      {showTeamModal && (
        <TeamDetailsModal 
          teams={teamsData}
          onClose={() => setShowTeamModal(false)}
          onRemoveTeam={handleRemoveTeam}
        />
      )}
    </div>
  );
};

export default ShiftTabContent;
