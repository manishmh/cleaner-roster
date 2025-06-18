import { type ShiftMessage as BackendShiftMessage, type Shift } from "@/lib/api";
import { Calendar, Clock, Edit2, Pause, Play, Plus, RotateCcw, Save, Square } from "lucide-react";
import React, { useEffect, useState } from 'react';
import { toast } from "sonner";
import { CalendarEvent } from "../../Calendar";
import TravelDistance from './TravelDistance';

interface ReportTabContentProps {
  event: CalendarEvent;
  shiftData?: Shift | null;
  addMessage?: (messageText: string, createdBy?: number) => Promise<void>;
  updateShift?: (shiftUpdateData: Partial<Shift>) => Promise<void>;
  allStaff?: Array<{ id: number; name: string; }>;
}

interface Message {
  id: string;
  message: string;
  createdBy: string;
  createdAt: Date;
}

interface PauseEntry {
  pausedAt: string;
  resumedAt?: string;
}

const ReportTabContent: React.FC<ReportTabContentProps> = ({ event, shiftData, addMessage, updateShift, allStaff }) => {
  const [isShiftStarted, setIsShiftStarted] = useState(false);
  const [isShiftPaused, setIsShiftPaused] = useState(false);
  const [isShiftEnded, setIsShiftEnded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [isSubmittingMessage, setIsSubmittingMessage] = useState(false);
  const [isStartingShift, setIsStartingShift] = useState(false);
  const [isPausingShift, setIsPausingShift] = useState(false);
  const [isResumingShift, setIsResumingShift] = useState(false);
  const [isEndingShift, setIsEndingShift] = useState(false);
  const [isResettingShift, setIsResettingShift] = useState(false);
  const [lastResetTime, setLastResetTime] = useState(0);
  const [showTimeTracker, setShowTimeTracker] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  
  // Editable date and time state
  const [editableDate, setEditableDate] = useState('');
  const [editableStartTime, setEditableStartTime] = useState('');
  const [editableEndTime, setEditableEndTime] = useState('');
  const [isEditingDateTime, setIsEditingDateTime] = useState(false);
  
  // Time tracking state
  const [scheduledInTime, setScheduledInTime] = useState('');
  const [scheduledOutTime, setScheduledOutTime] = useState('');
  const [loggedInTime, setLoggedInTime] = useState('');
  const [loggedOutTime, setLoggedOutTime] = useState('');
  const [pauseEntries, setPauseEntries] = useState<PauseEntry[]>([]);

  useEffect(() => {
    // Don't update state if we're currently updating or if we just reset (within 1 second)
    if ((isStartingShift || isPausingShift || isResumingShift || isEndingShift || isResettingShift) || (Date.now() - lastResetTime < 1000)) {
      return;
    }

    if (shiftData) {
      console.log('Shift state update from shiftData:', {
        shiftStarted: shiftData.jobStarted,
        shiftPaused: shiftData.jobPaused,
        jobEndedAt: shiftData.jobEndedAt,
        currentIsShiftStarted: isShiftStarted,
        currentIsShiftPaused: isShiftPaused
      });
      setIsShiftStarted(shiftData.jobStarted || false);
      setIsShiftPaused(shiftData.jobPaused || false);
      setIsShiftEnded(!!shiftData.jobEndedAt);
      
      // Show time tracker if shift has been started (even if currently ended)
      setShowTimeTracker(shiftData.jobStarted || !!shiftData.jobStartedAt || !!shiftData.jobEndedAt);
      
      // Initialize scheduled times from shift start/end times
      if (shiftData.startTime) {
        const startTime = new Date(shiftData.startTime);
        setEditableDate(formatDateForInput(startTime));
        setEditableStartTime(formatTimeForInput(startTime));
        
        // Use scheduledInTime if available, otherwise use startTime
        if (shiftData.scheduledInTime) {
          setScheduledInTime(formatTimeForInput(new Date(shiftData.scheduledInTime)));
        } else {
          setScheduledInTime(formatTimeForInput(startTime));
        }
      }
      
      if (shiftData.endTime) {
        const endTime = new Date(shiftData.endTime);
        setEditableEndTime(formatTimeForInput(endTime));
        
        // Use scheduledOutTime if available, otherwise use endTime
        if (shiftData.scheduledOutTime) {
          setScheduledOutTime(formatTimeForInput(new Date(shiftData.scheduledOutTime)));
        } else {
          setScheduledOutTime(formatTimeForInput(endTime));
        }
      }
      
      // Set logged times if available
      if (shiftData.loggedInTime) {
        setLoggedInTime(formatTimeForInput(new Date(shiftData.loggedInTime)));
      }
      if (shiftData.loggedOutTime) {
        setLoggedOutTime(formatTimeForInput(new Date(shiftData.loggedOutTime)));
      }
      
      // Parse pause log if available
      if (shiftData.pauseLog) {
        try {
          const pauseData = JSON.parse(shiftData.pauseLog);
          setPauseEntries(pauseData || []);
        } catch (error) {
          console.error('Error parsing pause log:', error);
          setPauseEntries([]);
        }
      }

      if (Array.isArray(shiftData.messages)) {
        setMessages(
          shiftData.messages.map((msg: BackendShiftMessage) => {
            // Try to parse message text as JSON to extract staff info
            let messageText = msg.messageText;
            let staffId = msg.createdBy?.toString() || 'Unknown';
            
            try {
              const parsedMessage = JSON.parse(msg.messageText);
              if (parsedMessage.text && parsedMessage.staffId) {
                messageText = parsedMessage.text;
                staffId = parsedMessage.staffId.toString();
              }
            } catch {
              // If parsing fails, use the original messageText
              messageText = msg.messageText;
            }
            
            return {
              id: msg.id.toString(),
              message: messageText,
              createdBy: staffId,
              createdAt: new Date(msg.createdAt),
            };
          }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        );
      }
    } else if (event?.extendedProps) {
      console.log('Shift state update from event.extendedProps:', {
        shiftStarted: event.extendedProps.jobStarted,
        shiftPaused: event.extendedProps.jobPaused,
        jobEndedAt: event.extendedProps.jobEndedAt,
        currentIsShiftStarted: isShiftStarted,
        currentIsShiftPaused: isShiftPaused
      });
      setIsShiftStarted(event.extendedProps.jobStarted || false);
      setIsShiftPaused(event.extendedProps.jobPaused || false);
      setIsShiftEnded(!!event.extendedProps.jobEndedAt);
      
      // Show time tracker if shift has been started (even if currently ended)
      setShowTimeTracker(event.extendedProps.jobStarted || !!event.extendedProps.jobStartedAt || !!event.extendedProps.jobEndedAt);
      
      // Initialize editable date/time from event
      if (event.start) {
        setEditableDate(formatDateForInput(event.start));
        setEditableStartTime(formatTimeForInput(event.start));
        setScheduledInTime(formatTimeForInput(event.start));
      }
      if (event.end) {
        setEditableEndTime(formatTimeForInput(event.end));
        setScheduledOutTime(formatTimeForInput(event.end));
      }
      
      if (Array.isArray(event.extendedProps.messages)) {
        const processedMessages = (event.extendedProps.messages as Message[]).map(msg => {
          // Try to parse message text as JSON to extract staff info
          let messageText = msg.message;
          let staffId = msg.createdBy;
          
          try {
            const parsedMessage = JSON.parse(msg.message);
            if (parsedMessage.text && parsedMessage.staffId) {
              messageText = parsedMessage.text;
              staffId = parsedMessage.staffId.toString();
            }
          } catch {
            // If parsing fails, use the original message
            messageText = msg.message;
          }
          
          return {
            ...msg,
            message: messageText,
            createdBy: staffId
          };
        });
        
        setMessages(processedMessages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
      }
    }
  }, [shiftData, event?.extendedProps, isStartingShift, isPausingShift, isResumingShift, isEndingShift, isResettingShift, lastResetTime]);

  const formatDateForInput = (date: Date | string | number | number[] | undefined) => {
    if (!date) return '';
    if (Array.isArray(date)) return ''; // Handle DateInput number[] case
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  const formatTimeForInput = (date: Date | string | number | number[] | undefined) => {
    if (!date) return '';
    if (Array.isArray(date)) return ''; // Handle DateInput number[] case
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toTimeString().slice(0, 5);
  };

  const formatDate = (dateInput: Date | string | number | number[] | undefined) => {
    if (!dateInput) return 'N/A';
    if (Array.isArray(dateInput)) return 'N/A';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTime = (dateInput: Date | string | number | number[] | undefined) => {
    if (!dateInput) return 'N/A';
    if (Array.isArray(dateInput)) return 'N/A';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const calculateTimeDuration = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return '0:00';
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    if (end < start) {
      end.setDate(end.getDate() + 1); // Handle overnight shifts
    }
    
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const calculatePauseTime = (): string => {
    if (pauseEntries.length === 0) return '0:00';
    
    let totalPauseTime = 0;
    pauseEntries.forEach(entry => {
      if (entry.pausedAt && entry.resumedAt) {
        const pausedAt = new Date(entry.pausedAt);
        const resumedAt = new Date(entry.resumedAt);
        totalPauseTime += resumedAt.getTime() - pausedAt.getTime();
      }
    });
    
    const hours = Math.floor(totalPauseTime / (1000 * 60 * 60));
    const minutes = Math.floor((totalPauseTime % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleShiftAction = async (action: 'start' | 'pause' | 'resume' | 'end' | 'reset') => {
    if (!updateShift) {
      toast.error("Update function not available.");
      return;
    }
    
    // Check if any action is currently in progress
    if (isStartingShift || isPausingShift || isResumingShift || isEndingShift || isResettingShift) {
      return;
    }
    
    // Set the appropriate loading state
    switch (action) {
      case 'start':
        setIsStartingShift(true);
        break;
      case 'pause':
        setIsPausingShift(true);
        break;
      case 'resume':
        setIsResumingShift(true);
        break;
      case 'end':
        setIsEndingShift(true);
        break;
      case 'reset':
        setIsResettingShift(true);
        break;
    }
    let updatePayload: Partial<Shift> = {};
    let successMessage = "";

    const currentStarted = isShiftStarted;
    const currentPaused = isShiftPaused;
    const now = new Date().toISOString();

    try {
      switch (action) {
        case 'start':
          // When starting shift, save current scheduled times to database
          const getValidDate = (dateInput: Date | string | number | number[] | undefined): Date => {
            if (!dateInput) return new Date();
            if (Array.isArray(dateInput)) return new Date();
            if (dateInput instanceof Date) return dateInput;
            return new Date(dateInput);
          };
          
          const schedInDateTime = scheduledInTime && editableDate ? 
            new Date(`${editableDate}T${scheduledInTime}`).toISOString() : 
            getValidDate(event?.start).toISOString();
          const schedOutDateTime = scheduledOutTime && editableDate ? 
            new Date(`${editableDate}T${scheduledOutTime}`).toISOString() : 
            getValidDate(event?.end).toISOString();
            
          updatePayload = { 
            jobStarted: true, 
            jobPaused: false, 
            jobStartedAt: now,
            loggedInTime: now,
            scheduledInTime: schedInDateTime,
            scheduledOutTime: schedOutDateTime,
            theme: 'Warning' // Yellow when shift is started/in progress
          };
          successMessage = "Shift started successfully!";
          setShowTimeTracker(true);
          break;
        case 'pause':
          const newPauseEntries = [...pauseEntries, { pausedAt: now }];
          updatePayload = { 
            jobPaused: true,
            pauseLog: JSON.stringify(newPauseEntries)
            // Keep Warning theme when paused
          };
          successMessage = "Shift paused successfully!";
          setPauseEntries(newPauseEntries);
          break;
        case 'resume':
          const updatedPauseEntries = pauseEntries.map((entry, index) => 
            index === pauseEntries.length - 1 && !entry.resumedAt
              ? { ...entry, resumedAt: now }
              : entry
          );
          updatePayload = { 
            jobPaused: false,
            pauseLog: JSON.stringify(updatedPauseEntries)
            // Keep Warning theme when resumed
          };
          successMessage = "Shift resumed successfully!";
          setPauseEntries(updatedPauseEntries);
          break;
        case 'end':
          updatePayload = { 
            jobStarted: false, 
            jobPaused: false, 
            jobEndedAt: now,
            loggedOutTime: now,
            theme: 'Success' // Green when shift is completed
          };
          successMessage = "Shift ended successfully!";
          break;
        case 'reset':
          updatePayload = { 
            jobStarted: false, 
            jobPaused: false, 
            jobStartedAt: undefined,
            jobEndedAt: undefined,
            loggedInTime: undefined,
            loggedOutTime: undefined,
            scheduledInTime: undefined,
            scheduledOutTime: undefined,
            pauseLog: undefined,
            theme: 'Primary' // Blue when reset to initial state
          };
          successMessage = "Shift reset successfully!";
          setShowTimeTracker(false);
          setPauseEntries([]);
          setLoggedInTime('');
          setLoggedOutTime('');
          setScheduledInTime('');
          setScheduledOutTime('');
          break;
      }

      console.log(`Starting ${action} with payload:`, updatePayload);
      await updateShift(updatePayload);
      console.log(`${action} completed successfully`);
      toast.success(successMessage);
      
      switch (action) {
        case 'start':
          setIsShiftStarted(true);
          setIsShiftPaused(false);
          setLoggedInTime(formatTimeForInput(new Date()));
          
          // Trigger distance calculation after shift is started
          break;
        case 'pause':
          setIsShiftPaused(true);
          break;
        case 'resume':
          setIsShiftPaused(false);
          break;
        case 'end':
          setIsShiftStarted(false);
          setIsShiftPaused(false);
          setIsShiftEnded(true);
          setLoggedOutTime(formatTimeForInput(new Date()));
          break;
        case 'reset':
          setIsShiftStarted(false);
          setIsShiftPaused(false);
          setIsShiftEnded(false);
          setShowTimeTracker(false);
          setPauseEntries([]);
          setLoggedInTime('');
          setLoggedOutTime('');
          setScheduledInTime('');
          setScheduledOutTime('');
          // Set the reset timestamp to prevent useEffect from overriding state
          setLastResetTime(Date.now());
          break;
      }
    } catch (error) {
      console.error(`Error ${action} shift:`, error);
      toast.error(`Failed to ${action} shift. Please try again.`);
      // Only rollback state if it's not a reset operation
      if (action !== 'reset') {
        setIsShiftStarted(currentStarted);
        setIsShiftPaused(currentPaused);
      }
    } finally {
      // Clear the appropriate loading state
      switch (action) {
        case 'start':
          setIsStartingShift(false);
          break;
        case 'pause':
          setIsPausingShift(false);
          break;
        case 'resume':
          setIsResumingShift(false);
          break;
        case 'end':
          setIsEndingShift(false);
          break;
        case 'reset':
          setIsResettingShift(false);
          break;
      }
    }
  };

  const handleDateTimeUpdate = async () => {
    if (!updateShift || !editableDate || !editableStartTime || !editableEndTime) {
      toast.error("Please fill in all date and time fields.");
      return;
    }

    const startDateTime = new Date(`${editableDate}T${editableStartTime}`);
    const endDateTime = new Date(`${editableDate}T${editableEndTime}`);

    if (endDateTime <= startDateTime) {
      toast.error("End time must be after start time.");
      return;
    }

    try {
      await updateShift({
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        scheduledInTime: startDateTime.toISOString(),
        scheduledOutTime: endDateTime.toISOString(),
      });
      
      setScheduledInTime(formatTimeForInput(startDateTime));
      setScheduledOutTime(formatTimeForInput(endDateTime));
      setIsEditingDateTime(false);
      toast.success("Date and time updated successfully!");
    } catch (error) {
      console.error('Error updating date/time:', error);
      toast.error("Failed to update date and time.");
    }
  };

  const handleTimeTrackerUpdate = async () => {
    if (!updateShift) {
      toast.error("Update function not available.");
      return;
    }

    try {
      const updateData: Partial<Shift> = {};
      
      if (scheduledInTime && scheduledOutTime) {
        const schedInDateTime = new Date(`${editableDate}T${scheduledInTime}`);
        const schedOutDateTime = new Date(`${editableDate}T${scheduledOutTime}`);
        updateData.scheduledInTime = schedInDateTime.toISOString();
        updateData.scheduledOutTime = schedOutDateTime.toISOString();
      }
      
      if (loggedInTime) {
        const loggedInDateTime = new Date(`${editableDate}T${loggedInTime}`);
        updateData.loggedInTime = loggedInDateTime.toISOString();
      }
      
      if (loggedOutTime) {
        const loggedOutDateTime = new Date(`${editableDate}T${loggedOutTime}`);
        updateData.loggedOutTime = loggedOutDateTime.toISOString();
      }

      await updateShift(updateData);
      setShowUpdateModal(false);
      toast.success("Time tracking data updated successfully!");
    } catch (error) {
      console.error('Error updating time tracking data:', error);
      toast.error("Failed to update time tracking data.");
    }
  };

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newMessage.trim() || !selectedStaff) {
      toast.error("Please select staff and enter a message.");
      return;
    }
    if (!addMessage) {
      toast.error("Message function not available.");
      return;
    }
    setIsSubmittingMessage(true);
    try {
      let createdById: number | undefined;
      if (allStaff) {
        const staff = allStaff.find(s => s.id.toString() === selectedStaff.toString());
        createdById = staff?.id;
      } else {
        const staffIdMatch = selectedStaff.match(/^s(\d+)$/);
        if (staffIdMatch) {
          createdById = parseInt(staffIdMatch[1]);
        }
      }
      
      await addMessage(newMessage.trim(), createdById);
      toast.success("Message added successfully!");
      setNewMessage('');
      setSelectedStaff('');
      setShowMessageModal(false);
    } catch (error) {
      console.error('Error adding message:', error);
      toast.error("Failed to add message. Please try again.");
    } finally {
      setIsSubmittingMessage(false);
    }
  };

  const getStaffName = (staffId: string | number) => {
    if (allStaff) {
      const staff = allStaff.find(s => s.id.toString() === staffId.toString());
      if (staff) return staff.name;
    }
    
    return `Staff ${staffId}`;
  };

  const scheduledLength = calculateTimeDuration(scheduledInTime, scheduledOutTime);
  const loggedLength = calculateTimeDuration(loggedInTime, loggedOutTime);
  const pauseTime = calculatePauseTime();
  const payLength = scheduledLength && loggedLength ? 
    (scheduledLength <= loggedLength ? scheduledLength : loggedLength) : 
    (scheduledLength || loggedLength);

  return (
    <div className="flex flex-col gap-4 md:gap-6 text-sm">
      <div className="mb-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-3 py-2 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700">
        <strong>Note:</strong> Any change in this section will only affect the selected shift. Try Repeat for group change.
      </div>

      {/* Editable Date and Time Section */}
      <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date & Time
          </h3>
          <button
            onClick={() => setIsEditingDateTime(!isEditingDateTime)}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {isEditingDateTime ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Date:</label>
                <input
                  type="date"
                  value={editableDate}
                  onChange={(e) => setEditableDate(e.target.value)}
                  className="w-full px-3 py-1 border rounded text-sm bg-white dark:bg-gray-900 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Start Time:</label>
                <input
                  type="time"
                  value={editableStartTime}
                  onChange={(e) => setEditableStartTime(e.target.value)}
                  className="w-full px-3 py-1 border rounded text-sm bg-white dark:bg-gray-900 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">End Time:</label>
                <input
                  type="time"
                  value={editableEndTime}
                  onChange={(e) => setEditableEndTime(e.target.value)}
                  className="w-full px-3 py-1 border rounded text-sm bg-white dark:bg-gray-900 dark:border-gray-600"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDateTimeUpdate}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                Save
              </button>
              <button
                onClick={() => setIsEditingDateTime(false)}
                className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-300 mb-0.5">Date:</label>
              <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">
                {editableDate ? formatDate(new Date(editableDate)) : 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-300 mb-0.5">Time:</label>
              <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">
                {editableStartTime && editableEndTime ? 
                  `${editableStartTime} - ${editableEndTime}` : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100">Start Shift</h2>
        <div className="flex gap-2">
          <button
            onClick={() => handleShiftAction('reset')}
            disabled={isResettingShift}
            className="px-3 py-1 rounded border border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            {isResettingShift ? "Resetting..." : "Reset Shift"} 
          </button>
        </div>
      </div>

      <div className="mb-6 text-sm">
        {!isShiftStarted && !isShiftEnded ? (
          <button
            onClick={() => handleShiftAction('start')}
            disabled={isStartingShift}
            className="w-full sm:w-auto px-20 py-2 border text-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 rounded-lg hover:bg-gray-100 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4" /> 
            {isStartingShift ? "Starting..." : "Start Shift"}
          </button>
        ) : isShiftStarted ? (
          <div className={`p-4 border rounded-lg ${isShiftPaused ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
            <div className={`flex items-center gap-2 font-medium ${isShiftPaused ? 'text-gray-700 dark:text-gray-300' : 'text-gray-800 dark:text-gray-200'}`}>
              {isShiftPaused ? (
                <>
                  <Pause className="w-4 h-4" />
                  Shift Paused
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  Shift Started
                </>
              )}
            </div>
            <div className={`text-sm mt-1 ${isShiftPaused ? 'text-gray-600 dark:text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {isShiftPaused ? 'Shift is currently paused...' : `Shift started at ${shiftData?.jobStartedAt ? formatTime(shiftData.jobStartedAt) : 'N/A'}`}
            </div>
            <div className="flex gap-2 mt-3">
              {isShiftPaused ? (
                <button
                  onClick={() => handleShiftAction('resume')}
                  disabled={isResumingShift}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  {isResumingShift ? "Resuming..." : "Resume"}
                </button>
              ) : (
                <button
                  onClick={() => handleShiftAction('pause')}
                  disabled={isPausingShift}
                  className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 border border-gray-300 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Pause className="w-3 h-3" />
                  {isPausingShift ? "Pausing..." : "Pause"}
                </button>
              )}
              <button
                onClick={() => handleShiftAction('end')}
                disabled={isEndingShift}
                className="px-3 py-1 border border-gray-300 bg-gray-100 rounded hover:bg-gray-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Square className="w-3 h-3" />
                {isEndingShift ? "Ending..." : "End Shift"}
              </button>
            </div>
          </div>
        ) : isShiftEnded ? (
          <div className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600">
            <div className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
              <Square className="w-4 h-4" />
              Shift Ended
            </div>
            <div className="text-sm mt-1 text-gray-600 dark:text-gray-400">
              Shift ended at {shiftData?.jobEndedAt ? formatTime(shiftData.jobEndedAt) : 'N/A'}
            </div>
          </div>
        ) : null}
      </div>

      {/* Time Tracker Interface */}
      {(showTimeTracker || isShiftStarted || isShiftEnded) && (
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time Tracking
            </h3>
            <button
              onClick={() => setShowUpdateModal(true)}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              Update
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scheduled Times */}
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Scheduled</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">In:</span>
                  <span className="font-medium">{scheduledInTime || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Out:</span>
                  <span className="font-medium">{scheduledOutTime || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Logged Times */}
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Logged</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">In:</span>
                  <span className="font-medium">{loggedInTime || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Out:</span>
                  <span className="font-medium">{loggedOutTime || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Time Calculations */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-600 dark:text-gray-400">Sch Length</div>
                <div className="font-semibold text-lg">{scheduledLength}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600 dark:text-gray-400">Log Length</div>
                <div className="font-semibold text-lg">{loggedLength}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600 dark:text-gray-400">Pause Time</div>
                <div className="font-semibold text-lg">{pauseTime}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-600 dark:text-gray-400">Pay Length</div>
                <div className="font-semibold text-lg text-gray-800 dark:text-gray-200">{payLength}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Travel Distance Section */}
      <TravelDistance 
        event={event}
        shiftData={shiftData}
        updateShift={updateShift}
      />

      {/* Messages Section */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Messages</h3>
          <button
            onClick={() => setShowMessageModal(true)}
            className="w-8 h-8 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center justify-center"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded overflow-hidden text-sm border border-gray-200 dark:border-gray-700">
          <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4 px-3 py-2">
              <div className="font-semibold text-gray-600 dark:text-gray-200 col-span-2">Messages</div>
              <div className="font-semibold text-gray-600 dark:text-gray-200">Created By</div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900">
            {messages.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No Messages Found
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="grid grid-cols-3 gap-4 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <div className="text-gray-800 dark:text-gray-100 col-span-2">{message.message}</div>
                  <div className="text-gray-600 dark:text-gray-300">{getStaffName(message.createdBy)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Time Update Modal */}
      {showUpdateModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30"
          onClick={() => setShowUpdateModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 min-w-[500px] max-w-[600px] w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Update Time Tracking
              </h3>
              <button
                className="h-6 w-6 bg-gray-700 text-white rounded hover:bg-gray-600 flex items-center justify-center"
                onClick={() => setShowUpdateModal(false)}
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Scheduled Times</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">In Time:</label>
                    <input
                      type="time"
                      value={scheduledInTime}
                      onChange={(e) => setScheduledInTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Out Time:</label>
                    <input
                      type="time"
                      value={scheduledOutTime}
                      onChange={(e) => setScheduledOutTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Logged Times</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">In Time:</label>
                    <input
                      type="time"
                      value={loggedInTime}
                      onChange={(e) => setLoggedInTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Out Time:</label>
                    <input
                      type="time"
                      value={loggedOutTime}
                      onChange={(e) => setLoggedOutTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleTimeTrackerUpdate}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30"
          onClick={() => setShowMessageModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 min-w-[400px] max-w-[500px] w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Add New Message
              </h3>
              <button
                className="h-6 w-6 bg-gray-700 text-white rounded hover:bg-gray-600 flex items-center justify-center"
                onClick={() => setShowMessageModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Created By:
                </label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-400 focus:outline-none"
                  required
                >
                  <option value="">Select Staff</option>
                  {allStaff?.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Message:
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-gray-400 focus:outline-none min-h-[80px] resize-none"
                  placeholder="Enter your message..."
                  required
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMessage}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingMessage ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportTabContent;
