"use client";

import { shiftApi, staffApi, type Shift, type Staff } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

 
type RosterPageProps = Record<string, never>;

function RosterContent() {
  const searchParams = useSearchParams();
  const staffId = searchParams?.get('staffId');
  const weekStart = searchParams?.get('weekStart'); // ISO date string for start of week
  
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRosterData = async () => {
      if (!staffId || !weekStart) {
        setError('Missing required parameters');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch staff details
        const staffResponse = await staffApi.getById(staffId);
        if (!staffResponse.success || !staffResponse.data) {
          throw new Error('Staff member not found');
        }
        setStaff(staffResponse.data);

        // Fetch all shifts
        const shiftsResponse = await shiftApi.getAll();
        if (!shiftsResponse.success || !shiftsResponse.data) {
          throw new Error('Failed to fetch shifts');
        }

        // Filter shifts for this staff member and week
        const weekStartDate = new Date(weekStart);
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekEndDate.getDate() + 7);

        const staffShifts = shiftsResponse.data.data.filter(shift => {
          // Check if staff is assigned to this shift
          const isAssigned = shift.staff.some(s => s.id === parseInt(staffId));
          if (!isAssigned) return false;

          // Check if shift is within the week
          const shiftDate = new Date(shift.startTime);
          return shiftDate >= weekStartDate && shiftDate < weekEndDate;
        });

        // Sort shifts by start time
        staffShifts.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        setShifts(staffShifts);

      } catch (err) {
        console.error('Error fetching roster data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load roster data');
      } finally {
        setLoading(false);
      }
    };

    fetchRosterData();
  }, [staffId, weekStart]);

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const dayStr = date.toLocaleDateString('en-US', { 
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return `${timeStr} ${dayStr}`;
  };

  const formatFinishTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    const dayStr = date.toLocaleDateString('en-US', { 
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return `Finish Time: ${timeStr} ${dayStr}`;
  };

  const getSupervisorName = (shift: Shift) => {
    const supervisor = shift.staff.find(s => s.roleInShift === 'supervisor');
    return supervisor ? `${supervisor.name} (S)` : '';
  };

  const getCleanerName = (shift: Shift) => {
    const cleaner = shift.staff.find(s => s.roleInShift !== 'supervisor');
    return cleaner ? cleaner.name : '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading roster...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Staff member not found</p>
        </div>
      </div>
    );
  }

  const weekStartDate = weekStart ? new Date(weekStart) : new Date();
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        

        {/* Roster Title */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Roster</h2>
          <p className="text-gray-600">
            Week of {weekStartDate.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })} - {weekEndDate.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          <p className="text-lg font-medium text-blue-600 mt-2">
            {staff.name} ({staff.role})
          </p>
        </div>

        {/* Shifts List */}
        <div className="bg-white rounded-lg shadow-sm">
          {shifts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No shifts scheduled for this week</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {shifts.map((shift) => (
                <div key={shift.id} className="p-6">
                  <div className="flex flex-col space-y-2">
                    {/* Main shift info */}
                    <div className="text-lg font-medium text-gray-900">
                      {formatDateTime(shift.startTime)} {getSupervisorName(shift)} {getCleanerName(shift)}
                    </div>
                    
                    {/* Finish time */}
                    <div className="text-sm text-gray-600">
                      {formatFinishTime(shift.endTime)}
                    </div>

                    {/* Location if available */}
                    {shift.locations && shift.locations.length > 0 && (
                      <div className="text-sm text-gray-600">
                        Location: {(() => {
                          const locationWrapper = shift.locations[0];
                          if ('locations' in locationWrapper) {
                            return locationWrapper.locations.formattedAddress || locationWrapper.locations.address || locationWrapper.locations.name;
                          }
                          return locationWrapper.formattedAddress || locationWrapper.address || locationWrapper.name;
                        })()}
                      </div>
                    )}

                    {/* Client if available */}
                    {shift.clients && shift.clients.length > 0 && (
                      <div className="text-sm text-gray-600">
                        Client: {shift.clients[0].name}
                      </div>
                    )}

                    {/* Instructions if available */}
                    {shift.shiftInstructions && (
                      <div className="text-sm text-gray-600 mt-2">
                        <span className="font-medium">Instructions:</span> {shift.shiftInstructions}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>This roster is generated automatically. Please contact your supervisor for any questions.</p>
        </div>
      </div>
    </div>
  );
}

export default function RosterPage({}: RosterPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading roster...</p>
        </div>
      </div>
    }>
      <RosterContent />
    </Suspense>
  );
}