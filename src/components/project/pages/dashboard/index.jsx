import React, { useState, useEffect, memo, useCallback, useMemo } from "react";
import { TabButtons } from "../../../core/elements/index.jsx";
import { getData } from "../../../../backend/api/index.js";
import { DashboardSkeleton } from "../../../core/loader/shimmer.jsx";
import { Calendar, DollarSign, UserPlus, Ticket, User, Clock, BarChart3, PieChartIcon, Presentation, Users, Building, Store } from "lucide-react";
import { useToast } from "../../../core/toast/ToastContext.jsx";
import moment from "moment";
import RegistrationTimeline from "./RegistrationTimeline.jsx";
import RegistrationsBreakdown from "./RegistrationsBreakdown.jsx";
import RegistrationByTicket from "./RegistrationByTicket.jsx";
import AttendanceByTicket from "./AttendanceByTicket.jsx";
import PeakRegistrationHour from "./PeakRegistrationHour.jsx";
import CheckinTimeline from "./CheckinTimeline.jsx";
import CheckInRateByTicket from "./CheckInRateByTicket.jsx";

const avatarColors = ["bg-pink-500", "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-yellow-500", "bg-red-500"];

function getAvatarColor(letter) {
  if (!letter) return "bg-gray-400";
  const charCode = letter.toUpperCase().charCodeAt(0);
  const index = (charCode - 65) % avatarColors.length;
  return avatarColors[index] || "bg-gray-400";
}

// Helper function to capitalize each word in a string
const capitalizeWords = (str) => {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const Dashboard = memo(({ openData, initialTab = 1, showTabs = true }) => {
  const toast = useToast();
  const [data, setData] = useState(openData?.data ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [dashboardCountData, setDashboardCountData] = useState(null);
  const [ticketData, setTicketData] = useState([]);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [speakersCount, setSpeakersCount] = useState(0);
  const [sponsorsCount, setSponsorsCount] = useState(0);
  const [participantTypesCount, setParticipantTypesCount] = useState(0);
  const [latestRegistrations, setLatestRegistrations] = useState([]);
  const [latestCheckins, setLatestCheckins] = useState([]);
  const [allRegistrations, setAllRegistrations] = useState(null);
  const [attendanceLoaded, setAttendanceLoaded] = useState(false);

  // Optimized useEffect - only fetch essential data
  useEffect(() => {
    if (!data?._id) {
      setDashboardCountData(null);
      setTicketData([]);
      setSessionsCount(0);
      setSpeakersCount(0);
      setSponsorsCount(0);
      setParticipantTypesCount(0);
      setLatestRegistrations([]);
      setLatestCheckins([]);
      setAllRegistrations(null);
      return;
    }

    const fetchEssentialDashboardData = async () => {
      setIsLoading(true);

      try {
        // Only fetch the essential data - reduced from 8 to 3 API calls
        const [dashboardCountRes, ticketDataRes, allRegistrationsRes] = await Promise.all([
          getData({ event: data._id }, "dashboard"), // Gets all count metrics
          getData({ event: data._id }, "ticket/select/all/Ticket"), // For ticket count
          getData({ event: data._id, ticket: "", searchkey: "", type: "Ticket", skip: 0, limit: 1000 }, "ticket-registration/all"), // Reduced limit
        ]);

        // Process dashboard count data (includes registration, attendance, revenue stats)
        if (dashboardCountRes.status === 200) {
          setDashboardCountData(dashboardCountRes.data || []);
        } else {
          toast.error("Failed to load dashboard count data");
        }

        // Process ticket data
        if (ticketDataRes.status === 200 && ticketDataRes.data) {
          setTicketData(ticketDataRes.data);
        } else {
          toast.error("Failed to load ticket data");
        }

        // Process registration data for charts and recent registrations
        if (allRegistrationsRes.status === 200) {
          const registrationData = allRegistrationsRes.data?.response || [];
          setLatestRegistrations(registrationData);
          setAllRegistrations(allRegistrationsRes);
        } else {
          setLatestRegistrations([]);
          toast.error("Failed to load registration data");
        }

        // Set default counts (these can be fetched separately if needed)
        setSessionsCount(0); // Remove API call - show 0 or fetch only when needed
        setSpeakersCount(0); // Remove API call - show 0 or fetch only when needed
        setSponsorsCount(0); // Remove API call - show 0 or fetch only when needed
        setParticipantTypesCount(0); // Remove API call - show 0 or fetch only when needed
      } catch (error) {
        toast.error("Error loading dashboard data. Please try refreshing.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEssentialDashboardData();
  }, [data?._id, toast]);

  useEffect(() => {
    setData(openData?.data);
  }, [openData?.data]);

  const fetchAttendance = useCallback(async () => {
    if (!data?._id || attendanceLoaded) return;
    setIsLoading(true);
    try {
      // Only fetch recent check-ins, not all attendance data
      const response = await getData({ ticket: "all", event: data._id, limit: 10 }, "attendance/check-in");
      if (response.status === 200 && Array.isArray(response.data.response)) {
        setLatestCheckins(response.data.response);
      } else {
        setLatestCheckins([]);
      }
      setAttendanceLoaded(true);
    } catch (error) {
      console.error(`Error fetching attendance data:`, error);
      toast.error("Error loading attendance data");
      setAttendanceLoaded(false);
    } finally {
      setIsLoading(false);
    }
  }, [data?._id, attendanceLoaded, toast]);

  useEffect(() => {
    if ((showTabs ? selectedTab : initialTab) === 2) {
      fetchAttendance();
    }
  }, [showTabs, selectedTab, initialTab, fetchAttendance]);

  const stats = useMemo(
    () => [
      {
        id: 1,
        title: "TOTAL REGISTRATIONS",
        value: dashboardCountData?.[0]?.count || "0",
        icon: dashboardCountData?.[0]?.icon || "registration",
        bgColor: "bg-[#e2f6e6]",
        iconColor: "text-green-500",
      },
      { id: 2, title: "TODAY'S REGISTRATIONS", value: dashboardCountData?.[1]?.count || "0", icon: dashboardCountData?.[1]?.icon || "date", bgColor: "bg-[#deebff]", iconColor: "text-blue-500" },
      { id: 3, title: "TOTAL TICKET AMOUNT", value: dashboardCountData?.[2]?.count || "0", icon: dashboardCountData?.[2]?.icon || "currency", bgColor: "bg-[#ffe5e2]", iconColor: "text-red-500" },
    ],
    [dashboardCountData]
  );

  const attendanceStats = useMemo(
    () => [
      { id: 1, title: "REGISTERED ATTENDANCE", value: dashboardCountData?.[4]?.count || "0", icon: dashboardCountData?.[4]?.icon || "users", bgColor: "bg-[#e2f6e6]", iconColor: "text-green-500" },
      { id: 2, title: "CHECK-IN ATTENDEE", value: dashboardCountData?.[5]?.count || "0", icon: dashboardCountData?.[5]?.icon || "user-check", bgColor: "bg-[#deebff]", iconColor: "text-blue-500" },
      { id: 3, title: "PENDING ATTENDEE", value: dashboardCountData?.[6]?.count || "0", icon: dashboardCountData?.[6]?.icon || "user-clock", bgColor: "bg-[#ffe5e2]", iconColor: "text-red-500" },
      { id: 4, title: "CHECK-IN RATE", value: dashboardCountData?.[7]?.count || "0%", icon: dashboardCountData?.[7]?.icon || "percent", bgColor: "bg-[#e6e6f9]", iconColor: "text-purple-500" },
    ],
    [dashboardCountData]
  );

  // Determine which tab to show
  const activeTab = showTabs ? selectedTab : initialTab;

  // Generate tabs based on CHECK-IN ATTENDEE count
  const availableTabs = useMemo(() => {
    const baseTabs = [{ key: 1, title: "Registration" }];

    // Check if there are any CHECK-IN ATTENDEE records (index 5 in dashboardCountData)
    const checkInAttendeeCount = dashboardCountData?.[5]?.count || "0";
    const hasCheckInAttendees = parseInt(checkInAttendeeCount) > 0;

    console.log("Dashboard - CHECK-IN ATTENDEE count:", checkInAttendeeCount, "Has check-ins:", hasCheckInAttendees);

    // Only add Attendance tab if there are check-in attendees
    if (hasCheckInAttendees) {
      console.log("Dashboard - Adding Attendance tab");
      baseTabs.push({ key: 2, title: "Attendance" });
    } else {
      console.log("Dashboard - No check-in attendees found, skipping Attendance tab");
    }

    return baseTabs;
  }, [dashboardCountData]);

  // Reset selected tab if current selection is not available
  useEffect(() => {
    if (showTabs && !availableTabs.find((tab) => tab.key === selectedTab)) {
      console.log("Dashboard - Resetting selected tab to first available tab");
      setSelectedTab(availableTabs[0]?.key || 1);
    }
  }, [availableTabs, selectedTab, showTabs]);

  return (
    <main className="w-full min-h-min">
      <div className="container mx-auto">
        {/* Header Section (only if showTabs) */}
        {showTabs && (
          <div className="flex md:flex-row justify-between items-center gap-4 md:mb-8">
            <div className="w-full md:w-auto">
              <TabButtons tabs={availableTabs} selectedTab={selectedTab} selectedChange={setSelectedTab} />
            </div>
          </div>
        )}
        {/* Loading State */}
        {isLoading && (
          <div className="w-full">
            <DashboardSkeleton />
          </div>
        )}

        {/* Registration View */}
        {activeTab === 1 && (
          <div className="w-full border border-gray-200 p-2 bg-white rounded-xl shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {stats.map((stat, index) => (
                <div key={stat.id} className={`flex items-center p-2 gap-3  ${index !== stats.length - 1 ? "border-r border-gray-200" : ""}`}>
                  <div className="flex items-center justify-center border border-gray-200 rounded-full">
                    <div className={` w-12 h-12 rounded-full flex items-center justify-center  ${stat.bgColor}`}>
                      {stat.icon === "currency" ? (
                        <DollarSign className="" width={18} height={18} stroke="#99231b" />
                      ) : stat.icon === "registration" ? (
                        <UserPlus className="" width={18} height={18} stroke="#016a27" />
                      ) : stat.icon === "date" ? (
                        <Calendar className="" width={18} height={18} stroke="#004999" />
                      ) : (
                        <Ticket className="" width={18} height={18} stroke="#2b2a69" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium font-inter text-gray-500">{stat.title}</p>
                    <p className="text-[16px] font-bold font-inter text-gray-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Attendance View */}
        {activeTab === 2 && (
          <div className="w-full border border-gray-200 p-2 bg-white rounded-xl shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {attendanceStats.map((stat, index) => (
                <div key={stat.id} className={`flex items-center p-2 gap-3  ${index !== attendanceStats.length - 1 ? "border-r border-gray-200" : ""}`}>
                  <div className="flex items-center justify-center border border-gray-200 rounded-full">
                    <div className={` w-12 h-12 rounded-full flex items-center justify-center  ${stat.bgColor}`}>
                      {stat.icon === "user-check" ? (
                        <UserPlus width={18} height={18} stroke="#016a27" />
                      ) : stat.icon === "users" ? (
                        <Users width={18} height={18} stroke="#016a27" />
                      ) : stat.icon === "user-clock" ? (
                        <Clock width={18} height={18} stroke="#004999" />
                      ) : stat.icon === "percent" ? (
                        <BarChart3 width={18} height={18} stroke="#2b2a69" />
                      ) : (
                        <Ticket width={18} height={18} stroke="#2b2a69" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium font-inter text-gray-500">{stat.title}</p>
                    <p className="text-[16px] font-bold text-gray-900 font-inter">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DASHBOARD REGISTRATION TAB CONTENT */}
        {!isLoading && activeTab === 1 && (
          <div className="flex flex-col gap-6">
            {/* FIRST ROW: EVENT OVERVIEW, REGISTRATION TIMELINE, RECENT REGISTRATIONS */}
            <div className="flex flex-col md:flex-row gap-6 h-[375px]">
              {/* EVENT OVERVIEW CARD */}
              <div className="w-full md:w-[25%] bg-white rounded-xl border border-gray-200 p-5 h-full flex flex-col">
                <div className="flex items-center gap-2 font-semibold text-md text-gray-800 mb-4 border-b border-gray-100 pb-3">
                  <Calendar size={20} className="text-gray-600" />
                  Event Overview
                </div>
                <div className="flex-grow space-y-4 py-2">
                  {/* Tickets */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Ticket size={18} className="text-gray-600" />
                      <span className="text-sm text-gray-600 font-inter">No. of Tickets</span>
                    </div>
                    <span className="text-lg font-bold text-gray-600 font-inter">{ticketData.length}</span>
                  </div>
                  {/* Sessions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Presentation size={18} className="text-blue-600" />
                      <span className="text-sm text-gray-600 font-inter">No. of Sessions</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600 font-inter">{sessionsCount}</span>
                  </div>
                  {/* Speakers */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users size={18} className="text-green-600" />
                      <span className="text-sm text-gray-600 font-inter">No. of Speakers</span>
                    </div>
                    <span className="text-lg font-bold text-green-600 font-inter">{speakersCount}</span>
                  </div>
                  {/* Sponsors */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building size={18} className="text-orange-600" />
                      <span className="text-sm text-gray-600 font-inter">No. of Sponsors</span>
                    </div>
                    <span className="text-lg font-bold text-orange-600 font-inter">{sponsorsCount}</span>
                  </div>
                  {/* Exhibitors */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Store size={18} className="text-red-600" />
                      <span className="text-sm text-gray-600 font-inter">No. of Exhibitors</span>
                    </div>
                    <span className="text-lg font-bold text-red-600 font-inter">{ticketData.filter((ticket) => ticket.value.toLowerCase().includes("exhibitor")).length}</span>
                  </div>
                  {/* Participant Types */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users size={18} className="text-violet-600" />
                      <span className="text-sm text-gray-600 font-inter">No. of Participant Types</span>
                    </div>
                    <span className="text-lg font-bold text-violet-600 font-inter">{participantTypesCount}</span>
                  </div>
                </div>
              </div>

              {/* REGISTRATION TIMELINE CARD */}
              <div className="w-full md:w-[50%] bg-white rounded-xl border border-gray-200 p-5 h-full flex flex-col">
                <div className="flex items-center gap-2 font-semibold text-md text-gray-800 mb-4 border-b border-gray-100 pb-3">
                  <BarChart3 size={20} className="text-gray-600" />
                  Registration Timeline
                </div>
                <div className="flex-grow w-full h-[calc(100%-3rem)]">
                  <RegistrationTimeline propData={allRegistrations} hideTitle={true} eventId={data?._id} />
                </div>
              </div>

              {/* RECENT REGISTRATIONS CARD */}
              <div className="w-full md:w-[25%] bg-white rounded-xl border border-gray-200 p-5 h-full flex flex-col">
                <div className="flex items-center gap-2 font-semibold text-md text-gray-800 mb-4 border-b border-gray-100 pb-3">
                  <User size={20} className="text-gray-600" />
                  Recent Registrations
                </div>
                <div className="flex-grow overflow-y-auto">
                  {Array.isArray(latestRegistrations) &&
                    latestRegistrations
                      .slice()
                      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
                      .slice(0, 5)
                      .map((item, index) => (
                        <div key={index} className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${item.image ? "" : getAvatarColor(item.fullName?.[0] || item.firstName?.[0] || "U")}`}
                          >
                            {item.image ? (
                              <img src={item.image} alt={capitalizeWords(item.fullName || item.firstName || "User")} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg font-semibold text-white">{(item.fullName?.[0] || item.firstName?.[0] || "U").toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm font-inter whitespace-nowrap overflow-hidden text-ellipsis" title={capitalizeWords(item.firstName || "")}>
                                {capitalizeWords(item.firstName || "")}
                              </span>
                              <span className="text-xs text-gray-500 font-inter ml-3 flex-shrink-0">{moment(item.date || item.createdAt).fromNow()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  {Array.isArray(latestRegistrations) && latestRegistrations.length === 0 && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                      <p className="text-lg font-semibold text-gray-800">No recent registrations</p>
                      <p className="text-sm text-gray-500 mt-2">New registrations will appear here as attendees sign up.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECOND ROW: REGISTRATION BREAKDOWN, TICKET TYPE BREAKDOWN, PEAK ORDERING HOUR */}
            <div className="flex flex-col md:flex-row gap-6 h-[375px]">
              {/* REGISTRATION BREAKDOWN */}
              <div className="w-full md:w-[25%] bg-white rounded-xl border border-gray-200 p-5 h-full flex flex-col">
                <div className="flex items-center gap-2 font-semibold text-md text-gray-800 mb-4 border-b border-gray-100 pb-3">
                  <PieChartIcon size={20} className="text-gray-600" />
                  Registration Breakdown
                </div>
                <div className="flex-grow">
                  <RegistrationsBreakdown propData={allRegistrations} hideTitle={true} eventId={data?._id} />
                </div>
              </div>

              {/* TICKET TYPE BREAKDOWN */}
              <div className="w-full md:w-[25%] bg-white rounded-xl border border-gray-200 p-5 h-full flex flex-col">
                <div className="flex items-center gap-2 font-semibold text-md text-gray-800 mb-4 border-b border-gray-100 pb-3">
                  <Ticket size={20} className="text-gray-600" />
                  Registrations by Ticket Type
                </div>
                <div className="flex-grow">
                  <RegistrationByTicket propData={allRegistrations} hideTitle={true} eventId={data?._id} />
                </div>
              </div>

              {/* PEAK ORDERING HOUR */}
              <div className="w-full md:w-[50%] bg-white rounded-xl border border-gray-200 p-5 h-full flex flex-col">
                <div className="flex items-center gap-2 font-semibold text-md text-gray-800 mb-4 border-b border-gray-100 pb-3">
                  <BarChart3 size={20} className="text-gray-600" />
                  Peak Registration Hour
                </div>
                <div className="flex-grow">
                  <PeakRegistrationHour propData={allRegistrations} hideTitle={true} eventId={data?._id} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD ATTENDANCE TAB CONTENT */}
        {!isLoading && activeTab === 2 && (
          <div className="flex flex-col gap-6">
            {/* FIRST ROW: CHECK-IN TIMELINE & ATTENDANCE RATE BY TICKET TYPE */}
            <div className="flex flex-col md:flex-row gap-6 items-stretch">
              <div className="w-full md:w-[50%] h-full" style={{ height: "320px" }}>
                <CheckinTimeline eventId={data?._id} />
              </div>
              <div className="w-full md:w-[25%] h-full" style={{ height: "320px" }}>
                <CheckInRateByTicket eventId={data?._id} />
              </div>
              <div className="w-full md:w-[25%] bg-white rounded-xl border border-gray-200 p-5 h-full flex flex-col" style={{ height: "320px" }}>
                <div className="flex items-center gap-2 font-semibold text-md text-gray-800 mb-4 border-b border-gray-100 pb-3">
                  <User size={20} className="text-gray-600" />
                  Recent Check-in Attendees
                </div>
                <div className="flex-grow overflow-y-auto">
                  {Array.isArray(latestCheckins) &&
                    latestCheckins
                      .slice()
                      .sort((a, b) => new Date(b.attendanceDate || b.updatedAt || b.date || b.createdAt) - new Date(a.attendanceDate || a.updatedAt || a.date || a.createdAt))
                      .slice(0, 4)
                      .map((item, index) => (
                        <div key={index} className="p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${item.image ? "" : getAvatarColor(item.fullName?.[0] || item.firstName?.[0] || "U")}`}
                          >
                            {item.image ? (
                              <img src={item.image} alt={capitalizeWords(item.fullName || item.firstName || "User")} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg font-semibold text-white">{(item.fullName?.[0] || item.firstName?.[0] || "U").toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-sm font-inter whitespace-nowrap overflow-hidden text-ellipsis" title={capitalizeWords(item.firstName || item.fullName || "")}>
                                {capitalizeWords(item.firstName || item.fullName || "")}
                              </span>
                              <span className="text-xs text-gray-500 font-inter ml-3 flex-shrink-0">{moment(item.attendanceDate || item.updatedAt || item.date || item.createdAt).fromNow()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  {Array.isArray(latestCheckins) && latestCheckins.length === 0 && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                      <p className="text-lg font-semibold text-gray-800">No recent check-ins</p>
                      <p className="text-sm text-gray-500 mt-2">Checked-in attendees will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECOND ROW: ATTENDANCE BY TICKET TYPE (COUNTS) & REPEAT ATTENDANCE */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-[30%] h-full" style={{ height: "390px" }}>
                <AttendanceByTicket propData={allRegistrations} eventId={data?._id} />
              </div>
              <div className="w-full md:w-[30%] h-full" style={{ height: "390px" }}>
                <RegistrationsBreakdown propData={allRegistrations} eventId={data?._id} />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
});

export default Dashboard;
