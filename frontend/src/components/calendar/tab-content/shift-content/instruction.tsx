import { type ShiftInstruction as BackendShiftInstruction, type Shift } from "@/lib/api";
import React, { useEffect, useState } from 'react';
import { toast } from "sonner";
import { CalendarEvent } from "../../Calendar";

interface InstructionTabContentProps {
  event: CalendarEvent;
  onUpdate: (updatedEvent: CalendarEvent) => void;
  shiftData?: Shift | null;
  addInstruction?: (instructionText: string, instructionType?: string) => Promise<void>;
}

type InstructionType = 'ok' | 'yes/no' | 'text';

interface Instruction {
  id: string;
  text: string;
  type: InstructionType;
  createdAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const InstructionTabContent: React.FC<InstructionTabContentProps> = ({ event, onUpdate, shiftData, addInstruction }) => {
  const [instruction, setInstruction] = useState("");
  const [instructionType, setInstructionType] = useState<InstructionType>('text');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let currentInstructions: Instruction[] = [];

    // Prioritize instructions from shiftData if available (fresh from backend)
    if (shiftData?.instructions && Array.isArray(shiftData.instructions)) {
      currentInstructions = shiftData.instructions.map((inst: BackendShiftInstruction) => ({
        id: inst.id.toString(),
        text: inst.instructionText,
        type: inst.instructionType as InstructionType,
        createdAt: new Date(inst.createdAt), // Use actual backend date
      }));
    } 
    // Fallback to event.extendedProps.instructions if shiftData is not yet populated
    else if (event?.extendedProps?.instructions && Array.isArray(event.extendedProps.instructions)) {
      currentInstructions = event.extendedProps.instructions.map(inst => ({
        ...inst,
        createdAt: new Date(inst.createdAt) // Ensure proper Date object
      }));
    }

    // Note: We no longer create fake instructions from shiftInstructions
    // The backend now creates proper instruction records when a shift is created with shiftInstructions

    // Sort all instructions by creation date, newest first
    currentInstructions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    setInstructions(currentInstructions);
  }, [shiftData, event?.extendedProps?.instructions, event?.extendedProps?.shiftInstructions, event?.extendedProps?.instructionType, event.start]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!instruction.trim()) {
      toast.error("Please enter an instruction");
      return;
    }

    if (!addInstruction) {
      toast.error("Unable to add instruction - API not available");
      return;
    }

    setIsSubmitting(true);

    try {
      await addInstruction(instruction.trim(), instructionType);
      // The useEffect above will update the instructions list when shiftData is updated by the hook
      
      setInstruction("");
      setInstructionType('text');
      toast.success("Instruction added successfully!");
      
      // This state is for the small green text confirmation, separate from toast
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);

    } catch (error) {
      console.error('Error adding instruction:', error);
      toast.error("Failed to add instruction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Note Section */}
      <div className="mb-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2 dark:text-blue-200 dark:bg-gray-800 dark:border-gray-700">
        <strong>Note:</strong> Any change in this section will only affect the selected shift. Try Repeat for group change.
      </div>

      {/* Header */}
      <div>
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Instruction Detail +</h2>
      </div>

      {/* Existing Instructions */}
      {instructions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-md font-medium text-gray-700 dark:text-gray-200">Existing Instructions:</h3>
          {instructions.map((inst) => (
            <div key={inst.id} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {inst.createdAt.toLocaleString()}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  {inst.type.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-100">{inst.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Instruction Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            New Instruction:
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-400 focus:outline-none min-h-[100px] resize-none"
            placeholder="Enter new instruction here..."
          />
        </div>

        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Instruction Type:
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="radio"
                name="instructionType"
                value="ok"
                checked={instructionType === 'ok'}
                onChange={(e) => setInstructionType(e.target.value as InstructionType)}
                className="text-blue-600 focus:ring-blue-500"
              />
              OK
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="radio"
                name="instructionType"
                value="yes/no"
                checked={instructionType === 'yes/no'}
                onChange={(e) => setInstructionType(e.target.value as InstructionType)}
                className="text-blue-600 focus:ring-blue-500"
              />
              Yes/No
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="radio"
                name="instructionType"
                value="text"
                checked={instructionType === 'text'}
                onChange={(e) => setInstructionType(e.target.value as InstructionType)}
                className="text-blue-600 focus:ring-blue-500"
              />
              Text Input
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center sm:justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 md:px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium shadow-sm transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Adding..." : "Add Instruction"}
          </button>
        </div>

        {/* Confirmation Message */}
        {showConfirmation && (
          <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-300 text-sm text-center">
            Instruction added successfully!
          </div>
        )}
      </form>
    </div>
  );
};

export default InstructionTabContent;
