// import React, { useState, useEffect, useRef } from "react";
// import { MapPinIcon, Search, Loader2 } from "lucide-react";

// const MapPicker = ({ onLocationSelect, initialLocation = null, height = "400px" }) => {
//   const mapRef = useRef(null);
//   const [map, setMap] = useState(null);
//   const [marker, setMarker] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [selectedLocation, setSelectedLocation] = useState(null);
//   const [geocoder, setGeocoder] = useState(null);

//   // Initialize map
//   useEffect(() => {
//     const initializeMap = async () => {
//       try {
//         setIsLoading(true);

//         // Check if Google Maps is loaded
//         if (!window.google || !window.google.maps) {
//           throw new Error("Google Maps API not loaded");
//         }

//         // Default center (can be changed based on initial location)
//         const defaultCenter = initialLocation?.location?.coordinates
//           ? {
//               lat: initialLocation.location.coordinates[1],
//               lng: initialLocation.location.coordinates[0],
//             }
//           : { lat: 28.6139, lng: 77.209 }; // Default to Delhi

//         // Create map
//         const mapInstance = new window.google.maps.Map(mapRef.current, {
//           center: defaultCenter,
//           zoom: 15,
//           mapTypeId: window.google.maps.MapTypeId.ROADMAP,
//           styles: [
//             {
//               featureType: "poi",
//               elementType: "labels",
//               stylers: [{ visibility: "off" }],
//             },
//           ],
//         });

//         // Create geocoder
//         const geocoderInstance = new window.google.maps.Geocoder();
//         setGeocoder(geocoderInstance);

//         // Add click listener to map
//         mapInstance.addListener("click", (event) => {
//           const lat = event.latLng.lat();
//           const lng = event.latLng.lng();

//           // Reverse geocode to get address
//           geocoderInstance.geocode({ location: { lat, lng } }, (results, status) => {
//             if (status === "OK" && results[0]) {
//               const address = results[0].formatted_address;
//               const locationData = {
//                 lat,
//                 lng,
//                 address,
//               };

//               setSelectedLocation(locationData);
//               if (onLocationSelect) {
//                 onLocationSelect(locationData);
//               }
//             }
//           });
//         });

//         // Set initial marker if location provided
//         if (initialLocation?.location?.coordinates) {
//           const lat = initialLocation.location.coordinates[1];
//           const lng = initialLocation.location.coordinates[0];
//           const address = initialLocation.address || "Selected Location";

//           const markerInstance = new window.google.maps.Marker({
//             position: { lat, lng },
//             map: mapInstance,
//             title: address,
//             draggable: true,
//           });

//           markerInstance.addListener("dragend", (event) => {
//             const lat = event.latLng.lat();
//             const lng = event.latLng.lng();

//             geocoderInstance.geocode({ location: { lat, lng } }, (results, status) => {
//               if (status === "OK" && results[0]) {
//                 const address = results[0].formatted_address;
//                 const locationData = {
//                   lat,
//                   lng,
//                   address,
//                 };

//                 setSelectedLocation(locationData);
//                 if (onLocationSelect) {
//                   onLocationSelect(locationData);
//                 }
//               }
//             });
//           });

//           setMarker(markerInstance);
//           setSelectedLocation({ lat, lng, address });
//         }

//         setMap(mapInstance);
//         setIsLoading(false);
//       } catch (error) {
//         console.error("Error initializing map:", error);
//         setIsLoading(false);
//       }
//     };

//     // Load Google Maps script if not already loaded
//     if (!window.google || !window.google.maps) {
//       const script = document.createElement("script");
//       script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_MAP}&libraries=places`;
//       script.async = true;
//       script.defer = true;
//       script.onload = initializeMap;
//       script.onerror = () => {
//         console.error("Failed to load Google Maps API");
//         setIsLoading(false);
//       };
//       document.head.appendChild(script);
//     } else {
//       initializeMap();
//     }
//   }, [initialLocation, onLocationSelect]);

//   // Handle search
//   const handleSearch = () => {
//     if (!geocoder || !searchQuery.trim()) return;

//     geocoder.geocode({ address: searchQuery }, (results, status) => {
//       if (status === "OK" && results[0]) {
//         const location = results[0].geometry.location;
//         const lat = location.lat();
//         const lng = location.lng();
//         const address = results[0].formatted_address;

//         // Update map center
//         if (map) {
//           map.setCenter({ lat, lng });
//           map.setZoom(15);
//         }

//         // Update marker
//         if (marker) {
//           marker.setPosition({ lat, lng });
//         } else if (map) {
//           const newMarker = new window.google.maps.Marker({
//             position: { lat, lng },
//             map: map,
//             title: address,
//             draggable: true,
//           });

//           newMarker.addListener("dragend", (event) => {
//             const lat = event.latLng.lat();
//             const lng = event.latLng.lng();

//             geocoder.geocode({ location: { lat, lng } }, (results, status) => {
//               if (status === "OK" && results[0]) {
//                 const address = results[0].formatted_address;
//                 const locationData = {
//                   lat,
//                   lng,
//                   address,
//                 };

//                 setSelectedLocation(locationData);
//                 if (onLocationSelect) {
//                   onLocationSelect(locationData);
//                 }
//               }
//             });
//           });

//           setMarker(newMarker);
//         }

//         const locationData = { lat, lng, address };
//         setSelectedLocation(locationData);
//         if (onLocationSelect) {
//           onLocationSelect(locationData);
//         }
//       }
//     });
//   };

//   // Handle search on Enter key
//   const handleKeyPress = (e) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       handleSearch();
//     }
//   };

//   return (
//     <div className="w-full">
//       {/* Search Bar */}
//       <div className="mb-4">
//         <div className="relative">
//           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//             <Search className="h-4 w-4 text-text-sub" />
//           </div>
//           <input
//             type="text"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             onKeyPress={handleKeyPress}
//             placeholder="Search for a location..."
//             className="w-full pl-10 pr-4 py-2.5 border border-stroke-soft rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-base focus:border-primary-base transition-colors"
//           />
//           <button onClick={handleSearch} disabled={!searchQuery.trim()} className="absolute inset-y-0 right-0 pr-3 flex items-center">
//             <Search className="h-4 w-4 text-primary-base hover:text-primary-dark transition-colors" />
//           </button>
//         </div>
//       </div>

//       {/* Map Container */}
//       <div className="relative">
//         <div ref={mapRef} style={{ height }} className="w-full rounded-lg border border-stroke-soft overflow-hidden" />

//         {/* Loading Overlay */}
//         {isLoading && (
//           <div className="absolute inset-0 bg-bg-weak/80 flex items-center justify-center rounded-lg">
//             <div className="flex items-center space-x-2">
//               <Loader2 className="w-5 h-5 animate-spin text-primary-base" />
//               <span className="text-sm text-text-sub">Loading map...</span>
//             </div>
//           </div>
//         )}

//         {/* Instructions */}
//         <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-stroke-soft">
//           <div className="flex items-center space-x-2 text-sm text-text-sub">
//             <MapPinIcon className="w-4 h-4 text-primary-base" />
//             <span>Click on the map to select location</span>
//           </div>
//         </div>

//         {/* Selected Location Info */}
//         {selectedLocation && (
//           <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-stroke-soft">
//             <div className="flex items-start space-x-2">
//               <MapPinIcon className="w-4 h-4 text-state-success mt-0.5 flex-shrink-0" />
//               <div className="flex-1 min-w-0">
//                 <p className="text-sm font-medium text-text-main">Selected Location</p>
//                 <p className="text-xs text-text-sub truncate">{selectedLocation.address}</p>
//                 <p className="text-xs text-text-soft">
//                   Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
//                 </p>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default MapPicker;

import { useEffect, useRef, useState } from "react";
import { MapPinIcon, Search, Loader2, Navigation, XCircle, ArrowRight } from "lucide-react";

const MapPicker = ({ onLocationSelect, initialLocation }) => {
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [addressValue, setAddressValue] = useState(initialLocation?.address || "");
  const [selectedLocation, setSelectedLocation] = useState(
    initialLocation?.location
      ? {
          lat: initialLocation.location.coordinates[1],
          lng: initialLocation.location.coordinates[0],
          address: initialLocation.address,
          location: initialLocation.location,
        }
      : null
  );
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  // Use Vite env variable
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Bahrain bounds
  const BAHRAIN_BOUNDS = {
    north: 26.3,
    south: 25.8,
    east: 50.8,
    west: 50.3,
  };

  // Initialize map only once
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;

      window.initMap = () => {
        if (mapRef.current && autocompleteRef.current) {
          const defaultLocation = initialLocation?.location
            ? {
                lat: initialLocation.location.coordinates[1],
                lng: initialLocation.location.coordinates[0],
              }
            : { lat: 26.2235, lng: 50.5876 }; // Bahrain center

          const mapOptions = {
            center: defaultLocation,
            zoom: 13,
            styles: [
              {
                featureType: "water",
                elementType: "geometry.fill",
                stylers: [{ color: "#e4f2f9" }],
              },
              {
                featureType: "landscape",
                elementType: "geometry.fill",
                stylers: [{ color: "#ffffff" }],
              },
              {
                featureType: "transit",
                stylers: [{ visibility: "off" }],
              },
              {
                featureType: "road",
                elementType: "geometry.stroke",
                stylers: [{ color: "#f0f0f0" }],
              },
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
            ],
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
            restriction: {
              latLngBounds: BAHRAIN_BOUNDS,
              strictBounds: true,
            },
          };

          const map = new window.google.maps.Map(mapRef.current, mapOptions);

          const marker = new window.google.maps.Marker({
            position: defaultLocation,
            map: map,
            title: "Selected Location",
            animation: window.google.maps.Animation.DROP,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#4f46e5",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });

          // Initialize Autocomplete service with Bahrain restrictions
          const autocompleteService = new window.google.maps.places.AutocompleteService();
          const placesService = new window.google.maps.places.PlacesService(map);

          // Handle input changes with Bahrain restrictions
          const handleInputChange = (value) => {
            setSearchValue(value);
            if (value.length > 2) {
              autocompleteService.getPlacePredictions(
                {
                  input: value,
                  types: ["geocode", "establishment"],
                  componentRestrictions: { country: "bh" },
                  bounds: BAHRAIN_BOUNDS,
                },
                (predictions, status) => {
                  if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    setPredictions(predictions);
                    setShowPredictions(true);
                  } else {
                    setPredictions([]);
                    setShowPredictions(false);
                  }
                }
              );
            } else {
              setPredictions([]);
              setShowPredictions(false);
            }
          };

          // Add event listener for input
          autocompleteRef.current.addEventListener("input", (e) => {
            handleInputChange(e.target.value);
          });

          // Handle map clicks with bounds check
          map.addListener("click", (e) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();

            // Check if click is within Bahrain bounds
            if (lat >= BAHRAIN_BOUNDS.south && lat <= BAHRAIN_BOUNDS.north && lng >= BAHRAIN_BOUNDS.west && lng <= BAHRAIN_BOUNDS.east) {
              marker.setPosition(e.latLng);
              marker.setAnimation(window.google.maps.Animation.DROP);

              const geocoder = new window.google.maps.Geocoder();
              geocoder.geocode({ location: { lat: lat, lng: lng } }, (results, status) => {
                if (status === "OK" && results[0]) {
                  const newLocation = {
                    lat: lat,
                    lng: lng,
                    address: results[0].formatted_address,
                    location: {
                      type: "Point",
                      coordinates: [lng, lat],
                    },
                  };
                  setSelectedLocation(newLocation);
                  setSearchValue(results[0].formatted_address);
                  setAddressValue(results[0].formatted_address);
                  if (onLocationSelect) {
                    onLocationSelect(newLocation);
                  }
                }
              });
            }
          });

          // Add "My Location" button
          const locationButton = document.createElement("button");
          locationButton.className =
            "map-location-button absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400";
          locationButton.innerHTML =
            '<svg class="w-5 h-5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';

          locationButton.addEventListener("click", () => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  };

                  // Check if location is within Bahrain bounds
                  if (pos.lat >= BAHRAIN_BOUNDS.south && pos.lat <= BAHRAIN_BOUNDS.north && pos.lng >= BAHRAIN_BOUNDS.west && pos.lng <= BAHRAIN_BOUNDS.east) {
                    map.setCenter(pos);
                    marker.setPosition(pos);
                    marker.setAnimation(window.google.maps.Animation.DROP);

                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode({ location: pos }, (results, status) => {
                      if (status === "OK" && results[0]) {
                        const newLocation = {
                          ...pos,
                          address: results[0].formatted_address,
                          location: {
                            type: "Point",
                            coordinates: [pos.lng, pos.lat],
                          },
                        };
                        setSelectedLocation(newLocation);
                        setSearchValue(results[0].formatted_address);
                        setAddressValue(results[0].formatted_address);
                        if (onLocationSelect) {
                          onLocationSelect(newLocation);
                        }
                      }
                    });
                  } else {
                    // Using a more elegant notification
                    const notificationDiv = document.createElement("div");
                    notificationDiv.className =
                      "fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg shadow-md text-sm font-medium flex items-center";
                    notificationDiv.innerHTML =
                      '<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>Please select a location within Bahrain';
                    document.body.appendChild(notificationDiv);

                    setTimeout(() => {
                      document.body.removeChild(notificationDiv);
                    }, 3000);
                  }
                },
                () => {
                  console.log("Error: The Geolocation service failed.");
                }
              );
            }
          });

          map.controls[window.google.maps.ControlPosition.RIGHT_TOP].push(locationButton);

          setIsLoading(false);

          // Store map and marker references
          window.mapInstance = map;
          window.markerInstance = marker;

          // Set initial location if provided
          if (initialLocation?.location) {
            const position = {
              lat: initialLocation.location.coordinates[1],
              lng: initialLocation.location.coordinates[0],
            };
            map.setCenter(position);
            marker.setPosition(position);
            setSearchValue(initialLocation.address || "");
            setAddressValue(initialLocation.address || "");
            setSelectedLocation({
              lat: position.lat,
              lng: position.lng,
              address: initialLocation.address,
              location: initialLocation.location,
            });
          }
        }
      };

      document.head.appendChild(script);
    };

    loadGoogleMapsScript();

    return () => {
      window.initMap = undefined;
      window.mapInstance = undefined;
      window.markerInstance = undefined;
      const script = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js?key=${apiKey}"]`);
      if (script) {
        script.remove();
      }
    };
  }, [apiKey, initialLocation]); // Only depend on apiKey and initialLocation

  // Handle initial location and updates
  useEffect(() => {
    if (initialLocation?.location && window.mapInstance && window.markerInstance) {
      const position = {
        lat: initialLocation.location.coordinates[1],
        lng: initialLocation.location.coordinates[0],
      };
      window.mapInstance.setCenter(position);
      window.markerInstance.setPosition(position);
      setSearchValue(initialLocation.address || "");
      setAddressValue(initialLocation.address || "");
      setSelectedLocation({
        lat: position.lat,
        lng: position.lng,
        address: initialLocation.address,
        location: initialLocation.location,
      });
    }
  }, [initialLocation]); // Only update when initialLocation changes

  // Handle prediction selection
  const handlePredictionSelect = (prediction) => {
    const placesService = new window.google.maps.places.PlacesService(mapRef.current);
    placesService.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["geometry", "name", "formatted_address"],
      },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          if (place.geometry && place.geometry.location) {
            const newLocation = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              address: place.formatted_address,
              name: place.name,
              location: {
                type: "Point",
                coordinates: [place.geometry.location.lng(), place.geometry.location.lat()],
              },
            };
            setSelectedLocation(newLocation);
            setSearchValue(place.formatted_address);
            setAddressValue(place.formatted_address);
            if (onLocationSelect) {
              onLocationSelect(newLocation);
            }
            setShowPredictions(false);
          }
        }
      }
    );
  };

  const clearSearch = () => {
    setSearchValue("");
    setShowPredictions(false);
  };

  return (
    <div className="relative w-full">
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            <span className="text-sm font-medium text-gray-600">Loading map...</span>
          </div>
        </div>
      )}

      {/* Search Box - Elegant Design */}
      <div className="absolute top-4 left-4 right-16 z-10">
        <div className="relative max-w-full mx-auto">
          <div className="relative">
            <input
              ref={autocompleteRef}
              type="text"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                if (e.target.value.length > 2) {
                  autocompleteService.getPlacePredictions(
                    {
                      input: e.target.value,
                      types: ["geocode", "establishment"],
                      componentRestrictions: { country: "bh" },
                      bounds: BAHRAIN_BOUNDS,
                    },
                    (predictions, status) => {
                      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                        setPredictions(predictions);
                        setShowPredictions(true);
                      } else {
                        setPredictions([]);
                        setShowPredictions(false);
                      }
                    }
                  );
                } else {
                  setPredictions([]);
                  setShowPredictions(false);
                }
              }}
              placeholder="Find a location in Bahrain"
              className="w-full px-10 py-2.5 rounded-full border border-gray-200 shadow-md focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:outline-none transition-all duration-300 text-sm placeholder-gray-400"
            />
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

            {searchValue && (
              <button onClick={clearSearch} className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <XCircle className="w-4 h-4" />
              </button>
            )}

            {/* Predictions Dropdown - Refined Design */}
            {showPredictions && predictions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-100 max-h-60 overflow-y-auto z-50">
                {predictions.map((prediction) => (
                  <div
                    key={prediction.place_id}
                    className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex items-center justify-between group transition-colors border-b border-gray-50 last:border-b-0"
                    onClick={() => handlePredictionSelect(prediction)}
                  >
                    <div className="flex items-center space-x-3">
                      <MapPinIcon className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 truncate">{prediction.structured_formatting.main_text}</span>
                        <span className="text-xs text-gray-500 truncate max-w-xs">{prediction.structured_formatting.secondary_text}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-500 ml-2 flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Container - More Elegant */}
      <div ref={mapRef} className="w-full h-[300px] rounded-xl shadow-sm border border-gray-100 transition-shadow duration-300 hover:shadow-md overflow-hidden" />

      {/* Address Display - Minimalist Design */}
      <div className="mt-4">
        <div className="flex items-start gap-2">
          <MapPinIcon className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            {selectedLocation?.address ? (
              <div className="py-2 px-3 bg-indigo-50 rounded-lg text-sm text-gray-700 border border-indigo-100">
                <input
                  type="text"
                  value={addressValue}
                  onChange={(e) => {
                    setAddressValue(e.target.value);
                    // Update the selected location with the new address
                    if (selectedLocation) {
                      const updatedLocation = {
                        ...selectedLocation,
                        address: e.target.value,
                      };
                      setSelectedLocation(updatedLocation);
                      if (onLocationSelect) {
                        onLocationSelect(updatedLocation);
                      }
                    }
                  }}
                  className="w-full bg-transparent focus:outline-none focus:ring-0"
                  placeholder="Enter address"
                />
              </div>
            ) : (
              <div className="py-2 px-3 bg-gray-50 rounded-lg text-sm text-gray-500 border border-gray-100 italic">Select a location on the map</div>
            )}

            {selectedLocation && (
              <div className="mt-1 text-xs text-gray-500 flex items-center">
                <span className="inline-block px-2 py-0.5 bg-white border border-gray-100 rounded-md shadow-sm">
                  {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPicker;
