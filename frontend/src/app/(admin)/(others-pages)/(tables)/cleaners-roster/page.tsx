"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CleanersRosterForm, { type CleanerRosterFormData } from "@/components/tables/CleanersRosterForm";
import CleanersRosterTable from "@/components/tables/CleanersRosterTable";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";
import { cleanerRosterApi } from "@/lib/api";
import React, { useState } from "react";
import { toast } from "sonner";

// export const metadata: Metadata = {
//   title: "Cleaners Roster | Rooster - Next.js Dashboard",
//   description: "Manage and track cleaning staff assignments and schedules",
// };

export default function CleanersRoster() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddRoster = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (rosterData: CleanerRosterFormData) => {
    if (isSubmitting) return; // Prevent double submission
    
    try {
      setIsSubmitting(true);
      
      const response = await cleanerRosterApi.create(rosterData);
      if (response.success) {
        setIsModalOpen(false);
        toast.success("Roster entry created successfully");
        // Trigger refresh of the table
        setRefreshTrigger(prev => prev + 1);
      } else {
        toast.error("Failed to create roster entry");
      }
    } catch (error) {
      console.error("Error creating roster entry:", error);
      toast.error("An error occurred while saving");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Cleaners Roster" />
      <div className="space-y-6">
        <ComponentCard title="Roster">
          <div className="mb-4 flex justify-end">
            <Button
              variant="primary"
              onClick={handleAddRoster}
              className="flex items-center gap-2"
              disabled={isSubmitting}
            >
              <PlusIcon className="h-4 w-4" />
              Add New Roster
            </Button>
          </div>
          <CleanersRosterTable refreshTrigger={refreshTrigger} />
        </ComponentCard>
      </div>

      <CleanersRosterForm 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSubmit={handleSubmit}
      />
    </div>
  );
} 