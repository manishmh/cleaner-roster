"use client";

import React, { ChangeEvent, FormEvent, useState } from "react";
import PhoneInput from "../form/group-input/PhoneInput";
import Button from "../ui/button/Button";
import Input from "../ui/input/Input";
import Modal from "../ui/modal/Modal";
import Select from "../ui/select/Select";

type EntityType = "Supervisor" | "Cleaner" | "Team" | "Client";

interface Entity {
  id?: number;
  type: EntityType;
  name: string;
  contact: string;
  email: string;
  status: "Active" | "Inactive";
  mobileUsername?: string;
  supervisor?: string;
  cleaners?: string[];
  address?: string;
}

interface EntityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Entity) => void;
  initialData?: Entity;
}

export default function EntityFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: EntityFormModalProps) {
  const [formData, setFormData] = useState<Entity>({
    type: initialData?.type || "Supervisor",
    name: initialData?.name || "",
    contact: initialData?.contact || "",
    email: initialData?.email || "",
    status: initialData?.status || "Active",
    mobileUsername: initialData?.mobileUsername || "",
    supervisor: initialData?.supervisor || "",
    cleaners: initialData?.cleaners || [],
    address: initialData?.address || "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case "Supervisor":
        return (
          <Input
            label="Mobile Username"
            name="mobileUsername"
            value={formData.mobileUsername}
            onChange={handleInputChange}
            placeholder="Enter mobile username"
          />
        );
      case "Team":
        return (
          <>
            <Input
              label="Supervisor"
              name="supervisor"
              value={formData.supervisor}
              onChange={handleInputChange}
              placeholder="Enter supervisor name"
            />
            <Input
              label="Cleaners"
              name="cleaners"
              value={formData.cleaners?.join(", ") || ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({
                  ...formData,
                  cleaners: e.target.value.split(",").map((s) => s.trim()),
                })
              }
              placeholder="Enter cleaner names (comma separated)"
            />
          </>
        );
      case "Client":
        return (
          <Input
            label="Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Enter address"
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Entity">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Entity Type"
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          options={[
            { value: "Supervisor", label: "Supervisor" },
            { value: "Cleaner", label: "Cleaner" },
            { value: "Team", label: "Team" },
            { value: "Client", label: "Client" },
          ]}
        />

        <Input
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="Enter name"
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Phone Number
          </label>
          <PhoneInput
            countries={[
              { code: "US", label: "+1" },
              { code: "GB", label: "+44" },
              { code: "CA", label: "+1" },
              { code: "AU", label: "+61" },
            ]}
            placeholder="+1 (555) 000-0000"
            value={formData.contact}
            onChange={(phoneNumber) => 
              setFormData((prev) => ({ ...prev, contact: phoneNumber }))
            }
          />
        </div>

        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Enter email"
          required
        />

        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleInputChange}
          options={[
            { value: "Active", label: "Active" },
            { value: "Inactive", label: "Inactive" },
          ]}
        />

        {renderTypeSpecificFields()}

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button>Save</Button>
        </div>
      </form>
    </Modal>
  );
} 