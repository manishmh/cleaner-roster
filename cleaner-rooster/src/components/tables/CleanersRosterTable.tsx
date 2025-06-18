"use client";

import { cleanerRosterApi, type CleanerRoster } from "@/lib/api";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import ConfirmationModal from "../ui/modal/ConfirmationModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import CleanersRosterForm, { type CleanerRosterFormData } from './CleanersRosterForm';

interface CleanersRosterTableProps {
  refreshTrigger?: number; // Used to trigger refresh from parent
}

export default function CleanersRosterTable({ refreshTrigger }: CleanersRosterTableProps) {
  const [roster, setRoster] = useState<CleanerRoster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoster, setSelectedRoster] = useState<CleanerRoster | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rosterToDelete, setRosterToDelete] = useState<CleanerRoster | null>(null);

  const fetchRoster = async () => {
    try {
      setIsLoading(true);
      const response = await cleanerRosterApi.getAll();
      if (response.success && response.data) {
        setRoster(response.data.data);
      } else {
        toast.error("Failed to fetch roster");
      }
    } catch (error) {
      console.error("Error fetching roster:", error);
      toast.error("Failed to fetch roster");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, []);

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchRoster();
    }
  }, [refreshTrigger]);

  const handleEditRoster = (rosterEntry: CleanerRoster) => {
    setSelectedRoster(rosterEntry);
    setIsModalOpen(true);
  };

  const handleSubmit = async (rosterData: CleanerRosterFormData) => {
    if (isSubmitting) return; // Prevent double submission
    
    try {
      setIsSubmitting(true);
      
      if (selectedRoster) {
        // Update existing roster entry
        const response = await cleanerRosterApi.update(selectedRoster.id.toString(), rosterData);
        if (response.success) {
          await fetchRoster(); // Refresh the list
          setIsModalOpen(false);
          setSelectedRoster(undefined);
          toast.success("Roster entry updated successfully");
        } else {
          toast.error("Failed to update roster entry");
        }
      } else {
        // Add new roster entry
        const response = await cleanerRosterApi.create(rosterData);
        if (response.success) {
          await fetchRoster(); // Refresh the list
          setIsModalOpen(false);
          toast.success("Roster entry created successfully");
        } else {
          toast.error("Failed to create roster entry");
        }
      }
    } catch (error) {
      console.error("Error submitting roster data:", error);
      toast.error("An error occurred while saving");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (rosterEntry: CleanerRoster) => {
    setRosterToDelete(rosterEntry);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!rosterToDelete) return;
    
    try {
      setIsSubmitting(true);
      const response = await cleanerRosterApi.delete(rosterToDelete.id.toString());
      if (response.success) {
        await fetchRoster(); // Refresh the list
        toast.success("Roster entry deleted successfully");
      } else {
        toast.error("Failed to delete roster entry");
      }
    } catch (error) {
      console.error("Error deleting roster entry:", error);
      toast.error("Failed to delete roster entry");
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
      setRosterToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setRosterToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading roster...</div>
      </div>
    );
  }

  return (
    <div>
      <CleanersRosterForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRoster(undefined);
        }}
        onSubmit={handleSubmit}
        initialData={selectedRoster}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Roster Entry"
        message={`Are you sure you want to delete this roster entry? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isSubmitting}
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1200px] max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Client
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Booking Info
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Time Details
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Location
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Instructions
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Status
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {roster.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No roster entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  roster.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="text-brand-500 hover:text-brand-600 font-medium">
                          {task.clientLink}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <div>
                          <p>Date: {task.bookingDate}</p>
                          <p>Booked: {task.bookingTime}</p>
                          <p>Scheduled: {task.scheduledTime}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <div>
                          <p>Logged: {task.loggedTime || "N/A"}</p>
                          <p>In: {task.inTime || "N/A"}</p>
                          <p>Out: {task.outTime || "N/A"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <div>
                          {task.locationGoogleMapLink ? (
                            <a
                              href={task.locationGoogleMapLink}
                              className="text-brand-500 hover:text-brand-600 block"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {task.locationAddress}
                            </a>
                          ) : (
                            <span>{task.locationAddress}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <div>
                          <p className="font-medium">Shift Instructions:</p>
                          <p>{task.shiftInstructions || "No instructions"}</p>
                          {task.supervisorQuestions && task.supervisorQuestions.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium text-xs">Questions:</p>
                              {task.supervisorQuestions.map((q, idx) => (
                                <div key={idx} className="mt-1">
                                  <p className="text-xs text-gray-400">{q.question}</p>
                                  <p className="text-sm">{q.answer || "Pending"}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <Badge
                          size="sm"
                          color={
                            task.status === "Completed"
                              ? "success"
                              : task.status === "Pending"
                              ? "warning"
                              : task.status === "In Progress"
                              ? "info"
                              : "error"
                          }
                        >
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRoster(task)}
                            disabled={isSubmitting}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(task)}
                            disabled={isSubmitting}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
} 