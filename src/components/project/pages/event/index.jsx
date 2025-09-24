import React, { useEffect, useState, useMemo, useCallback } from "react";
import Layout from "../../../core/layout";
import ListTable from "../../../core/list/list";
import { Container } from "../../../core/layout/styels";
import moment from "moment";
import { checkprivilege, privileges } from "../../brand/previliage";
import EventForm from "./eventForm";
import FormBuilderNew from "../formBuilderNew";
import { useSelector } from "react-redux";
import PopupView from "../../../core/popupview";
import PosterBuilder from "../posterbuilder";
import { getData, postData } from "../../../../backend/api";
import UploadAudio from "./uploadAudio";
import PosterBuilderHeader from "../posterbuilder/header";
import { useToast } from "../../../core/toast";
import IAmAttending from "../iAmAttending";
import { ticketAttributes, ticketCoupenAttributes } from "./attributes/ticket";
import { paymentHistoryAttributes } from "./attributes/paymentHistory";
import { instanceAttributes, instanceDataAttributes } from "./attributes/instance";
import { Globe, MapPin, User, MapPinIcon, Loader2 } from "lucide-react";
import { GetIcon } from "../../../../icons/index.jsx";
import { Title } from "../../../core/list/styles.js";
import FormBuilderHeader from "../formBuilderNew/header";
import EventFormHeader from "./eventForm/header.jsx";
import Modal from "./Modal.jsx";
import MapPicker from "./MapPicker.jsx";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

//if you want to write custom style wirte in above file
const Event = (props) => {
  const toast = useToast();
  //to update the page title
  useEffect(() => {
    document.title = `Event - goCampus Portal`;
  }, []);

  const userType = props.user.user.userType._id;
  const themeColors = useSelector((state) => state.themeColors);
  // State to control the display of the SetupMenu popup
  const [openMenuSetup, setOpenMenuSetup] = useState(false);
  const [openMenuSetupAudio, setOpenMenuSetupAudio] = useState(false);
  const [openBadgeSetup, setOpenBadgeSetup] = useState(false);
  const [openPosterMaker, setOpenPosterMaker] = useState(false);
  // State to store the data for the item that was clicked on in the ListTable
  const [openItemData, setOpenItemData] = useState(null);
  const [openPosterUsage, setOpenPosterUsage] = useState(false);
  const [openCompanyProfile, setOpenCompanyProfile] = useState(false);
  const [openTeamManagement, setOpenTeamManagement] = useState(false);
  const [openProductCatalog, setOpenProductCatalog] = useState(false);
  const [openTicketForm, setOpenTicketForm] = useState(false);
  const [openSettingsTrigger, setOpenSettingsTrigger] = useState(0);
  const [openEventFormSettingsTrigger, setOpenEventFormSettingsTrigger] = useState(0);
  const [openTicketResponse, setOpenTicketResponse] = useState(false);

  // Clone progress modal state
  const [showCloneProgress, setShowCloneProgress] = useState(false);
  const [cloneProgress, setCloneProgress] = useState(0);
  const [cloneCurrentStep, setCloneCurrentStep] = useState(0);
  const [cloneEventTitle, setCloneEventTitle] = useState("");

  // Map functionality state
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapFormData, setMapFormData] = useState({});
  const [mapFormErrors, setMapFormErrors] = useState({});
  const [isSubmittingMap, setIsSubmittingMap] = useState(false);

  const refreshCampaign = async (id) => {
    props.setLoaderBox(true);
    try {
      const response = await getData({}, `campaign/${id}/refresh-counts`);
      if (response.status === 200) {
        const { successCount, failedCount, audienceCount, status } = response.data.data;
        const values = {
          status: status,
          successCount: successCount,
          failedCount: failedCount,
          audienceCount: audienceCount,
        };
        toast.success(response.data.customMessage);
        return values;
      } else {
        toast.error(response.data.customMessage);
      }
      return {};
    } catch (error) {
      toast.error(error.message);
      return {};
    } finally {
      props.setLoaderBox(false);
    }
  };
  // Function to close the SetupMenu popup
  const closeModal = () => {
    setOpenMenuSetup(false);
    setOpenMenuSetupAudio(false);
    setOpenBadgeSetup(false);
    setOpenItemData(null);
    setOpenPosterMaker(false);
    setOpenPosterUsage(false);
    setOpenCompanyProfile(false);
    setOpenTeamManagement(false);
    setOpenProductCatalog(false);
    setShowCloneProgress(false);
    setCloneProgress(0);
    setCloneCurrentStep(0);
    setCloneEventTitle("");
    setOpenTicketResponse(false);
    setShowMapModal(false);
    setSelectedLocation(null);
    setMapFormData({});
    setMapFormErrors({});
  };

  // Map functionality handlers
  const handleLocationSelect = useCallback((location) => {
    setSelectedLocation(location);
    setMapFormData((prev) => ({
      ...prev,
      address: location.address,
      coordinates: {
        lat: location.lat,
        lng: location.lng,
      },
    }));
  }, []);

  const handleMapFormSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const errors = {};
    if (!mapFormData.title) errors.title = "Title is required";
    if (!mapFormData.address) errors.address = "Address is required";
    if (!selectedLocation) errors.location = "Please select a location on the map";

    setMapFormErrors(errors);

    if (Object.keys(errors).length > 0) return;

    try {
      setIsSubmittingMap(true);

      // Here you can add your API call to save the location
      // For example:
      // const response = await postData({
      //   ...mapFormData,
      //   location: {
      //     type: "Point",
      //     coordinates: [selectedLocation.lng, selectedLocation.lat]
      //   }
      // }, "your-api-endpoint");

      toast.success("Location saved successfully!");
      setShowMapModal(false);
      setSelectedLocation(null);
      setMapFormData({});
      setMapFormErrors({});
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error("Failed to save location");
    } finally {
      setIsSubmittingMap(false);
    }
  };

  const openMapModal = () => {
    setShowMapModal(true);
    setMapFormData({
      title: "",
      address: "",
      description: "",
    });
    setMapFormErrors({});
  };

  const onEventChange = (name, updateValue) => {
    // Handle switching between single and multi-day events
    const isMultiDay = updateValue["mutliEvent"];
    if (!updateValue["_multiStartDate"]) {
      updateValue["_multiStartDate"] = updateValue["startDate"];
    }
    if (!updateValue["_multiEndDate"]) {
      updateValue["_multiEndDate"] = updateValue["endDate"];
    }
    if (!updateValue["_singleStartDate"]) {
      updateValue["_singleStartDate"] = updateValue["startDate"];
    }
    if (!updateValue["_singleEndDate"]) {
      updateValue["_singleEndDate"] = updateValue["endDate"];
    }
    if (name === "mutliEvent") {
      if (isMultiDay) {
        // Save current values as single day
        updateValue["startDate"] = updateValue["_multiStartDate"] ?? updateValue["startDate"];
        updateValue["endDate"] = updateValue["_multiEndDate"] ?? updateValue["endDate"];
      } else {
        // Save current values as multi-day
        updateValue["startDate"] = updateValue["_singleStartDate"] ?? updateValue["startDate"];
        updateValue["endDate"] = updateValue["_singleEndDate"] ?? updateValue["endDate"];
      }
    }

    // Handle date changes and enforce minimum duration
    if (updateValue["startDate"] || updateValue["endDate"]) {
      const startTime = moment(updateValue["startDate"]);
      const endTime = moment(updateValue["endDate"]);

      if (!isMultiDay) {
        // For single-day events, end date should match start date
        if (name === "startDate") {
          updateValue["endDate"] = moment(startTime).hours(endTime.hours()).minutes(endTime.minutes()).format();
        }

        // Store the single-day values
        updateValue["_singleStartDate"] = updateValue["startDate"];
        updateValue["_singleEndDate"] = updateValue["endDate"];
      } else {
        // Store the multi-day values
        updateValue["_multiStartDate"] = updateValue["startDate"];
        updateValue["_multiEndDate"] = updateValue["endDate"];
      }

      // Ensure end time is after start time
      if (moment(updateValue["endDate"]).isBefore(startTime)) {
        updateValue["endDate"] = moment(startTime).add(1, "hour").format();
      }
    }

    console.log(isMultiDay, moment(updateValue["endDate"]).diff(moment(updateValue["startDate"]), "days"));

    return updateValue;
  };

  const [attributes] = useState([
    // ...(checkprivilege([privileges.admin], userType)
    //   ? [
    //       {
    //         type: "select",
    //         placeholder: "Creating Event for",
    //         name: "franchise",
    //         validation: "",
    //         editable: true,
    //         label: "Creating Event for",
    //         group: "Event Details",
    //         sublabel: "",
    //         showItem: "",
    //         required: true,
    //         customClass: "full",
    //         filter: false,
    //         view: true,
    //         add: true,
    //         update: true,
    //         apiType: "API",
    //         footnote: "You are logged in as a admin, so you need to select the organisation you want to create the event for!",
    //         selectApi: "franchise/select",
    //       },
    //     ]
    //   : []),
    {
      type: "image",
      placeholder: "Event Image",
      name: "logo",
      validation: "",
      default: "false",
      tag: true,
      label: "Event Event Image",
      footnote: "For best results, use a logo with a transparent background",
      required: false,
      view: true,
      add: true,
      update: true,
      customClass: "full",
    },
    {
      type: "text",
      placeholder: "Give yout event a clear, descriptive title",
      name: "title",
      validation: "",
      default: "",
      label: "Event Title",
      required: true,
      view: true,
      add: true,
      update: true,
      customClass: "full",
      footnote: "Be specific and use keywords your audience would search for",
    },
    {
      type: "select",
      placeholder: "Event Type",
      name: "eventType",
      validation: "",
      editable: true,
      label: "Event Type",
      customClass: "full",
      showItem: "",
      required: true,
      filter: false,
      view: true,
      add: true,
      update: true,
      apiType: "JSON",
      selectType: "card",
      selectApi: [
        { value: "In-person", id: "in-person", description: "Host a physical event for direct networking.", icon: "in-person" },
        { value: "Virtual", id: "virtual", description: "Host an online event that connects remote particiapants.", icon: "virtual" },
      ],
    },
    {
      type: "title",
      title: "Mark Your Calendar",
      name: "Mark Your Calendar",
      add: true,
      update: true,
    },
    {
      type: "checkbox",
      placeholder: "Is this a multi day event?",
      name: "mutliEvent",
      onChange: onEventChange,
      validation: "",
      default: "false",
      tag: false,
      label: "Is this a multi day event?",
      required: false,
      customClass: "full",
      view: false,
      add: true,
      update: true,
    },
    {
      type: "datetime",
      placeholder: "Select date",
      name: "startDate",
      split: true,
      onChange: onEventChange,
      validation: "",
      default: moment().add(1, "day").set({ hour: 9, minute: 0, second: 0 }).toDate(), // Tomorrow 9 AM
      label: "Start Date & Time",
      minDate: moment().add(1, "day").startOf("day").toDate(), // Cannot select before tomorrow 12 AM
      tag: true,
      required: true,
      view: true,
      add: true,
      update: true,
      icon: "date",
      customClass: "half",
    },
    {
      type: "datetime",
      placeholder: "Select date",
      name: "endDate",
      split: true,
      onChange: onEventChange,
      validation: "",
      default: moment().add(1, "day").set({ hour: 16, minute: 0, second: 0 }).toDate(), // Tomorrow 4 PM
      label: "End Date & Time",
      condition: { item: "mutliEvent", if: true, then: "enabled", else: "disabled" },
      minDate: moment().add(1, "day").startOf("day").toDate(),
      tag: true,
      required: true,
      view: true,
      add: true,
      update: true,
      icon: "date",
      customClass: "half",
    },
    {
      type: "time",
      placeholder: "Select time",
      name: "endDate",
      condition: { item: "mutliEvent", if: false, then: "enabled", else: "disabled" },
      onChange: onEventChange,
      validation: "",
      default: moment().add(1, "day").set({ hour: 16, minute: 0, second: 0 }).toDate(), // Tomorrow 4 PM
      label: "End Time",
      minDate: moment().add(1, "day").startOf("day").toDate(),
      tag: false,
      required: true,
      view: true,
      add: true,
      update: true,
      icon: "time",
      customClass: "quarter",
    },
    {
      type: "timezone",
      name: "timezone",
      label: "Timezone",
      required: true,
      view: true,
      add: true,
      update: true,
      customClass: "full",
    },
    {
      type: "title",
      title: "Where it's happening",
      name: "Where it's happening",
      add: true,
      update: true,
    },
    {
      type: "text",
      placeholder: "Enter location or venue name",
      name: "venue",
      validation: "",
      default: "",
      label: "Venue",
      required: true,
      view: true,
      tag: true,
      add: true,
      update: true,
      icon: "location",
      customClass: "full",
      footnote: "For virtual events, you can leave this blank or enter 'Online'",
      render: (value, data, attribute) => {
        const getEventStatus = () => {
          const now = moment();
          const start = data.startDate ? moment(data.startDate) : null;
          const end = data.endDate ? moment(data.endDate) : null;

          if (!start) return { status: "No Date", color: "bg-gray-100 text-gray-800" };

          if (now.isBefore(start)) {
            return { status: "Upcoming", color: "bg-blue-100 text-blue-800" };
          } else if (end && now.isAfter(end)) {
            return { status: "Expired", color: "bg-red-100 text-red-800" };
          } else {
            return { status: "Live", color: "bg-green-100 text-green-800" };
          }
        };
        const eventStatus = getEventStatus();
        return (
          <div className="flex flex-col gap-0 w-full">
            <Title>{attribute.label}</Title>
            <div className="flex text-sm justify-between w-full">
              {data.eventType === "virtual" ? (
                <span className="flex items-center gap-2  text-xs ">
                  <Globe className="w-3 h-3" /> Virtual
                </span>
              ) : (
                <span className="flex items-start gap-2  text-xs">
                  <MapPin className="w-3 h-3" /> {value}
                </span>
              )}
              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded-full text-xs ${eventStatus.color}`}>{eventStatus.status} </div>
                <div className="px-2 py-1 rounded-full text-xs items-center flex gap-2 bg-green-100 text-green-800">
                  <User className="w-3 h-3" />
                  {data.registrationCount}
                </div>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      type: "element",
      name: "venueMap",
      label: "Location Map",
      customClass: "full",
      view: false,
      add: true,
      update: true,
      element: ({ formValues, onChange }) => {
        const [mapSearchResults, setMapSearchResults] = useState([]);
        const [isAutoSearching, setIsAutoSearching] = useState(false);
        const [selectedLocation, setSelectedLocation] = useState(null);
        const [mapLoadError, setMapLoadError] = useState(false);

        // Auto-search when venue field changes with debounce
        useEffect(() => {
          if (formValues?.venue && formValues.venue.trim()) {
            // Debounce the search to avoid too many API calls
            const timeoutId = setTimeout(() => {
              handleAutoSearch(formValues.venue);
            }, 1000); // 1 second delay

            return () => clearTimeout(timeoutId);
          } else {
            setMapSearchResults([]);
            setSelectedLocation(null);
          }
        }, [formValues?.venue]);

        const handleAutoSearch = async (query) => {
          if (!query || !query.trim()) return;

          setIsAutoSearching(true);
          try {
            // Use Google Places API for search suggestions
            if (window.google && window.google.maps && window.google.maps.places && window.google.maps.places.PlacesService) {
              const service = new window.google.maps.places.PlacesService(document.createElement("div"));
              const request = {
                query: query,
                fields: ["name", "formatted_address", "geometry"],
              };

              service.textSearch(request, (results, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                  setMapSearchResults(results.slice(0, 5)); // Limit to 5 results

                  // Auto-select the first result if it's a good match
                  if (results.length > 0) {
                    const firstResult = results[0];
                    const venueText = formValues?.venue?.toLowerCase() || "";
                    const resultName = firstResult.name?.toLowerCase() || "";
                    const resultAddress = firstResult.formatted_address?.toLowerCase() || "";

                    // If the venue text is contained in the result name or address, auto-select it
                    if (resultName.includes(venueText) || resultAddress.includes(venueText)) {
                      setTimeout(() => {
                        handleLocationSelect(firstResult);
                      }, 500); // Small delay to show the results first
                    }
                  }
                } else {
                  setMapSearchResults([]);
                }
                setIsAutoSearching(false);
              });
            } else if (window.google && window.google.maps && window.google.maps.Geocoder) {
              // Fallback to geocoding if Places API not available
              const geocoder = new window.google.maps.Geocoder();
              geocoder.geocode({ address: query }, (results, status) => {
                if (status === "OK" && results) {
                  const formattedResults = results.map((result) => ({
                    name: result.formatted_address,
                    formatted_address: result.formatted_address,
                    geometry: result.geometry,
                  }));
                  setMapSearchResults(formattedResults.slice(0, 5));

                  // Auto-select first result for geocoding
                  if (formattedResults.length > 0) {
                    setTimeout(() => {
                      handleLocationSelect(formattedResults[0]);
                    }, 500);
                  }
                } else {
                  setMapSearchResults([]);
                }
                setIsAutoSearching(false);
              });
            } else {
              console.warn("Google Maps API not available for search");
              setMapSearchResults([]);
              setIsAutoSearching(false);
            }
          } catch (error) {
            console.error("Auto search error:", error);
            setIsAutoSearching(false);
          }
        };

        const handleLocationSelect = (location) => {
          const lat = location.geometry.location.lat();
          const lng = location.geometry.location.lng();
          const address = location.formatted_address || location.name;

          // Store coordinates
          onChange(
            {
              target: {
                value: JSON.stringify({
                  lat: lat,
                  lng: lng,
                }),
              },
            },
            "venueCoordinates",
            "hidden"
          );

          setSelectedLocation({
            lat: lat,
            lng: lng,
            address: address,
          });
          setMapSearchResults([]);
        };

        return (
          <div className="space-y-3">
            {/* Auto-search indicator */}
            {isAutoSearching && (
              <div className="flex items-center text-sm text-text-sub">
                <div className="w-4 h-4 border-2 border-t-primary-base border-primary-light rounded-full animate-spin mr-2"></div>
                Searching for "{formValues?.venue}"...
              </div>
            )}

            {/* Search Results */}
            {mapSearchResults.length > 0 && (
              <div className="bg-white border border-stroke-soft rounded-lg shadow-sm max-h-48 overflow-y-auto">
                {mapSearchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleLocationSelect(result)}
                    className="w-full px-4 py-3 text-left hover:bg-bg-weak border-b border-stroke-soft last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <MapPinIcon className="w-4 h-4 text-text-sub mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-main truncate">{result.name}</p>
                        <p className="text-xs text-text-sub truncate">{result.formatted_address}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Map Display */}
            <div className="space-y-3">
              {/* Map Container */}
              <div className="relative">
                <div className="w-full h-64 rounded-lg border border-stroke-soft overflow-hidden" style={{ minHeight: "256px" }}>
                  {mapLoadError ? (
                    <div className="flex items-center justify-center h-full bg-bg-weak">
                      <div className="text-center">
                        <MapPinIcon className="w-8 h-8 text-text-sub mx-auto mb-2" />
                        <p className="text-sm text-text-sub">Map unavailable</p>
                        <p className="text-xs text-text-soft mt-1">Location search still works</p>
                      </div>
                    </div>
                  ) : (
                    <LoadScript
                      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyBvOkBw7cTUFg6cI1vVcD1hE9fQ8rS2tU"}
                      libraries={["places"]}
                      loadingElement={
                        <div className="flex items-center justify-center h-full bg-bg-weak">
                          <div className="text-center">
                            <div className="w-8 h-8 border-2 border-t-primary-base border-primary-light rounded-full animate-spin mx-auto mb-2"></div>
                            <p className="text-sm text-text-sub">Loading map...</p>
                          </div>
                        </div>
                      }
                      onError={(error) => {
                        console.error("Google Maps LoadScript error:", error);
                        setMapLoadError(true);
                      }}
                    >
                      <GoogleMap
                        mapContainerStyle={{ width: "100%", height: "100%" }}
                        center={selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : { lat: 11.2588, lng: 75.7804 }}
                        zoom={selectedLocation ? 15 : 10}
                        options={{
                          styles: [
                            {
                              featureType: "poi",
                              elementType: "labels",
                              stylers: [{ visibility: "off" }],
                            },
                          ],
                        }}
                      >
                        {selectedLocation && (
                          <Marker position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }} title={selectedLocation.address} animation={window.google?.maps?.Animation?.DROP} />
                        )}
                      </GoogleMap>
                    </LoadScript>
                  )}
                </div>
              </div>

              {/* Selected Location Info */}
              {selectedLocation && (
                <div className="bg-bg-weak rounded-lg p-4 border border-stroke-soft">
                  <div className="space-y-2 text-sm text-text-sub">
                    <p>
                      <strong>Address:</strong> {selectedLocation.address}
                    </p>
                    <p>
                      <strong>Coordinates:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      type: "hidden",
      name: "venueCoordinates",
      add: true,
      update: true,
    },
  ]);

  const [ticket] = useState(ticketAttributes);
  const [ticketCoupen] = useState(ticketCoupenAttributes);
  const [paymentHistory] = useState(paymentHistoryAttributes);
  const [instance] = useState(instanceAttributes);
  const [instanceData] = useState(instanceDataAttributes);

  const [actions] = useState([
    {
      element: "button",
      type: "custom",
      id: "dashboard",
      icon: "dashboard",
      title: "Dashboard",
      page: "dashboard",
    },
    {
      element: "button",
      type: "subTabs",
      id: "configure",
      title: "Setup",
      icon: "configure",
      tabs: [
        {
          type: "title",
          title: "BASIC DETAILS",
          id: "BASIC DETAILS",
        },
        {
          type: "information",
          title: "Event Info",
          icon: "info",
          id: "information",
          updateButtonText: "Update Event",
          submitButtonText: "Create Event",
          formTabTheme: "notab",
          params: {
            updateButtonText: "Update Event",
            submitButtonText: "Create Event",
          },
        },
        {
          element: "button",
          type: "subList",
          id: "ticket",
          title: "Ticket",
          icon: "ticket",
          attributes: ticket,
          params: {
            api: `ticket`,
            parentReference: "event",
            icon: "ticket",
            itemTitle: { name: "title", type: "text", collection: "" },
            preFilter: { type: "Ticket" },
            shortName: "Ticket",
            description: "Create and manage different ticket types with customizable pricing and availability ",
            submitButtonText: "Create",
            addPrivilege: true,
            dotMenu: true,
            delPrivilege: true,
            updatePrivilege: true,
            customClass: "medium",
            formMode: `single`,
            popupMode: "full-page",
            popupMenu: "vertical-menu",
            viewMode: "table",
            showEditInDotMenu: false,
            // formTabTheme: "tab",
            actions: [
              {
                element: "button",
                type: "callback",
                callback: (item, data) => {
                  setOpenItemData({ item, data });
                  setOpenMenuSetup(true);
                },
                icon: "form-builder",
                title: "Form Builder",
                params: {
                  itemTitle: { name: "title", type: "text", collection: "" },
                  shortName: "Form Builder",
                  addPrivilege: true,
                  delPrivilege: true,
                  updatePrivilege: true,
                  customClass: "full-page",
                },
                actionType: "button",
              },
              {
                element: "button",
                type: "callback",
                callback: (item, data) => {
                  let patchedData = { ...data };
                  if (item && (item.ticket?._id || item.ticket)) {
                    patchedData._id = item.ticket._id || item.ticket;
                  } else if (item && Array.isArray(item.tickets) && item.tickets.length > 0) {
                    patchedData._id = item.tickets[0]._id || item.tickets[0].id || item.tickets[0];
                  }
                  // Ensure event is present
                  if (!patchedData.event && item.event) {
                    patchedData.event = item.event;
                  }
                  setOpenItemData({ item, data: patchedData });
                  setOpenBadgeSetup(true);
                },
                icon: "badge",
                title: "Badge Builder",
                params: {
                  itemTitle: { name: "title", type: "text", collection: "" },
                  shortName: "Badge Builder",
                  addPrivilege: true,
                  delPrivilege: true,
                  updatePrivilege: true,
                  customClass: "full-page",
                },
                actionType: "button",
              },
            ],
          },
        },
        {
          element: "button",
          type: "custom",
          id: "custom-domain",
          icon: "url",
          title: "Custom Domain",
          page: "domain",
        },
        {
          element: "button",
          type: "subList",
          id: "discount-coupons",
          icon: "coupon",
          visibilityCondition: {
            conditions: [{ item: "ticketType", if: "paid", operator: "equals" }],
            operator: "AND",
            then: true,
            else: false,
          },
          itemTitle: "code",
          title: "Discount Coupons",
          attributes: ticketCoupen,
          params: {
            api: `coupen`,
            parentReference: "event",
            itemTitle: { name: "code", type: "text", collection: "" },
            shortName: "Discount Coupons",
            description: "Create and manage promotional codes and discounts for ticket purchases",
            addPrivilege: true,
            delPrivilege: true,
            updatePrivilege: true,
            customClass: "medium",
            formMode: `single`,
            viewMode: "table",
          },
        },
      ],
    },
    {
      element: "button",
      type: "subTabs",
      id: "registration",
      title: "Registrations",
      icon: "registration",
      tabs: [
        {
          type: "title",
          title: "ATTENDEES",
          id: "ATTENDEES",
        },
        {
          element: "button",
          type: "custom",
          id: "registrations",
          icon: "attendees",
          title: "Registrations",
          description: "View and manage all registered participants for your event",
          page: "attendee",
          ticketType: "Ticket",
        },
        {
          element: "button",
          type: "custom",
          id: "approvals",
          icon: "registration-approval",
          title: "Approvals",
          description: "Review and approve pending registration requests requiring manual confirmation",
          page: "approval",
          ticketType: "Ticket",
          visibilityCondition: {
            conditions: [{ item: "hasTicketsNeedingApproval", if: true, operator: "equals" }],
            operator: "AND",
            then: true,
            else: false,
          },
        },
        {
          type: "title",
          title: "ORDERS",
          id: "ORDERS",
          visibilityCondition: {
            conditions: [{ item: "ticketType", if: "paid", operator: "equals" }],
            operator: "AND",
            then: true,
            else: false,
          },
        },
        {
          element: "button",
          type: "subList",
          id: "orders",
          title: "Orders",
          icon: "orders",
          visibilityCondition: {
            conditions: [{ item: "ticketType", if: "paid", operator: "equals" }],
            operator: "AND",
            then: true,
            else: false,
          },
          attributes: paymentHistory,
          params: {
            api: `orders/status`,
            parentReference: "event",
            itemTitle: { name: "fullName", type: "text", collection: "authentication" },
            shortName: "Orders",
            description: "Track all ticket purchases and monitor payment status",
            addPrivilege: false,
            delPrivilege: false,
            updatePrivilege: false,
            customClass: "medium",
            formMode: "double",
            viewMode: "table",
            labels: [
              { key: "No of orders", title: "NO OF ORDERS", icon: "orders", backgroundColor: "rgba(0, 200, 81, 0.15)", color: "#006B27" },
              { key: "today order", title: "TODAY ORDER", icon: "checked", backgroundColor: "rgba(0, 122, 255, 0.15)", color: "#004999" },
              { key: "Failed orders", title: "FAILED ORDERS", icon: "close", backgroundColor: "rgba(255, 69, 58, 0.15)", color: "#99231B" },
              { key: "Total amount", title: "TOTAL AMOUNT", icon: "currency", backgroundColor: "rgba(88, 86, 214, 0.15)", color: "#2B2A69" },
            ],
          },
        },
        {
          element: "button",
          type: "subList",
          id: "cancelled-orders",
          title: "Cancelled Orders",
          icon: "orders",
          visibilityCondition: {
            conditions: [{ item: "ticketType", if: "paid", operator: "equals" }],
            operator: "AND",
            then: true,
            else: false,
          },
          attributes: paymentHistory,
          params: {
            api: `orders/status?status=failed`,
            parentReference: "event",
            itemTitle: { name: "fullName", type: "text", collection: "authentication" },
            shortName: "Cancelled Orders",
            description: "Track cancelled and failed payment orders",
            addPrivilege: false,
            delPrivilege: false,
            updatePrivilege: false,
            customClass: "medium",
            formMode: "double",
            viewMode: "table",
          },
        },
        {
          type: "title",
          title: "CHECK-IN",
          id: "CHECK-IN",
        },
        {
          element: "button",
          type: "custom",
          id: "attendance",
          title: "Attendance",
          icon: "attendance",
          description: "Monitor participant check-ins and track overall event attendance",
          page: "attendance",
        },
        {
          element: "button",
          type: "subList",
          id: "instance",
          title: "Instance",
          icon: "instance",
          attributes: instance,
          params: {
            api: `instance`,
            parentReference: "event",
            itemTitle: { name: "title", type: "text", collection: "" },
            actions: [],
            shortName: "Instance",
            description: "Set up and manage scanning instances to be used in different location which tickets can be validated or scanned",
            addPrivilege: true,
            delPrivilege: true,
            updatePrivilege: true,
            customClass: "medium",
            viewMode: "table",
          },
        },
        {
          element: "button",
          type: "subTabs",
          id: "instance-check-in",
          title: "Instance Check-In",
          icon: "instance",
          dynamicTabs: {
            api: "instance/select",
            template: {
              element: "button",
              type: "subList",
              id: "instance-all",
              title: "All",
              icon: "all",
              attributes: instanceData,
              params: {
                api: `instance/attendance`,
                parentReference: "event",
                itemTitle: { name: "title", type: "text", collection: "" },
                preFilter: { type: "all" },
                labels: [
                  { key: "checkIn", title: "NO OF CHECK-IN", icon: "check-in", backgroundColor: "rgba(0, 200, 81, 0.15)", color: "#006B27" },
                  { key: "pending", title: "PENDING", icon: "pending", backgroundColor: "rgba(255, 69, 58, 0.15)", color: "#99231B" },
                  { key: "checkInRate", title: "CHECK-IN RATE", icon: "check-in-rate", backgroundColor: "rgba(0, 122, 255, 0.15)", color: "#004999" },
                  { key: "noShow", title: "NO-SHOW RATE", icon: "no-show", backgroundColor: "rgba(153, 153, 6, 0.15)", color: "#856404" },
                ],
                shortName: "Instance Check-In",
                description: "Monitor and manage ticket scans for assigned scanning instances",
                addPrivilege: false,
                delPrivilege: false,
                exportPrivilege: false,
                updatePrivilege: false,
                customClass: "medium",
                viewMode: "table",
              },
            },
          },
        },
      ],
    },
    {
      element: "button",
      type: "subList",
      id: "design",
      title: "Design",
      icon: "display",
      tabs: [
        {
          type: "title",
          title: "WEBSITE",
          id: "WEBSITE",
        },
        {
          element: "button",
          type: "custom",
          id: "layout-content",
          icon: "registration-approval",
          title: "Layout & Content",
          page: "layoutContent",
        },
      ],
    },
    {
      element: "button",
      type: "callback",
      actionType: "dotmenu",
      callback: async (item, data, refreshUpdate) => {
        // Improved confirmation message
        props.setMessage({
          type: 2,
          title: "🎯 Clone Event",
          content: `
            <div style="padding: 8px 0;">
              <div style="margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">Are you sure you want to clone this event?</h4>
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6; margin-bottom: 16px;">
                  <strong style="color: #1f2937;">"${data.title}"</strong>
                </div>
              </div>
              
              <div style="margin-bottom: 16px;">
                <h5 style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">✨ What will be cloned:</h5>
                <ul style="margin: 0; padding-left: 20px; color: #6b7280; font-size: 13px; line-height: 1.6;">
                  <li>🎫 All tickets, forms, and registration settings</li>
                  <li>🎤 Speakers, sessions, and event agenda</li>
                  <li>🏢 Sponsors, exhibitors, and their categories</li>
                  <li>🌐 Website design, landing pages, and content</li>
                  <li>⚙️ All settings, permissions, and configurations</li>
                  <li>🔗 New unique subdomain will be created</li>
                </ul>
              </div>
              
              <div style="background: #fef3c7; padding: 12px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                <div style="font-size: 13px; color: #92400e;">
                  <strong>📝 Note:</strong> The cloned event will be titled <strong>"Copy of ${data.title}"</strong> and will start as <strong>inactive</strong>. All registration data will be reset to zero.
                </div>
              </div>
            </div>
          `,
          proceed: "🚀 Yes, Clone Event",
          onProceed: async () => {
            try {
              // Show progress in the same modal
              const showProgress = (step, message, progress) => {
                props.setMessage({
                  type: 2,
                  title: "🎯 Cloning Event",
                  content: `
                    <div style="padding: 20px; text-align: center;">
                      <div style="margin-bottom: 20px;">
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: white; font-size: 24px; animation: pulse 2s infinite;">
                          🚀
                        </div>
                        <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 18px;">Cloning "${data.title}"</h3>
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">${message}</p>
                      </div>
                      
                      <!-- Progress Bar -->
                      <div style="background: #f3f4f6; border-radius: 10px; height: 8px; margin-bottom: 16px; overflow: hidden;">
                        <div style="background: linear-gradient(90deg, #3b82f6, #1d4ed8); height: 100%; width: ${progress}%; transition: width 0.5s ease-out; border-radius: 10px;"></div>
                      </div>
                      
                      <!-- Progress Steps -->
                      <div style="display: flex; justify-content: space-between; font-size: 11px; color: #6b7280; margin-bottom: 20px;">
                        <span style="color: ${step >= 1 ? "#3b82f6" : "#9ca3af"}; font-weight: ${step >= 1 ? "600" : "400"};">Setup</span>
                        <span style="color: ${step >= 2 ? "#3b82f6" : "#9ca3af"}; font-weight: ${step >= 2 ? "600" : "400"};">Tickets</span>
                        <span style="color: ${step >= 3 ? "#3b82f6" : "#9ca3af"}; font-weight: ${step >= 3 ? "600" : "400"};">Content</span>
                        <span style="color: ${step >= 4 ? "#3b82f6" : "#9ca3af"}; font-weight: ${step >= 4 ? "600" : "400"};">Settings</span>
                        <span style="color: ${step >= 5 ? "#3b82f6" : "#9ca3af"}; font-weight: ${step >= 5 ? "600" : "400"};">Speakers</span>
                        <span style="color: ${step >= 6 ? "#3b82f6" : "#9ca3af"}; font-weight: ${step >= 6 ? "600" : "400"};">Sponsors</span>
                        <span style="color: ${step >= 7 ? "#3b82f6" : "#9ca3af"}; font-weight: ${step >= 7 ? "600" : "400"};">Website</span>
                        <span style="color: ${step >= 8 ? "#10b981" : "#9ca3af"}; font-weight: ${step >= 8 ? "600" : "400"};">Complete</span>
                      </div>
                      
                      <!-- Current Step Details -->
                      <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                        <div style="font-size: 13px; color: #374151;">
                          <strong>Step ${step} of 8:</strong> ${message}
                        </div>
                      </div>
                    </div>
                    
                    <style>
                      @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                      }
                    </style>
                  `,
                  hideButtons: true, // Hide all buttons during progress
                });
              };

              const steps = [
                { message: "Initializing clone process...", delay: 800 },
                { message: "Cloning tickets and registration settings...", delay: 1000 },
                { message: "Copying event content and pages...", delay: 900 },
                { message: "Duplicating settings and configurations...", delay: 800 },
                { message: "Cloning speakers and sessions...", delay: 900 },
                { message: "Copying sponsors and exhibitors...", delay: 800 },
                { message: "Setting up website and subdomain...", delay: 1000 },
                { message: "Finalizing clone process...", delay: 700 },
              ];

              // Start the cloning process with progress updates
              let currentStep = 0;

              const updateProgress = async () => {
                for (let i = 0; i < steps.length; i++) {
                  currentStep = i + 1;
                  const progress = Math.round((currentStep / steps.length) * 100);
                  showProgress(currentStep, steps[i].message, progress);
                  await new Promise((resolve) => setTimeout(resolve, steps[i].delay));
                }
              };

              // Run progress updates and API call in parallel
              const [_, response] = await Promise.all([updateProgress(), postData({ eventId: data._id }, "event/clone")]);

              if (response.status === 201 && response.data.success) {
                props.setMessage({
                  type: 1,
                  title: "🎉 Clone Successful!",
                  content: `
                    <div style="text-align: center; padding: 20px;">
                      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: white; font-size: 32px; box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);">✓</div>
                      <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 20px;">Event Cloned Successfully! 🎊</h3>
                      <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 15px;">Your event has been successfully duplicated with all settings and content. The event list will be updated automatically.</p>
                      <div style="background: #f0fdf4; padding: 16px; border-radius: 12px; border: 1px solid #bbf7d0; margin-bottom: 16px;">
                        <div style="font-size: 14px; color: #166534; margin-bottom: 4px;"><strong>New Event:</strong></div>
                        <div style="font-weight: 600; color: #15803d; font-size: 16px;">"${response.data.data.title}"</div>
                      </div>
                      <div style="font-size: 13px; color: #6b7280; line-height: 1.5;">
                        💡 The cloned event is currently <strong>inactive</strong>. You can activate it and make any necessary changes from the event settings.
                      </div>
                    </div>
                  `,
                  okay: "🔄 Refresh List",
                  cancel: "📋 View Events",
                  onProceed: async () => {
                    try {
                      // Virtual refresh - update the event list without page reload
                      if (refreshUpdate) {
                        console.log("🔄 Refreshing event list virtually...");
                        console.log("📊 New cloned event data:", response.data.data);

                        // Add a small delay to ensure the backend has processed the new event
                        await new Promise((resolve) => setTimeout(resolve, 1500));

                        // Call refresh function multiple times to ensure it works
                        await refreshUpdate();

                        // Wait a bit more and refresh again to be sure
                        await new Promise((resolve) => setTimeout(resolve, 500));
                        await refreshUpdate();

                        console.log("✅ Virtual refresh completed");

                        // Show confirmation with the new event name
                        props.setMessage({
                          type: 0,
                          title: "✅ List Updated",
                          content: `
                            <div style="text-align: center; padding: 20px;">
                              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; color: white; font-size: 24px;">✓</div>
                              <div style="font-size: 16px; color: #059669; margin-bottom: 8px; font-weight: 600;">
                                Event List Updated!
                              </div>
                              <div style="font-size: 14px; color: #374151; margin-bottom: 12px;">
                                Your new event is now available:
                              </div>
                              <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; border: 1px solid #bbf7d0; margin-bottom: 16px;">
                                <div style="font-weight: 600; color: #15803d; font-size: 15px;">"${response.data.data.title}"</div>
                              </div>
                              <div style="font-size: 12px; color: #6b7280;">
                                Look for it in your events list - it should appear at the top or bottom depending on your sort order.
                              </div>
                            </div>
                          `,
                          autoClose: 4000,
                        });
                      } else {
                        console.log("⚠️ No refreshUpdate function available, reloading page...");
                        window.location.reload();
                      }
                    } catch (error) {
                      console.error("Error during virtual refresh:", error);
                      // Fallback to page reload if virtual refresh fails
                      console.log("🔄 Falling back to page reload...");
                      window.location.reload();
                    }
                  },
                  onClose: () => {
                    // Alternative: Force page reload to guarantee the new event shows
                    console.log("🔄 User chose to reload page to see updated list...");
                    window.location.reload();
                  },
                });
              } else {
                throw new Error(response.data.message || "Failed to clone event");
              }
            } catch (error) {
              console.error("Clone error:", error);
              setShowCloneProgress(false);

              props.setMessage({
                type: 2,
                title: "❌ Clone Failed",
                content: `
                  <div style="text-align: center; padding: 20px;">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: white; font-size: 32px; box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3);">✕</div>
                    <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px;">Clone Process Failed</h3>
                    <div style="background: #fef2f2; padding: 16px; border-radius: 12px; border: 1px solid #fecaca; margin-bottom: 16px;">
                      <div style="font-size: 14px; color: #991b1b; line-height: 1.5;">
                        <strong>Error:</strong> ${error.message || "An unexpected error occurred during the cloning process"}
                      </div>
                    </div>
                    <div style="font-size: 13px; color: #6b7280;">
                      💡 Please try again or contact support if the issue persists.
                    </div>
                  </div>
                `,
                okay: "🔄 Try Again",
                onClose: () => {},
              });
            }
          },
          data: data,
        });
      },
      icon: "copy",
      title: "Clone Event",
    },
  ]);

  const MetricTileRender = ({ labels, data }) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {labels.map((label, index) => {
          const metricData = data?.[label.key] ?? {};
          return (
            <div key={label.key || index} className="bg-white rounded-lg shadow-sm border border-stroke-soft p-4">
              <div className="flex items-center gap-3">
                {label.icon?.length > 0 && (
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center`}
                    style={{
                      backgroundColor: label.backgroundColor || "#f3f4f6",
                      color: label.color || "#6b7280",
                    }}
                  >
                    <GetIcon icon={label.icon} />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-text-sub mb-1">{label.title}</h3>
                  <p className="text-lg font-bold text-text-main">
                    {label.key === "Total amount" ? (
                      <>
                        {typeof metricData.count === "string" ? (
                          // Multiple currencies case - count is already formatted as "KWD 1190 + INR 1000"
                          metricData.count
                        ) : (
                          // Single currency case
                          <>
                            {metricData.currency?.toUpperCase()} {metricData.count}
                          </>
                        )}
                        {metricData?.total && ` / ${metricData.total}`}
                        {metricData?.suffix && metricData.suffix}
                      </>
                    ) : (
                      <>
                        {metricData?.count}
                        {metricData?.total && ` / ${metricData.total}`}
                        {metricData?.suffix && metricData.suffix}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Container className="noshadow">
      {/* <pre>{JSON.stringify(props.itemPages, null, 2)}</pre> */}
      <ListTable
        // lastUpdateDate={lastUpdateDate}
        itemDescription={{ name: "startDate", type: "datetime" }}
        rowLimit={9}
        showInfo={false}
        viewMode="list"
        // showFilter={true}
        itemOpenMode={{ type: "open" }}
        headerActions={[
          {
            label: "Visit Website",
            icon: "share",
            onClick: (openData) => {
              // First try to get the custom domain using the whitelisted-Domains endpoint
              getData({ event: openData.data._id }, "whitelisted-Domains").then((domainRes) => {
                if (domainRes.status === 200) {
                  const domains = domainRes.data.response || [];
                  // Look for the default domain (isDefault: true) regardless of app type
                  const defaultDomain = domains.find((domain) => domain.isDefault === true);

                  if (defaultDomain) {
                    const websiteUrl = defaultDomain.domain.includes("http") ? defaultDomain.domain : `https://${defaultDomain.domain}`;
                    window.open(websiteUrl, "_blank");
                  } else {
                    // Fallback to regular website URL if no default domain is set
                    getData({ id: openData.data._id }, "event/website").then((res) => {
                      if (res.status === 200 && res.data.data) {
                        const websiteUrl = res.data.data.includes("http") ? res.data.data : `https://${res.data.data}`;
                        window.open(websiteUrl, "_blank");
                      }
                    });
                  }
                }
              });
            },
          },
        ]}
        icon="event"
        addLabel={{ label: "Create Event", icon: "add" }}
        submitButtonText={"Create"}
        showInfoType={"edit"}
        displayColumn={"triple"}
        profileImage={"logo"}
        // formStyle={"page"}
        enableFullScreen={true}
        bulkUplaod={false}
        formLayout={"center medium"}
        // formTabTheme={"steps"}
        isSingle={false}
        popupMode="full-page"
        popupMenu={"vertical-menu"}
        parentReference={"event"}
        actions={actions}
        showTitle={false}
        // description={`Create and manage your events with our comprehensive platform`}
        api={checkprivilege([privileges.admin], userType) ? `event` : checkprivilege([privileges.franchiseAdmin], userType) ? `event/franchise` : `event/event-admin`}
        itemTitle={{ name: "title", type: "text", collection: "" }}
        shortName={`Event`}
        formMode={`double`}
        labels={[
          { key: "Live Events", title: "LIVE EVENTS", icon: "calendar-check", backgroundColor: "rgba(0, 200, 81, 0.15)", color: "#006B27" },
          { key: "Upcoming Events", title: "UPCOMING EVENTS", icon: "calendar-plus", backgroundColor: "rgba(0, 122, 255, 0.15)", color: "#004999" },
          { key: "Archive", title: "PAST EVENTS", icon: "calendar-minus", backgroundColor: "rgba(255, 69, 58, 0.15)", color: "#99231B" },
          { key: "Total Events", title: "TOTAL EVENTS", icon: "calendar-alt", backgroundColor: "rgba(88, 86, 214, 0.15)", color: "#2B2A69" },
        ]}
        {...props}
        addPrivilege={true}
        updatePrivilege={true}
        attributes={attributes}
        subPageAuthorization={true}
        dotMenu={true}
        showEditInDotMenu={true}
        showDeleteInDotMenu={true}
        delPrivilege={true}
        // ListItemRender={ListItemRender}
        // MetricTileRender={MetricTileRender}
      ></ListTable>
      {openMenuSetup && openItemData && (
        <PopupView
          popupData={
            <EventForm
              {...props}
              data={openItemData?.data || {}}
              user={props?.user}
              themeColors={themeColors}
              setMessage={props?.setMessage}
              setLoaderBox={props?.setLoaderBox}
              setOpenEventFormSettingsTrigger={openEventFormSettingsTrigger}
            />
          }
          themeColors={themeColors}
          closeModal={() => setOpenMenuSetup(false)}
          customClass={"full-page"}
          itemTitle={{ name: "title", type: "text", collection: "", render: (value, rowData) => <EventFormHeader rowData={rowData} /> }}
          openData={{
            data: { _id: openItemData?.data?._id || "event-form", title: openItemData?.data?.title || "Event Form" },
          }}
          headerActions={[
            // { label: "Publish", icon: "publish" },
            { label: "Settings", icon: "settings", onClick: () => setOpenEventFormSettingsTrigger((prev) => prev + 1) },
          ]}
        ></PopupView>
      )}
      {openTicketForm && openItemData && (
        <PopupView
          popupData={
            <FormBuilderNew
              {...props}
              data={openItemData?.data || {}}
              user={props?.user}
              themeColors={themeColors}
              setMessage={props?.setMessage}
              setLoaderBox={props?.setLoaderBox}
              openSettingsTrigger={openSettingsTrigger}
            />
          }
          themeColors={themeColors}
          closeModal={() => setOpenTicketForm(false)}
          customClass={"full-page"}
          itemTitle={{ name: "title", type: "text", collection: "", render: (value, rowData) => <FormBuilderHeader rowData={rowData} /> }}
          openData={{
            data: { _id: openItemData?.data?._id || "form-builder", title: openItemData?.data?.title || "Form Builder" },
          }}
          headerActions={[
            { label: "Publish", icon: "publish" },
            { label: "Settings", icon: "settings", onClick: () => setOpenSettingsTrigger((prev) => prev + 1) },
          ]}
        ></PopupView>
      )}
      {openPosterMaker && openItemData && (
        <PopupView
          // Popup data is a JSX element which is binding to the Popup Data Area like HOC
          popupData={<PosterBuilder {...props} type={"advocacy"} data={openItemData.data} item={openItemData.item} />}
          themeColors={themeColors}
          closeModal={closeModal}
          itemTitle={{ name: "title", type: "text", collection: "", render: (value, rowData) => <PosterBuilderHeader rowData={rowData} /> }}
          // openData={openItemData} // Pass selected item data to the popup for setting the time and taking menu id and other required data from the list item
          openData={{ data: { _id: "print_preparation", ...openItemData?.data } }}
          customClass={"full-page"}
        ></PopupView>
      )}
      {openPosterUsage && openItemData && (
        <PopupView
          // Popup data is a JSX element which is binding to the Popup Data Area like HOC
          // popupData={<ListTable api={`advocacy-poster-usage?advocacyPoster=${openItemData.data._id}`}
          //   attributes={advocacyPosterUsage}
          //   />}
          popupData={<IAmAttending posterId={openItemData.data._id} />}
          themeColors={themeColors}
          closeModal={closeModal}
          itemTitle={{ name: "title", type: "text", collection: "" }}
          // openData={openItemData} // Pass selected item data to the popup for setting the time and taking menu id and other required data from the list item
          openData={{ data: { _id: "print_preparation", title: "Poster Usage" } }}
          customClass={"full-page"}
        ></PopupView>
      )}
      {openBadgeSetup && openItemData && (
        <PopupView
          // Popup data is a JSX element which is binding to the Popup Data Area like HOC
          // popupData={<BadgeForm {...props} data={openItemData.data} item={openItemData.item} />}
          popupData={<PosterBuilder {...props} type={"badge"} data={openItemData.data} item={openItemData.item} />}
          themeColors={themeColors}
          closeModal={closeModal}
          itemTitle={{ name: "title", type: "text", collection: "" }}
          // openData={openItemData} // Pass selected item data to the popup for setting the time and taking menu id and other required data from the list item
          openData={{ data: { _id: "print_preparation", title: "Badge" } }}
          customClass={"full-page"}
        ></PopupView>
      )}
      {openMenuSetupAudio && (
        <PopupView
          itemTitle={{ name: "title", type: "text", collection: "" }}
          popupData={<UploadAudio {...props} data={openItemData.data} />}
          openData={{ data: { _id: "print_preparation", title: "Upload Audio / " + openItemData?.data?.title } }}
          themeColors={themeColors}
          customClass={"large"}
          closeModal={() => setOpenMenuSetupAudio(false)}
        ></PopupView>
      )}

      {/* Map Modal */}
      <Modal
        isOpen={showMapModal}
        onClose={() => {
          setShowMapModal(false);
          setSelectedLocation(null);
          setMapFormData({});
          setMapFormErrors({});
        }}
        title="Select Event Location"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6">
          {/* Map Picker Component */}
          <div>
            <label className="block text-sm font-medium text-text-main mb-2">Select Location on Map</label>
            <MapPicker onLocationSelect={handleLocationSelect} height="500px" />
            {mapFormErrors.location && <p className="mt-1 text-xs text-state-error">{mapFormErrors.location}</p>}
          </div>

          {/* Form section */}
          <form onSubmit={handleMapFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Location Title</label>
                <input
                  type="text"
                  value={mapFormData.title || ""}
                  onChange={(e) => setMapFormData({ ...mapFormData, title: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-base focus:border-primary-base transition-colors ${
                    mapFormErrors.title ? "border-state-error" : "border-stroke-soft"
                  }`}
                  placeholder="Enter location title"
                />
                {mapFormErrors.title && <p className="mt-1 text-xs text-state-error">{mapFormErrors.title}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-text-main mb-1.5">Address</label>
                <input
                  type="text"
                  value={mapFormData.address || ""}
                  onChange={(e) => setMapFormData({ ...mapFormData, address: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-base focus:border-primary-base transition-colors ${
                    mapFormErrors.address ? "border-state-error" : "border-stroke-soft"
                  }`}
                  placeholder="Enter address"
                />
                {mapFormErrors.address && <p className="mt-1 text-xs text-state-error">{mapFormErrors.address}</p>}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-main mb-1.5">Description (Optional)</label>
              <textarea
                value={mapFormData.description || ""}
                onChange={(e) => setMapFormData({ ...mapFormData, description: e.target.value })}
                className="w-full px-3 py-2.5 border border-stroke-soft rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-base focus:border-primary-base transition-colors"
                placeholder="Enter location description"
                rows={3}
              />
            </div>

            {/* Selected Location Info */}
            {selectedLocation && (
              <div className="p-4 bg-bg-weak rounded-lg border border-stroke-soft">
                <h4 className="text-sm font-medium text-text-main mb-2">Selected Location Details</h4>
                <div className="space-y-1 text-sm text-text-sub">
                  <p>
                    <strong>Address:</strong> {selectedLocation.address}
                  </p>
                  <p>
                    <strong>Coordinates:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-stroke-soft">
              <button
                type="button"
                onClick={() => {
                  setShowMapModal(false);
                  setSelectedLocation(null);
                  setMapFormData({});
                  setMapFormErrors({});
                }}
                className="px-4 py-2 text-text-sub bg-white border border-stroke-soft rounded-lg hover:bg-bg-weak focus:outline-none focus:ring-2 focus:ring-stroke-soft transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingMap}
                className="px-4 py-2 bg-primary-base text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200 font-medium"
              >
                {isSubmittingMap ? (
                  <span className="flex items-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <MapPinIcon className="w-4 h-4 mr-1.5" />
                    Save Location
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </Container>
  );
};
// exporting the page with parent container layout..
export default Layout(Event);
