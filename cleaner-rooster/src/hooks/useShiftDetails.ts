import {
    clientApi,
    locationApi,
    shiftApi,
    teamApi,
    type Client,
    type Location,
    type Shift,
    type Team
} from '@/lib/api';
import { useEffect, useState } from 'react';

interface ShiftDetailsData {
  shift: Shift | null;
  allClients: Client[];
  allLocations: Location[];
  allTeams: Team[];
}

interface UseShiftDetailsReturn {
  data: ShiftDetailsData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateShift: (shiftData: Partial<Shift>) => Promise<void>;
  addInstruction: (instructionText: string, instructionType?: string) => Promise<void>;
  addMessage: (messageText: string) => Promise<void>;
}

export function useShiftDetails(shiftId: number): UseShiftDetailsReturn {
  const [data, setData] = useState<ShiftDetailsData>({
    shift: null,
    allClients: [],
    allLocations: [],
    allTeams: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch shift details and all reference data in parallel
      const [shiftResponse, clientsResponse, locationsResponse, teamsResponse] = await Promise.all([
        shiftApi.getById(shiftId),
        clientApi.getAll({ isActive: true }),
        locationApi.getAll(),
        teamApi.getAll(),
      ]);

      setData({
        shift: shiftResponse.success && shiftResponse.data ? shiftResponse.data.data : null,
        allClients: clientsResponse.success && clientsResponse.data ? clientsResponse.data.data : [],
        allLocations: locationsResponse.success && locationsResponse.data ? locationsResponse.data.data : [],
        allTeams: teamsResponse.success && teamsResponse.data ? teamsResponse.data.data : [],
      });
    } catch (err) {
      console.error('Error fetching shift details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch shift details');
    } finally {
      setLoading(false);
    }
  };

  const updateShift = async (shiftData: Partial<Shift>): Promise<void> => {
    try {
      const response = await shiftApi.update(shiftId, shiftData);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update shift');
      }
      
      // Refetch shift data to ensure we have the latest state
      await fetchData();
    } catch (err) {
      console.error('Error updating shift:', err);
      throw err;
    }
  };

  const addInstruction = async (instructionText: string, instructionType: string = 'text'): Promise<void> => {
    try {
      const response = await shiftApi.addInstruction(shiftId, { instructionText, instructionType });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to add instruction');
      }
      
      // Refetch shift data to get updated instructions
      await fetchData();
    } catch (err) {
      console.error('Error adding instruction:', err);
      throw err;
    }
  };

  const addMessage = async (messageText: string, createdBy?: number): Promise<void> => {
    try {
      const response = await shiftApi.addMessage(shiftId, { messageText, createdBy });
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to add message');
      }
      
      // Refetch shift data to get updated messages
      await fetchData();
    } catch (err) {
      console.error('Error adding message:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (shiftId) {
      fetchData();
    }
  }, [shiftId]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    updateShift,
    addInstruction,
    addMessage,
  };
} 