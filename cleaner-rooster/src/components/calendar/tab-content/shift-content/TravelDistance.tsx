import { useCalendarEvents } from "@/hooks/useCalendarData";
import { type Shift } from "@/lib/api";
import { Edit2, MapPin, Save } from "lucide-react";
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from "sonner";
import { CalendarEvent } from "../../Calendar";

interface TravelDistanceProps {
  event: CalendarEvent;
  shiftData?: Shift | null;
  updateShift?: (shiftUpdateData: Partial<Shift>) => Promise<void>;
}

interface TravelDistanceData {
  distance: number; // in kilometers
  duration: number; // in minutes
  fromLocation: string;
}

// Google Maps Directions API types
interface GoogleMapsAPI {
  maps: {
    DirectionsService: new () => {
      route: (request: DirectionsRequest, callback: (response: DirectionsResponse | null, status: string) => void) => void;
    };
    TravelMode: {
      DRIVING: string;
    };
    DirectionsStatus: {
      OK: string;
    };
  };
}

interface DirectionsRequest {
  origin: string;
  destination: string;
  travelMode: string;
}

interface DirectionsResponse {
  routes: Array<{
    legs: Array<{
      distance: { value: number; text: string };
      duration: { value: number; text: string };
      start_address: string;
      end_address: string;
    }>;
  }>;
}

const TravelDistance: React.FC<TravelDistanceProps> = ({ event, shiftData, updateShift }) => {
  const { events } = useCalendarEvents();
  const [travelData, setTravelData] = useState<TravelDistanceData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDistance, setEditDistance] = useState('0');
  const [editDuration, setEditDuration] = useState('0');
  const [editFromLocation, setEditFromLocation] = useState('');

  // Helper function to safely convert to Date
  const getValidDate = (dateInput: Date | string | number | number[] | undefined): Date => {
    if (!dateInput) return new Date();
    if (Array.isArray(dateInput)) return new Date();
    if (dateInput instanceof Date) return dateInput;
    return new Date(dateInput);
  };

  // Helper function to get location string from location object
  const getLocationString = (location: unknown): string => {
    if (!location) return '';
    if (typeof location === 'string') return location;
    if (typeof location === 'object' && location !== null) {
      const loc = location as { 
        formattedAddress?: string; 
        address?: string; 
        name?: string; 
        unit?: string;
      };
      // Try different location fields in order of preference
      return loc.formattedAddress || 
             loc.address || 
             (loc.unit && loc.name ? `${loc.unit} ${loc.name}` : '') ||
             loc.name || 
             loc.unit || 
             '';
    }
    return '';
  };

  // Find previous shift for the same staff on the same day
  const findPreviousShift = useCallback(() => {
    const currentShiftDate = getValidDate(event.start).toISOString().split('T')[0];
    const currentShiftStart = getValidDate(event.start);
    const currentShiftId = event.id;

    console.log('🔍 Finding previous shift for:', {
      currentShiftId,
      currentShiftDate,
      currentShiftStart: currentShiftStart.toISOString(),
      assignmentType: event.extendedProps.assignmentType,
      staffIds: event.extendedProps.staffIds,
      totalEvents: events.length
    });

    // Filter shifts for the same day that are different from current shift
    const sameDayShifts = events.filter((shift: CalendarEvent) => {
      const shiftDate = getValidDate(shift.start);
      const isSameDay = shiftDate.toISOString().split('T')[0] === currentShiftDate;
      const isDifferentShift = shift.id !== currentShiftId;
      return isSameDay && isDifferentShift;
    });

    console.log('📅 Same day shifts found:', sameDayShifts.length, sameDayShifts.map(s => ({
      id: s.id,
      title: s.title,
      start: getValidDate(s.start).toISOString(),
      end: getValidDate(s.end).toISOString(),
      staffIds: s.extendedProps.staffIds,
      location: s.extendedProps.location
    })));

    // For individual assignments, find shifts with same staff
    if (event.extendedProps.assignmentType === 'individual') {
      const currentStaffIds = event.extendedProps.staffIds || [];
      console.log('👤 Looking for individual shifts with staff IDs:', currentStaffIds);
      
      const matchingShifts = sameDayShifts.filter((shift: CalendarEvent) => {
        const shiftStaffIds = shift.extendedProps.staffIds || [];
        const hasMatchingStaff = currentStaffIds.some((staffId: string) => shiftStaffIds.includes(staffId));
        console.log('Checking shift:', shift.id, 'staffIds:', shiftStaffIds, 'matches:', hasMatchingStaff);
        return hasMatchingStaff;
      });

      console.log('✅ Matching staff shifts:', matchingShifts.length);

      // Find the shift that ends closest to (but before) current shift start
      const previousShifts = matchingShifts.filter((shift: CalendarEvent) => {
        const shiftEnd = getValidDate(shift.end);
        const isBeforeCurrent = shiftEnd <= currentShiftStart;
        console.log('Shift end check:', shift.id, 'ends at:', shiftEnd.toISOString(), 'before current:', isBeforeCurrent);
        return isBeforeCurrent;
      });

      console.log('⏰ Previous shifts (before current):', previousShifts.length);

      const sortedPreviousShifts = previousShifts.sort((a: CalendarEvent, b: CalendarEvent) => {
        const aEnd = getValidDate(a.end);
        const bEnd = getValidDate(b.end);
        return bEnd.getTime() - aEnd.getTime();
      });

      const result = sortedPreviousShifts[0];
      console.log('🎯 Selected previous shift:', result ? {
        id: result.id,
        title: result.title,
        end: getValidDate(result.end).toISOString(),
        location: result.extendedProps.location,
        locationString: getLocationString(result.extendedProps.location)
      } : 'None found');

      return result || null;
    }

    // For team assignments, find shifts with exactly the same team
    if (event.extendedProps.assignmentType === 'team') {
      const currentTeamIds = event.extendedProps.teamIds || [];
      const currentSupervisorIds = event.extendedProps.supervisorIds || [];
      const currentTeamMemberIds = event.extendedProps.teamMemberIds || [];

      console.log('👥 Looking for team shifts with:', {
        teamIds: currentTeamIds,
        supervisorIds: currentSupervisorIds,
        teamMemberIds: currentTeamMemberIds
      });

      const matchingShifts = sameDayShifts.filter((shift: CalendarEvent) => {
        if (shift.extendedProps.assignmentType !== 'team') return false;
        
        const shiftTeamIds = shift.extendedProps.teamIds || [];
        const shiftSupervisorIds = shift.extendedProps.supervisorIds || [];
        const shiftTeamMemberIds = shift.extendedProps.teamMemberIds || [];

        // Check if teams match exactly
        const teamsMatch = currentTeamIds.length === shiftTeamIds.length && 
          currentTeamIds.every(id => shiftTeamIds.includes(id));
        
        // Check if supervisors match exactly
        const supervisorsMatch = currentSupervisorIds.length === shiftSupervisorIds.length &&
          currentSupervisorIds.every(id => shiftSupervisorIds.includes(id));
        
        // Check if team members match exactly
        const teamMembersMatch = currentTeamMemberIds.length === shiftTeamMemberIds.length &&
          currentTeamMemberIds.every(id => shiftTeamMemberIds.includes(id));

        const matches = teamsMatch && supervisorsMatch && teamMembersMatch;
        console.log('Team shift check:', shift.id, 'matches:', matches);
        return matches;
      });

      console.log('✅ Matching team shifts:', matchingShifts.length);

      // Find the shift that ends closest to (but before) current shift start
      const previousShifts = matchingShifts.filter((shift: CalendarEvent) => {
        const shiftEnd = getValidDate(shift.end);
        const isBeforeCurrent = shiftEnd <= currentShiftStart;
        return isBeforeCurrent;
      });

      const sortedPreviousShifts = previousShifts.sort((a: CalendarEvent, b: CalendarEvent) => {
        const aEnd = getValidDate(a.end);
        const bEnd = getValidDate(b.end);
        return bEnd.getTime() - aEnd.getTime();
      });

      const result = sortedPreviousShifts[0];
      console.log('🎯 Selected previous team shift:', result ? {
        id: result.id,
        title: result.title,
        end: getValidDate(result.end).toISOString(),
        location: result.extendedProps.location,
        locationString: getLocationString(result.extendedProps.location)
      } : 'None found');

      return result || null;
    }

    return null;
  }, [event, events, getLocationString]);

  // Calculate distance using Google Maps Directions API
  const calculateDistance = async (origin: string, destination: string): Promise<{ distance: number; duration: number } | null> => {
    try {
      console.log('🗺️ Calculating distance:', { origin, destination });
      
      // If same location, return 0
      if (origin.toLowerCase().trim() === destination.toLowerCase().trim()) {
        return { distance: 0, duration: 0 };
      }
      
      // Check if Google Maps API is loaded
      const googleMaps = (window as unknown as { google?: GoogleMapsAPI }).google;
      if (!googleMaps?.maps?.DirectionsService) {
        console.warn('❌ Google Maps API not loaded, using fallback');
        // Fallback: estimate based on location similarity
        return { distance: 5, duration: 10 }; // Default 5km, 10min
      }
      
      return new Promise((resolve) => {
        const service = new googleMaps.maps.DirectionsService();
        
        const request: DirectionsRequest = {
          origin: origin,
          destination: destination,
          travelMode: googleMaps.maps.TravelMode.DRIVING,
        };
        
        service.route(request, (response: DirectionsResponse | null, status: string) => {
          console.log('📍 Directions API response:', { status, routes: response?.routes?.length || 0 });
          
          if (status === googleMaps.maps.DirectionsStatus.OK && response && response.routes.length > 0) {
            const route = response.routes[0];
            const leg = route.legs[0];
            
            if (leg && leg.distance && leg.duration) {
              const distanceKm = Math.round((leg.distance.value / 1000) * 10) / 10;
              const durationMin = Math.round(leg.duration.value / 60);
              
              console.log('✅ Distance calculated:', { distanceKm, durationMin });
              
              resolve({
                distance: distanceKm,
                duration: durationMin
              });
              return;
            }
          }
          
          console.warn('❌ Directions API failed:', status, 'using fallback');
          // Fallback calculation
          resolve({ distance: 5, duration: 10 });
        });
      });
      
    } catch (error) {
      console.error('❌ Error calculating distance:', error);
      return { distance: 5, duration: 10 }; // Fallback
    }
  };

  // Calculate travel distance
  const calculateTravelDistance = useCallback(async () => {
    if (isCalculating) return;
    
    setIsCalculating(true);
    
    try {
      console.log('🚀 Starting travel distance calculation...');
      
      // Get current shift location
      const currentLocationRaw = event.extendedProps.location;
      const currentLocation = getLocationString(currentLocationRaw);
      
      console.log('📍 Current location:', { raw: currentLocationRaw, string: currentLocation });
      
      // Find previous shift
      const previousShift = findPreviousShift();
      if (!previousShift) {
        console.log('❌ No previous shift found');
        // Set default data when no previous shift
        const defaultData: TravelDistanceData = {
          distance: 0,
          duration: 0,
          fromLocation: 'No previous shift found'
        };
        setTravelData(defaultData);
        setEditDistance('0');
        setEditDuration('0');
        setEditFromLocation('No previous shift found');
        return;
      }
      
      const previousLocationRaw = previousShift.extendedProps.location;
      const previousLocation = getLocationString(previousLocationRaw);
      
      console.log('📍 Previous location:', { raw: previousLocationRaw, string: previousLocation });
      
      if (!previousLocation) {
        console.log('❌ No previous location found');
        const defaultData: TravelDistanceData = {
          distance: 0,
          duration: 0,
          fromLocation: 'Previous location not available'
        };
        setTravelData(defaultData);
        setEditDistance('0');
        setEditDuration('0');
        setEditFromLocation('Previous location not available');
        return;
      }
      
      // Calculate distance if we have both locations
      let result = { distance: 0, duration: 0 };
      if (currentLocation && previousLocation) {
        const calculatedResult = await calculateDistance(previousLocation, currentLocation);
        if (calculatedResult) {
          result = calculatedResult;
        }
      }
      
      const travelDistanceData: TravelDistanceData = {
        distance: result.distance,
        duration: result.duration,
        fromLocation: previousLocation,
      };
      
      setTravelData(travelDistanceData);
      setEditDistance(result.distance.toString());
      setEditDuration(result.duration.toString());
      setEditFromLocation(previousLocation);
      
      // Update shift in backend if shift has started
      if (updateShift && shiftData?.jobStarted) {
        console.log('💾 Saving travel data to backend...');
        await updateShift({
          travelDistance: result.distance,
          travelDuration: result.duration,
          travelFromLocation: previousLocation,
        });
      }
      
      console.log('✅ Travel distance calculation completed:', travelDistanceData);
      
    } catch (error) {
      console.error('❌ Error in travel distance calculation:', error);
      // Set fallback data on error
      const fallbackData: TravelDistanceData = {
        distance: 0,
        duration: 0,
        fromLocation: 'Error calculating distance'
      };
      setTravelData(fallbackData);
      setEditDistance('0');
      setEditDuration('0');
      setEditFromLocation('Error calculating distance');
    } finally {
      setIsCalculating(false);
    }
  }, [event, findPreviousShift, updateShift, shiftData?.jobStarted, isCalculating, getLocationString]);

  // Handle manual update
  const handleUpdate = async () => {
    if (!updateShift) {
      toast.error("Update function not available.");
      return;
    }

    const distance = parseFloat(editDistance) || 0;
    const duration = parseInt(editDuration) || 0;
    const fromLocation = editFromLocation.trim() || 'Manual entry';

    try {
      await updateShift({
        travelDistance: distance,
        travelDuration: duration,
        travelFromLocation: fromLocation
      });

      setTravelData({
        distance,
        duration,
        fromLocation
      });
      
      setIsEditing(false);
      toast.success("Travel distance updated successfully!");
    } catch (error) {
      console.error('Error updating travel distance:', error);
      toast.error("Failed to update travel distance.");
    }
  };

  // Auto-calculate when shift starts or component mounts
  useEffect(() => {
    if (shiftData?.jobStarted && !travelData && !isCalculating) {
      console.log('🎯 Shift started, auto-calculating travel distance...');
      calculateTravelDistance();
    }
  }, [shiftData?.jobStarted, travelData, isCalculating, calculateTravelDistance]);

  // Load existing travel data from backend
  useEffect(() => {
    if (shiftData?.travelDistance !== undefined && shiftData?.travelDistance !== null) {
      const existingData: TravelDistanceData = {
        distance: shiftData.travelDistance,
        duration: shiftData.travelDuration || 0,
        fromLocation: shiftData.travelFromLocation || 'Unknown location',
      };
      setTravelData(existingData);
      setEditDistance(existingData.distance.toString());
      setEditDuration(existingData.duration.toString());
      setEditFromLocation(existingData.fromLocation);
    } else if (!travelData && !isCalculating) {
      // Initialize with calculation if no existing data
      calculateTravelDistance();
    }
  }, [shiftData, travelData, isCalculating, calculateTravelDistance]);

  // Always show the component
  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Travel Distance
        </h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm flex items-center gap-1"
        >
          <Edit2 className="w-3 h-3" />
          Update
        </button>
      </div>

      {isCalculating && (
        <div className="text-center py-4">
          <div className="text-gray-600 dark:text-gray-400">Calculating distance...</div>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">From Location:</label>
              <input
                type="text"
                value={editFromLocation}
                onChange={(e) => setEditFromLocation(e.target.value)}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
                placeholder="Previous location"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Distance (km):</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={editDistance}
                onChange={(e) => setEditDistance(e.target.value)}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Duration (min):</label>
              <input
                type="number"
                min="0"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                className="w-full px-3 py-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-600"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm flex items-center gap-1"
            >
              <Save className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={calculateTravelDistance}
              disabled={isCalculating}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50"
            >
              {isCalculating ? 'Calculating...' : 'Calculate'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-300 mb-0.5">From Location:</label>
            <p className="text-sm text-gray-800 dark:text-gray-100 font-medium truncate" title={travelData?.fromLocation}>
              {travelData?.fromLocation || 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-300 mb-0.5">Distance:</label>
            <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">
              {travelData?.distance || 0} km
            </p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-300 mb-0.5">Duration:</label>
            <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">
              {travelData?.duration || 0} min
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelDistance; 