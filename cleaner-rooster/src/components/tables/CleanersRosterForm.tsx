"use client";
import Form from "@/components/form/Form";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import {
  BoxIcon,
  CalenderIcon,
  CheckLineIcon,
  CloseLineIcon,
  PlusIcon,
  TaskIcon,
  TimeIcon,
  TrashBinIcon,
  UserIcon,
} from "@/icons";
import type { CleanerRoster } from "@/lib/api";
import React, { useEffect, useState } from "react";
import { Modal } from "../ui/modal";

export interface CleanerRosterFormData {
  clientLink: string;
  bookingDate: string;
  bookingTime: string;
  scheduledTime: string;
  loggedTime?: string;
  inTime?: string;
  outTime?: string;
  locationAddress: string;
  locationGoogleMapLink?: string;
  startLocationAddress?: string;
  startLocationGoogleMapLink?: string;
  endLocationAddress?: string;
  endLocationGoogleMapLink?: string;
  shiftInstructions?: string;
  supervisorQuestions: Array<{
    question: string;
    type: "OK" | "YES_NO" | "TEXT";
    answer?: string;
  }>;
  mobileMessage?: {
    text: string;
    imageUrl?: string;
  };
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
}

interface CleanersRosterFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CleanerRosterFormData) => void;
  initialData?: CleanerRoster;
}

const statusOptions = [
  { value: "Pending", label: "Pending" },
  { value: "In Progress", label: "In Progress" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
] as const;

const questionTypeOptions = [
  { value: "OK", label: "OK" },
  { value: "YES_NO", label: "Yes/No" },
  { value: "TEXT", label: "Text" },
] as const;

const defaultFormData: CleanerRosterFormData = {
  clientLink: "",
  bookingDate: "",
  bookingTime: "",
  scheduledTime: "",
  loggedTime: "",
  inTime: "",
  outTime: "",
  locationAddress: "",
  locationGoogleMapLink: "",
  startLocationAddress: "",
  startLocationGoogleMapLink: "",
  endLocationAddress: "",
  endLocationGoogleMapLink: "",
  shiftInstructions: "",
  supervisorQuestions: [],
  status: "Pending",
};

export default function CleanersRosterForm({ isOpen, onClose, onSubmit, initialData }: CleanersRosterFormProps) {
  const [formData, setFormData] = useState<CleanerRosterFormData>(defaultFormData);
  const [isInitialized, setIsInitialized] = useState(false);
  const isEditing = !!initialData;

  // Initialize form data only when modal opens or when switching between add/edit
  useEffect(() => {
    if (isOpen && !isInitialized) {
      if (initialData) {
        // Editing mode - populate with existing data
        setFormData({
          clientLink: initialData.clientLink || "",
          bookingDate: initialData.bookingDate || "",
          bookingTime: initialData.bookingTime || "",
          scheduledTime: initialData.scheduledTime || "",
          loggedTime: initialData.loggedTime || "",
          inTime: initialData.inTime || "",
          outTime: initialData.outTime || "",
          locationAddress: initialData.locationAddress || "",
          locationGoogleMapLink: initialData.locationGoogleMapLink || "",
          startLocationAddress: initialData.startLocationAddress || "",
          startLocationGoogleMapLink: initialData.startLocationGoogleMapLink || "",
          endLocationAddress: initialData.endLocationAddress || "",
          endLocationGoogleMapLink: initialData.endLocationGoogleMapLink || "",
          shiftInstructions: initialData.shiftInstructions || "",
          supervisorQuestions: Array.isArray(initialData.supervisorQuestions) ? initialData.supervisorQuestions : [],
          mobileMessage: initialData.mobileMessage,
          status: initialData.status || "Pending",
        });
      } else {
        // Adding mode - reset to initial data
        setFormData(defaultFormData);
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

  const handleChange = (field: keyof CleanerRosterFormData, value: string | Date) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value instanceof Date ? value.toISOString().split('T')[0] : value,
    }));
  };

  const handleAddQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      supervisorQuestions: [
        ...prev.supervisorQuestions,
        { question: "", type: "OK", answer: "" },
      ],
    }));
  };

  const handleQuestionChange = (
    index: number,
    field: "question" | "type" | "answer",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      supervisorQuestions: prev.supervisorQuestions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  };

  const handleRemoveQuestion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      supervisorQuestions: prev.supervisorQuestions.filter((_, i) => i !== index),
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-4xl p-6 mt-60 mb-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {isEditing ? "Edit Roster" : "Add New Roster"}
        </h2>
      </div>

      <Form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Information */}
          <div className="space-y-4">
            <div>
              <Label>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Client Link *
                </div>
              </Label>
              <Input
                type="text"
                defaultValue={formData.clientLink}
                onChange={(e) => handleChange("clientLink", e.target.value)}
                placeholder="Enter client link"
              />
            </div>

            {/* Booking Details */}
            <div>
              <Label>
                <div className="flex items-center gap-2">
                  <CalenderIcon className="w-4 h-4" />
                  Booking Date *
                </div>
              </Label>
              <Input
                type="date"
                defaultValue={formData.bookingDate}
                onChange={(e) => handleChange("bookingDate", e.target.value)}
              />
            </div>

            <div>
              <Label>
                <div className="flex items-center gap-2">
                  <TimeIcon className="w-4 h-4" />
                  Booking Time *
                </div>
              </Label>
              <Input
                type="time"
                defaultValue={formData.bookingTime}
                onChange={(e) => handleChange("bookingTime", e.target.value)}
              />
            </div>

            <div>
              <Label>
                <div className="flex items-center gap-2">
                  <TimeIcon className="w-4 h-4" />
                  Scheduled Time *
                </div>
              </Label>
              <Input
                type="time"
                defaultValue={formData.scheduledTime}
                onChange={(e) => handleChange("scheduledTime", e.target.value)}
              />
            </div>
          </div>

          {/* Time Tracking */}
          <div className="space-y-4">
            <div>
              <Label>
                <div className="flex items-center gap-2">
                  <TimeIcon className="w-4 h-4" />
                  Logged Time
                </div>
              </Label>
              <Input
                type="time"
                defaultValue={formData.loggedTime || ""}
                onChange={(e) => handleChange("loggedTime", e.target.value)}
              />
            </div>

            <div>
              <Label>
                <div className="flex items-center gap-2">
                  <TimeIcon className="w-4 h-4" />
                  In Time
                </div>
              </Label>
              <Input
                type="time"
                defaultValue={formData.inTime || ""}
                onChange={(e) => handleChange("inTime", e.target.value)}
              />
            </div>

            <div>
              <Label>
                <div className="flex items-center gap-2">
                  <TimeIcon className="w-4 h-4" />
                  Out Time
                </div>
              </Label>
              <Input
                type="time"
                defaultValue={formData.outTime || ""}
                onChange={(e) => handleChange("outTime", e.target.value)}
              />
            </div>

            <div>
              <Label>
                <div className="flex items-center gap-2">
                  <TaskIcon className="w-4 h-4" />
                  Status
                </div>
              </Label>
              <Select
                defaultValue={formData.status}
                onChange={(value) => handleChange("status", value)}
                options={[...statusOptions]}
              />
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <BoxIcon className="w-5 h-5" />
            Locations
          </h3>
          
          {/* Main Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Location Address *</Label>
              <Input
                type="text"
                defaultValue={formData.locationAddress}
                onChange={(e) => handleChange("locationAddress", e.target.value)}
                placeholder="Enter location address"
              />
            </div>
            <div>
              <Label>Google Maps Link</Label>
              <Input
                type="text"
                defaultValue={formData.locationGoogleMapLink || ""}
                onChange={(e) => handleChange("locationGoogleMapLink", e.target.value)}
                placeholder="Enter Google Maps link"
              />
            </div>
          </div>

          {/* Start Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Start Location Address</Label>
              <Input
                type="text"
                defaultValue={formData.startLocationAddress || ""}
                onChange={(e) => handleChange("startLocationAddress", e.target.value)}
                placeholder="Enter start location address"
              />
            </div>
            <div>
              <Label>Start Location Google Maps Link</Label>
              <Input
                type="text"
                defaultValue={formData.startLocationGoogleMapLink || ""}
                onChange={(e) => handleChange("startLocationGoogleMapLink", e.target.value)}
                placeholder="Enter Google Maps link"
              />
            </div>
          </div>

          {/* End Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>End Location Address</Label>
              <Input
                type="text"
                defaultValue={formData.endLocationAddress || ""}
                onChange={(e) => handleChange("endLocationAddress", e.target.value)}
                placeholder="Enter end location address"
              />
            </div>
            <div>
              <Label>End Location Google Maps Link</Label>
              <Input
                type="text"
                defaultValue={formData.endLocationGoogleMapLink || ""}
                onChange={(e) => handleChange("endLocationGoogleMapLink", e.target.value)}
                placeholder="Enter Google Maps link"
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <div>
            <Label>
              <div className="flex items-center gap-2">
                <TaskIcon className="w-4 h-4" />
                Shift Instructions
              </div>
            </Label>
            <Input
              type="textarea"
              defaultValue={formData.shiftInstructions || ""}
              onChange={(e) => handleChange("shiftInstructions", e.target.value)}
              placeholder="Enter shift instructions"
            />
          </div>

          {/* Supervisor Questions */}
          <div>
            <Label>
              <div className="flex items-center gap-2">
                <TaskIcon className="w-4 h-4" />
                Supervisor Questions
              </div>
            </Label>
            {formData.supervisorQuestions.map((question, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Input
                    type="text"
                    defaultValue={question.question}
                    onChange={(e) => handleQuestionChange(index, "question", e.target.value)}
                    placeholder="Enter question"
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    defaultValue={question.type}
                    onChange={(value) => handleQuestionChange(index, "type", value)}
                    options={[...questionTypeOptions]}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(index)}
                    className="p-2 text-red-500 hover:text-red-600"
                  >
                    <TrashBinIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddQuestion}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
            >
              <PlusIcon className="w-4 h-4" />
              Add Question
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <CloseLineIcon className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600"
          >
            <CheckLineIcon className="w-4 h-4" />
            {isEditing ? "Update Roster" : "Add Roster"}
          </button>
        </div>
      </Form>
    </Modal>
  );
} 