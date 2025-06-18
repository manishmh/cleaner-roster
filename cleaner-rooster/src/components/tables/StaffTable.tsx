"use client";

import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import ConfirmationModal from "@/components/ui/modal/ConfirmationModal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useStaff } from "@/context/StaffContext";
import { PlusIcon } from "@/icons";
import { staffApi, type CreateStaffRequest, type Staff } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import StaffFormModal from "./StaffFormModal";

export interface StaffFormData {
  name: string;
  email?: string;
  phone?: string;
  role: "cleaner" | "supervisor" | "staff";
  access: string[];
  isActive: boolean;
}

export default function StaffTable() {
  const { staff, isLoading, updateStaff, removeStaff, refreshStaff } = useStaff();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);

  const handleAddStaff = () => {
    setSelectedStaff(undefined);
    setIsModalOpen(true);
  };

  const handleEditStaff = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setIsModalOpen(true);
  };

  const handleSubmit = async (staffData: StaffFormData) => {
    if (isSubmitting) return; // Prevent double submission
    
    try {
      setIsSubmitting(true);
      
      if (selectedStaff) {
        // Update existing staff member
        const updateData: Partial<CreateStaffRequest> = {
          name: staffData.name,
          email: staffData.email,
          phone: staffData.phone,
          role: staffData.role,
          access: staffData.access,
          isActive: staffData.isActive,
        };
        const response = await staffApi.update(selectedStaff.id.toString(), updateData);
        if (response.success && response.data) {
          updateStaff(response.data);
          setIsModalOpen(false);
          setSelectedStaff(undefined);
          toast.success("Staff member updated successfully");
        } else {
          toast.error("Failed to update staff member");
        }
      } else {
        // Add new staff member
        const createData: CreateStaffRequest = {
          name: staffData.name,
          email: staffData.email,
          phone: staffData.phone,
          role: staffData.role,
          access: staffData.access,
          isActive: staffData.isActive,
        };
        const response = await staffApi.create(createData);
        if (response.success && response.data) {
          await refreshStaff();
          setIsModalOpen(false);
          toast.success("Staff member created successfully");
        } else {
          toast.error("Failed to create staff member");
        }
      }
    } catch (error) {
      console.error("Error submitting staff data:", error);
      toast.error("An error occurred while saving");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (staffMember: Staff) => {
    setStaffToDelete(staffMember);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;
    
    try {
      setIsSubmitting(true);
      const response = await staffApi.delete(staffToDelete.id.toString());
      if (response.success) {
        removeStaff(staffToDelete.id);
        toast.success("Staff member deleted successfully");
      } else {
        toast.error("Failed to delete staff member");
      }
    } catch (error) {
      console.error("Error deleting staff member:", error);
      toast.error("Failed to delete staff member");
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
      setStaffToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setStaffToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading staff...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          variant="primary"
          onClick={handleAddStaff}
          className="flex items-center gap-2"
          disabled={isSubmitting}
        >
          <PlusIcon className="h-4 w-4" />
          Add Staff Member
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1102px]">
            <Table>
              {/* Table Header */}
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Staff Member
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Role
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Contact
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Access
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Status
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No staff members found
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((staffMember) => (
                    <TableRow
                      key={staffMember.id}
                      className="hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    >
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10">
                            {staffMember.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {staffMember.name}
                            </div>
                            {staffMember.email && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {staffMember.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <Badge
                          size="sm"
                          color={
                            staffMember.role === "supervisor" ? "warning" :
                            staffMember.role === "staff" ? "info" : "success"
                          }
                        >
                          {staffMember.role.charAt(0).toUpperCase() + staffMember.role.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {staffMember.phone || "No phone"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <div className="flex flex-wrap gap-1">
                          {staffMember.access && staffMember.access.length > 0 ? (
                            staffMember.access.map((access, index) => (
                              <Badge key={index} size="sm" color="info">
                                {access}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-gray-400">No access</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        <Badge
                          size="sm"
                          color={staffMember.isActive ? "success" : "error"}
                        >
                          {staffMember.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStaff(staffMember)}
                            disabled={isSubmitting}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(staffMember)}
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

      <StaffFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStaff(undefined);
        }}
        onSubmit={handleSubmit}
        initialData={selectedStaff}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Staff Member"
        message={staffToDelete ? `Are you sure you want to delete ${staffToDelete.name}? This action cannot be undone.` : "Are you sure you want to delete this staff member?"}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}