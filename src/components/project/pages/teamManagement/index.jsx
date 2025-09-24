import { useState, useEffect } from "react";
import { 
  Users, 
  Mail, 
  User, 
  Phone
} from "lucide-react";
import { getData } from "../../../../backend/api";
import { useUser } from "../../../../contexts/UserContext";



// Utility function for logging
const logAction = (action, details = {}) => {
  console.log(`[Team Management] ${action}:`, {
    timestamp: new Date().toISOString(),
    ...details
  });
};



// Shimmer components
const ShimmerStats = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
          </div>
          <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
          <div className="w-16 h-8 bg-gray-200 rounded mb-2"></div>
          <div className="w-32 h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
    ))}
  </div>
);

const ShimmerTable = ({ rows }) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <div className="w-32 h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
            <div className="w-48 h-3 bg-gray-200 rounded mb-1 animate-pulse"></div>
            <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);









// Main component
export default function Team({ exhibitorData }) {
  const user = useUser(); // Get current user from context
  
  // Log exhibitor data for debugging
  useEffect(() => {
    logAction("Team Management component mounted", { 
      exhibitorData: exhibitorData,
      user: user,
      exhibitorDataKeys: exhibitorData ? Object.keys(exhibitorData) : null,
      userKeys: user ? Object.keys(user) : null
    });
  }, [exhibitorData, user]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [currentExhibitorId, setCurrentExhibitorId] = useState(null);
  const [currentEventId, setCurrentEventId] = useState(null);

  // Get current exhibitor ID and event ID
  useEffect(() => {
    logAction("useEffect triggered for ID extraction", { 
      user: user,
      exhibitorData: exhibitorData,
      userKeys: user ? Object.keys(user) : null,
      exhibitorDataKeys: exhibitorData ? Object.keys(exhibitorData) : null
    });

    const getCurrentExhibitorId = () => {
      // First, try to get from exhibitorData (the exhibitor we're managing)
      if (exhibitorData?._id) {
        logAction("Retrieved exhibitor ID from exhibitorData._id", { exhibitorId: exhibitorData._id });
        return exhibitorData._id;
      }
      
      // Try to get from user context as fallback
      if (user?._id) {
        logAction("Retrieved exhibitor ID from user context (fallback)", { exhibitorId: user._id });
        return user._id;
      }
      
      // Try to get from localStorage as last fallback
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.userId) {
            logAction("Retrieved exhibitor ID from localStorage (fallback)", { exhibitorId: userData.userId });
            return userData.userId;
          }
        } catch (error) {
          logAction("Error parsing user data from localStorage", { error: error.message });
        }
      }
      
      logAction("No valid exhibitor ID found", { user: user, exhibitorData: exhibitorData });
      return null;
    };

    const getCurrentEventId = () => {
      logAction("Getting current event ID", { 
        exhibitorData: exhibitorData,
        exhibitorDataEvent: exhibitorData?.event,
        exhibitorDataId: exhibitorData?._id,
        exhibitorDataEventKeys: exhibitorData?.event ? Object.keys(exhibitorData.event) : null
      });
      
      // Try to get event ID from exhibitorData.event._id (populated event object)
      if (exhibitorData?.event?._id) {
        logAction("Retrieved event ID from exhibitorData.event._id", { eventId: exhibitorData.event._id });
        return exhibitorData.event._id;
      }
      
      // Try to get from exhibitorData.event (if it's just the ID string)
      if (exhibitorData?.event && typeof exhibitorData.event === 'string') {
        logAction("Retrieved event ID from exhibitorData.event (string)", { eventId: exhibitorData.event });
        return exhibitorData.event;
      }
      
      // Try to get from exhibitorData directly (fallback)
      if (exhibitorData?._id) {
        logAction("Retrieved event ID from exhibitorData._id (fallback)", { eventId: exhibitorData._id });
        return exhibitorData._id;
      }
      
      logAction("No valid event ID found", { exhibitorData: exhibitorData });
      return null;
    };

    const exhibitorId = getCurrentExhibitorId();
    const eventId = getCurrentEventId();
    
    logAction("Setting IDs", { exhibitorId: exhibitorId, eventId: eventId });
    
    setCurrentExhibitorId(exhibitorId);
    setCurrentEventId(eventId);
  }, [user, exhibitorData]);

  // Fetch booth members from API
  const fetchBoothMembers = async () => {
    if (!currentExhibitorId) {
      logAction("No exhibitor ID available, skipping fetch");
      setIsLoading(false);
      return;
    }

    try {
      logAction("Fetching booth members", { 
        exhibitorId: currentExhibitorId,
        eventId: currentEventId 
      });
      setIsLoading(true);

      // First, try without event filter to see if any booth members exist for this exhibitor
      const apiParamsWithoutEvent = { 
        parentExhibitor: currentExhibitorId,
        searchkey: "",
        skip: 0,
        limit: 100
      };
      
      logAction("Making API call WITHOUT event filter", apiParamsWithoutEvent);
      
      const responseWithoutEvent = await getData(apiParamsWithoutEvent, "ticket-registration/boothmember");

      logAction("API response WITHOUT event filter", { 
        status: responseWithoutEvent.status,
        success: responseWithoutEvent.data?.success,
        message: responseWithoutEvent.data?.message,
        responseData: responseWithoutEvent.data
      });

      // If we found members without event filter, use those
      if (responseWithoutEvent.status === 200 && responseWithoutEvent.data.success) {
        const membersWithoutEvent = responseWithoutEvent.data.response || [];
        logAction("Booth members found WITHOUT event filter", { 
          count: membersWithoutEvent.length,
          exhibitorId: currentExhibitorId,
          members: membersWithoutEvent
        });
        
        // If we have an event ID, filter the results on the frontend
        if (currentEventId) {
          const filteredMembers = membersWithoutEvent.filter(member => 
            member.event === currentEventId || member.event?._id === currentEventId
          );
          logAction("Filtered members for event", { 
            originalCount: membersWithoutEvent.length,
            filteredCount: filteredMembers.length,
            eventId: currentEventId
          });
          setTeamMembers(filteredMembers);
        } else {
          setTeamMembers(membersWithoutEvent);
        }
        return;
      }

      // If no members found without event filter, try with event filter
      if (currentEventId) {
        const apiParamsWithEvent = { 
          parentExhibitor: currentExhibitorId,
          searchkey: "",
          event: currentEventId,
          skip: 0,
          limit: 100
        };
        
        logAction("Making API call WITH event filter", apiParamsWithEvent);
        
        const responseWithEvent = await getData(apiParamsWithEvent, "ticket-registration/boothmember");

        logAction("API response WITH event filter", { 
          status: responseWithEvent.status,
          success: responseWithEvent.data?.success,
          message: responseWithEvent.data?.message,
          responseData: responseWithEvent.data
        });
        
        if (responseWithEvent.status === 200 && responseWithEvent.data.success) {
          const members = responseWithEvent.data.response || [];
          logAction("Booth members fetched successfully WITH event filter", { 
            count: members.length,
            exhibitorId: currentExhibitorId,
            eventId: currentEventId,
            members: members
          });
          setTeamMembers(members);
        } else {
          logAction("Failed to fetch booth members WITH event filter", { 
            status: responseWithEvent.status,
            message: responseWithEvent.data?.message,
            fullResponse: responseWithEvent.data
          });
          showToast("Failed to load team members", "Please try again", "error");
        }
      } else {
        logAction("No event ID available, using members without event filter");
        setTeamMembers([]);
      }
    } catch (error) {
      logAction("Error fetching booth members", { error: error.message });
      showToast("Error loading team members", "Please check your connection and try again", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Debug logging for troubleshooting
  useEffect(() => {
    console.log("user context:", user);
    console.log("exhibitorData prop:", exhibitorData);
    console.log("Current Exhibitor ID:", currentExhibitorId);
    console.log("Current Event ID:", currentEventId);
  }, [currentExhibitorId, currentEventId]);

  // Load booth members when component mounts or exhibitor/event ID changes
  useEffect(() => {
    logAction("useEffect for fetchBoothMembers triggered", { 
      currentExhibitorId: currentExhibitorId, 
      currentEventId: currentEventId 
    });
    
    // Only fetch if both IDs are available
    if (currentExhibitorId && currentEventId) {
      logAction("Both IDs available, calling fetchBoothMembers");
      fetchBoothMembers();
    } else {
      logAction("Missing IDs, skipping fetchBoothMembers", { 
        currentExhibitorId: currentExhibitorId, 
        currentEventId: currentEventId 
      });
    }
  }, [currentExhibitorId, currentEventId]);

    // Toast functionality
  const showToast = (title, description, variant = "success") => {
    logAction("Show toast", { title, description, variant });
    setToast({ title, description, variant });
    setTimeout(() => setToast(null), 3000);
  };

  const getStatusColor = () => "text-green-600 bg-green-100";

  const getRoleIcon = (designation) => {
    switch (designation?.toLowerCase()) {
      case "admin":
      case "manager":
        return <Shield className="w-4 h-4" />;
      case "developer":
      case "designer":
        return <Users className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (designation) => {
    switch (designation?.toLowerCase()) {
      case "admin":
        return "text-red-600 bg-red-100";
      case "manager":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const activeMembers = teamMembers.filter(m => !m.isParentExhibitor);
  const invitedMembers = [];

  // Show loading or error state if no exhibitor ID or event ID
  if ((!currentExhibitorId || !currentEventId) && !isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load team management</h3>
          <p className="text-gray-500">
            {!currentExhibitorId && !currentEventId 
              ? "Please ensure you are logged in as an exhibitor and have selected an event."
              : !currentExhibitorId 
                ? "Please ensure you are logged in as an exhibitor."
                : "Please ensure you have selected an event."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[300px] ${
          toast.variant === 'error' ? 'border-red-200' : 'border-green-200'
        }`}>
          <div className={`text-sm font-medium ${toast.variant === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {toast.title}
          </div>
          {toast.description && (
            <div className="text-sm text-gray-600 mt-1">{toast.description}</div>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6">
            {/* Statistics Cards */}
            {isLoading ? (
              <ShimmerStats />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Total</span>
                  </div>
                  <div className="mb-2">
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Total Members</h3>
                    <p className="text-3xl font-bold text-gray-900">{teamMembers.length}</p>
                  </div>
                  <p className="text-sm text-gray-500">All team members</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <User className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
                  </div>
                  <div className="mb-2">
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Active Members</h3>
                    <p className="text-3xl font-bold text-gray-900">{activeMembers.length}</p>
                  </div>
                  <p className="text-sm text-gray-500">Currently active</p>
                </div>

                {/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <Mail className="w-6 h-6 text-yellow-600" />
                    </div>
                    <span className="text-sm font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Pending</span>
                  </div>
                  <div className="mb-2">
                    <h3 className="text-sm font-medium text-gray-600 mb-1">Pending Invites</h3>
                    <p className="text-3xl font-bold text-gray-900">{invitedMembers.length}</p>
                  </div>
                  <p className="text-sm text-gray-500">Awaiting response</p>
                </div> */}
              </div>
            )}

            {/* Team Members List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Booth Members</h2>
                      <p className="text-sm text-gray-500">{teamMembers.length} booth members total</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Booth members for this exhibitor
                  </div>
                </div>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <ShimmerTable rows={3} />
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No booth members found</h3>
                    <p className="text-gray-500">No booth members are associated with this exhibitor for this event.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {teamMembers.map((member) => (
                      <div key={member._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium shrink-0">
                            {member.fullName?.charAt(0) || "?"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{member.fullName || "Unnamed Member"}</p>
                            <p className="text-sm text-gray-600 truncate">{member.emailId || "No email"}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <p className="text-sm text-gray-500 truncate">{member.authenticationId || "No phone"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              {getRoleIcon(member.designation || "")}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.designation || "")}`}>
                                {member.designation || "Member"}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                              Active
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Booth Member
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Info Footer */}
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                Displaying booth members associated with this exhibitor for the current event
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}