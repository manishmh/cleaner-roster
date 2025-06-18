"use client";
import { useCalendarFilter } from "@/components/calendar/CalendarFilterContext";
import { Modal } from "@/components/ui/modal";
import { useStaff } from "@/context/StaffContext";
import { useCalendarEvents } from "@/hooks/useCalendarData";
import { useModal } from "@/hooks/useModal";
import { locationApi } from "@/lib/api";
import {
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventHoveringArg,
  EventInput,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import CreateEventModal from "./CreateEventModal";
import TabbedSidebarLayout from "./TabbedSidebarLayout";

export interface CalendarEvent extends EventInput {
  extendedProps: {
    calendarType?: string;
    clientIds: string[];
    staffIds: string[];
    teamIds: string[];
    theme?: string;
    assignedUserId?: string;
    newClientDetails?: {
      id: string;
      name: string;
      mobile: string;
      email: string;
      company: string;
      abn: string;
      acn: string;
      clientInstruction: string;
      clientInfo: string;
      propertyInfo: string;
    } | null;
    location?: { unit: string; name: string; accuracy: string; comment?: string; address?: string; formattedAddress?: string } | null;
    includeLocation?: boolean;
    isPublished?: boolean;
    shiftInstructions?: string;
    instructionType?: 'ok' | 'yes/no' | 'text';
    instructions?: Array<{
      id: string;
      text: string;
      type: 'ok' | 'yes/no' | 'text';
      createdAt: Date;
    }>;
    jobStarted?: boolean;
    jobStartedAt?: string;
    jobPaused?: boolean;
    jobEndedAt?: string;
    messages?: Array<{
      id: string;
      message: string;
      createdBy: string;
      createdAt: Date;
    }>;
    assignmentType?: 'individual' | 'team';
    supervisorIds?: string[];
    teamMemberIds?: string[];
  };
}

const Calendar: React.FC = () => {
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const { filterCategory, filterChecked } = useCalendarFilter();
  const { 
    events, 
    loading, 
    error, 
    refetch,
    loadDateRange,
    createShift, 
    updateShift, 
    deleteShift,
    cancelShift,
    clients,
    teams 
  } = useCalendarEvents();
  
  const { staff } = useStaff();

  const router = useRouter();
  const searchParams = useSearchParams();

  const [modalType, setModalType] = useState<'create' | 'view' | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ startStr: string; endStr: string } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);


  // Handle calendar date range changes (when user navigates)
  const handleDatesSet = useCallback((dateInfo: DatesSetArg) => {
    const { start, end, view } = dateInfo;
    console.log(`Calendar view changed: ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]} (${view.type})`);
    
    // For month view, use exact dates to only load that month's data
    // For week/day views, allow buffer for smooth navigation
    const isMonthView = view.type === 'dayGridMonth';
    const options = isMonthView ? { exact: true } : undefined;
    
    // Load data for the new visible range
    loadDateRange(start, end, options);
  }, [loadDateRange]);

  // --- URL Modal Sync Logic ---
  // Open modal if URL has modal param
  useEffect(() => {
    const modalParam = searchParams!.get('modal');
    const idParam = searchParams!.get('id');
    if (modalParam === 'create' && !isOpen) {
      setModalType('create');
      setSelectedSlot(null);
      openModal();
    } else if (modalParam === 'view' && idParam && !isOpen) {
      // Find the event by id
      const event = events.find(e => String(e.id) === String(idParam));
      if (event) {
        setModalType('view');
        setSelectedEvent(event as CalendarEvent);
        setSelectedSlot(null);
        openModal();
      }
    }
    // If no modal param and modal is open, close it
    if (!modalParam && isOpen) {
      closeModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, events]);

  // Helper to update URL params
  const setModalUrl = (type: 'create' | 'view', eventId?: string) => {
    const params = new URLSearchParams(searchParams!.toString());
    params.set('modal', type);
    if (type === 'view' && eventId) {
      params.set('id', eventId);
    } else {
      params.delete('id');
    }
    router.replace(`?${params.toString()}`);
  };
  const clearModalUrl = () => {
    const params = new URLSearchParams(searchParams!.toString());
    params.delete('modal');
    params.delete('id');
    router.replace(`?${params.toString()}`);
  };

  // Event class names for theme styling - let FullCalendar handle sizing
  const getEventClassNames = (eventInfo: EventContentArg) => {
    const theme = eventInfo.event.extendedProps.theme || "Primary";
    return [`event-fc-color`, `fc-bg-${theme.toLowerCase()}`];
  };

  // Custom event content renderer to show only the title (no time)
  const renderEventContent = (eventInfo: EventContentArg) => {
    // Clean the title by removing date suffixes (e.g., "- Jun 5", "- Jun 14")
    let cleanTitle = eventInfo.event.title || '';
    cleanTitle = cleanTitle.replace(/\s*-\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s*\d{1,2}$/i, '');
    
    return (
      <div className="fc-event-main-frame">
        <div className="fc-event-title-container">
          <div className="fc-event-title fc-sticky truncate">
            {cleanTitle}
          </div>
        </div>
      </div>
    );
  };

  // Event mouse enter for tooltip
  const handleEventMouseEnter = (eventInfo: EventHoveringArg) => {
    const ext = eventInfo.event.extendedProps;
    const tooltipLines: string[] = [];
    
    // Add title
    tooltipLines.push(eventInfo.event.title);
    
    // Add staff information if available
    if (ext.staffIds && ext.staffIds.length > 0) {
      const staffNames = ext.staffIds.map((id: string) => {
        const staffMember = staff.find((s) => s.id.toString() === id);
        return staffMember ? `${staffMember.name}${staffMember.role === 'supervisor' ? ' (S)' : ''}` : '';
      }).filter(Boolean);
      if (staffNames.length > 0) {
        tooltipLines.push(`Staff: ${staffNames.join(', ')}`);
        tooltipLines.push(`Team ID: ${ext.staffIds.join(', ')}`);
      }
    }
    
    // Add shift length
    if (eventInfo.event.start && eventInfo.event.end) {
      const duration = new Date(eventInfo.event.end).getTime() - new Date(eventInfo.event.start).getTime();
      const hours = Math.floor(duration / (1000 * 60 * 60));
      const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
      tooltipLines.push(`Length: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }
    
    // Add location if available
    if (ext.location) {
      const location = ext.location.formattedAddress || ext.location.address || `${ext.location.unit} ${ext.location.name}`;
      tooltipLines.push(`Location: ${location}`);
    }
    
    // Add client info if available
    if (ext.clientIds && ext.clientIds.length > 0) {
      const client = clients.find((c) => c.id.toString() === ext.clientIds[0]);
      if (client) {
        if (client.phone) tooltipLines.push(`Mobile: ${client.phone}`);
        if (client.clientInstruction) tooltipLines.push(`Instructions: ${client.clientInstruction}`);
      }
    }
    
    const tooltipText = tooltipLines.join('\n');
    eventInfo.el.title = tooltipText;
  };

  // Filtering logic: Only show events that match the selected filter category and checked IDs
  const filteredEvents = React.useMemo(() => {
    if (!filterChecked.length) return events;
    return events.filter(event => {
      const ext = event.extendedProps;
      if (filterCategory === 'Staff') {
        return ext.staffIds && ext.staffIds.some((id: string) => filterChecked.includes(id));
      }
      if (filterCategory === 'Client') {
        return ext.clientIds && ext.clientIds.some((id: string) => filterChecked.includes(id));
      }
      if (filterCategory === 'Team') {
        return ext.teamIds && ext.teamIds.some((id: string) => filterChecked.includes(id));
      }
      return true;
    });
  }, [events, filterCategory, filterChecked]);

  // --- Modal Handlers ---
  const handleDateSelect = (selectInfo: { startStr: string; endStr: string }) => {
    setModalType('create');
    setSelectedSlot(selectInfo);
    setModalUrl('create');
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setModalType('view');
    const event = clickInfo.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start!,
      end: event.end!,
      extendedProps: event.extendedProps as CalendarEvent['extendedProps'],
    });
    setSelectedSlot(null);
    setModalUrl('view', event.id);
    openModal();
  };

  const handleAddEventButton = () => {
    setModalType('create');
    setSelectedSlot(null);
    setModalUrl('create');
    openModal();
  };

  // When modal closes, clear modal params from URL
  const handleCloseModal = () => {
    clearModalUrl();
    closeModal();
  };

  // Add new event using API
  const handleCreateEvent = async (newEvent: CalendarEvent) => {
    try {
      setSubmitError(null); // Clear previous errors
      
      // Convert CalendarEvent to CreateShiftData format
      let startTime: string;
      let endTime: string;

      // Handle different date formats
      if (newEvent.start instanceof Date) {
        startTime = newEvent.start.toISOString();
      } else if (typeof newEvent.start === 'string') {
        // If it's a string without timezone, add seconds and timezone
        if (newEvent.start.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
          startTime = newEvent.start + ':00.000Z';
        } else {
          startTime = new Date(newEvent.start).toISOString();
        }
      } else {
        startTime = new Date().toISOString();
      }

      if (newEvent.end instanceof Date) {
        endTime = newEvent.end.toISOString();
      } else if (typeof newEvent.end === 'string') {
        // If it's a string without timezone, add seconds and timezone
        if (newEvent.end.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)) {
          endTime = newEvent.end + ':00.000Z';
        } else {
          endTime = new Date(newEvent.end).toISOString();
        }
      } else {
        // Default to 1 hour after start time
        endTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();
      }

      // Filter out null values and convert to numbers
      const staffIds = (newEvent.extendedProps?.staffIds || [])
        .filter(id => id !== null && id !== undefined && id !== '')
        .map(id => parseInt(String(id)))
        .filter(id => !isNaN(id));

      const clientIds = (newEvent.extendedProps?.clientIds || [])
        .filter(id => id !== null && id !== undefined && id !== '')
        .map(id => parseInt(String(id)))
        .filter(id => !isNaN(id));

      const teamIds = (newEvent.extendedProps?.teamIds || [])
        .filter(id => id !== null && id !== undefined && id !== '')
        .map(id => parseInt(String(id)))
        .filter(id => !isNaN(id));

      // Handle location properly - create location if needed and get its ID
      let locationIds: number[] = [];
      if (newEvent.extendedProps?.includeLocation && newEvent.extendedProps?.location) {
        try {
          // First, try to find the location in the database
          const locationsResponse = await locationApi.getAll();
          let locationId: number | null = null;
          
          if (locationsResponse.success && locationsResponse.data) {
            const existingLocation = locationsResponse.data.data.find(
              loc => loc.unit === newEvent.extendedProps?.location?.unit && 
                     loc.name === newEvent.extendedProps?.location?.name
            );
            locationId = existingLocation?.id || null;
          }

          // If location not found, create it
          if (!locationId) {
            const createResponse = await locationApi.create({
              unit: newEvent.extendedProps.location.unit,
              name: newEvent.extendedProps.location.name,
              accuracy: parseInt(newEvent.extendedProps.location.accuracy),
              comment: newEvent.extendedProps.location.comment,
              address: newEvent.extendedProps.location.address,
              formattedAddress: newEvent.extendedProps.location.formattedAddress,
            });
            
            if (createResponse.success && createResponse.data) {
              locationId = createResponse.data.data.id;
            }
          }

          if (locationId) {
            locationIds = [locationId];
          }
        } catch (error) {
          console.error('Error handling location:', error);
        }
      }

      // Handle supervisor and team member IDs properly
      let supervisorIds: number[] = [];
      let teamMemberIds: number[] = [];

             if (newEvent.extendedProps?.assignmentType === 'team') {
         // For team assignments, we need to separate supervisors from team members
         // Get supervisor IDs from the form data (these are stored separately in CreateEventModal)
        if (newEvent.extendedProps?.supervisorIds) {
          supervisorIds = newEvent.extendedProps.supervisorIds
            .filter(id => id !== null && id !== undefined && id !== '')
            .map(id => parseInt(String(id)))
            .filter(id => !isNaN(id));
        }

        // Get team member IDs from the form data
        if (newEvent.extendedProps?.teamMemberIds) {
          teamMemberIds = newEvent.extendedProps.teamMemberIds
            .filter(id => id !== null && id !== undefined && id !== '')
            .map(id => parseInt(String(id)))
            .filter(id => !isNaN(id));
        }
      } else {
        // For individual assignments, all staffIds are team members
        teamMemberIds = staffIds;
      }
      
      const shiftData = {
        title: newEvent.title || '',
        startTime,
        endTime,
        theme: (newEvent.extendedProps?.theme as 'Danger' | 'Warning' | 'Success' | 'Primary') || 'Primary',
        assignmentType: newEvent.extendedProps?.assignmentType || 'individual',
        isPublished: newEvent.extendedProps?.isPublished || false,
        includeLocation: newEvent.extendedProps?.includeLocation || false,
        shiftInstructions: newEvent.extendedProps?.shiftInstructions || undefined,
        staffIds: [], // Keep empty as we're using supervisorIds and teamMemberIds
        clientIds,
        teamIds,
        locationIds,
        supervisorIds,
        teamMemberIds,
      };

      console.log('Sending shift data:', shiftData);
      
      const newShift = await createShift(shiftData);
      console.log('Created shift:', newShift);
      
      // The createShift function already updates local state, so no need for refetch
      // This provides immediate UI feedback without waiting for a server round-trip
      handleCloseModal();
    } catch (error) {
      console.error('Failed to create shift:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create shift');
    }
  };

  // Update event using API
  const handleUpdateEvent = async (updatedEvent: CalendarEvent) => {
    try {
      const eventId = parseInt(updatedEvent.id || '0');
      if (eventId === 0) return;
      
      const startTime = updatedEvent.start instanceof Date ? updatedEvent.start.toISOString() : 
                       typeof updatedEvent.start === 'string' ? updatedEvent.start : undefined;
      const endTime = updatedEvent.end instanceof Date ? updatedEvent.end.toISOString() : 
                     typeof updatedEvent.end === 'string' ? updatedEvent.end : undefined;
      
      const shiftData = {
        title: updatedEvent.title || '',
        ...(startTime && { startTime }),
        ...(endTime && { endTime }),
        theme: (updatedEvent.extendedProps?.theme as 'Danger' | 'Warning' | 'Success' | 'Primary') || 'Primary',
        assignmentType: updatedEvent.extendedProps?.assignmentType || 'individual',
        isPublished: updatedEvent.extendedProps?.isPublished || false,
        includeLocation: updatedEvent.extendedProps?.includeLocation || false,
        shiftInstructions: updatedEvent.extendedProps?.shiftInstructions,
      };
      
      await updateShift(eventId, shiftData);
    } catch (error) {
      console.error('Failed to update shift:', error);
      // TODO: Show error message to user
    }
  };

  // Delete event using API
  const handleDeleteEvent = async (eventId: string) => {
    try {
      const id = parseInt(eventId);
      if (id === 0) return;
      
      await deleteShift(id);
      handleCloseModal();
    } catch (error) {
      console.error('Failed to delete shift:', error);
      // TODO: Show error message to user
    }
  };

  // Cancel event using API
  const handleCancelEvent = async (eventId: string) => {
    try {
      const id = parseInt(eventId);
      if (id === 0) return;
      
      await cancelShift(id);
      handleCloseModal();
    } catch (error) {
      console.error('Failed to cancel shift:', error);
      // TODO: Show error message to user
    }
  };

  // Only show full loading screen if no events are loaded yet
  if (loading && events.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-8">
        <div className="flex items-center justify-center">
          <div className="text-gray-500">Loading calendar...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-8">
        <div className="flex items-center justify-center">
          <div className="text-red-500">Error loading calendar: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border  border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] relative">
      {/* Show loading indicator when fetching data */}
      {loading && (
        <div className="absolute top-4 right-4 z-50 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm shadow-lg flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Loading shifts...</span>
        </div>
      )}
      
      {/* Overlay for month view loading to make it more prominent */}
      {loading && events.length === 0 && (
        <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center rounded-2xl">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center space-x-3">
                         <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Loading calendar data...</span>
          </div>
        </div>
      )}
      
      <div className="custom-calendar calendar-theme-events relative">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next addEventButton",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={filteredEvents}
          selectable={true}
          dayMaxEvents={3}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventClassNames={getEventClassNames}
          eventContent={renderEventContent}
          eventMouseEnter={handleEventMouseEnter}
          customButtons={{
            addEventButton: {
              text: "Add Event +",
              click: handleAddEventButton,
            },
          }}
          height="auto"
          expandRows={true}
          eventMinHeight={30}
          eventShortHeight={40}
          slotDuration="00:30:00"
          eventOverlap={false}
          slotEventOverlap={false}
          eventMaxStack={3}
          datesSet={handleDatesSet}
        />
      </div>
      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="max-w-[900px] xl:max-w-[1100px] p-6 lg:px-8 lg:py-4 md:h-[70vh] mx-4 overflow-y-scroll"
      >
        <div className="">
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <strong>Error:</strong> {submitError}
            </div>
          )}
          {modalType === 'create' ? (
            <CreateEventModal
              onSubmit={handleCreateEvent}
              onCancel={handleCloseModal}
              slotInfo={selectedSlot}
              staff={staff}
              teams={teams}
            />
          ) : modalType === 'view' && selectedEvent ? (
            <TabbedSidebarLayout 
              event={selectedEvent} 
              onUpdate={handleUpdateEvent} 
              onDelete={handleDeleteEvent}
              onCancel={handleCancelEvent}
              onRefetch={refetch}
              onClose={handleCloseModal}
            />
          ) : null}
        </div>
      </Modal>
    </div>
  );
};

export default Calendar;