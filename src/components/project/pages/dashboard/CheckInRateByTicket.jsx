import React, { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, Percent } from "lucide-react";
import { getData } from "../../../../backend/api";

// Helper to calculate rate and determine color/icon
const calculateRate = (checkedIn, registered) => {
  if (!registered || registered === 0) return { rate: 0, color: "text-gray-500", Icon: Percent };
  const rate = (checkedIn / registered) * 100;
  let color = "text-yellow-600";
  let Icon = Percent;
  if (rate > 85) {
    color = "text-green-600";
    Icon = TrendingUp;
  } else if (rate < 70) {
    color = "text-red-600";
    Icon = TrendingDown;
  }
  return { rate: rate.toFixed(1), color, Icon };
};

// A simple color palette for dynamically assigned ticket type colors
const ticketColors = ["#F6C34F", "#34D399", "#4F46E5", "#EF4444", "#EC4899", "#10B981", "#8B5CF6"];

const CheckInRateByTicket = ({ eventId }) => {
  const [attendanceData, setAttendanceData] = useState({});
  const [registrationData, setRegistrationData] = useState({});
  const [ticketTypes, setTicketTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("eventId", eventId);
    const fetchData = async () => {
      if (!eventId) return;
      setLoading(true);
      try {
        // Fetch all registrations
        const regRes = await getData({ event: eventId, ticket: "", searchkey: "", type: "Ticket", skip: 0, limit: 100000 }, "ticket-registration/all");
        let allRegistrations = Array.isArray(regRes.data?.response) ? regRes.data.response : [];
        console.log("All Registrations:", allRegistrations);

        // Group by ticket type
        const registrationCount = {};
        const checkedInCount = {};
        const ticketInfo = {};
        let unknownCheckedIn = 0;

        allRegistrations.forEach((reg) => {
          if (reg.ticket && reg.ticket._id && reg.ticket.title) {
            const ticketId = reg.ticket._id;
            registrationCount[ticketId] = (registrationCount[ticketId] || 0) + 1;
            if (!ticketInfo[ticketId]) {
              ticketInfo[ticketId] = { key: ticketId, name: reg.ticket.title, color: ticketColors[Object.keys(ticketInfo).length % ticketColors.length] };
            }
            // Count checked-in attendees for this ticket
            if (reg.attendance === true) {
              checkedInCount[ticketId] = (checkedInCount[ticketId] || 0) + 1;
            }
          } else {
            // Unknown ticket
            if (reg.attendance === true) {
              unknownCheckedIn++;
            }
          }
        });

        // Only add Unknown Ticket row if there are unknown check-ins
        if (unknownCheckedIn > 0) {
          const unknownKey = "unknown";
          ticketInfo[unknownKey] = { key: unknownKey, name: "Unknown Ticket", color: "#A0AEC0" };
          checkedInCount[unknownKey] = unknownCheckedIn;
          registrationCount[unknownKey] = 0; // No registrations, only check-ins
        }

        setRegistrationData(registrationCount);
        setAttendanceData(checkedInCount);
        setTicketTypes(Object.values(ticketInfo));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId]);

  const memoizedRates = useMemo(() => {
    return ticketTypes.map((type) => {
      const checkedIn = attendanceData[type.key] || 0;
      const registered = registrationData[type.key] || 0;
      const { rate, color: rateStatusColor, Icon } = calculateRate(checkedIn, registered);
      return { key: type.key, name: type.name, checkedIn, registered, rate, color: rateStatusColor, Icon, dotColor: type.color };
    });
  }, [ticketTypes, attendanceData, registrationData]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 w-full h-full flex flex-col justify-center items-center">
        <div className="text-gray-500 animate-pulse">Loading attendance data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 w-full h-full flex flex-col justify-center items-center">
        <div className="text-red-600 font-medium">Error loading data:</div>
        <div className="text-red-500 text-sm mt-1">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 w-full h-full flex flex-col">
      {/* Card Header */}
      <div className="flex items-center gap-2 font-semibold text-md text-gray-800 mb-4 border-b border-gray-100 pb-3">
        <Percent size={20} className="text-gray-600" />
        Check-in Rate by Ticket Type
      </div>
      {/* Content - List View */}
      <div className="flex-grow space-y-3 overflow-y-auto py-2 pr-2">
        {memoizedRates.map((item) => (
          <div key={item.key} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 font-inter">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.dotColor }}></span>
              <span className="text-sm text-gray-700 font-inter flex-grow truncate" title={item.name}>
                {item.name}
              </span>
            </div>
            <div className={`flex items-center gap-2 text-sm font-semibold ${item.color}`}>
              <item.Icon size={16} />
              <span>{item.rate}%</span>
              <span className="text-xs text-gray-400 font-inter ml-2">
                ({item.checkedIn}/{item.registered})
              </span>
            </div>
          </div>
        ))}
        {memoizedRates.length === 0 && !loading && <div className="w-full h-full flex flex-col items-center justify-center text-center py-4">No ticket data available.</div>}
      </div>
    </div>
  );
};

export default CheckInRateByTicket;
