import React, { useEffect, useRef, useState, useCallback } from "react";

interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceDetails {
  city?: string;
  state?: string;
  zipCode?: string;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: PlaceDetails & { displayText: string }) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter city or ZIP code...",
  className = "",
  inputClassName = "",
}: LocationAutocompleteProps) {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPredictions = useCallback(async (input: string) => {
    if (input.length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/google/places/autocomplete?input=${encodeURIComponent(input)}`);
      const data = await response.json();
      
      if (data.predictions && data.predictions.length > 0) {
        setPredictions(data.predictions);
        setShowDropdown(true);
      } else {
        setPredictions([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error("Error fetching location predictions:", error);
      setPredictions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchPredictions(value);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, fetchPredictions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
    try {
      const response = await fetch(`/api/google/places/details?place_id=${encodeURIComponent(placeId)}`);
      const data = await response.json();
      
      if (data.result) {
        const result = data.result;
        let city = "";
        let state = "";
        let zipCode = "";
        
        if (result.address_components) {
          for (const component of result.address_components) {
            const types = component.types;
            if (types.includes("locality")) {
              city = component.long_name;
            } else if (types.includes("administrative_area_level_1")) {
              state = component.short_name;
            } else if (types.includes("postal_code")) {
              zipCode = component.long_name;
            }
          }
        }
        
        return {
          city,
          state,
          zipCode,
          lat: result.geometry?.location?.lat,
          lng: result.geometry?.location?.lng,
          formattedAddress: result.formatted_address,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching place details:", error);
      return null;
    }
  };

  const handleSelectPrediction = async (prediction: PlacePrediction) => {
    const displayText = prediction.structured_formatting.main_text;
    onChange(displayText);
    setShowDropdown(false);
    setSelectedIndex(-1);
    
    if (onPlaceSelect) {
      const details = await fetchPlaceDetails(prediction.place_id);
      if (details) {
        onPlaceSelect({ ...details, displayText });
      } else {
        onPlaceSelect({ displayText });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || predictions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, predictions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectPrediction(predictions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <svg 
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" 
          style={{ color: '#c9a962' }} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => predictions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className={inputClassName}
          data-testid="input-location"
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showDropdown && predictions.length > 0 && (
        <div 
          className="absolute left-0 right-0 mt-1 bg-[#1a2f25] border border-amber-900/30 rounded-lg shadow-xl z-50 overflow-hidden"
          style={{ maxHeight: '280px', overflowY: 'auto' }}
        >
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handleSelectPrediction(prediction)}
              className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 ${
                index === selectedIndex 
                  ? 'bg-amber-900/30' 
                  : 'hover:bg-amber-900/20'
              }`}
              data-testid={`location-item-${index}`}
            >
              <svg 
                className="w-4 h-4 shrink-0" 
                style={{ color: '#c9a962' }} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p 
                  className="text-stone-200 text-sm truncate"
                  style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400 }}
                >
                  {prediction.structured_formatting.main_text}
                </p>
                <p 
                  className="text-stone-500 text-xs truncate"
                  style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300 }}
                >
                  {prediction.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
          <div 
            className="px-4 py-2 text-xs text-stone-600 border-t border-amber-900/20"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            Powered by Google
          </div>
        </div>
      )}
    </div>
  );
}
