import React from "react";
import Button from "../button/Button";
import { Modal } from "./index";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger" | "warning";
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger",
  isLoading = false,
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const getConfirmButtonProps = () => {
    switch (confirmVariant) {
      case "danger":
        return {
          variant: "primary" as const,
          className: "bg-red-600 hover:bg-red-700 text-white border-red-600"
        };
      case "warning":
        return {
          variant: "primary" as const,
          className: "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600"
        };
      default:
        return {
          variant: "primary" as const,
          className: ""
        };
    }
  };

  const confirmButtonProps = getConfirmButtonProps();

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-2">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {message}
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button
          variant={confirmButtonProps.variant}
          onClick={handleConfirm}
          disabled={isLoading}
          className={confirmButtonProps.className}
        >
          {isLoading ? "Processing..." : confirmText}
        </Button>
      </div>
    </Modal>
  );
} 