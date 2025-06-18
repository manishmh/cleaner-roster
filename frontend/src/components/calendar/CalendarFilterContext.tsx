'use client'
import React, { createContext, useContext, useState } from 'react';

export type FilterCategory = 'Staff' | 'Client' | 'Team';

interface CalendarFilterContextType {
  filterCategory: FilterCategory;
  setFilterCategory: (cat: FilterCategory) => void;
  filterChecked: string[];
  setFilterChecked: (ids: string[]) => void;
}

const CalendarFilterContext = createContext<CalendarFilterContextType | undefined>(undefined);

export const useCalendarFilter = () => {
  const ctx = useContext(CalendarFilterContext);
  if (!ctx) throw new Error('useCalendarFilter must be used within CalendarFilterProvider');
  return ctx;
};

export const CalendarFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('Staff');
  const [filterChecked, setFilterChecked] = useState<string[]>([]);

  return (
    <CalendarFilterContext.Provider value={{ filterCategory, setFilterCategory, filterChecked, setFilterChecked }}>
      {children}
    </CalendarFilterContext.Provider>
  );
}; 