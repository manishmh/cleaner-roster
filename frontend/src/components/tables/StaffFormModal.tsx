"use client";

import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import { Modal } from "@/components/ui/modal";
import Select from "@/components/ui/select/Select";
import type { Staff } from "@/lib/api";
import React, { useEffect, useState } from "react";

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StaffFormData) => void;
  initialData?: Staff;
}

export interface StaffFormData {
  name: string;
  email?: string;
  phone?: string;
  role: "cleaner" | "supervisor" | "staff";
  access: string[];
  isActive: boolean;
}

const initialFormData: StaffFormData = {
  name: "",
  email: "",
  phone: "",
  role: "cleaner",
  access: [],
  isActive: true,
};

const roleOptions = [
  { value: "cleaner", label: "Cleaner" },
  { value: "supervisor", label: "Supervisor" },
  { value: "staff", label: "Staff" },
];

const accessOptions = [
  { value: "Cleaning", label: "Cleaning" },
  { value: "Inventory", label: "Inventory" },
  { value: "Management", label: "Management" },
];

export default function StaffFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: StaffFormModalProps) {
  const [formData, setFormData] = useState<StaffFormData>(initialFormData);
  const [isInitialized, setIsInitialized] = useState(false);
  const isEditing = !!initialData;

  // Initialize form data only when modal opens or when switching between add/edit
  useEffect(() => {
    if (isOpen && !isInitialized) {
      if (initialData) {
        // Editing mode - populate with existing data
        setFormData({
          name: initialData.name || "",
          email: initialData.email || "",
          phone: initialData.phone || "",
          role: initialData.role || "cleaner",
          access: Array.isArray(initialData.access) ? initialData.access : [],
          isActive: initialData.isActive ?? true,
        });
      } else {
        // Adding mode - reset to initial data
        setFormData(initialFormData);
      }
      setIsInitialized(true);
    }
  }, [isOpen, initialData, isInitialized]);

  // Reset initialization flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClose = () => {
    setIsInitialized(false);
    onClose();
  };

  const handleAccessChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      access: prev.access.includes(value)
        ? prev.access.filter((item) => item !== value)
        : [...prev.access, value],
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {isEditing ? "Edit Staff Member" : "Add New Staff Member"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter name"
              required
            />
          </div>

          <div>
            <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <Input
              type="email"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="Enter email"
            />
          </div>

          <div>
            <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Phone
            </label>
            <Input
              type="tel"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Role *
            </label>
            <Select
              value={formData.role}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, role: e.target.value as "cleaner" | "supervisor" | "staff" }))
              }
              options={roleOptions}
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Access Permissions
            </label>
            <div className="flex flex-wrap gap-2">
              {accessOptions.map((option) => (
                <label
                  key={option.value}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={formData.access.includes(option.value)}
                    onChange={() => handleAccessChange(option.value)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <Select
              value={formData.isActive ? "active" : "inactive"}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isActive: e.target.value === "active" }))
              }
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
              required
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="px-6"
          >
            Cancel
          </Button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            {isEditing ? "Update Staff Member" : "Add Staff Member"}
          </button>
        </div>
      </form>
    </Modal>
  );
}