import PlacesAutocomplete from "@/components/google-maps/PlacesAutocomplete";
import { locationApi, type Location } from "@/lib/api";
import React, { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa6";
import { MdDelete } from "react-icons/md";

interface LocationModalProps {
  handleCloseLocationModal: () => void;
  onSelect?: (location: { 
    unit: string; 
    name: string; 
    accuracy: string; 
    comment?: string;
    address?: string;
    formattedAddress?: string;
  }) => void;
}

interface PlaceResult {
  name: string;
  formattedAddress: string;
  placeId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

const LocationModal = ({
  handleCloseLocationModal,
  onSelect,
}: LocationModalProps) => {
  const [unit, setUnit] = useState("");
  const [locationName, setLocationName] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [accuracy, setAccuracy] = useState("");
  const [comment, setComment] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only fetch locations on mount
  useEffect(() => {
    const fetchRecentLocations = async () => {
      try {
        setLoading(true);
        const response = await locationApi.getAll({ history: true });
        if (response.success && response.data) {
          setLocations(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError('Failed to load recent locations');
      } finally {
        setLoading(false);
      }
    };
    fetchRecentLocations();
  }, []);

  const handlePlaceSelect = (place: PlaceResult) => {
    setSelectedPlace(place);
    setLocationName(place.name);
    if (place.accuracy) {
      setAccuracy(place.accuracy.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!locationName.trim()) {
      setError('Please enter a location name');
      return;
    }

    if (!unit.trim()) {
      setError('Please enter a unit number');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let locationData;
      
      if (selectedPlace) {
        // User selected from dropdown - use full place data
        locationData = {
          unit,
          name: selectedPlace.name,
          address: selectedPlace.formattedAddress,
          formattedAddress: selectedPlace.formattedAddress,
          latitude: selectedPlace.latitude,
          longitude: selectedPlace.longitude,
          placeId: selectedPlace.placeId,
          accuracy: parseInt(accuracy) || selectedPlace.accuracy || 80,
          comment: comment || undefined,
        };
      } else {
        // User typed location manually - create basic location
        locationData = {
          unit,
          name: locationName.trim(),
          address: locationName.trim(),
          formattedAddress: locationName.trim(),
          latitude: 0, // Default coordinates
          longitude: 0,
          placeId: `manual_${Date.now()}`, // Generate unique ID
          accuracy: parseInt(accuracy) || 50, // Lower accuracy for manual entry
          comment: comment || undefined,
        };
      }

      const response = await locationApi.create(locationData);
      
      if (response.success && response.data) {
        const newLocation = response.data.data;
        
        // Add to the list
        setLocations(prev => [newLocation, ...prev.slice(0, 9)]); // Keep only 10 items
        
        // Reset form
        setUnit('');
        setLocationName('');
        setAccuracy('');
        setComment('');
        setSelectedPlace(null);
        
        // Auto-select the newly created location if onSelect is provided
        if (onSelect) {
          onSelect({
            unit: newLocation.unit,
            name: newLocation.name,
            accuracy: newLocation.accuracy.toString(),
            comment: newLocation.comment || '',
            address: newLocation.address,
            formattedAddress: newLocation.formattedAddress
          });
        }
      } else {
        setError(response.error || 'Failed to create location');
      }
    } catch (err) {
      console.error('Error creating location:', err);
      setError('Failed to create location. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await locationApi.delete(id);
      if (response.success) {
        setLocations(prev => prev.filter(loc => loc.id !== id));
      } else {
        setError(response.error || 'Failed to delete location');
      }
    } catch (err) {
      console.error('Error deleting location:', err);
      setError('Failed to delete location');
    }
  };

  const handleUse = async (item: Location) => {
    try {
      // Mark location as used (update lastUsedAt)
      const response = await locationApi.markAsUsed(item.id);
      
      if (response.success) {
        // Move to top of list
        setLocations(prev => [
          item,
          ...prev.filter(loc => loc.id !== item.id)
        ]);
      }

      if (onSelect) {
        onSelect({ 
          unit: item.unit, 
          name: item.name, 
          accuracy: item.accuracy.toString(), 
          comment: item.comment || '',
          address: item.address,
          formattedAddress: item.formattedAddress
        });
      }
    } catch (err) {
      console.error('Error marking location as used:', err);
      // Still proceed with selection even if update fails
      if (onSelect) {
        onSelect({ 
          unit: item.unit, 
          name: item.name, 
          accuracy: item.accuracy.toString(), 
          comment: item.comment || '',
          address: item.address,
          formattedAddress: item.formattedAddress
        });
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/30 bg-opacity-30"
      onClick={handleCloseLocationModal}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 min-w-[300px] w-[70vw] h-[70vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="font-semibold text-lg text-gray-900 dark:text-gray-100">
            Locations
          </div>
          <button
            className="h-6 w-6 bg-gray-700 text-white rounded hover:bg-gray-600 flex items-center justify-center"
            onClick={handleCloseLocationModal}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form
          className="flex flex-col gap-4 mb-6"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Unit No."
              className="border dark:border-none rounded px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
            />
            <PlacesAutocomplete
              onPlaceSelect={handlePlaceSelect}
              initialValue={locationName}
              placeholder="Search for location..."
              className="border dark:border-none rounded px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
            />
            <input
              type="number"
              placeholder="Accuracy (%)"
              min="0"
              max="100"
              className="border dark:border-none rounded px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={accuracy}
              onChange={(e) => setAccuracy(e.target.value)}
            />
            <div className="md:col-span-1">
              <button
                type="submit"
                disabled={isSubmitting || !locationName.trim() || !unit.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Adding...' : 'Add Location'}
              </button>
            </div>
          </div>
          <textarea
            placeholder="Location Comment (optional)"
            className="border dark:border-none w-full rounded px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[60px] resize-none"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          {(selectedPlace || locationName.trim()) && (
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded">
              <strong>Location:</strong> {selectedPlace ? selectedPlace.formattedAddress : locationName.trim()}
              {!selectedPlace && locationName.trim() && (
                <span className="text-orange-600 dark:text-orange-400 ml-2">
                  (Manual entry - coordinates will be set to default)
                </span>
              )}
            </div>
          )}
        </form>

        {/* Recent Locations Table */}
        <div className="flex-1 overflow-auto">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recent Locations (Last 10 Used)
          </h3>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500 dark:text-gray-400">Loading recent locations...</div>
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                  <th className="px-2 py-1 text-left">Unit</th>
                  <th className="px-2 py-1 text-left">Name</th>
                  <th className="px-2 py-1 text-left">Address</th>
                  <th className="px-2 py-1 text-left">Accuracy</th>
                  <th className="px-2 py-1 text-left">Comment</th>
                  <th className="px-2 py-1 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200"
                  >
                    <td className="px-2 py-1">{item.unit}</td>
                    <td className="px-2 py-1">{item.name}</td>
                    <td className="px-2 py-1 max-w-[200px] truncate" title={item.formattedAddress || item.address}>
                      {item.formattedAddress || item.address || '-'}
                    </td>
                    <td className="px-2 py-1">{item.accuracy}%</td>
                    <td className="px-2 py-1">{item.comment || '-'}</td>
                    <td className="px-2 py-1 flex gap-2">
                      <button
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                        title="Select this location"
                        onClick={() => handleUse(item)}
                        type="button"
                      >
                        <FaCheck />
                      </button>
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                        title="Delete location"
                        onClick={() => handleDelete(item.id)}
                        type="button"
                      >
                        <MdDelete />
                      </button>
                    </td>
                  </tr>
                ))}
                {locations.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center text-gray-400 dark:text-gray-500 py-4"
                    >
                      No recent locations found. Add a new location above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationModal;