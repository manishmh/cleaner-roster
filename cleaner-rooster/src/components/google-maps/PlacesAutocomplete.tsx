import { useCombobox } from 'downshift';
import React, { useEffect, useState } from 'react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';

// Global type declaration for Google Maps
declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          PlacesService?: unknown;
          AutocompleteService?: unknown;
        };
      };
    };
  }
}

interface PlaceResult {
  name: string;
  formattedAddress: string;
  placeId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface PlacesAutocompleteProps {
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
}

// Check if Google Maps Places API is fully loaded
const isGoogleMapsPlacesReady = (): boolean => {
  const isReady = !!(
    window.google?.maps?.places?.PlacesService &&
    window.google?.maps?.places?.AutocompleteService
  );
  console.log('Google Maps Places API ready:', isReady);
  return isReady;
};

// Google Maps API loader with improved error handling
const loadGoogleMapsAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('Starting Google Maps API load...');
    
    // Check if already loaded
    if (isGoogleMapsPlacesReady()) {
      console.log('Google Maps API already loaded');
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('Google Maps script already exists, waiting for load...');
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds max
      
      const checkReady = () => {
        attempts++;
        if (isGoogleMapsPlacesReady()) {
          console.log('Google Maps API loaded after', attempts * 100, 'ms');
          resolve();
        } else if (attempts >= maxAttempts) {
          console.error('Google Maps API failed to load after', maxAttempts * 100, 'ms');
          reject(new Error('Google Maps API loading timeout'));
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
      return;
    }

    // Create and load the script
    console.log('Creating Google Maps script...');
    const script = document.createElement('script');
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('Google Maps API key not found');
      reject(new Error('Google Maps API key not configured'));
      return;
    }
    
    console.log('Using API key:', apiKey.substring(0, 10) + '...');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Google Maps script loaded, waiting for Places API...');
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max
      
      // Wait for the places library to be fully initialized
      const checkReady = () => {
        attempts++;
        if (isGoogleMapsPlacesReady()) {
          console.log('Google Maps Places API ready after', attempts * 100, 'ms');
          resolve();
        } else if (attempts >= maxAttempts) {
          console.error('Google Maps Places API failed to initialize after', maxAttempts * 100, 'ms');
          reject(new Error('Google Maps Places API initialization timeout'));
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Google Maps script:', error);
      reject(new Error('Failed to load Google Maps API script'));
    };
    
    document.head.appendChild(script);
    console.log('Google Maps script added to document');
  });
};

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  onPlaceSelect,
  placeholder = 'Search for a location...',
  className = '',
  initialValue = '',
}) => {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState('Initializing...');

  // Load Google Maps API on component mount
  useEffect(() => {
    const loadAPI = async () => {
      try {
        setLoadingProgress('Loading Google Maps API...');
        await loadGoogleMapsAPI();
        setLoadingProgress('Google Maps API loaded successfully');
        setIsGoogleMapsLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps API:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setLoadingError(`Failed to load Google Maps API: ${errorMessage}`);
        setLoadingProgress('Failed to load');
      }
    };

    loadAPI();
  }, []);

  const {
    ready,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      // Configure for Indian locations
      componentRestrictions: { country: 'in' },
      types: ['establishment', 'geocode'],
    },
    debounce: 300,
    defaultValue: initialValue,
    // Only initialize when Google Maps is loaded and ready
    initOnMount: isGoogleMapsLoaded,
  });

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      
      const placeResult: PlaceResult = {
        name: results[0].address_components[0]?.long_name || address,
        formattedAddress: results[0].formatted_address,
        placeId: results[0].place_id,
        latitude: lat,
        longitude: lng,
        accuracy: results[0].geometry.location_type === 'ROOFTOP' ? 100 : 80,
      };

      onPlaceSelect(placeResult);
    } catch (error) {
      console.error('Geocoding error: ', error);
      // Fallback: create a basic place result without coordinates
      const fallbackResult: PlaceResult = {
        name: address,
        formattedAddress: address,
        placeId: `fallback_${Date.now()}`,
        latitude: 0,
        longitude: 0,
        accuracy: 50,
      };
      onPlaceSelect(fallbackResult);
    }
  };
  
  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex,
  } = useCombobox({
    items: data || [], // Ensure items is never undefined
    onInputValueChange: ({ inputValue }) => {
      setValue(inputValue || ''); // Ensure value is never undefined
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        handleSelect(selectedItem.description);
      }
    },
    itemToString: (item) => (item ? item.description : ''),
  });

  // Show loading state
  if (!isGoogleMapsLoaded && !loadingError) {
    return (
      <div className="relative">
        <input
          {...getInputProps({
            placeholder: loadingProgress,
            className: `${className} bg-gray-100 cursor-not-allowed`,
            disabled: true,
            value: '',
          })}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
        <ul {...getMenuProps()} style={{ display: 'none' }}></ul>
      </div>
    );
  }

  // Show error state
  if (loadingError) {
    return (
      <div className="relative">
        <input
          {...getInputProps({
            placeholder: "Google Maps failed to load",
            className: `${className} bg-red-50 border-red-300 text-red-700`,
            disabled: true,
            value: '',
          })}
        />
        <div className="text-xs text-red-600 mt-1">{loadingError}</div>
        <ul {...getMenuProps()} style={{ display: 'none' }}></ul>
      </div>
    );
  }

  // Normal autocomplete input
  const isInputReady = isGoogleMapsLoaded && ready;

  return (
    <div className="relative">
      <input
        {...getInputProps({
          placeholder: isInputReady ? placeholder : 'Initializing search...',
          className: `${className} ${!isInputReady ? 'bg-gray-100 cursor-not-allowed' : ''}`,
          disabled: !isInputReady,
        })}
      />
      
      {!isInputReady && isGoogleMapsLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      <ul {...getMenuProps()} className={`absolute z-10 w-full dark:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg mt-1 ${!isOpen || status !== 'OK' || !data?.length ? 'hidden' : ''}`}>
        {isOpen &&
          status === 'OK' &&
          data &&
          data.map(({ place_id, description }, index) => (
            <li
              key={place_id}
              {...getItemProps({ item: { place_id, description }, index })}
              className={`px-3 py-2 cursor-pointer ${
                highlightedIndex === index ? 'bg-blue-100 dark:bg-blue-900' : ''
              }`}
            >
              {description}
            </li>
          ))}
      </ul>
    </div>
  );
};

export default PlacesAutocomplete; 