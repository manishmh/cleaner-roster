"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';

interface Staff {
  id: number;
  name: string;
  email?: string;
  roleInShift: string;
}

interface SendRosterEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffMembers: Staff[];
  weekStart: string; // ISO date string for start of week
}

export default function SendRosterEmailModal({
  isOpen,
  onClose,
  staffMembers,
  weekStart
}: SendRosterEmailModalProps) {
  const [email, setEmail] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<number>(staffMembers[0]?.id || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedStaff = staffMembers.find(s => s.id === selectedStaffId);

  // Auto-fill email when staff member is selected
  const handleStaffChange = (staffId: number) => {
    setSelectedStaffId(staffId);
    const staff = staffMembers.find(s => s.id === staffId);
    if (staff?.email) {
      setEmail(staff.email);
    }
  };

  // Auto-fill email on initial load
  React.useEffect(() => {
    if (staffMembers.length > 0 && !email) {
      const initialStaff = staffMembers[0];
      if (initialStaff?.email) {
        setEmail(initialStaff.email);
      }
    }
  }, [staffMembers, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    if (!selectedStaff) {
      toast.error('Please select a staff member');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/send-roster-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          staffId: selectedStaff.id,
          staffName: selectedStaff.name,
          weekStart,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Roster email sent successfully to ${email.trim()}`);
        setEmail('');
        onClose();
      } else {
        toast.error(result.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending roster email:', error);
      toast.error('Failed to send email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('');
      setSelectedStaffId(staffMembers[0]?.id || 0);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Format week dates for display
  const weekStartDate = new Date(weekStart);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const weekStartFormatted = weekStartDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const weekEndFormatted = weekEndDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 bg-opacity-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-md w-[90vw] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Send Roster Email
          </h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <strong>Week:</strong> {weekStartFormatted} - {weekEndFormatted}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter the email address where you want to send the roster link. The recipient will receive a link to view their weekly schedule.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Staff Selection */}
          {staffMembers.length > 1 && (
            <div className="mb-4">
              <label htmlFor="staff" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Staff Member <span className="text-red-500">*</span>
              </label>
              <select
                id="staff"
                value={selectedStaffId}
                onChange={(e) => handleStaffChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100 disabled:opacity-50"
                disabled={isSubmitting}
                required
              >
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.roleInShift})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Single staff member display */}
          {staffMembers.length === 1 && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Staff Member:</strong> {staffMembers[0].name} ({staffMembers[0].roleInShift})
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            {selectedStaff?.email && (
              <div className="text-xs text-green-600 dark:text-green-400 mb-1">
                ✓ Auto-filled from staff profile
              </div>
            )}
            {selectedStaff && !selectedStaff.email && (
              <div className="text-xs text-amber-600 dark:text-amber-400 mb-1">
                ⚠ No email address on file for {selectedStaff.name}
              </div>
            )}
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={selectedStaff?.email ? selectedStaff.email : "Enter email address"}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100 disabled:opacity-50"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Email
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 