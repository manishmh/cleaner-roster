'use client'
import { clientApi, type Client } from '@/lib/api';
import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from 'sonner';

interface CalendarClientContextType {
  clientList: Client[];
  loading: boolean;
  addClient: (client: Partial<Client>) => Promise<void>;
  updateClient: (client: Partial<Client>) => Promise<void>;
  refetch: () => Promise<void>;
}

const CalendarClientContext = createContext<CalendarClientContextType | undefined>(undefined);

export const useCalendarClient = () => {
  const ctx = useContext(CalendarClientContext);
  if (!ctx) throw new Error('useCalendarClient must be used within CalendarClientProvider');
  return ctx;
};

export const CalendarClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clientList, setClientList] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await clientApi.getAll({ isActive: true });
      if (response.success && response.data) {
        setClientList(response.data.data);
      } else {
        console.error('Failed to fetch clients:', response.error);
        // Only show toast error if it's not a network error
        if (!response.error?.includes('NetworkError') && !response.error?.includes('fetch')) {
          toast.error('Failed to load clients');
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      // Only show toast error if it's not a network error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('NetworkError') && !errorMessage.includes('fetch')) {
        toast.error('Failed to load clients');
      }
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (clientData: Partial<Client>) => {
    try {
      const response = await clientApi.create({
        name: clientData.name || '',
        email: clientData.email || '',
        phone: clientData.phone,
        company: clientData.company,
        abn: clientData.abn,
        acn: clientData.acn,
        address: clientData.address,
        clientInstruction: clientData.clientInstruction,
        clientInfo: clientData.clientInfo,
        propertyInfo: clientData.propertyInfo,
      });
      if (response.success && response.data?.data) {
        setClientList(prev => [...prev, response.data!.data]);
        toast.success('Client added successfully');
      } else {
        throw new Error(response.error || 'Failed to add client');
      }
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Failed to add client');
      throw error;
    }
  };

  const updateClient = async (clientData: Partial<Client>) => {
    try {
      if (!clientData.id) {
        throw new Error('Client ID is required for update');
      }
      
      const response = await clientApi.update(clientData.id, {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        company: clientData.company,
        abn: clientData.abn,
        acn: clientData.acn,
        address: clientData.address,
        clientInstruction: clientData.clientInstruction,
        clientInfo: clientData.clientInfo,
        propertyInfo: clientData.propertyInfo,
      });
      if (response.success && response.data?.data) {
        setClientList(prev => prev.map(c => c.id === clientData.id ? response.data!.data : c));
        toast.success('Client updated successfully');
      } else {
        throw new Error(response.error || 'Failed to update client');
      }
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
      throw error;
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <CalendarClientContext.Provider value={{ 
      clientList, 
      loading, 
      addClient, 
      updateClient, 
      refetch: fetchClients 
    }}>
      {children}
    </CalendarClientContext.Provider>
  );
} 