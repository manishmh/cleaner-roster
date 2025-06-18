"use client";

import { staffApi, type Staff } from "@/lib/api";
import React, { createContext, useContext, useEffect, useState } from "react";

interface StaffContextType {
  staff: Staff[];
  isLoading: boolean;
  error: string | null;
  refreshStaff: () => Promise<void>;
  addStaff: (newStaff: Staff) => void;
  updateStaff: (updatedStaff: Staff) => void;
  removeStaff: (staffId: number) => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export function useStaff() {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error("useStaff must be used within a StaffProvider");
  }
  return context;
}

interface StaffProviderProps {
  children: React.ReactNode;
}

export function StaffProvider({ children }: StaffProviderProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await staffApi.getAll();
      if (response.success && response.data) {
        setStaff(response.data.data);
      } else {
        setError("Failed to fetch staff");
      }
    } catch (err) {
      console.error("Error fetching staff:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch staff");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStaff = async () => {
    await fetchStaff();
  };

  const addStaff = (newStaff: Staff) => {
    // Only add staff if it has a valid ID
    if (newStaff && newStaff.id != null) {
      setStaff(prev => [newStaff, ...prev]);
    } else {
      console.warn("Attempted to add staff without valid ID:", newStaff);
      // Refresh the staff list to get the latest data from the server
      refreshStaff();
    }
  };

  const updateStaff = (updatedStaff: Staff) => {
    setStaff(prev => prev.map(s => s.id === updatedStaff.id ? updatedStaff : s));
  };

  const removeStaff = (staffId: number) => {
    setStaff(prev => prev.filter(s => s.id !== staffId));
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const value: StaffContextType = {
    staff,
    isLoading,
    error,
    refreshStaff,
    addStaff,
    updateStaff,
    removeStaff,
  };

  return (
    <StaffContext.Provider value={value}>
      {children}
    </StaffContext.Provider>
  );
} 