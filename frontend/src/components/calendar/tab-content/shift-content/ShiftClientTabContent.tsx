import { useCalendarClient } from "@/components/calendar/CalendarClientContext";
import { type Client, shiftApi } from "@/lib/api";
import React, { useEffect, useState } from 'react';
import { toast } from "sonner";
import { CalendarEvent } from "../../Calendar";

const initialClientData: Client = {
  id: 0,
  name: "",
  phone: "",
  email: "",
  company: "",
  abn: "",
  acn: "",
  address: "",
  clientInstruction: "",
  clientInfo: "",
  propertyInfo: "",
  isActive: true,
  createdAt: "",
  updatedAt: "",
};

interface ShiftClientTabContentProps {
  event: CalendarEvent;
  onUpdate: (updatedEvent: CalendarEvent) => void;
}

const ShiftClientTabContent: React.FC<ShiftClientTabContentProps> = ({ event, onUpdate }) => {
  const { clientList, updateClient } = useCalendarClient();
  // Find the clientId from event (convert string to number)
  const clientId = event.extendedProps.clientIds?.[0] ? parseInt(event.extendedProps.clientIds[0]) : 0;
  const eventClient = clientList.find(c => c.id === clientId) || initialClientData;
  const [clientData, setClientData] = useState<Client>(eventClient);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When clientId changes, update form
  useEffect(() => {
    setClientData(eventClient);
  }, [eventClient]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setClientData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClientSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = parseInt(e.target.value);
    const selectedClient = clientList.find(c => c.id === selectedId) || initialClientData;
    setClientData(selectedClient);
    
    // Get the shift ID from the event
    const shiftId = event.id ? parseInt(event.id) : null;
    
    if (shiftId && !isNaN(shiftId)) {
      try {
        // Update the client assignment in the backend
        await shiftApi.updateClient(shiftId, selectedId || null);
        
        // Update the event with the new clientId
        onUpdate({
          ...event,
          extendedProps: {
            ...event.extendedProps,
            clientIds: selectedId ? [selectedId.toString()] : [],
          },
        });
        
        toast.success("Client assignment updated successfully!");
      } catch (error) {
        console.error('Error updating client assignment:', error);
        toast.error("Failed to update client assignment. Please try again.");
      }
    } else {
      console.error('Invalid shift ID:', event.id);
      toast.error("Unable to update client assignment - invalid shift ID.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clientData.id && clientData.id > 0) {
      setIsSubmitting(true);
      try {
        await updateClient(clientData);
        setShowConfirmation(true);
        // Hide confirmation after 3 seconds
        setTimeout(() => setShowConfirmation(false), 3000);
      } catch (error) {
        console.error('Error updating client:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* Header Section */}
      <div>
          <div className="mb-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded px-3 py-2 dark:text-blue-200 dark:bg-gray-800 dark:border-gray-700">
            <strong>Note:</strong> Any change in this section will only affect the selected shift. Try Repeat for group change.
          </div>
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Shift Client</h2>
      </div>

      {/* Client Name Selector */}
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-1">Client Name:</label>
        <select
          name="id"
          value={clientData.id}
          onChange={handleClientSelect}
          className="border rounded px-3 py-2 w-full text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
        >
          <option value="">Select a client</option>
          {clientList.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6">
        {/* Subtle Note */}
        <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          <strong>Note :</strong> Changes done in this section will effect all the shifts of this client.
        </div>
        {/* Responsive grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Name:</label>
            <input
              type="text"
              name="name"
              value={clientData.name || ''}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Phone:</label>
            <input
              type="text"
              name="phone"
              value={clientData.phone || ''}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Email:</label>
            <input
              type="email"
              name="email"
              value={clientData.email || ''}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Company Name:</label>
            <input
              type="text"
              name="company"
              value={clientData.company || ''}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">ABN:</label>
            <input
              type="text"
              name="abn"
              value={clientData.abn || ''}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">ACN:</label>
            <input
              type="text"
              name="acn"
              value={clientData.acn || ''}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Client Instruction:</label>
            <textarea
              name="clientInstruction"
              value={clientData.clientInstruction || ''}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 min-h-[60px] resize-none"
            />
          </div>
          <div className="lg:col-span-1">
            <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Client Information:</label>
            <textarea
              name="clientInfo"
              value={clientData.clientInfo || ''}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 min-h-[60px] resize-none"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Property Information:</label>
            <textarea
              name="propertyInfo"
              value={clientData.propertyInfo || ''}
              onChange={handleChange}
              className="border rounded px-3 py-2 w-full text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 min-h-[60px] resize-none"
            />
          </div>
        </div>
        {/* Submit Button */}
        <div className="flex justify-center sm:justify-end mt-4 md:mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 md:px-6 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800 font-medium shadow-sm transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating...' : 'Submit'}
          </button>
        </div>
        
        {/* Confirmation Message */}
        {showConfirmation && (
          <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-300 text-sm text-center">
            Client information updated successfully!
          </div>
        )}
      </form>
    </div>
  );
};

export default ShiftClientTabContent;
