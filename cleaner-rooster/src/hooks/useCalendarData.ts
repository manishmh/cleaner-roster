import type { CalendarEvent } from '@/components/calendar/Calendar';
import {
  clientApi,
  locationApi,
  shiftApi,
  teamApi,
  type Client,
  type CreateShiftData,
  type Location,
  type Shift,
  type Team
} from '@/lib/api';
import { useCallback, useEffect, useRef, useState } from 'react';

interface CalendarData {
  shifts: Shift[];
  clients: Client[];
  locations: Location[];
  teams: Team[];
}

interface UseCalendarDataReturn {
  data: CalendarData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadDateRange: (startDate: Date, endDate: Date, options?: { exact?: boolean }) => Promise<void>;
  createShift: (shiftData: CreateShiftData) => Promise<Shift>;
  updateShift: (id: number, shiftData: Partial<CreateShiftData>) => Promise<Shift>;
  deleteShift: (id: number) => Promise<void>;
  cancelShift: (id: number) => Promise<void>;
}

// Cache for shifts by date range
interface ShiftCache {
  [key: string]: {
    shifts: Shift[];
    timestamp: number;
    startDate: string;
    endDate: string;
  };
}

// Convert backend Shift to CalendarEvent
function convertShiftToCalendarEvent(shift: Shift): CalendarEvent {
  // Helper to extract team IDs from wrapped or plain team objects
  const getTeamIds = () => {
    return (shift.teams || []).map(teamWrapper => {
      if ('teams' in teamWrapper) {
        return teamWrapper.teams.id.toString();
      }
      return teamWrapper.id.toString();
    });
  };

  // Helper to extract location data from wrapped or plain location objects
  const getLocationData = () => {
    if ((shift.locations || []).length > 0) {
      const locationWrapper = shift.locations[0];
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
      // Plain location object
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
    return null;
  };

  // Extract staff IDs based on their roles
  const allStaffIds = (shift.staff || []).map(s => s.id.toString());
  const supervisorIds = (shift.staff || [])
    .filter(s => s.roleInShift === 'supervisor')
    .map(s => s.id.toString());
  const teamMemberIds = (shift.staff || [])
    .filter(s => s.roleInShift === 'team_member')
    .map(s => s.id.toString());
  const assignedStaffIds = (shift.staff || [])
    .filter(s => s.roleInShift === 'assigned')
    .map(s => s.id.toString());

  return {
    id: shift.id.toString(),
    title: shift.title,
    start: new Date(shift.startTime),
    end: new Date(shift.endTime),
    extendedProps: {
      calendarType: 'shift',
      clientIds: (shift.clients || []).map(c => c.id.toString()),
      staffIds: allStaffIds,
      teamIds: getTeamIds(),
      theme: shift.theme,
      assignmentType: shift.assignmentType,
      isPublished: shift.isPublished,
      includeLocation: shift.includeLocation,
      shiftInstructions: shift.shiftInstructions,
      jobStarted: shift.jobStarted,
      jobStartedAt: shift.jobStartedAt,
      jobPaused: shift.jobPaused,
      supervisorIds: supervisorIds,
      teamMemberIds: teamMemberIds.length > 0 ? teamMemberIds : assignedStaffIds, // Use assigned staff if no team members
      instructions: (shift.instructions || []).map(inst => ({
        id: inst.id.toString(),
        text: inst.instructionText,
        type: inst.instructionType,
        createdAt: new Date(inst.createdAt),
      })),
      messages: (shift.messages || []).map(msg => ({
        id: msg.id.toString(),
        message: msg.messageText,
        createdBy: msg.createdBy?.toString() || 'Unknown',
        createdAt: new Date(msg.createdAt),
      })),
      location: getLocationData(),
    },
  };
}

export function useCalendarData(): UseCalendarDataReturn {
  const [data, setData] = useState<CalendarData>({
    shifts: [],
    clients: [],
    locations: [],
    teams: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cache and debouncing refs
  const shiftsCache = useRef<ShiftCache>({});
  const loadingRanges = useRef<Set<string>>(new Set());
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Cache duration (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Generate cache key for date range
  const getCacheKey = (startDate: Date, endDate: Date) => {
    return `${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}`;
  };

  // Check if cache is valid
  const isCacheValid = (cacheEntry: { timestamp: number }) => {
    return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
  };

  // Load initial reference data (clients, locations, teams)
  const loadReferenceData = useCallback(async () => {
    try {
      const [clientsResponse, locationsResponse, teamsResponse] = await Promise.all([
        clientApi.getAll({ isActive: true }),
        locationApi.getAll(),
        teamApi.getAll(),
      ]);

      setData(prev => ({
        ...prev,
        clients: clientsResponse.success && clientsResponse.data ? clientsResponse.data.data : [],
        locations: locationsResponse.success && locationsResponse.data ? locationsResponse.data.data : [],
        teams: teamsResponse.success && teamsResponse.data ? teamsResponse.data.data : [],
      }));
    } catch (err) {
      console.error('Error fetching reference data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reference data');
    }
  }, []);

  // Load shifts for a specific date range
  const loadDateRange = useCallback(async (startDate: Date, endDate: Date, options?: { exact?: boolean }) => {
    const cacheKey = getCacheKey(startDate, endDate);
    
    // Check if already loading this range
    if (loadingRanges.current.has(cacheKey)) {
      return;
    }

    // Check cache first
    const cached = shiftsCache.current[cacheKey];
    if (cached && isCacheValid(cached)) {
      // Merge cached shifts with existing shifts (avoid duplicates)
      setData(prev => {
        const existingIds = new Set(prev.shifts.map(s => s.id));
        const newShifts = cached.shifts.filter(s => !existingIds.has(s.id));
        return {
          ...prev,
          shifts: [...prev.shifts, ...newShifts],
        };
      });
      return;
    }

    try {
      loadingRanges.current.add(cacheKey);
      setError(null);
      setLoading(true); // Set loading state for visual feedback

      // Only add buffer for week/day views, not for month view
      let actualStart = startDate;
      let actualEnd = endDate;
      
      if (!options?.exact) {
        // Add minimal buffer for week/day views (3 days instead of 7)
        const bufferDays = 3;
        actualStart = new Date(startDate);
        actualStart.setDate(actualStart.getDate() - bufferDays);
        actualEnd = new Date(endDate);
        actualEnd.setDate(actualEnd.getDate() + bufferDays);
      }

      console.log(`Loading shifts for range: ${actualStart.toISOString().split('T')[0]} to ${actualEnd.toISOString().split('T')[0]}${options?.exact ? ' (exact)' : ' (with buffer)'}`);

      const shiftsResponse = await shiftApi.getAll({
        startDate: actualStart.toISOString().split('T')[0],
        endDate: actualEnd.toISOString().split('T')[0],
        includeRelations: true,
      });

      if (shiftsResponse.success && shiftsResponse.data) {
        const newShifts = shiftsResponse.data.data;
        
        // Cache the result
        shiftsCache.current[cacheKey] = {
          shifts: newShifts,
          timestamp: Date.now(),
          startDate: actualStart.toISOString(),
          endDate: actualEnd.toISOString(),
        };

        // Merge with existing shifts (avoid duplicates)
        setData(prev => {
          const existingIds = new Set(prev.shifts.map(s => s.id));
          const filteredNewShifts = newShifts.filter(s => !existingIds.has(s.id));
          return {
            ...prev,
            shifts: [...prev.shifts, ...filteredNewShifts],
          };
        });
      }
    } catch (err) {
      console.error('Error loading date range:', err);
      setError(err instanceof Error ? err.message : 'Failed to load shifts for date range');
    } finally {
      setLoading(false); // Clear loading state
      loadingRanges.current.delete(cacheKey);
    }
  }, []);

  // Debounced date range loading
  const debouncedLoadDateRange = useCallback((startDate: Date, endDate: Date, options?: { exact?: boolean }): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      
      debounceTimeout.current = setTimeout(async () => {
        try {
          await loadDateRange(startDate, endDate, options);
          resolve();
        } catch (error) {
          console.error('Error in debounced load date range:', error);
          resolve(); // Still resolve to avoid hanging promises
        }
      }, 300); // 300ms debounce
    });
  }, [loadDateRange]);

  // Fetch initial data (reference data + current month)
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load reference data first
      await loadReferenceData();

      // Load current month's shifts
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      await loadDateRange(startOfMonth, endOfMonth);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar data');
    } finally {
      setLoading(false);
    }
  };

  const createShift = async (shiftData: CreateShiftData): Promise<Shift> => {
    try {
      const response = await shiftApi.create(shiftData);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create shift');
      }
      const newShift = response.data.data;
      
      // Update local state
      setData(prev => ({
        ...prev,
        shifts: [...prev.shifts, newShift],
      }));

      // Invalidate relevant cache entries
      const shiftDate = new Date(newShift.startTime);
      Object.keys(shiftsCache.current).forEach(key => {
        const cache = shiftsCache.current[key];
        const cacheStart = new Date(cache.startDate);
        const cacheEnd = new Date(cache.endDate);
        if (shiftDate >= cacheStart && shiftDate <= cacheEnd) {
          delete shiftsCache.current[key];
        }
      });

      return newShift;
    } catch (err) {
      console.error('Error creating shift:', err);
      throw err;
    }
  };

  const updateShift = async (id: number, shiftData: Partial<CreateShiftData>): Promise<Shift> => {
    try {
      const response = await shiftApi.update(id, shiftData);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update shift');
      }
      const updatedShift = response.data.data;
      
      // Update local state
      setData(prev => ({
        ...prev,
        shifts: prev.shifts.map(shift => 
          shift.id === id ? updatedShift : shift
        ),
      }));

      // Invalidate cache
      shiftsCache.current = {};

      return updatedShift;
    } catch (err) {
      console.error('Error updating shift:', err);
      throw err;
    }
  };

  const deleteShift = async (id: number): Promise<void> => {
    try {
      await shiftApi.delete(id);
      
      // Update local state
      setData(prev => ({
        ...prev,
        shifts: prev.shifts.filter(shift => shift.id !== id),
      }));

      // Invalidate cache
      shiftsCache.current = {};
    } catch (err) {
      console.error('Error deleting shift:', err);
      throw err;
    }
  };

  const cancelShift = async (id: number): Promise<void> => {
    try {
      await shiftApi.cancel(id);
      
      // Refetch data to get updated shift with Cover staff and red theme
      await fetchData();
    } catch (err) {
      console.error('Error cancelling shift:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    loadDateRange: debouncedLoadDateRange,
    createShift,
    updateShift,
    deleteShift,
    cancelShift,
  };
}

// Hook to get calendar events from shifts
export function useCalendarEvents() {
  const { data, loading, error, refetch, loadDateRange, createShift, updateShift, deleteShift, cancelShift } = useCalendarData();
  
  const events: CalendarEvent[] = data.shifts.map(convertShiftToCalendarEvent);

  return {
    events,
    loading,
    error,
    refetch,
    loadDateRange,
    createShift,
    updateShift,
    deleteShift,
    cancelShift,
    // Expose raw data for forms and filters
    clients: data.clients,
    locations: data.locations,
    teams: data.teams,
  };
} 