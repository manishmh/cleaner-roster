import React, { useEffect, useRef, useState } from "react";
import LocationModal from "./tab-content/shift-content/LocationModal";

const themeOptions = [
  { value: "Danger", label: "Danger" },
  { value: "Warning", label: "Warning" },
  { value: "Success", label: "Success" },
  { value: "Primary", label: "Primary" },
];

// Date/time/length picker constants from ShiftTabContent
const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"));
const lengthHours = Array.from({ length: 23 }, (_, i) => (i + 1).toString().padStart(2, "0"));



function generateId(prefix: string = "id"): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

import type { Staff, Team } from "@/lib/api";
import type { CalendarEvent } from "./Calendar";

interface CreateEventModalProps {
  onSubmit: (event: CalendarEvent) => void;
  onCancel: () => void;
  slotInfo: { startStr: string; endStr: string } | null;
  staff?: Staff[];
  teams?: Team[];
}

// Helper to get IST time
function getISTTime(): string {
  const now = new Date();
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const initialFormState = (slotInfo: { startStr: string; endStr: string } | null) => {
  const now = new Date();
  const defaultDate = slotInfo?.startStr ? new Date(slotInfo.startStr).toISOString().split('T')[0] : now.toISOString().split('T')[0];
  const defaultTime = getISTTime();
  const defaultLength = "01:00"; // 1 hour default
  
  return {
    assignmentType: "individual" as "individual" | "team",
    shiftName: "",
    shiftTheme: "Primary",
    selectedStaffId: "", // For individual assignment
    bookingDate: defaultDate,
    bookingTime: defaultTime,
    bookingLength: defaultLength,
    selectedTeams: [] as Team[],
    selectedSupervisors: [] as string[],
    selectedTeamMembers: [] as string[],
    selectedLocation: null as null | { 
      unit: string; 
      name: string; 
      accuracy: string; 
      comment?: string;
      address?: string;
      formattedAddress?: string;
    },
    includeLocation: false,
    isPublished: false,
    shiftInstructions: "",
  };
};

// Team Selection Modal Component
interface TeamSelectionModalProps {
  onClose: () => void;
  onSelect: (selectedTeams: Team[], supervisors: string[], teamMembers: string[]) => void;
  initialSelectedTeams?: Team[];
  initialSupervisors?: string[];
  initialTeamMembers?: string[];
  staff: Staff[];
  teams: Team[];
}

const TeamSelectionModal: React.FC<TeamSelectionModalProps> = ({ 
  onClose, 
  onSelect, 
  initialSelectedTeams = [],
  initialSupervisors = [],
  initialTeamMembers = [],
  staff,
  teams
}) => {
  const [selectedTeams, setSelectedTeams] = useState<Team[]>(initialSelectedTeams);
  const [selectedSupervisors, setSelectedSupervisors] = useState<string[]>(initialSupervisors);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>(initialTeamMembers);

  const handleTeamToggle = (team: Team) => {
    setSelectedTeams(prev => 
      prev.find(t => t.id === team.id)
        ? prev.filter(t => t.id !== team.id)
        : [...prev, team]
    );
  };

  const handleSupervisorToggle = (supervisorId: string) => {
    setSelectedSupervisors(prev => 
      prev.includes(supervisorId) 
        ? prev.filter(id => id !== supervisorId)
        : [...prev, supervisorId]
    );
  };

  const handleTeamMemberToggle = (memberId: string) => {
    setSelectedTeamMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSelect(selectedTeams, selectedSupervisors, selectedTeamMembers);
  };

  return (
    <div
      className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/30 bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 min-w-[600px] max-w-[800px] w-[90vw] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Select Team
          </h3>
          <button
            className="h-6 w-6 bg-gray-700 text-white rounded hover:bg-gray-600 flex items-center justify-center"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Selection Areas */}
          <div className="flex-1 grid grid-cols-3 gap-4 min-h-0 overflow-hidden">
            {/* Teams */}
            <div className="flex flex-col min-h-0">
              <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2 flex-shrink-0">
                Teams ({selectedTeams.length} selected)
              </h4>
              <div className="flex-1 border rounded p-3 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 overflow-y-auto min-h-0">
                {teams.map(team => (
                  <label key={team.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTeams.some(t => t.id === team.id)}
                      onChange={() => handleTeamToggle(team)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">{team.name}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Supervisors */}
            <div className="flex flex-col min-h-0">
              <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2 flex-shrink-0">
                Supervisors ({selectedSupervisors.length} selected)
              </h4>
              <div className="flex-1 border rounded p-3 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 overflow-y-auto min-h-0">
                {staff.filter(s => s.role.toLowerCase().includes('supervisor') || s.role.toLowerCase().includes('manager')).map(supervisor => (
                  <label key={supervisor.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSupervisors.includes(supervisor.id.toString())}
                      onChange={() => handleSupervisorToggle(supervisor.id.toString())}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">{supervisor.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Team Members */}
            <div className="flex flex-col min-h-0">
              <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2 flex-shrink-0">
                Staffs ({selectedTeamMembers.length} selected)
              </h4>
              <div className="flex-1 border rounded p-3 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 overflow-y-auto min-h-0">
                {staff.map(staffMember => (
                  <label key={staffMember.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTeamMembers.includes(staffMember.id.toString())}
                      onChange={() => handleTeamMemberToggle(staffMember.id.toString())}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-200">{staffMember.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end mt-4 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Select Team
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateEventModal: React.FC<CreateEventModalProps> = ({ 
  onSubmit, 
  onCancel, 
  slotInfo, 
  staff = [], 
  teams = [] 
}) => {
  const [form, setForm] = useState(() => initialFormState(slotInfo));
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);

  // Time and length picker states
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showLengthPicker, setShowLengthPicker] = useState(false);
  const [tempTimeHour, setTempTimeHour] = useState<string>(form.bookingTime.split(":")[0]);
  const [tempTimeMinute, setTempTimeMinute] = useState<string>(form.bookingTime.split(":")[1]);
  const [tempLengthHour, setTempLengthHour] = useState<string>(form.bookingLength.split(":")[0]);
  const [tempLengthMinute, setTempLengthMinute] = useState<string>(form.bookingLength.split(":")[1]);

  // Grid picker states
  const [showTimeHourGrid, setShowTimeHourGrid] = useState(false);
  const [showTimeMinuteGrid, setShowTimeMinuteGrid] = useState(false);
  const [showLengthHourGrid, setShowLengthHourGrid] = useState(false);
  const [showLengthMinuteGrid, setShowLengthMinuteGrid] = useState(false);

  // Refs for click outside detection
  const timePickerRef = useRef<HTMLDivElement>(null);
  const lengthPickerRef = useRef<HTMLDivElement>(null);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm(f => ({ ...f, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  // Time Picker Handlers
  const handleTimeBoxClick = () => setShowTimePicker(true);
  const handleTimeSelect = () => {
    const newTime = `${tempTimeHour}:${tempTimeMinute}`;
    setForm(f => ({ ...f, bookingTime: newTime }));
    setShowTimePicker(false);
  };
  const handleTimeClear = () => {
    setForm(f => ({ ...f, bookingTime: "" }));
    setTempTimeHour("00");
    setTempTimeMinute("00");
    setShowTimePicker(false);
  };

  // Length Picker Handlers
  const handleLengthBoxClick = () => setShowLengthPicker(true);
  const handleLengthSelect = () => {
    const newLength = `${tempLengthHour}:${tempLengthMinute}`;
    setForm(f => ({ ...f, bookingLength: newLength }));
    setShowLengthPicker(false);
  };
  const handleLengthClear = () => {
    setForm(f => ({ ...f, bookingLength: "" }));
    setTempLengthHour("01");
    setTempLengthMinute("00");
    setShowLengthPicker(false);
  };

  // Helper to render a grid
  const renderGrid = (options: string[], onSelect: (v: string) => void, selected: string) => (
    <div className="grid grid-cols-6 gap-1 p-2 bg-white dark:bg-gray-900 border rounded shadow z-30 absolute bottom-full mb-1 md:bottom-auto md:top-full md:mt-1">
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

  // Handle location modal
  const handleLocationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLocationModal(true);
  };
  const handleCloseLocationModal = () => setShowLocationModal(false);
  const handleLocationSelect = (location: { unit: string; name: string; accuracy: string; comment?: string; address?: string; formattedAddress?: string }) => {
    setForm(f => ({ ...f, selectedLocation: location }));
    setShowLocationModal(false);
  };

  // Handle team selection
  const handleTeamSelect = (selectedTeams: Team[], supervisors: string[], teamMembers: string[]) => {
    setForm(f => ({ 
      ...f, 
      selectedTeams: selectedTeams,
      selectedSupervisors: supervisors,
      selectedTeamMembers: teamMembers
    }));
    setShowTeamModal(false);
  };

  // Calculate end time based on start time and length
  const calculateEndTime = (date: string, time: string, length: string): string => {
    if (!date || !time || !length) return "";
    
    const [lengthHours, lengthMinutes] = length.split(':').map(Number);
    // Ensure time has seconds for proper parsing
    const timeWithSeconds = time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time;
    const startDateTime = new Date(`${date}T${timeWithSeconds}`);
    const endDateTime = new Date(startDateTime.getTime() + (lengthHours * 60 + lengthMinutes) * 60 * 1000);
    
    return endDateTime.toISOString();
  };

  // On submit, build event object
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate IDs
    const eventId = generateId("event");
    const newClientId: string | null = null;
    const newClientObj = null;
    const clientIds: string[] = [];
    let staffIds: string[] = [];
    let teamIds: string[] = [];

    if (form.assignmentType === "individual") {
      // For individual assignment, add selected staff to staffIds
      if (form.selectedStaffId) {
        staffIds = [form.selectedStaffId];
      }
    } else if (form.assignmentType === "team") {
      // Handle team assignment - use actual team IDs
      if (form.selectedTeams.length > 0) {
        // Use the actual team IDs from selected teams
        teamIds = form.selectedTeams.map(team => team.id.toString());
        // Add supervisors and team members as staff
        staffIds = [...form.selectedSupervisors, ...form.selectedTeamMembers];
      }
    }

    // Calculate start and end times
    const startDateTime = new Date(`${form.bookingDate}T${form.bookingTime}:00`);
    const startTime = startDateTime.toISOString();
    const endTime = calculateEndTime(form.bookingDate, form.bookingTime, form.bookingLength);
    
    // Build event object
    const newEvent: CalendarEvent = {
      id: eventId,
      title: form.shiftName,
      start: startTime,
      end: endTime,
      extendedProps: {
        theme: form.shiftTheme,
        clientIds: clientIds,
        staffIds: staffIds,
        teamIds: teamIds,
        newClientDetails: newClientId ? newClientObj : null,
        location: form.selectedLocation,
        includeLocation: form.includeLocation,
        isPublished: form.isPublished,
        shiftInstructions: form.shiftInstructions,
        assignmentType: form.assignmentType,
        supervisorIds: form.assignmentType === 'team' ? form.selectedSupervisors : [],
        teamMemberIds: form.assignmentType === 'team' ? form.selectedTeamMembers : staffIds,
      },
    };
    onSubmit(newEvent);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-md mx-4 ">
      <div className="overflow-y-auto flex-1 pr-2 text-sm">
        <form className="w-full mx-auto space-y-6 p-6 md:p-8" onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold mb-8 text-gray-900 dark:text-gray-100">Create New Shift - Cleaning</h2>
          
          {/* Assignment Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-200">Assignment Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, assignmentType: "individual" }))}
                className={`px-4 py-2 rounded border ${
                  form.assignmentType === "individual"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                Individual
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, assignmentType: "team" }))}
                className={`px-4 py-2 rounded border ${
                  form.assignmentType === "team"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                Team
              </button>
            </div>
          </div>

          {/* Individual Assignment Fields */}
          {form.assignmentType === "individual" && (
            <>
              {/* Event/Shift Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Shift Name</label>
                  <input
                    type="text"
                    name="shiftName"
                    className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    value={form.shiftName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Theme</label>
                  <select
                    name="shiftTheme"
                    className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    value={form.shiftTheme}
                    onChange={handleChange}
                    required
                  >
                    {themeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Staff Selection */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Select Staff</label>
                <select
                  name="selectedStaffId"
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  value={form.selectedStaffId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a staff member...</option>
                  {staff.map(staffMember => (
                    <option key={staffMember.id} value={staffMember.id}>{staffMember.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Team Selection (only show when team is selected) */}
          {form.assignmentType === "team" && (
            <>
              {/* Event/Shift Details for Team */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Shift Name</label>
                  <input
                    type="text"
                    name="shiftName"
                    className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    value={form.shiftName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Theme</label>
                  <select
                    name="shiftTheme"
                    className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                    value={form.shiftTheme}
                    onChange={handleChange}
                    required
                  >
                    {themeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Team Selection</label>
                <button
                  type="button"
                  onClick={() => setShowTeamModal(true)}
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-400 focus:outline-none text-left"
                >
                  {form.selectedTeams.length > 0 ? (
                    <div>
                      <div className="font-medium">
                        {form.selectedTeams.map(team => team.name).join(', ')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {form.selectedSupervisors.length} supervisors, {form.selectedTeamMembers.length} team members
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">Select team...</span>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Date / Time / Length Fields (from ShiftTabContent) */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Booking Date:</label>
              <input
                type="date"
                name="bookingDate"
                className="border rounded px-3 py-1 text-sm w-full md:w-40 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
                value={form.bookingDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="relative flex-1 min-w-0" ref={timePickerRef}>
              <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Time:</label>
              <button
                type="button"
                className="border rounded px-3 py-1 text-sm w-full md:w-40 text-left bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                onClick={handleTimeBoxClick}
              >
                {form.bookingTime ? form.bookingTime : <span className="text-gray-400 dark:text-gray-500">Select time</span>}
              </button>
              {showTimePicker && (
                <div className="absolute z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 pb-3 rounded shadow-lg mt-1 w-full md:w-56 left-0 md:left-auto" onClick={e => e.stopPropagation()}>
                  <div className="relative">
                    <div className="flex gap-2 items-center p-3 pb-0 justify-center">
                      <button
                        type="button"
                        className="border rounded px-3 py-1 w-14 text-center text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        onClick={() => {
                          setShowTimeHourGrid(v => !v);
                          setShowTimeMinuteGrid(false);
                        }}
                      >
                        {tempTimeHour}
                      </button>
                      <span>:</span>
                      <button
                        type="button"
                        className="border rounded px-2 py-1 w-14 text-center text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        onClick={() => {
                          setShowTimeMinuteGrid(v => !v);
                          setShowTimeHourGrid(false);
                        }}
                      >
                        {tempTimeMinute}
                      </button>
                    </div>
                    {showTimeHourGrid && renderGrid(hours, h => { setTempTimeHour(h); setShowTimeHourGrid(false); }, tempTimeHour)}
                    {showTimeMinuteGrid && renderGrid(minutes, m => { setTempTimeMinute(m); setShowTimeMinuteGrid(false); }, tempTimeMinute)}
                  </div>
                  <div className="flex gap-2 mt-2 px-3 justify-center">
                    <button type="button" className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600 text-xs" onClick={handleTimeSelect}>Set</button>
                    <button type="button" className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-xs" onClick={handleTimeClear}>Clear</button>
                  </div>
                </div>
              )}
            </div>
            <div className="relative flex-1 min-w-0" ref={lengthPickerRef}>
              <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Hours:</label>
              <button
                type="button"
                className="border rounded px-3 py-1 text-sm w-full md:w-40 text-left bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                onClick={handleLengthBoxClick}
              >
                {form.bookingLength ? `${form.bookingLength} hr` : <span className="text-gray-400 dark:text-gray-500">Select length</span>}
              </button>
              {showLengthPicker && (
                <div className="absolute z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg mt-1 pb-3 w-full md:w-56 left-0 md:left-auto" onClick={e => e.stopPropagation()}>
                  <div className="relative">
                    <div className="flex gap-2 items-center p-3 pb-0 justify-center">
                      <button
                        type="button"
                        className="border rounded px-2 py-1 w-14 text-center text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        onClick={() => {
                          setShowLengthHourGrid(v => !v);
                          setShowLengthMinuteGrid(false);
                        }}
                      >
                        {tempLengthHour}
                      </button>
                      <span className="text-xs">hr</span>
                      <button
                        type="button"
                        className="border rounded px-2 py-1 w-14 text-center text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                        onClick={() => {
                          setShowLengthMinuteGrid(v => !v);
                          setShowLengthHourGrid(false);
                        }}
                      >
                        {tempLengthMinute}
                      </button>
                      <span className="text-xs">min</span>
                    </div>
                  </div>
                  {showLengthHourGrid && renderGrid(lengthHours, h => { setTempLengthHour(h); setShowLengthHourGrid(false); }, tempLengthHour)}
                  {showLengthMinuteGrid && renderGrid(minutes, m => { setTempLengthMinute(m); setShowLengthMinuteGrid(false); }, tempLengthMinute)}
                  <div className="flex gap-2 mt-2 px-3 justify-center">
                    <button type="button" className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600 text-xs" onClick={handleLengthSelect}>Set</button>
                    <button type="button" className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 text-xs" onClick={handleLengthClear}>Clear</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location Details */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Location</label>
            <button
              type="button"
              className="flex items-center gap-2 text-sm px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-100 w-full sm:w-auto"
              onClick={handleLocationClick}
            >
              <span role="img" aria-label="location">📍</span> Select Location
            </button>
                          {form.selectedLocation && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Selected Location:
                  </div>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                    <div><strong>Unit:</strong> {form.selectedLocation.unit}</div>
                    <div><strong>Address:</strong> {form.selectedLocation.formattedAddress || form.selectedLocation.address || form.selectedLocation.name}</div>
                    <div><strong>Accuracy:</strong> {form.selectedLocation.accuracy}%</div>
                    {form.selectedLocation.comment && (
                      <div><strong>Comment:</strong> {form.selectedLocation.comment}</div>
                    )}
                  </div>
                </div>
              )}
          </div>
          
          {/* Additional Options */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                name="includeLocation"
                checked={form.includeLocation}
                onChange={handleChange}
              />
              Include Location Details
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                name="isPublished"
                checked={form.isPublished}
                onChange={handleChange}
              />
              Publish Event
            </label>
          </div>
          
          {/* Shift Instructions */}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Shift Instructions</label>
            <textarea
              name="shiftInstructions"
              className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              value={form.shiftInstructions}
              onChange={handleChange}
            />
          </div>
          
          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <button type="button" className="px-4 py-2 rounded border bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600" onClick={onCancel}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Create Event</button>
          </div>
        </form>
      </div>
      {showLocationModal && (
        <LocationModal
          handleCloseLocationModal={handleCloseLocationModal}
          onSelect={handleLocationSelect}
        />
      )}
      
      {showTeamModal && (
          <TeamSelectionModal
            onClose={() => setShowTeamModal(false)}
            onSelect={handleTeamSelect}
            initialSelectedTeams={form.selectedTeams}
            initialSupervisors={form.selectedSupervisors}
            initialTeamMembers={form.selectedTeamMembers}
            staff={staff}
            teams={teams}
          />
        )}
    </div>
  );
};

export default CreateEventModal; 
