import React, { useEffect, useState, useMemo, useCallback } from "react";
import FormInput from "../../../../core/input";
import AutoForm from "../../../../core/autoform/AutoForm";
import PopupView from "../../../../core/popupview";
import { useSelector } from "react-redux";
import { ElementContainer } from "../../../../core/elements";
import { deleteData, getData, postData, putData } from "../../../../../backend/api";
import withLayout from "../../../../core/layout";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import EventFormPrimary from "./primary";
import { customFields, quickFields } from "./styles";
import { useToast } from "../../../../core/toast";
import SettingsModal from "./SettingsModal";
import { FaCopy, FaMagic } from "react-icons/fa";
// import geminiService from "../../../../services/geminiService";
import geminiService from "../../../../../services/geminiService";
import {
  Plus,
  X,
  User,
  Phone,
  Mail,
  Building,
  Globe,
  Calendar,
  CheckSquare,
  Hash,
  FileText,
  Edit,
  Search,
  Columns2,
  Columns,
  GripVertical,
  Lock,
  Unlock,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import IphoneMockup from "./iphoneMockup";

// Map form field types to icons (aligns with formBuilderNew)
const getFieldTypeIcon = (type) => {
  const iconMap = {
    text: <User className="w-5 h-5" />,
    email: <Mail className="w-5 h-5" />,
    mobilenumber: <Phone className="w-5 h-5" />,
    number: <Hash className="w-5 h-5" />,
    password: <Lock className="w-5 h-5" />,
    date: <Calendar className="w-5 h-5" />,
    time: <Clock className="w-5 h-5" />,
    file: <FileText className="w-5 h-5" />,
    checkbox: <CheckSquare className="w-5 h-5" />,
    select: <Columns className="w-5 h-5" />,
    multiSelect: <Columns2 className="w-5 h-5" />,
    textarea: <Edit className="w-5 h-5" />,
    htmleditor: <Edit className="w-5 h-5" />,
    html: <Edit className="w-5 h-5" />,
    company: <Building className="w-5 h-5" />,
    url: <Globe className="w-5 h-5" />,
  };
  return iconMap[type] || <Edit className="w-5 h-5" />;
};

// New CloneTicketPopup Component
const CloneTicketPopup = ({ cloneTickets = [], isLoadingTickets = false, selectedCloneTicket, setSelectedCloneTicket, isCloning = false, onClone, onClose }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          maxWidth: "512px",
          width: "100%",
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ background: "linear-gradient(to right, #2563eb, #1d4ed8)", color: "white", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="m4 16 0 2 0 0 2 0 9.5-9.5-2-2L4 16" />
                <path d="m22 4-2-2-6.5 6.5 2 2L22 4" />
              </svg>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>Clone Ticket Fields</h2>
                <p style={{ color: "#bfdbfe", fontSize: "14px", margin: "4px 0 0 0" }}>Select a ticket to copy its custom fields</p>
              </div>
            </div>
            <button onClick={onClose} style={{ color: "white", background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m18 6-12 12" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "24px", flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ marginBottom: "16px" }}>
            <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "16px" }}>Choose a ticket from the list below to copy all its custom fields to the current ticket.</p>
          </div>

          {/* Loading State */}
          {isLoadingTickets && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#6b7280" }}>
                <div style={{ width: "24px", height: "24px", border: "2px solid #2563eb", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                <span>Loading tickets...</span>
              </div>
            </div>
          )}

          {/* No Tickets State */}
          {!isLoadingTickets && cloneTickets.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", color: "#6b7280" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" style={{ marginBottom: "12px" }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8" />
              </svg>
              <h3 style={{ fontSize: "18px", fontWeight: "500", color: "#374151", margin: "0 0 4px 0" }}>No Other Tickets Found</h3>
              <p style={{ fontSize: "14px", textAlign: "center", margin: 0 }}>There are no other tickets in this event to clone fields from.</p>
            </div>
          )}

          {/* Tickets Grid */}
          {!isLoadingTickets && cloneTickets.length > 0 && (
            <div style={{ display: "grid", gap: "12px", overflowY: "auto", paddingRight: "8px", flex: 1, minHeight: 0 }}>
              {cloneTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  style={{
                    border: selectedCloneTicket === ticket._id ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "16px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    backgroundColor: selectedCloneTicket === ticket._id ? "#eff6ff" : "white",
                  }}
                  onClick={() => setSelectedCloneTicket(ticket._id)}
                  onMouseEnter={(e) => {
                    if (selectedCloneTicket !== ticket._id) {
                      e.target.style.borderColor = "#93c5fd";
                      e.target.style.boxShadow = "none";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCloneTicket !== ticket._id) {
                      e.target.style.borderColor = "#e5e7eb";
                      e.target.style.boxShadow = "none";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                        <h3 style={{ fontWeight: "500", color: "#111827", margin: 0 }}>{ticket.title || "Untitled Ticket"}</h3>
                        {ticket.type && (
                          <span style={{ padding: "4px 8px", borderRadius: "9999px", fontSize: "12px", fontWeight: "500", backgroundColor: "#dbeafe", color: "#1e40af" }}>{ticket.type}</span>
                        )}
                      </div>

                      {ticket.description && <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 12px 0" }}>{ticket.description}</p>}

                      <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "#6b7280" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="m22 21-3-3m0 0L16 15m3 3 3-3m-3 3v6" />
                          </svg>
                          <span>ID: {ticket._id.slice(-6)}</span>
                        </div>
                        {ticket.updatedAt && (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                              <line x1="16" x2="16" y1="2" y2="6" />
                              <line x1="8" x2="8" y1="2" y2="6" />
                              <line x1="3" x2="21" y1="10" y2="10" />
                            </svg>
                            <span>Modified {formatDate(ticket.updatedAt)}</span>
                          </div>
                        )}
                        {ticket.price !== undefined && (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ color: "#059669", fontWeight: "500" }}>{ticket.price === 0 ? "Free" : `$${ticket.price}`}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ marginLeft: "16px" }}>
                      {selectedCloneTicket === ticket._id && (
                        <div style={{ width: "24px", height: "24px", backgroundColor: "#3b82f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <polyline points="20,6 9,17 4,12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ backgroundColor: "#f9fafb", padding: "16px 24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button
            onClick={onClose}
            disabled={isCloning}
            style={{ padding: "8px 16px", color: "#6b7280", backgroundColor: "transparent", border: "none", cursor: isCloning ? "not-allowed" : "pointer" }}
          >
            Cancel
          </button>
          <button
            disabled={!selectedCloneTicket || isCloning || isLoadingTickets}
            style={{
              padding: "8px 24px",
              borderRadius: "8px",
              fontWeight: "500",
              border: "none",
              cursor: selectedCloneTicket && !isCloning && !isLoadingTickets ? "pointer" : "not-allowed",
              backgroundColor: selectedCloneTicket && !isCloning && !isLoadingTickets ? "#2563eb" : "#d1d5db",
              color: selectedCloneTicket && !isCloning && !isLoadingTickets ? "white" : "#6b7280",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onClick={onClone}
          >
            {isCloning ? (
              <>
                <div style={{ width: "16px", height: "16px", border: "2px solid white", borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
                <span>Cloning...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="m4 16 0 2 0 0 2 0 9.5-9.5-2-2L4 16" />
                  <path d="m22 4-2-2-6.5 6.5 2 2L22 4" />
                </svg>
                <span>Clone Fields</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add CSS animation */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `,
        }}
      />
    </div>
  );
};

// FormBuilder Component - Updated with modern design to match formBuilderNew layout
// Features: Two-panel layout with field builder on left and live preview on right
// Maintains all existing functionality while providing modern UI/UX
const FormBuilder = (props) => {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEventSidebarOpen, setIsEventSidebarOpen] = useState(false);
  const themeColors = useSelector((state) => state.themeColors);
  const [activeInput, setActiveInput] = useState({});
  const [ticketFormValues, setTicketFormValues] = useState(null);
  const [eventTicketFormValues, setEventTicketFormValues] = useState(null);
  const [id, setId] = useState("");
  const [activeInputType, setActiveInputType] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedEventField, setSelectedEventField] = useState(null);
  const [triggerEffect, setTriggerEffect] = useState(false); // State variable to trigger useEffect
  const [formFields, setFormFields] = useState([]);
  const [originalFormFields, setOriginalFormFields] = useState([]);
  const [eventFormFields, setEventFormFields] = useState([]);
  const [countries, setCountries] = useState([]);
  const [ticketData, setTicketData] = useState(null);
  const [isClonePopupOpen, setIsClonePopupOpen] = useState(false);
  const [cloneTickets, setCloneTickets] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [selectedCloneTicket, setSelectedCloneTicket] = useState(null);
  const [isCloning, setIsCloning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Editing toggle and inline field selector (align with formBuilderNew)
  const [isEditingEnabled, setIsEditingEnabled] = useState(false);
  const [isFieldSelectorOpen, setIsFieldSelectorOpen] = useState(false);
  const [fieldSelectorTarget, setFieldSelectorTarget] = useState(""); // 'event' | 'custom'
  const [fieldSearchTerm, setFieldSearchTerm] = useState("");

  // Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("general");
  const [activeSubmissionTab, setActiveSubmissionTab] = useState("email");
  const [activeApprovalTab, setActiveApprovalTab] = useState("approval");
  const [activeApprovalChannel, setActiveApprovalChannel] = useState("email");
  const [activeRejectionChannel, setActiveRejectionChannel] = useState("email");

  // AI Generation State Variables
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTargetSection, setAiTargetSection] = useState("custom"); // Track which section AI was triggered from

  // Settings State Variables
  const [emailSubject, setEmailSubject] = useState("Thank you for your submission - {{formTitle}}");
  const [emailMessage, setEmailMessage] = useState(
    props?.data?.emailTemplate || "Hi {{name}}, thank you for submitting {{formTitle}}! We have received your information and will get back to you soon."
  );
  const [whatsappMessage, setWhatsappMessage] = useState(props?.data?.whatsappTemplate || "Hi {{name}}, thank you for registering for {{formTitle}}! We will contact you soon with further details.");
  const [websiteMessage, setWebsiteMessage] = useState(props?.data?.onsuccessfullMessage || "Thank you for your submission!");
  const [approvalEmailSubject, setApprovalEmailSubject] = useState("Your submission has been approved - {{formTitle}}");
  const [approvalEmailMessage, setApprovalEmailMessage] = useState(props?.data?.approvalEmailTemplate || "Hi {{name}}, your submission for {{formTitle}} has been approved!");
  const [approvalWhatsappMessage, setApprovalWhatsappMessage] = useState(props?.data?.approvalWhatsappTemplate || "Hi {{name}}, your submission for {{formTitle}} has been approved!");
  const [rejectionEmailSubject, setRejectionEmailSubject] = useState("Update on your submission - {{formTitle}}");
  const [rejectionEmailMessage, setRejectionEmailMessage] = useState(
    props?.data?.rejectionEmailTemplate || "Hi {{name}}, thank you for your submission for {{formTitle}}. Unfortunately, we are unable to approve your request at this time."
  );
  const [rejectionWhatsappMessage, setRejectionWhatsappMessage] = useState(
    props?.data?.rejectionWhatsappTemplate || "Hi {{name}}, thank you for your submission for {{formTitle}}. Unfortunately, we are unable to approve your request at this time."
  );
  const [approvalEnabled, setApprovalEnabled] = useState(props?.data?.needsApproval || false);
  const [captchaEnabled, setCaptchaEnabled] = useState(props?.data?.enableCaptcha || false);
  const [consentEnabled, setConsentEnabled] = useState(props?.data?.consent || false);
  const [consentMessage, setConsentMessage] = useState(
    props?.data?.consentLetter || "By continuing with this registration, you provide your consent to participate in this event. Please review the terms and conditions carefully before proceeding."
  );
  const [termsEnabled, setTermsEnabled] = useState(props?.data?.termsAndPolicy || false);
  const [termsMessage, setTermsMessage] = useState(
    props?.data?.termsAndPolicyMessage || "By registering, you agree to our terms and policies. Please ensure you have read and understood the terms before proceeding."
  );

  // Settings tabs (match formBuilderNew)
  const settingsTabs = [
    { id: "general", label: "General" },
    { id: "submissions", label: "Submissions" },
    { id: "approval", label: "Approval" },
    { id: "security", label: "Security & Privacy" },
    { id: "notifications", label: "Notifications" },
  ];

  // Open Settings modal when parent toggles trigger (parent passes setOpenEventFormSettingsTrigger as a counter)
  useEffect(() => {
    if (props?.setOpenEventFormSettingsTrigger > 0) {
      setIsSettingsModalOpen(true);
    }
  }, [props?.setOpenEventFormSettingsTrigger]);

  // Helper function to replace variables in text
  const replaceVariables = (text) => {
    const formTitle = props?.data?.title || "Event Registration";
    const sampleData = { "{{name}}": "Jessica", "{{email}}": "jessica@example.com", "{{phone}}": "+1 (555) 123-4567", "{{formTitle}}": formTitle };
    return (text || "").replace(/\{\{(\w+)\}\}/g, (match) => {
      return sampleData[match] || match;
    });
  };

  // Close inline selector when clicking outside
  useEffect(() => {
    const handler = (event) => {
      if (isFieldSelectorOpen && !event.target.closest?.(".field-selector-popup") && !event.target.closest?.(".add-field-trigger")) {
        setIsFieldSelectorOpen(false);
        setFieldSelectorTarget("");
        setFieldSearchTerm(""); // Clear search when closing
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isFieldSelectorOpen]);

  const filteredQuickFields = useMemo(() => {
    if (!fieldSearchTerm.trim()) return quickFields;
    return quickFields.filter((f) => (f.label || "").toLowerCase().includes(fieldSearchTerm.toLowerCase()) || (f.value || "").toLowerCase().includes(fieldSearchTerm.toLowerCase()));
  }, [fieldSearchTerm]);

  const filteredCustomFields = useMemo(() => {
    if (!fieldSearchTerm.trim()) return customFields;
    return customFields.filter((f) => (f.label || "").toLowerCase().includes(fieldSearchTerm.toLowerCase()) || (f.value || "").toLowerCase().includes(fieldSearchTerm.toLowerCase()));
  }, [fieldSearchTerm]);

  const handleInputClick = (input, inputType) => {
    setActiveInput(input);
    setActiveInputType(inputType);
  };

  const toggleModal = () => {
    if (isModalOpen) {
      setSelectedField([]);
    }
    setIsModalOpen(!isModalOpen);
  };

  const [isEditMode, setIsEditMode] = useState(false);

  const toggleModalPrimary = async () => {
    if (isEditMode) {
      setIsEditMode(false);
      await getData({ ticket: props?.data?._id, eventId: props?.data?.event?._id }, "ticket-form-data").then((response) => {
        setFormFields(generateFormFields(response?.data?.response, response?.data?.countries));
        setOriginalFormFields(generateFormFields(response?.data?.response, response?.data?.countries) || []);
        setEventFormFields(generateFormFields(response?.data?.eventForm, response?.data?.countries).sort((a, b) => (a.orderId || 0) - (b.orderId || 0)));
        setTicketData(response?.data?.ticketData);
        setCountries(response?.data?.countries);
      });
    } else {
      setIsEditMode(true);
    }
  };

  const openSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const openEventSidebar = () => {
    setIsEventSidebarOpen(!isEventSidebarOpen);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSidebarOpen(false);
    setIsEventSidebarOpen(false);
    setActiveInput(null);
    setTicketFormValues({});
    setEventTicketFormValues({});
    setTriggerEffect((prevState) => !prevState);
    setId("");
  };

  const addFieldToForm = () => {
    if (selectedField) {
      postData(
        {
          ticket: props?.data?._id,
          ...selectedField,
          view: true,
          add: true,
          update: true,
        },
        "ticket-form-data"
      ).then((response) => {
        if (response?.data?.success === true) {
          toast.success("A field has been added to the form");
        }
        setTriggerEffect((prevState) => !prevState);
      });
      setSelectedField(null);
      closeModal();
    }
  };

  // Utility to get next orderId for event fields
  const getNextEventOrderId = () => {
    if (!eventFormFields || eventFormFields.length === 0) return 1;
    // Always use the highest orderId in the sorted array
    const sorted = [...eventFormFields].sort((a, b) => (a.orderId || 0) - (b.orderId || 0));
    return (sorted[sorted.length - 1]?.orderId || 0) + 1;
  };

  const addEventFieldToForm = () => {
    if (selectedEventField) {
      postData(
        {
          ticket: props?.data?._id,
          ...selectedEventField,
          view: true,
          add: true,
          update: true,
          event: props?.data?.event?._id,
          orderId: getNextEventOrderId(), // Ensure new field is appended
        },
        "event-form-fields"
      ).then((response) => {
        if (response?.data?.success === true) {
          toast.success("A field has been added to the form");
        }
        setTriggerEffect((prevState) => !prevState);
      });
      setSelectedEventField(null);
      closeModal();
    }
  };

  const handleDeleteField = (field) => {
    const id = field?._id;
    // Delete immediately without confirmation
    deleteData({ id }, `ticket-form-data`).then((response) => {
      if (response?.data?.success === true) {
        toast.success("A field has been deleted from the form");
      } else {
        toast.error(response.customMessage);
      }
      // Trigger refresh regardless to keep UI in sync
      setTriggerEffect((prevState) => !prevState);
    });
  };

  const handleEventDeleteField = (field) => {
    const id = field?._id;
    // Delete immediately without confirmation
    deleteData({ id }, `event-form-fields`).then((response) => {
      if (response?.data?.success === true) {
        toast.success("A field has been deleted from the form");
      } else {
        toast.error(response?.customMessage || "Failed to delete field");
      }
      setTriggerEffect((prevState) => !prevState);
    });
  };

  const handleFieldSelection = (field) => {
    setSelectedField(field);
    // Show selection for a short time before adding
    setTimeout(() => {
      postData(
        {
          ticket: props?.data?._id,
          ...field,
          view: true,
          add: true,
          update: true,
        },
        "ticket-form-data"
      ).then((response) => {
        if (response?.data?.success === true) {
          toast.success("A field has been added to the form");
        }
        setTriggerEffect((prevState) => !prevState);
      });
      setSelectedField(null);
      closeModal();
    }, 150); // 150ms is enough for the blue border to flash
  };

  const handleEventFieldSelection = (field) => {
    console.log("Adding event field:", field); // Debug log

    // Create a proper field object with name from value
    const fieldData = {
      ...field,
      name: field.value?.toLowerCase().replace(/\s+/g, "_"), // Convert "Full Name" to "full_name"
      label: field.label,
      type: field.type,
      placeholder: field.placeholder,
      required: false,
      view: true,
      add: true,
      update: true,
    };

    console.log("Processed field data:", fieldData); // Debug log

    setSelectedEventField(field);
    // Immediately add the event field
    postData(
      {
        ticket: props?.data?._id,
        ...fieldData,
        event: props?.data?.event?._id,
        orderId: getNextEventOrderId(), // Ensure new field is appended
      },
      "event-form-fields"
    )
      .then((response) => {
        console.log("Event field response:", response); // Debug log
        if (response?.data?.success === true) {
          toast.success("A field has been added to the form");
        } else {
          toast.error(response?.data?.message || "Failed to add field");
        }
        setTriggerEffect((prevState) => !prevState);
      })
      .catch((error) => {
        console.error("Error adding field:", error);
        toast.error("Failed to add field");
      });
    setSelectedEventField(null);
    closeModal();
  };

  // Handle adding fields to custom fields section
  const handleAddField = async (field, isEventForm = false) => {
    console.log("Adding field:", field, "isEventForm:", isEventForm); // Debug log

    if (isEventForm) {
      handleEventFieldSelection(field);
    } else {
      // Create a proper field object with name from value
      const fieldData = {
        ...field,
        name: field.value?.toLowerCase().replace(/\s+/g, "_"), // Convert "Text Input" to "text_input"
        label: field.label,
        type: field.type,
        placeholder: field.placeholder,
        required: false,
        view: true,
        add: true,
        update: true,
      };

      console.log("Processed custom field data:", fieldData); // Debug log

      setSelectedField(field);
      // Immediately add the field
      postData(
        {
          ticket: props?.data?._id,
          ...fieldData,
        },
        "ticket-form-data"
      )
        .then((response) => {
          console.log("Custom field response:", response); // Debug log
          if (response?.data?.success === true) {
            toast.success("A field has been added to the form");
          } else {
            toast.error(response?.data?.message || "Failed to add field");
          }
          setTriggerEffect((prevState) => !prevState);
        })
        .catch((error) => {
          console.error("Error adding field:", error);
          toast.error("Failed to add field");
        });
      setSelectedField(null);
      closeModal();
    }
  };

  // Memoize the getCountries function
  const getCountries = (field, countries) => {
    if (field?.type !== "mobilenumber") return null;

    const countryList = [...countries];
    field.countryLoadingType = field?.countryLoadingType || "all";
    field.country = field?.country || [];

    // Helper function to safely get country ID
    const getCountryId = (country) => {
      if (!country) return "";
      return typeof country === "object" ? country._id?.toString() : country.toString();
    };

    if (field?.countryLoadingType === "exclude") {
      const excludedIds = field.country.map((id) => getCountryId(id));
      return countryList.filter((country) => !excludedIds.includes(getCountryId(country)));
    }

    if (field?.countryLoadingType === "include") {
      const includedIds = field.country.map((id) => getCountryId(id));
      return countryList.filter((country) => includedIds.includes(getCountryId(country)));
    }

    return countryList;
  };

  // Memoize the renderInputField function
  const renderInputField = useCallback(
    (field) => {
      const placeholder = field?.placeholder?.length > 0 ? field?.placeholder : field?.label;

      switch (field?.type) {
        case "textarea":
        case "select":
        case "checkbox":
        case "date":
        case "time":
        case "number":
        case "mobilenumber":
        case "email":
        case "text":
        case "password":
        case "datetime":
        case "image":
        case "file":
        case "buttonInput":
        case "htmleditor":
        case "submit":
        case "button":
        case "linkbutton":
        case "widges":
        case "close":
        case "toggle":
        case "multiSelect":
        case "info":
        case "html":
        case "line":
        case "title":
        case "hidden":
          return (
            <div
              onClick={() => {
                setTicketFormValues(field);
                setId(field?._id);
                handleInputClick(field, field?.type);
                openSidebar();
              }}
            >
              <FormInput {...field} />
            </div>
          );
        default:
          return null;
      }
    },
    [countries, themeColors]
  );

  const renderEventInputField = (field) => {
    const placeholder = field?.placeholder?.length > 0 ? field?.placeholder : field?.label;
    switch (field?.type) {
      case "textarea":
      case "select":
      case "checkbox":
      case "date":
      case "time":
      case "email":
      case "number":
      case "password":
      case "mobilenumber":
      case "html":
      case "htmleditor":
      case "text":
      case "datetime":
      case "image":
      case "file":
      case "buttonInput":
      case "submit":
      case "button":
      case "linkbutton":
      case "widges":
      case "close":
      case "toggle":
      case "multiSelect":
      case "info":
      case "line":
      case "title":
      case "hidden":
        return (
          <div
            onClick={() => {
              setEventTicketFormValues(field);
              setId(field?._id); // Always set correct id
              handleInputClick(field, field?.type);
              openEventSidebar();
            }}
          >
            <FormInput {...field} />
          </div>
        );
      default:
        return null;
    }
  };

  const onChange = (name, updateValue) => {
    const { label } = updateValue;
    updateValue["placeHolder"] = label;
    return updateValue;
  };

  const [ticketFormData, setTicketFormData] = useState(null);
  const [tempTicketFormData] = useState([
    // Type selector - no condition needed
    {
      type: "select",
      placeholder: "Type",
      name: "type",
      validation: "",
      default: activeInputType,
      tag: true,
      label: "Type",
      showItem: "Type",
      required: false,
      view: true,
      filter: false,
      add: true,
      update: true,
      apiType: "JSON",
      selectApi: [
        { id: "text", value: "Text", icon: "text" },
        { id: "password", value: "Password", icon: "password" },
        { id: "email", value: "Email", icon: "email" },
        { id: "number", value: "Number", icon: "number" },
        { id: "mobilenumber", value: "Mobile Number", icon: "mobilenumber" },
        { id: "time", value: "Time", icon: "time" },
        { id: "date", value: "Date", icon: "date" },
        { id: "datetime", value: "Date Time", icon: "datetime" },
        { id: "image", value: "Image", icon: "image" },
        { id: "file", value: "File", icon: "file" },
        { id: "textarea", value: "Text Area", icon: "textarea" },
        { id: "htmleditor", value: "Html Editor", icon: "paragraph" },
        { id: "checkbox", value: "Check Box", icon: "checkBox" },
        { id: "toggle", value: "Toggle", icon: "toggle" },
        { id: "select", value: "Select", icon: "dropDown" },
        { id: "multiSelect", value: "Multi Select", icon: "multipleChoice" },
        { id: "info", value: "Info", icon: "info" },
        { id: "html", value: "Html", icon: "html" },
        { id: "line", value: "Line", icon: "line" },
        { id: "title", value: "Title", icon: "title" },
      ],
    },
    // Title field - only for title type
    {
      type: "text",
      placeholder: "Title",
      name: "title",
      condition: {
        item: "type",
        if: ["title"],
        then: "enabled",
        else: "disabled",
      },
      showItem: "",
      validation: "",
      default: "",
      tag: false,
      label: "Title",
      required: false,
      view: true,
      add: true,
      update: true,
      apiType: "",
      selectApi: "",
    },
    // Content field - only for info type
    {
      type: "htmleditor",
      placeholder: "Content",
      name: "content",
      condition: {
        item: "type",
        if: ["info", "html"],
        then: "enabled",
        else: "disabled",
      },
      showItem: "",
      validation: "",
      default: "",
      tag: false,
      label: "Content",
      required: false,
      view: true,
      add: true,
      update: true,
      apiType: "",
      selectApi: "",
    },
    // Label field - disabled for line
    {
      type: "text",
      placeholder: "Label",
      name: "label",
      condition: {
        item: "type",
        if: ["line"],
        then: "disabled",
        else: "enabled",
      },
      validation: "",
      default: activeInput ? activeInput?.label : "",
      label: "Label",
      tag: false,
      required: false,
      view: true,
      add: true,
      update: true,
      onChange: onChange,
    },

    // Placeholder - enabled for input types
    {
      type: "text",
      placeholder: "Place Holder",
      name: "placeholder",
      condition: {
        item: "type",
        if: ["text", "password", "email", "number", "mobilenumber", "textarea", "select", "multiSelect"],
        then: "enabled",
        else: "disabled",
      },
      validation: "",
      default: "",
      label: "Place Holder",
      tag: false,
      required: false,
      view: true,
      add: true,
      update: true,
    },
    // API Type - only for select types
    {
      type: "hidden",
      placeholder: "Api Type",
      name: "apiType",
      condition: {
        item: "type",
        if: ["select", "multiSelect"],
        then: "enabled",
        else: "disabled",
      },
      showItem: "",
      validation: "",
      default: "CSV",
      tag: false,
      label: "Api Type",
      required: false,
      view: true,
      add: true,
      update: true,
      apiType: "CSV",
      selectApi: "CSV",
    },
    // Select API for single select
    {
      type: "options",
      placeholder: "Add options",
      name: "selectApi",
      condition: {
        item: "type",
        if: ["select", "multiSelect"],
        then: "enabled",
        else: "disabled",
      },
      showItem: "",
      validation: "",
      default: "",
      tag: false,
      label: "Add options",
      required: false,
      view: true,
      add: true,
      update: true,
    },
    // Select API for multi select
    {
      type: "textarea",
      placeholder: "Select Api",
      name: "selectApi",
      condition: {
        item: "type",
        if: ["multiSelect"],
        then: "enabled",
        else: "disabled",
      },
      showItem: "",
      validation: "",
      default: "",
      tag: false,
      label: "Select Api",
      required: false,
      view: true,
      add: true,
      update: true,
    },

    {
      type: "multiSelect",
      placeholder: "Allowed File Types",
      name: "allowedFileTypes",
      condition: {
        item: "type",
        if: ["file"],
        then: "enabled",
        else: "disabled",
      },
      showItem: "",
      validation: "",
      default: "",
      tag: false,
      label: "Allowed File Types",
      required: true,
      view: true,
      add: true,
      update: true,
      apiType: "JSON",
      selectApi: [
        // Images
        { id: "image/jpeg", value: "JPG/JPEG Image" },
        { id: "image/png", value: "PNG Image" },
        { id: "image/gif", value: "GIF Image" },

        // Documents
        { id: "application/pdf", value: "PDF Document" },
        { id: "application/msword", value: "Word Document (DOC)" },
        { id: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", value: "Word Document (DOCX)" },
        { id: "text/plain", value: "Text File" },

        // Spreadsheets
        { id: "text/csv", value: "CSV File" },
        { id: "application/vnd.ms-excel", value: "Excel Spreadsheet (XLS)" },
        { id: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", value: "Excel Spreadsheet (XLSX)" },

        // Optional additional formats you might want to include
        { id: "image/webp", value: "WebP Image" },
        { id: "image/svg+xml", value: "SVG Image" },
        { id: "application/vnd.oasis.opendocument.text", value: "OpenDocument Text (ODT)" },
        { id: "application/vnd.oasis.opendocument.spreadsheet", value: "OpenDocument Spreadsheet (ODS)" },
        { id: "application/zip", value: "ZIP Archive" },
        { id: "application/x-rar-compressed", value: "RAR Archive" },
      ],
    },
    // Collection - no condition needed
    {
      type: "hidden",
      placeholder: "Collection",
      name: "dbcollection",
      validation: "",
      default: "formData",
      label: "Collection",
      tag: false,
      view: true,
      add: true,
      update: true,
    },
    // Show Item - no condition needed
    {
      type: "hidden",
      placeholder: "Show Item",
      name: "showItem",
      validation: "",
      default: "",
      label: "Show Item",
      tag: false,
      view: true,
      add: true,
      update: true,
    },

    // Permission Settings Title
    {
      type: "title",
      title: "Permission Settings",
      name: "sm",
      add: true,
      update: true,
    },
    // Tag
    {
      type: "hidden",
      placeholder: "Tag",
      name: "tag",
      validation: "",
      default: "true",
      value: true,
      tag: false,
      label: "Tag",
      required: false,
      view: true,
      add: true,
      update: true,
    },
    // Required checkbox
    {
      type: "checkbox",
      placeholder: "Required",
      name: "required",
      condition: {
        item: "type",
        if: ["line", "title", "info", "html"],
        then: "disabled",
        else: "enabled",
      },
      validation: "",
      default: "true",
      tag: true,
      label: "Required",
      required: false,
      view: true,
      add: true,
      update: true,
    },
    // View permission
    {
      type: "hidden",
      value: true,
      placeholder: "View",
      name: "view",
      validation: "",
      tag: false,
      label: "View",
      required: false,
      view: true,
      add: true,
      update: true,
      default: "true",
    },
    // Add permission
    {
      type: "hidden",
      placeholder: "Add",
      value: true,
      name: "add",
      validation: "",
      tag: false,
      label: "Add",
      required: false,
      view: true,
      add: true,
      update: true,
      default: "true",
    },
    // Update permission
    {
      type: "hidden",
      value: true,
      placeholder: "Update",
      name: "update",
      validation: "",
      tag: false,
      label: "Update",
      required: false,
      view: true,
      add: true,
      update: true,
      default: "true",
    },
    // Filter permission
    {
      type: "hidden",
      placeholder: "Filter",
      value: true,
      name: "filter",
      validation: "",
      tag: false,
      label: "Filter",
      required: false,
      view: true,
      add: true,
      update: true,
      default: "true",
    },
    // Country
    {
      type: "title",
      title: "Phone Code Settings",
      name: "sm",
      add: true,
      update: true,
      condition: {
        item: "type",
        if: ["mobilenumber"],
        then: "enabled",
        else: "disabled",
      },
    },
    {
      type: "select",
      label: "How to load countries?",
      showLabel: true,
      name: "countryLoadingType",
      default: "all",
      condition: {
        item: "type",
        if: ["mobilenumber"],
        then: "enabled",
        else: "disabled",
      },
      selectApi: [
        { id: "all", value: "All Countries" },
        { id: "exclude", value: "Exclude Some Countries" },
        { id: "include", value: "Limit to Specific Countries" },
      ],
      apiType: "JSON",
      selectType: "radio",
      add: true,
      update: true,
    },
    {
      type: "multiSelect",
      placeholder: "Specific Countries",
      name: "country",
      condition: {
        item: "countryLoadingType",
        if: ["include"],
        then: "enabled",
        else: "disabled",
      },
      validation: "",
      default: "",
      label: "Select your specific countries",
      tag: true,
      selectApi: "country/select?isSovereign=true",
      apiType: "API",
      required: false,
      view: true,
      add: true,
      update: true,
    },
    {
      type: "multiSelect",
      placeholder: "Excluded Countries",
      name: "country",
      condition: {
        item: "countryLoadingType",
        if: ["exclude"],
        then: "enabled",
        else: "disabled",
      },
      validation: "",
      default: "",
      label: "Select countries to exclude",
      tag: true,
      selectApi: "country/select?isSovereign=true",
      apiType: "API",
      required: false,
      view: true,
      add: true,
      update: true,
    },
    // Condition Settings Title
    {
      type: "title",
      title: "Condition Settings",
      name: "sm",
      add: true,
      update: true,
    },
    // Enable Condition
    {
      type: "checkbox",
      placeholder: "Enable Condition",
      name: "conditionEnabled",
      validation: "",
      default: "false",
      tag: true,
      label: "Enable Condition",
      required: false,
      view: true,
      add: true,
      update: true,
    },
    // Condition Field
    {
      type: "select",
      placeholder: "Condition Checking Field",
      name: "conditionWhenField",
      condition: {
        item: "conditionEnabled",
        if: true,
        then: "enabled",
        else: "disabled",
      },
      validation: "",
      default: "",
      label: "Condition Checking Field",
      tag: true,
      required: false,
      view: true,
      add: true,
      apiType: "JSON",
      selectApi: [],
      update: true,
    },
    // Match Values
    {
      type: "text",
      placeholder: "Match Values",
      name: "conditionCheckMatch",
      condition: {
        item: "conditionEnabled",
        if: true,
        then: "enabled",
        else: "disabled",
      },
      validation: "",
      default: "",
      label: "Match Values",
      tag: true,
      required: false,
      view: true,
      add: true,
      update: true,
    },
    // If Match Action
    {
      type: "select",
      placeholder: "If Match",
      name: "conditionIfMatch",
      condition: {
        item: "conditionEnabled",
        if: true,
        then: "enabled",
        else: "disabled",
      },
      validation: "",
      default: "",
      apiType: "JSON",
      selectApi: [
        { id: "enabled", value: "Show This Filed" },
        { id: "disabled", value: "Hide This Filed" },
      ],
      label: "Check Match Values",
      tag: true,
      required: false,
      view: true,
      add: true,
      update: true,
    },
    {
      type: "select",
      name: "customClass",
      label: "Grid Column",
      apiType: "JSON",
      selectApi: [
        { id: "quarter", value: "Quarter" },
        { id: "half", value: "Half" },
        { id: "full", value: "Full" },
      ],
      default: "full",
      view: true,
      add: true,
      update: true,
    },
    // Additional Settings Title
    {
      type: "title",
      title: "Additional Settings",
      name: "sm",
      add: true,
      update: true,
    },
    // Enable Additional
    {
      type: "checkbox",
      placeholder: "Enable Additional",
      name: "additionalEnabled",
      validation: "",
      default: "false",
      tag: true,
      label: "Enable Additional",
      required: false,
      view: true,
      add: true,
      update: true,
    },
    // Additional Field
    // Sub Label - disabled for line, title, info
    {
      type: "text",
      placeholder: "Sub Label",
      name: "sublabel",
      condition: {
        item: "additionalEnabled",
        // if: ["line", "title", "info", "html"],
        if: true,
        then: "enabled",
        else: "disabled",
      },
      validation: "",
      default: "",
      label: "Sub Label",
      tag: false,
      required: false,
      view: true,
      add: true,
      update: true,
    },
    // Foot Note - disabled for title and info
    {
      type: "textarea",
      placeholder: "Foot Note",
      name: "footnote",
      condition: {
        item: "additionalEnabled",
        // if: ["title", "info", "html", "line"],
        if: true,
        then: "enabled",
        else: "disabled",
      },
      showItem: "",
      validation: "",
      default: "",
      tag: false,
      label: "Foot Note",
      required: false,
      view: true,
      add: true,
      update: true,
    },
    // Default value
    {
      type: "text",
      placeholder: "Default",
      name: "default",
      condition: {
        item: "additionalEnabled",
        // if: ["title", "info", "html", "line"],
        if: true,
        then: "enabled",
        else: "disabled",
      },
      validation: "",
      default: "",
      label: "Default",
      tag: false,
      view: true,
      add: true,
      update: true,
    },

    // Character Length Title
    {
      type: "title",
      title: "Character Length",
      name: "sm",
      condition: {
        item: "type",
        if: ["text", "password", "email", "number", "mobilenumber", "textarea"],
        then: "enabled",
        else: "disabled",
      },
      add: true,
      update: true,
    },
    // Minimum length
    {
      type: "text",
      placeholder: "Minimum",
      name: "minimum",
      condition: {
        item: "type",
        if: ["text", "password", "email", "number", "mobilenumber", "textarea"],
        then: "enabled",
        else: "disabled",
      },
      showItem: "",
      validation: "",
      default: "",
      tag: false,
      label: "Minimum",
      required: false,
      view: true,
      add: true,
      update: true,
    },
    // Maximum length
    {
      type: "text",
      placeholder: "Maximum",
      name: "maximum",
      condition: {
        item: "type",
        if: ["text", "password", "email", "number", "mobilenumber", "textarea"],
        then: "enabled",
        else: "disabled",
      },
      showItem: "",
      validation: "",
      default: "",
      tag: false,
      label: "Maximum",
      required: false,
      view: true,
      add: true,
      update: true,
    },
    // Minimum length
    {
      type: "date",
      placeholder: "Minimum",
      name: "minDate",
      condition: {
        item: "type",
        if: ["date", "datetime"],
        then: "enabled",
        else: "disabled",
      },
      showItem: "",
      validation: "",
      default: "empty",
      tag: false,
      label: "Minimum",
      required: false,
      view: true,
      add: true,
      update: true,
    },
    // Maximum length
    {
      type: "date",
      placeholder: "Maximum",
      name: "maxDate",
      condition: {
        item: "type",
        if: ["date", "datetime"],
        then: "enabled",
        else: "disabled",
      },
      showItem: "",
      validation: "",
      default: "empty",
      tag: false,
      label: "Maximum",
      required: false,
      view: true,
      add: true,
      update: true,
    },
  ]);

  useEffect(() => {
    const temp = [...tempTicketFormData];
    temp[0].default = activeInputType;

    const conditionField = temp.find((item) => item?.name === "conditionWhenField");
    if (conditionField && eventFormFields?.length) {
      conditionField.selectApi = [...eventFormFields, ...formFields].map((field) => ({
        value: field?.label || "",
        id: field?.name || "",
      }));
    }
    console.log(conditionField);
    setTicketFormData(temp);
  }, [activeInputType, tempTicketFormData, eventFormFields, formFields]);

  const submitChange = async (post) => {
    putData({ id, ...post }, "ticket-form-data").then((response) => {
      if (response?.data?.success === true) {
        toast.success("A field has been updated in the form");
        closeModal();
      }
    });
    // write your code here
  };

  const submitEventChange = async (post) => {
    putData({ id, ...post }, "event-form-fields").then((response) => {
      if (response?.data?.success === true) {
        toast.success("A field has been updated in the form");
        closeModal();
      }
    });
    // write your code here
  };
  const generateFormFields = (response, countries) => {
    if (!response || !countries) return [];

    const tempFormFields = response.map((field) => {
      if (field?.type === "mobilenumber") {
        // Create a new object to avoid mutating the original
        const updatedField = {
          ...field,
          countries: getCountries(field, countries),
        };
        return updatedField;
      }
      return field;
    });
    return tempFormFields;
  };
  useEffect(() => {
    getData({ ticket: props?.data?._id, eventId: props?.data?.event?._id }, "ticket-form-data").then((response) => {
      setFormFields(generateFormFields(response?.data?.response, response?.data?.countries));
      setOriginalFormFields(generateFormFields(response?.data?.response, response?.data?.countries) || []);
      setEventFormFields(generateFormFields(response?.data?.eventForm, response?.data?.countries).sort((a, b) => (a.orderId || 0) - (b.orderId || 0)));
      setCountries(response?.data?.countries);
      setTicketData(response?.data?.ticketData);
    });
  }, [props, triggerEffect]);

  // Initialize sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Start dragging after moving 5 pixels
      },
    })
  );

  // Handle drag end
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (over && active?.id !== over?.id) {
      const oldIndex = formFields?.findIndex((item) => item?._id === active?.id);
      const newIndex = formFields?.findIndex((item) => item?._id === over?.id);

      const newFormFields = arrayMove(formFields, oldIndex, newIndex);

      // Update orderId based on new index
      const updatedFields = newFormFields.map((field, index) => ({
        ...field,
        orderId: index + 1, // Ensure orderId is updated according to new order
      }));

      try {
        props?.setLoaderBox(true);
        // Trigger the updates and wait for all of them to complete
        const updatePromises = updatedFields.map((item) => {
          return putData(
            { id: item?._id, orderId: item?.orderId }, // Update only relevant fields
            "ticket-form-data"
          );
        });

        // Wait for all the promises to resolve
        await Promise.all(updatePromises);

        setTriggerEffect((prevState) => !prevState);
        props?.setLoaderBox(false);
      } catch (error) {
        console.error("Error updating form fields:", error);
      }
    }
  };
  // Handle drag end
  const handleEventDragEnd = async (event) => {
    const { active, over } = event;

    if (over && active?.id !== over?.id) {
      const oldIndex = eventFormFields?.findIndex((item) => item?._id === active?.id);
      const newIndex = eventFormFields?.findIndex((item) => item?._id === over?.id);

      const newFormFields = arrayMove(eventFormFields, oldIndex, newIndex);

      // Update orderId based on new index
      const updatedFields = newFormFields.map((field, index) => ({
        ...field,
        orderId: index + 1, // Ensure orderId is updated according to new order
      }));

      try {
        props?.setLoaderBox(true);
        // Trigger the updates and wait for all of them to complete
        const updatePromises = updatedFields.map((item) => {
          return putData(
            { id: item?._id, orderId: item?.orderId }, // Update only relevant fields
            "event-form-fields"
          );
        });

        // Wait for all the promises to resolve
        await Promise.all(updatePromises);

        setTriggerEffect((prevState) => !prevState);
        props?.setLoaderBox(false);
      } catch (error) {
        console.error("Error updating form fields:", error);
      }
    }
  };

  // SortableItem Component for Custom Fields
  const SortableItem = ({ field }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field?._id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-4 rounded-lg border group relative transition-all duration-200 cursor-pointer hover:shadow-sm border-gray-200 hover:border-blue-300 ${
          (field.customClass || "half") === "full" ? "col-span-2" : "col-span-1"
        }`}
        data-field-width={field.customClass === "full" ? "double" : "single"}
        data-field-id={field._id}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center mr-2 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            {/* Labels are rendered inside FormInput; clicking the field opens sidebar */}
            <div
              onClick={() => {
                setTicketFormValues(field);
                setId(field?._id);
                handleInputClick(field, field?.type);
                openSidebar();
              }}
            >
              {renderInputField(field)}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="text-red-500 hover:bg-red-50 p-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteField(field);
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // SortableEventItem Component for Primary Fields
  const SortableEventItem = ({ field }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field?._id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`p-4 rounded-lg border group relative transition-all duration-200 ${
          isEditingEnabled ? "cursor-pointer hover:shadow-sm border-gray-200 hover:border-blue-300" : "cursor-not-allowed opacity-75 border-gray-200"
        }`}
        data-field-id={field._id}
      >
        <div className="flex items-start justify-between">
          <div className={`flex items-center mr-2 ${isEditingEnabled ? "cursor-grab active:cursor-grabbing" : "cursor-not-allowed"}`} {...(isEditingEnabled ? { ...attributes, ...listeners } : {})}>
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            {/* Labels are rendered inside FormInput; clicking the field opens sidebar */}
            <div
              onClick={() => {
                if (isEditingEnabled) {
                  setEventTicketFormValues(field);
                  setId(field?._id);
                  handleInputClick(field, field?.type);
                  openEventSidebar();
                }
              }}
            >
              {renderEventInputField(field)}
            </div>
          </div>
          {isEditingEnabled && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="text-red-500 hover:bg-red-50 p-1 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventDeleteField(field);
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Open clone popup and fetch tickets for this event
  const openClonePopup = async () => {
    setIsClonePopupOpen(true);
    setIsLoadingTickets(true);
    setSelectedCloneTicket(null);
    try {
      const response = await getData({ event: props?.data?.event?._id }, "ticket");
      setCloneTickets(response?.data?.response?.filter((t) => t._id !== props?.data?._id) || []);
    } catch (e) {
      setCloneTickets([]);
    }
    setIsLoadingTickets(false);
  };
  const closeClonePopup = () => {
    setIsClonePopupOpen(false);
    setSelectedCloneTicket(null);
  };
  // Clone fields from selected ticket
  const handleCloneFields = async () => {
    if (!selectedCloneTicket) return;
    setIsCloning(true);
    try {
      // 1. Get fields from the selected ticket
      const response = await getData({ ticket: selectedCloneTicket }, "ticket-form-data");
      const clonedFields = response?.data?.response || [];

      // 2. Get current fields to avoid duplicates
      const currentFieldNames = new Set((originalFormFields || []).map((f) => f.name));

      // 3. For each cloned field, if not already present, POST to backend
      for (const field of clonedFields) {
        if (!currentFieldNames.has(field.name)) {
          // Remove _id and ticket from the cloned field, set ticket to current ticket
          const { _id, ticket, ...rest } = field;
          await postData({ ...rest, ticket: props?.data?._id }, "ticket-form-data");
        }
      }

      // 4. Refetch and update UI
      const updated = await getData({ ticket: props?.data?._id, eventId: props?.data?.event?._id }, "ticket-form-data");
      setFormFields(generateFormFields(updated?.data?.response, updated?.data?.countries));
      setOriginalFormFields(generateFormFields(updated?.data?.response, updated?.data?.countries));
      toast.success("Custom fields cloned and saved!");
      closeClonePopup();
    } catch (e) {
      toast.error("Failed to clone fields");
    }
    setIsCloning(false);
  };

  const filterFields = (fields) => {
    return fields.filter((field) => {
      const label = field.label.toLowerCase();
      const value = field.value.toLowerCase();
      const query = searchQuery.toLowerCase();
      return label.includes(query) || value.includes(query);
    });
  };

  // Always sort eventFormFields by orderId before rendering
  const sortedEventFormFields = useMemo(() => {
    return [...eventFormFields].sort((a, b) => (a.orderId || 0) - (b.orderId || 0));
  }, [eventFormFields]);

  const renderGeneralSettings = () => (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Form Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            defaultValue={props?.data?.title || "Event Registration"}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            defaultValue={props?.data?.description || "Event registration form"}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>
      </div>
    </div>
  );

  const renderSubmissionSettings = () => (
    <div className="p-2">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Submission Messaging</h3>
        <p className="text-sm text-gray-600">Configure the message shown to users immediately after they submit the form.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveSubmissionTab("email")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeSubmissionTab === "email" ? "bg-purple-100 text-purple-700 border border-purple-200" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Email
        </button>
        <button
          onClick={() => setActiveSubmissionTab("whatsapp")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeSubmissionTab === "whatsapp" ? "bg-purple-100 text-purple-700 border border-purple-200" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          WhatsApp
        </button>
        <button
          onClick={() => setActiveSubmissionTab("website")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeSubmissionTab === "website" ? "bg-purple-100 text-purple-700 border border-purple-200" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Website
        </button>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div>
          {activeSubmissionTab === "email" && (
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-4">Email Configuration</h4>
              <div className="flex items-center gap-3 mb-6">
                <input type="radio" id="send-email" name="email-option" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                <label htmlFor="send-email" className="text-sm font-medium text-gray-700">
                  Send confirmation email
                </label>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => {
                      setEmailSubject(e.target.value);
                      setTimeout(() => {
                        saveSettings({ emailSubject: e.target.value }, { silent: true });
                      }, 500);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Message</label>
                  <textarea
                    rows={6}
                    value={emailMessage}
                    onChange={(e) => {
                      setEmailMessage(e.target.value);
                      setTimeout(() => {
                        saveSettings({ emailMessage: e.target.value }, { silent: true });
                      }, 500);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  Available variables: <span className="text-blue-600">{"{{firstName}}"}</span>, <span className="text-blue-600">{"{{event}}"}</span>,{" "}
                  <span className="text-blue-600">{"{{ticket}}"}</span>, <span className="text-blue-600">{"{{formTitle}}"}</span>
                </div>
              </div>
            </div>
          )}

          {activeSubmissionTab === "whatsapp" && (
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-4">WhatsApp Configuration</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Message</label>
                  <textarea
                    rows={6}
                    value={whatsappMessage}
                    onChange={(e) => {
                      setWhatsappMessage(e.target.value);
                      setTimeout(() => {
                        saveSettings({ whatsappMessage: e.target.value }, { silent: true });
                      }, 500);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  Available variables: <span className="text-blue-600">{"{{firstName}}"}</span>, <span className="text-blue-600">{"{{event}}"}</span>,{" "}
                  <span className="text-blue-600">{"{{ticket}}"}</span>, <span className="text-blue-600">{"{{formTitle}}"}</span>
                </div>
              </div>
            </div>
          )}

          {activeSubmissionTab === "website" && (
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-4">Website Configuration</h4>
              <div className="flex items-center gap-3 mb-6">
                <input type="radio" id="show-message" name="website-option" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                <label htmlFor="show-message" className="text-sm font-medium text-gray-700">
                  Show a confirmation message
                </label>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmation Message</label>
                  <textarea
                    rows={6}
                    value={websiteMessage}
                    onChange={(e) => {
                      setWebsiteMessage(e.target.value);
                      setTimeout(() => {
                        saveSettings({ websiteMessage: e.target.value }, { silent: true });
                      }, 500);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  Available variables: <span className="text-blue-600">{"{{firstName}}"}</span>, <span className="text-blue-600">{"{{event}}"}</span>,{" "}
                  <span className="text-blue-600">{"{{ticket}}"}</span>, <span className="text-blue-600">{"{{formTitle}}"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div>
          <h4 className="text-base font-semibold text-gray-900 mb-4">Preview</h4>
          {activeSubmissionTab === "email" && (
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Email Confirmation</span>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">To:</span> jessica@example.com
                </div>
                <div>
                  <span className="font-medium">Subject:</span> {replaceVariables(emailSubject)}
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded text-gray-700 whitespace-pre-wrap">{replaceVariables(emailMessage)}</div>
              </div>
            </div>
          )}

          {activeSubmissionTab === "whatsapp" && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="max-w-sm mx-auto">
                <IphoneMockup messageText={replaceVariables(whatsappMessage)} sender="goCampus.ai" />
              </div>
            </div>
          )}

          {activeSubmissionTab === "website" && (
            <div className="border border-gray-200 rounded-lg p-6 bg-white text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Submission Successful!</h3>
              <p className="text-sm text-gray-600 mb-4">Form submitted successfully</p>
              <p className="text-sm text-gray-800 mb-6 whitespace-pre-wrap">{replaceVariables(websiteMessage)}</p>
              <div className="flex gap-3 justify-center">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Submit Another</button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">Download Receipt</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderApprovalSettings = () => (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Approval Workflow</h3>
            <p className="text-sm text-gray-600">Enable this to manually approve or reject submissions for a ticket.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={approvalEnabled}
              onChange={(e) => {
                setApprovalEnabled(e.target.checked);
                saveSettings({ approvalEnabled: e.target.checked }, { silent: true });
              }}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {approvalEnabled && (
        <>
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveApprovalTab("approval")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeApprovalTab === "approval" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              On Approval
            </button>
            <button
              onClick={() => setActiveApprovalTab("rejection")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeApprovalTab === "rejection" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              On Rejection
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Configuration Panel */}
            <div>
              {activeApprovalTab === "approval" && (
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Approval Configuration</h4>
                  {/* Email/WhatsApp Toggle */}
                  <div className="flex space-x-1 mb-6 bg-purple-50 p-1 rounded-lg">
                    <button
                      onClick={() => setActiveApprovalChannel("email")}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        activeApprovalChannel === "email" ? "bg-purple-100 text-purple-700 border border-purple-200" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Email
                    </button>
                    <button
                      onClick={() => setActiveApprovalChannel("whatsapp")}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        activeApprovalChannel === "whatsapp" ? "bg-purple-100 text-purple-700 border border-purple-200" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      WhatsApp
                    </button>
                  </div>

                  {activeApprovalChannel === "email" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Approval Email Subject</label>
                        <input
                          type="text"
                          value={approvalEmailSubject}
                          onChange={(e) => {
                            setApprovalEmailSubject(e.target.value);
                            setTimeout(() => {
                              saveSettings({ approvalEmailSubject: e.target.value }, { silent: true });
                            }, 500);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Approval Email Message</label>
                        <textarea
                          rows={6}
                          value={approvalEmailMessage}
                          onChange={(e) => {
                            setApprovalEmailMessage(e.target.value);
                            setTimeout(() => {
                              saveSettings({ approvalEmailMessage: e.target.value }, { silent: true });
                            }, 500);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        Available variables: <span className="text-blue-600">{"{{firstName}}"}</span>, <span className="text-blue-600">{"{{event}}"}</span>,{" "}
                        <span className="text-blue-600">{"{{ticket}}"}</span>, <span className="text-blue-600">{"{{formTitle}}"}</span>
                      </div>
                    </div>
                  )}

                  {activeApprovalChannel === "whatsapp" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Approval WhatsApp Message</label>
                        <textarea
                          rows={6}
                          value={approvalWhatsappMessage}
                          onChange={(e) => {
                            setApprovalWhatsappMessage(e.target.value);
                            setTimeout(() => {
                              saveSettings({ approvalWhatsappMessage: e.target.value }, { silent: true });
                            }, 500);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        Available variables: <span className="text-blue-600">{"{{firstName}}"}</span>, <span className="text-blue-600">{"{{event}}"}</span>,{" "}
                        <span className="text-blue-600">{"{{ticket}}"}</span>, <span className="text-blue-600">{"{{formTitle}}"}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeApprovalTab === "rejection" && (
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4">Rejection Configuration</h4>
                  {/* Email/WhatsApp Toggle */}
                  <div className="flex space-x-1 mb-6 bg-purple-50 p-1 rounded-lg">
                    <button
                      onClick={() => setActiveApprovalChannel("email")}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        activeApprovalChannel === "email" ? "bg-purple-100 text-purple-700 border border-purple-200" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Email
                    </button>
                    <button
                      onClick={() => setActiveApprovalChannel("whatsapp")}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        activeApprovalChannel === "whatsapp" ? "bg-purple-100 text-purple-700 border border-purple-200" : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      WhatsApp
                    </button>
                  </div>

                  {activeApprovalChannel === "email" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Email Subject</label>
                        <input
                          type="text"
                          value={rejectionEmailSubject}
                          onChange={(e) => {
                            setRejectionEmailSubject(e.target.value);
                            setTimeout(() => {
                              saveSettings({ rejectionEmailSubject: e.target.value }, { silent: true });
                            }, 500);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Email Message</label>
                        <textarea
                          rows={6}
                          value={rejectionEmailMessage}
                          onChange={(e) => {
                            setRejectionEmailMessage(e.target.value);
                            setTimeout(() => {
                              saveSettings({ rejectionEmailMessage: e.target.value }, { silent: true });
                            }, 500);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {activeApprovalChannel === "whatsapp" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Rejection WhatsApp Message</label>
                        <textarea
                          rows={6}
                          value={rejectionWhatsappMessage}
                          onChange={(e) => {
                            setRejectionWhatsappMessage(e.target.value);
                            setTimeout(() => {
                              saveSettings({ rejectionWhatsappMessage: e.target.value }, { silent: true });
                            }, 500);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        Available variables: <span className="text-blue-600">{"{{firstName}}"}</span>, <span className="text-blue-600">{"{{event}}"}</span>,{" "}
                        <span className="text-blue-600">{"{{ticket}}"}</span>, <span className="text-blue-600">{"{{formTitle}}"}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <div>
              <h4 className="text-base font-semibold text-gray-900 mb-4">Preview</h4>
              {activeApprovalTab === "approval" && (
                <>
                  {activeApprovalChannel === "email" && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Approval Email Notification</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">To:</span> jessica@example.com
                        </div>
                        <div>
                          <span className="font-medium">Subject:</span> {replaceVariables(approvalEmailSubject)}
                        </div>
                        <div className="mt-4 p-3 bg-green-50 rounded text-gray-700 whitespace-pre-wrap">{replaceVariables(approvalEmailMessage)}</div>
                      </div>
                    </div>
                  )}

                  {activeApprovalChannel === "whatsapp" && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="max-w-sm mx-auto">
                        <IphoneMockup messageText={replaceVariables(approvalWhatsappMessage)} sender="goCampus.ai" />
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeApprovalTab === "rejection" && (
                <>
                  {activeApprovalChannel === "email" && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-center gap-2 mb-3">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-600">Rejection Email Notification</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">To:</span> jessica@example.com
                        </div>
                        <div>
                          <span className="font-medium">Subject:</span> {replaceVariables(rejectionEmailSubject)}
                        </div>
                        <div className="mt-4 p-3 bg-red-50 rounded text-gray-700 whitespace-pre-wrap">{replaceVariables(rejectionEmailMessage)}</div>
                      </div>
                    </div>
                  )}

                  {activeApprovalChannel === "whatsapp" && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="max-w-sm mx-auto">
                        <IphoneMockup messageText={replaceVariables(rejectionWhatsappMessage)} sender="goCampus.ai" />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Security & Privacy Settings</h3>
        <p className="text-sm text-gray-600">Configure security measures and privacy options for your form.</p>
      </div>
      <div className="space-y-6">
        {/* Captcha Setting */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <h4 className="text-base font-semibold text-gray-900 mb-1">Protect form with a Captcha</h4>
            <p className="text-sm text-gray-600">If enabled we will make sure respondent is a human</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={captchaEnabled}
              onChange={(e) => {
                setCaptchaEnabled(e.target.checked);
                saveSettings({ captchaEnabled: e.target.checked }, { silent: true });
              }}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {/* Consent Setting */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <h4 className="text-base font-semibold text-gray-900 mb-1">Consent</h4>
            <p className="text-sm text-gray-600">This field will be placed near the primary action button</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={consentEnabled}
              onChange={(e) => {
                setConsentEnabled(e.target.checked);
                saveSettings({ consentEnabled: e.target.checked }, { silent: true });
              }}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {/* Consent Message - Only show when consent is enabled */}
        {consentEnabled && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-base font-semibold text-gray-900 mb-3">Consent Message</h4>
            <textarea
              rows={4}
              value={consentMessage}
              onChange={(e) => {
                setConsentMessage(e.target.value);
                setTimeout(() => {
                  saveSettings({ consentMessage: e.target.value }, { silent: true });
                }, 500);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">Add the text to the linked inside the [] brackets and the URL in () brackets</p>
          </div>
        )}
        {/* Terms & Policies Setting */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex-1">
            <h4 className="text-base font-semibold text-gray-900 mb-1">Terms & Policies</h4>
            <p className="text-sm text-gray-600">Terms and Policies not configured in the event</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={termsEnabled}
              onChange={(e) => {
                setTermsEnabled(e.target.checked);
                saveSettings({ termsEnabled: e.target.checked }, { silent: true });
              }}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {/* Terms & Policy Text - Only show when terms is enabled */}
        {termsEnabled && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-base font-semibold text-gray-900 mb-3">Terms & Policy</h4>
            <input
              type="text"
              value={termsMessage}
              onChange={(e) => {
                setTermsMessage(e.target.value);
                setTimeout(() => {
                  saveSettings({ termsMessage: e.target.value }, { silent: true });
                }, 500);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Notification Settings</h3>
        <p className="text-sm text-gray-600">Configure how and when you receive notifications about form submissions.</p>
      </div>
      <div className="space-y-6">
        {/* Email Notifications */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-base font-semibold text-gray-900 mb-4">Email Notifications</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <span className="text-sm font-medium text-gray-700">Receive email notifications for new submissions</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <span className="text-sm font-medium text-gray-700">Receive daily summary emails</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <span className="text-sm font-medium text-gray-700">Receive weekly analytics reports</span>
            </label>
          </div>
        </div>
        {/* SMS Notifications */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-base font-semibold text-gray-900 mb-4">SMS Notifications</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <span className="text-sm font-medium text-gray-700">Receive SMS notifications for urgent submissions</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <span className="text-sm font-medium text-gray-700">Receive daily SMS summaries</span>
            </label>
          </div>
        </div>
        {/* Notification Frequency */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-base font-semibold text-gray-900 mb-4">Notification Frequency</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="radio" name="frequency" defaultChecked className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
              <span className="text-sm font-medium text-gray-700">Immediate (for each submission)</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="radio" name="frequency" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
              <span className="text-sm font-medium text-gray-700">Batch (every 10 submissions)</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="radio" name="frequency" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
              <span className="text-sm font-medium text-gray-700">Daily summary only</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  // AI Form Generation Function using Gemini
  const generateFormWithAI = async (description) => {
    try {
      console.log("Generating form with Gemini AI for description:", description);

      // Use Gemini service to generate form fields
      const generatedFields = await geminiService.generateFormFields(description);

      console.log("Gemini generated fields:", generatedFields);
      return generatedFields;
    } catch (error) {
      console.error("Gemini AI form generation error:", error);

      // Fallback: Generate basic fields based on keywords in description
      console.log("Falling back to keyword-based generation");
      const fallbackFields = generateFallbackFields(description);
      if (fallbackFields.length > 0) {
        console.log("Using fallback field generation");
        return fallbackFields;
      }

      throw error;
    }
  };

  // Fallback field generation based on keywords
  const generateFallbackFields = (description) => {
    const lowerDesc = description.toLowerCase();
    const fields = [];

    // Only add basic fields if the description suggests it's appropriate
    const isRegistrationOrContact =
      lowerDesc.includes("registration") || lowerDesc.includes("contact") || lowerDesc.includes("form") || lowerDesc.includes("signup") || lowerDesc.includes("application");

    if (isRegistrationOrContact) {
      // Only add name and email if context suggests it's needed
      if (lowerDesc.includes("name") || lowerDesc.includes("person") || lowerDesc.includes("user")) {
        fields.push({
          label: "Full Name",
          type: "text",
          placeholder: "Enter your full name",
          required: true,
        });
      }

      if (lowerDesc.includes("email") || lowerDesc.includes("contact") || lowerDesc.includes("communication")) {
        fields.push({
          label: "Email Address",
          type: "email",
          placeholder: "Enter your email address",
          required: true,
        });
      }
    }

    // Add conditional fields based on keywords
    if (lowerDesc.includes("phone") || lowerDesc.includes("contact") || lowerDesc.includes("mobile")) {
      fields.push({
        label: "Phone Number",
        type: "mobilenumber",
        placeholder: "Enter your phone number",
        required: false,
      });
    }

    if (lowerDesc.includes("company") || lowerDesc.includes("organization") || lowerDesc.includes("business")) {
      fields.push({
        label: "Company",
        type: "text",
        placeholder: "Enter your company name",
        required: false,
      });
    }

    if (lowerDesc.includes("job") || lowerDesc.includes("title") || lowerDesc.includes("position")) {
      fields.push({
        label: "Job Title",
        type: "text",
        placeholder: "Enter your job title",
        required: false,
      });
    }

    if (lowerDesc.includes("message") || lowerDesc.includes("comment") || lowerDesc.includes("feedback")) {
      fields.push({
        label: "Message",
        type: "textarea",
        placeholder: "Enter your message",
        required: false,
      });
    }

    if (lowerDesc.includes("country") || lowerDesc.includes("location") || lowerDesc.includes("region")) {
      fields.push({
        label: "Country",
        type: "select",
        placeholder: "Select your country",
        required: false,
        options: ["United States", "Canada", "United Kingdom", "Australia", "India", "Other"],
      });
    }

    if (lowerDesc.includes("dietary") || lowerDesc.includes("food") || lowerDesc.includes("meal")) {
      fields.push({
        label: "Dietary Preferences",
        type: "select",
        placeholder: "Select your dietary preferences",
        required: false,
        options: ["None", "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Other"],
      });
    }

    return fields;
  };

  // AI form generation handler
  const handleAIGenerate = async () => {
    if (!aiDescription.trim()) {
      toast.error("Please describe your form first");
      return;
    }

    setIsGenerating(true);
    try {
      const generatedFields = await generateFormWithAI(aiDescription);

      if (!generatedFields || generatedFields.length === 0) {
        toast.error("No fields were generated. Please try a different description.");
        return;
      }

      // Add generated fields to form
      let successCount = 0;
      for (const field of generatedFields) {
        try {
          // Convert AI field format to our field format
          const formField = {
            label: field.label || "Untitled Field",
            type: field.type || "text",
            placeholder: field.placeholder || `Enter ${field.label || "value"}`,
            required: Boolean(field.required),
            ...(field.options && {
              selectApi: field.options.join(","),
              apiType: "CSV",
            }),
          };

          await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay between requests

          // Add to the correct section based on aiTargetSection
          if (aiTargetSection === "event") {
            // Add to Common Questions section
            await handleEventFieldSelection(formField);
          } else {
            // Add to Custom Questions section
            await handleAddField(formField, false);
          }

          successCount++;
        } catch (fieldError) {
          console.error("Error adding field:", fieldError);
        }
      }

      if (successCount > 0) {
        toast.success(`Generated ${successCount} fields successfully!`);
        setIsAIModalOpen(false);
        setAiDescription("");
        setAiTargetSection("custom"); // Reset to default
      } else {
        toast.error("Failed to add any generated fields");
      }
    } catch (error) {
      console.error("AI generation error:", error);

      // Provide more specific error messages
      let errorMessage = "Failed to generate form. ";

      if (error.message?.includes("API key")) {
        errorMessage += "Please check your Gemini API key configuration.";
      } else if (error.message?.includes("network") || error.message?.includes("fetch")) {
        errorMessage += "Please check your internet connection and try again.";
      } else if (error.message?.includes("parse")) {
        errorMessage += "The AI response was invalid. Using fallback method.";
      } else {
        errorMessage += "Please try again with a different description.";
      }

      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveSettings = async (settings, options = {}) => {
    try {
      // Here you would typically save to your backend
      console.log("Saving settings:", settings);

      if (!options.silent) {
        toast.success("Settings saved successfully");
      }
      return true;
    } catch (error) {
      console.error("Error saving settings:", error);
      if (!options.silent) {
        toast.error("Failed to save settings");
      }
      return false;
    }
  };

  return (
    <>
      {isEditMode && (
        <PopupView
          customClass="full-page"
          popupData={
            <ElementContainer className="">
              <EventFormPrimary isOpen={isEditMode} onClose={toggleModalPrimary} eventFormFields={eventFormFields} data={props?.data} />
            </ElementContainer>
          }
          themeColors={themeColors}
          closeModal={toggleModalPrimary}
          itemTitle={{
            name: "title",
            type: "text",
            collection: "",
          }}
          openData={{
            data: { _id: props?.data?.event, title: "Primary Custom Fields" },
          }}
        ></PopupView>
      )}

      {/* Modern Two-Panel Layout - Left Panel for Field Building, Right Panel for Live Preview */}
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-gray-200 px-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3"></div>
          </div>
        </header>

        <div className="flex h-screen w-full">
          {/* Left Panel - Field Builder with Primary and Custom Fields Sections */}
          <div className="w-[60%] p-6 overflow-y-auto bg-white/[0.31]">
            {/* Primary Fields Section */}
            <div className="mb-8 p-6 border-2 rounded-lg border-gray-200 bg-gray-50/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">Common Questions</h3>
                    {!isEditingEnabled && <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-gray-600 leading-5 max-w-md">
                    {isEditingEnabled ? "Essential information required for all submissions - editing enabled" : "Essential information required for all submissions - locked for editing"}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-6 flex-shrink-0 relative">
                  <button
                    onClick={() => setIsEditingEnabled((v) => !v)}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border text-gray-700 border-gray-300 hover:bg-gray-100 whitespace-nowrap"
                  >
                    {isEditingEnabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    {isEditingEnabled ? "Lock Editing" : "Enable Editing"}
                  </button>
                  {isEditingEnabled && (
                    <button
                      onClick={() => {
                        setFieldSelectorTarget("event");
                        setIsFieldSelectorOpen((s) => !s);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
                    >
                      <Plus className="w-4 h-4" />
                      Add Field
                    </button>
                  )}

                  {isEditingEnabled && isFieldSelectorOpen && fieldSelectorTarget === "event" && (
                    <div className="field-selector-popup absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 w-96 z-50">
                      <div className="p-4 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            placeholder="Search fields..."
                            value={fieldSearchTerm}
                            onChange={(e) => setFieldSearchTerm(e.target.value)}
                            className="pl-10 text-sm h-10 border border-gray-200 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <div className="p-4 space-y-6">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">COMMON QUESTIONS</p>
                            <div className="grid grid-cols-2 gap-3">
                              {filteredQuickFields.map((field) => (
                                <button
                                  key={field.value}
                                  onClick={() => {
                                    handleEventFieldSelection(field);
                                    setIsFieldSelectorOpen(false);
                                  }}
                                  className="group flex flex-col items-center p-4 rounded-lg bg-white hover:bg-blue-50 cursor-pointer border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md text-center h-20 justify-center"
                                >
                                  <div className="text-blue-600 text-xl mb-2">{getFieldTypeIcon(field.type)}</div>
                                  <p className="font-medium text-xs text-gray-800 group-hover:text-gray-900 leading-tight">{field.label}</p>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">CUSTOM QUESTIONS</p>
                            <div className="grid grid-cols-2 gap-3">
                              {filteredCustomFields.map((field) => (
                                <button
                                  key={field.value}
                                  onClick={() => {
                                    handleEventFieldSelection(field);
                                    setIsFieldSelectorOpen(false);
                                  }}
                                  className="group flex flex-col items-center p-4 rounded-lg bg-white hover:bg-blue-50 cursor-pointer border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md text-center h-20 justify-center"
                                >
                                  <div className="text-blue-600 text-xl mb-2">{getFieldTypeIcon(field.type)}</div>
                                  <p className="font-medium text-xs text-gray-800 group-hover:text-gray-900 leading-tight">{field.label}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* AI Generate Option */}
                          <div className="p-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white text-center">
                            <h4 className="text-base font-semibold mb-2">Generate with AI</h4>
                            <p className="text-sm opacity-90 mb-4">Describe your form and let AI create the fields for you</p>
                            <button
                              onClick={() => {
                                setIsFieldSelectorOpen(false);
                                setAiTargetSection("event"); // Set target to Common Questions
                                setIsAIModalOpen(true);
                              }}
                              className="px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-md text-sm font-medium hover:bg-opacity-30 transition-all duration-200"
                            >
                              <FaMagic className="w-4 h-4 inline mr-2" />
                              Generate with AI
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {isFieldSelectorOpen && fieldSelectorTarget === "custom" && (
                    <div className="field-selector-popup absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 w-96 z-50">
                      <div className="p-4 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            placeholder="Search fields..."
                            value={fieldSearchTerm}
                            onChange={(e) => setFieldSearchTerm(e.target.value)}
                            className="pl-10 text-sm h-10 border border-gray-200 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <div className="p-4 space-y-6">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">COMMON QUESTIONS</p>
                            <div className="grid grid-cols-2 gap-2">
                              {filteredQuickFields.map((field) => (
                                <button
                                  key={field.value}
                                  onClick={() => {
                                    handleAddField(field, false);
                                    setIsFieldSelectorOpen(false);
                                  }}
                                  className="group flex flex-col items-center p-3 rounded-lg bg-white hover:bg-blue-50 cursor-pointer border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md text-center h-18 justify-center"
                                >
                                  <div className="text-blue-600 text-lg mb-2">{getFieldTypeIcon(field.type)}</div>
                                  <p className="font-medium text-xs text-gray-800 group-hover:text-gray-900 leading-tight">{field.label}</p>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">CUSTOM QUESTIONS</p>
                            <div className="grid grid-cols-2 gap-2">
                              {filteredCustomFields.map((field) => (
                                <button
                                  key={field.value}
                                  onClick={() => {
                                    handleAddField(field, false);
                                    setIsFieldSelectorOpen(false);
                                  }}
                                  className="group flex flex-col items-center p-3 rounded-lg bg-white hover:bg-blue-50 cursor-pointer border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md text-center h-18 justify-center"
                                >
                                  <div className="text-blue-600 text-lg mb-2">{getFieldTypeIcon(field.type)}</div>
                                  <p className="font-medium text-xs text-gray-800 group-hover:text-gray-900 leading-tight">{field.label}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* AI Generate Option */}
                          <div className="p-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white text-center">
                            <h4 className="text-base font-semibold mb-2">Generate with AI</h4>
                            <p className="text-sm opacity-90 mb-4">Describe your form and let AI create the fields for you</p>
                            <button
                              onClick={() => {
                                setIsFieldSelectorOpen(false);
                                setAiTargetSection("custom"); // Set target to Custom Questions
                                setIsAIModalOpen(true);
                              }}
                              className="px-4 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-md text-sm font-medium hover:bg-opacity-30 transition-all duration-200"
                            >
                              <FaMagic className="w-4 h-4 inline mr-2" />
                              Generate with AI
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {sortedEventFormFields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50">
                  <Plus className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-700 mb-1">No primary fields yet</h3>
                  <p className="text-xs text-gray-500 mb-3">Enable editing to add primary fields</p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEventDragEnd}>
                  <SortableContext items={sortedEventFormFields?.map((field) => field?._id)} strategy={verticalListSortingStrategy}>
                    <div className="grid grid-cols-2 gap-3">
                      {sortedEventFormFields.map((field) => (
                        <SortableEventItem key={field._id} field={field} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Custom Fields Section */}
            <div className="mb-8 p-6 border-2 rounded-lg border-gray-200 bg-gray-50/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Custom Questions</h3>
                  <p className="text-sm text-gray-600 leading-5 max-w-md">Additional information specific to this form</p>
                </div>
                <div className="flex items-center gap-2 ml-6 flex-shrink-0 relative">
                  <button onClick={openClonePopup} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 whitespace-nowrap">
                    <FaCopy size={12} />
                    Clone Fields
                  </button>
                  <button
                    onClick={() => {
                      setAiTargetSection("custom"); // Set target to Custom Questions
                      setIsAIModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 whitespace-nowrap"
                  >
                    <FaMagic className="w-4 h-4" />
                    AI Generate
                  </button>
                  <button
                    onClick={() => {
                      setFieldSelectorTarget("custom");
                      setIsFieldSelectorOpen((s) => !s);
                    }}
                    className="add-field-trigger flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Add Field
                  </button>
                </div>
              </div>

              {formFields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/50">
                  <Plus className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-sm font-medium text-gray-700 mb-1">No custom fields yet</h3>
                  <p className="text-xs text-gray-500 mb-3">Add custom fields to collect specific information for this form</p>
                  <button
                    onClick={() => {
                      setFieldSelectorTarget("custom");
                      setIsFieldSelectorOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Custom Field
                  </button>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={formFields?.map((field) => field?._id)} strategy={verticalListSortingStrategy}>
                    <div className="grid grid-cols-2 gap-3">
                      {formFields?.map((field) => (
                        <SortableItem key={field?._id} field={field} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
              {/* placeholder to keep structure consistent */}
            </div>
          </div>

          {/* Right Panel - Live Form Preview with Real-time Field Rendering */}
          <div className="w-[40%] bg-white border-l border-gray-200 p-6">
            <div style={{ scrollbarWidth: "none" }} className="w-full h-screen mx-auto overflow-y-auto">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Form Preview</h3>
              </div>
              <div className="h-px bg-gray-200"></div>

              <form className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {sortedEventFormFields.map((field) => (
                    <div key={field._id} className={`space-y-2 ${(field.customClass || "half") === "full" ? "col-span-2" : "col-span-1"}`}>
                      {renderEventInputField(field)}
                    </div>
                  ))}

                  {formFields.map((field) => (
                    <div key={field._id} className={`space-y-2 ${(field.customClass || "half") === "full" ? "col-span-2" : "col-span-1"}`}>
                      {renderInputField(field)}
                    </div>
                  ))}
                </div>

                {sortedEventFormFields.length === 0 && formFields.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No fields added yet</p>
                    <p className="text-sm">Start building your form by adding fields from the left panel</p>
                  </div>
                )}

                {(sortedEventFormFields.length > 0 || formFields.length > 0) && (
                  <div className="pt-6 flex items-center justify-center w-full">
                    <button type="submit" className="px-6 py-2 rounded-md font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700">
                      Submit
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Modals and Sidebars - Field Configuration and Settings */}
        {isModalOpen && (
          <PopupView
            customClass={"medium"}
            popupData={
              <ElementContainer className="column">
                <ElementContainer className="custom">
                  {customFields?.map(({ label, icon, value, type }) => (
                    <FormInput
                      key={value}
                      type="widges"
                      value={label}
                      icon={icon}
                      onChange={() => handleEventFieldSelection({ label, icon, value, type })}
                      isSelected={selectedEventField?.value === value}
                    />
                  ))}
                </ElementContainer>
              </ElementContainer>
            }
            themeColors={themeColors}
            closeModal={closeModal}
            itemTitle={{
              name: "title",
              type: "text",
              collection: "",
            }}
            openData={{
              data: { _id: "", title: "Primary Custom Fields" },
            }}
          ></PopupView>
        )}
        {isSidebarOpen && ticketFormData && (
          <AutoForm
            useCaptcha={false}
            key={"elements" + activeInputType}
            formType={"post"}
            header={"Properties"}
            description={""}
            formInput={ticketFormData}
            formValues={ticketFormValues}
            submitHandler={submitChange}
            button={"Save"}
            isOpenHandler={closeModal}
            isOpen={true}
            plainForm={true}
            formMode={"single"}
            setMessage={props?.setMessage}
            setLoaderBox={props?.setLoaderBox}
          ></AutoForm>
        )}
        {isEventSidebarOpen && ticketFormData && (
          <AutoForm
            useCaptcha={false}
            key={"elements" + activeInputType}
            formType={"post"}
            header={"Properties"}
            description={""}
            formInput={ticketFormData}
            formValues={eventTicketFormValues}
            submitHandler={submitEventChange}
            button={"Save"}
            isOpenHandler={closeModal}
            isOpen={true}
            plainForm={true}
            formMode={"single"}
            setMessage={props?.setMessage}
            setLoaderBox={props?.setLoaderBox}
          ></AutoForm>
        )}

        {/* Clone Popup */}
        {isClonePopupOpen && (
          <CloneTicketPopup
            cloneTickets={cloneTickets}
            isLoadingTickets={isLoadingTickets}
            selectedCloneTicket={selectedCloneTicket}
            setSelectedCloneTicket={setSelectedCloneTicket}
            isCloning={isCloning}
            onClone={handleCloneFields}
            onClose={closeClonePopup}
          />
        )}

        {/* AI Modal */}
        {isAIModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => {
              setIsAIModalOpen(false);
              setAiTargetSection("custom"); // Reset to default when closing
            }}
          >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                    <FaMagic className="text-purple-600" />
                    Generate Form with AI
                  </h2>
                  <button
                    onClick={() => {
                      setIsAIModalOpen(false);
                      setAiTargetSection("custom"); // Reset to default when closing
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block font-medium text-gray-700 mb-2">Describe your form</label>
                  <textarea
                    value={aiDescription}
                    onChange={(e) => setAiDescription(e.target.value)}
                    placeholder="E.g., Create a registration form for a business conference with fields for name, email, company, job title, and dietary preferences..."
                    className="w-full min-h-[120px] p-4 border-2 border-gray-200 rounded-lg text-sm resize-y focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="text-sm text-gray-600 mb-6">💡 Be specific about the type of information you want to collect and any special requirements.</div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsAIModalOpen(false);
                    setAiTargetSection("custom"); // Reset to default when closing
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAIGenerate}
                  disabled={!aiDescription.trim() || isGenerating}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FaMagic />
                      Generate Form
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settingsTabs={settingsTabs}
        activeSettingsTab={activeSettingsTab}
        onTabChange={setActiveSettingsTab}
        renderGeneralSettings={renderGeneralSettings}
        renderSubmissionSettings={renderSubmissionSettings}
        renderApprovalSettings={renderApprovalSettings}
        renderSecuritySettings={renderSecuritySettings}
        renderNotificationSettings={renderNotificationSettings}
        onSave={async () => {
          const allSettings = {
            emailSubject,
            emailMessage,
            whatsappMessage,
            websiteMessage,
            approvalEmailSubject,
            approvalEmailMessage,
            approvalWhatsappMessage,
            rejectionEmailSubject,
            rejectionEmailMessage,
            rejectionWhatsappMessage,
            approvalEnabled,
            captchaEnabled,
            consentEnabled,
            consentMessage,
            termsEnabled,
            termsMessage,
          };
          const success = await saveSettings(allSettings);
          if (success) setIsSettingsModalOpen(false);
        }}
      />
    </>
  );
};

export default withLayout(FormBuilder);
