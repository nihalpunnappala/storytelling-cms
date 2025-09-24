import React, { useState, useEffect, useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Ticket } from "lucide-react";
import { getData } from "../../../../backend/api";

ChartJS.register(ArcElement, Tooltip, Legend);

// Default empty state while data is loading
const defaultAttendanceData = {};
const defaultTicketTypes = [];

// Consistent color palette for ticket types
const colorPalette = ["#4F46E5", "#34D399", "#F6C34F", "#F87171", "#60A5FA", "#9333EA", "#EC4899", "#10B981", "#F59E0B", "#6366F1", "#8B5CF6", "#14B8A6", "#EF4444", "#3B82F6", "#D946EF"];

// Custom plugin to draw text in the center (Total Checked-in)
export const centerAttendanceTextPlugin = {
  id: "centerAttendanceText",
  afterDraw: (chart) => {
    if (!chart.options.plugins.centerText || !chart.options.plugins.centerText.display) {
      return;
    }
    const ctx = chart.ctx;
    const { width, height } = chart.chartArea;
    const centerX = width / 2 + chart.chartArea.left;
    const centerY = height / 2 + chart.chartArea.top;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Title Text
    ctx.font = "12px Inter, sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.fillText("TOTAL CHECKED-IN", centerX, centerY - 10);

    // Value Text
    ctx.font = "bold 28px Inter, sans-serif";
    ctx.fillStyle = "#1f2937";
    const total = chart.data.datasets[0].data.reduce((sum, value) => sum + value, 0);
    ctx.fillText(total.toLocaleString(), centerX, centerY + 15);
    ctx.restore();
  },
};

const AttendanceByTicket = ({ propData, eventId, hideTitle = false }) => {
  const [attendanceData, setAttendanceData] = useState(defaultAttendanceData);
  const [ticketTypes, setTicketTypes] = useState(defaultTicketTypes);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [franchiseData, setFranchiseData] = useState();
  const [data, setData] = useState();
  const [isFranchiseLoading, setIsFranchiseLoading] = useState(true);

  // Fetch attendance data from API
  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!eventId) {
        setIsLoading(false);
        return;
      }
      if (!propData) {
        return;
      }
      try {
        setIsLoading(true);

        // Fetch attendance data
        // const response = propData ? propData : await getData({ ticket: "all", event: eventId, skip: 0 }, "attendance/check-in");
        const response = propData ? propData : await getData({ ticket: "", searchkey: "", event: eventId, type: "Ticket", skip: 0, limit: 100000 }, "ticket-registration/all");
        // const response = propData ? propData : await getData({ ticket: "all", event: eventId, skip: 0 }, "attendance/check-in");

        if (response.status === 200) {
          // Extract attendance data from response
          let attendanceData = [];
          if (response.response && Array.isArray(response.response)) {
            attendanceData = response.response;
          } else if (response.data?.response && Array.isArray(response.data.response)) {
            attendanceData = response.data.response;
          } else if (Array.isArray(response.data)) {
            attendanceData = response.data;
          }

          // Process attendance by ticket type
          const ticketCounts = {};
          const ticketInfo = {};
          let colorIndex = 0;

          // Group attendance by ticket type for checked-in attendees
          attendanceData.forEach((attendance) => {
            if (attendance.ticket && attendance.ticket._id) {
              const ticketId = attendance.ticket._id;
              const ticketTitle = attendance.ticket.title || "Unknown Ticket";

              // Initialize ticket info if not exists
              if (!ticketInfo[ticketId]) {
                ticketInfo[ticketId] = { key: ticketId, name: ticketTitle, color: colorPalette[colorIndex % colorPalette.length] };
                colorIndex++;
              }
              // Count checked-in attendees by ticket type
              ticketCounts[ticketId] = (ticketCounts[ticketId] || 0) + 1;
            }
          });

          // Convert ticketInfo object to array
          const ticketTypesArray = Object.values(ticketInfo);
          // Set processed data to state
          setAttendanceData(ticketCounts);
          setTicketTypes(ticketTypesArray);
        } else {
          setError("Failed to load ticket type data");
        }
      } catch (error) {
        setError("Failed to load attendance data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttendanceData();
  }, [eventId]);

  useEffect(() => {
    const fetchFranchiseData = async () => {
      if (!eventId) {
        setIsFranchiseLoading(false);
        return;
      }
      try {
        setIsFranchiseLoading(true);
        const response = await getData({ event: eventId }, "dashboard/reg-count-franchise");
        console.log(response);
        const franchiseData = response.data.response;
        console.log(franchiseData, "franchiseData");
        setFranchiseData(franchiseData);
      } catch (error) {
        console.error("Error fetching franchise data:", error);
      } finally {
        setIsFranchiseLoading(false);
      }
    };
    fetchFranchiseData();
  }, [eventId]);

  // Prepare data for the chart based on available ticket types
  const { chartLabels, chartData, backgroundColors } = useMemo(() => {
    const labels = [];
    const dataPoints = [];
    const colors = [];

    ticketTypes.forEach((type) => {
      if (attendanceData[type.key] !== undefined) {
        labels.push(type.name);
        dataPoints.push(attendanceData[type.key]);
        colors.push(type.color || "#cccccc");
      }
    });
    return { chartLabels: labels, chartData: dataPoints, backgroundColors: colors };
  }, [ticketTypes, attendanceData]);

  // const data = useMemo(
  //   () => ({
  //     labels: chartLabels,
  //     datasets: [{ label: "Attendance", data: chartData, backgroundColor: backgroundColors, borderColor: "#ffffff", borderWidth: 2, cutout: "75%" }],
  //   }),
  //   [chartLabels, chartData, backgroundColors]
  // );

  // const data = useMemo(() => ({
  //   labels: [`Registration Count: ${franchiseData?.currentEventAttendanceCount}`, `Returning Users: ${franchiseData?.usersParticipatedInOtherFranchiseEvents}`],
  //   // datasets: [{ label: "Attendance", data: [1, 2], backgroundColor: ["#4F46E5", "#34D399"], borderColor: "#ffffff", borderWidth: 2, cutout: "75%" }],
  //   datasets: [{ label: "Attendance", data: [franchiseData?.currentEventAttendanceCount - franchiseData?.usersParticipatedInOtherFranchiseEvents, franchiseData?.usersParticipatedInOtherFranchiseEvents], backgroundColor: ["#4F46E5", "#34D399"], borderColor: "#ffffff", borderWidth: 2, cutout: "75%" }],
  // }), [franchiseData]);
  useEffect(() => {
    const setDataFunc = async () => {
      // Only set data if franchiseData is available and has valid values
      if (franchiseData && 
          typeof franchiseData.currentEventAttendanceCount === 'number' && 
          typeof franchiseData.usersParticipatedInOtherFranchiseEvents === 'number') {
        setData({
          labels: [`Registration Count: ${franchiseData.currentEventAttendanceCount}`, `Returning Users: ${franchiseData.usersParticipatedInOtherFranchiseEvents}`],
          datasets: [{ 
            label: "Attendance", 
            data: [
              franchiseData.currentEventAttendanceCount - franchiseData.usersParticipatedInOtherFranchiseEvents, 
              franchiseData.usersParticipatedInOtherFranchiseEvents
            ], 
            backgroundColor: ["#4F46E5", "#34D399"], 
            borderColor: "#ffffff", 
            borderWidth: 2, 
            cutout: "75%" 
          }],
        });
      } else {
        // Clear data if franchiseData is not valid
        setData(null);
      }
    };
    setDataFunc();
  }, [franchiseData]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: "bottom", align: "center", labels: { boxWidth: 12, padding: 15, font: { size: 11, family: "Inter, sans-serif" }, color: "#6b7280" } },
        tooltip: {
          enabled: true,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          titleColor: "#1f2937",
          bodyColor: "#374151",
          borderColor: "#e5e7eb",
          borderWidth: 1,
          padding: 8,
          displayColors: false,
          callbacks: {
            label: function (context) {
              let label = context.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed !== null) {
                label += context.parsed.toLocaleString();
              }
              return label;
            },
            title: () => null,
          },
        },
        centerText: { },
      },
    }),
    []
  );

  // Show loading indicator
  if (isLoading) {
    return (
      <div className={`${!hideTitle ? "bg-white rounded-xl border border-gray-200 p-5" : ""} w-full h-full flex flex-col`}>
        {!hideTitle && (
          <div className="flex items-center gap-2 font-semibold text-md text-gray-800 mb-4 border-b border-gray-100 pb-3">
            <Ticket size={20} className="text-gray-600" />
            Attendance by Ticket Type
          </div>
        )}
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading data...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`${!hideTitle ? "bg-white rounded-xl border border-gray-200 p-5" : ""} w-full h-full flex flex-col`}>
        {!hideTitle && (
          <div className="flex items-center gap-2 font-semibold text-md text-gray-800 mb-4 border-b border-gray-100 pb-3">
            <Ticket size={20} className="text-gray-600" />
            Attendance by Ticket Type
          </div>
        )}
        <div className="flex-grow flex items-center justify-center text-gray-500">{error}</div>
      </div>
    );
  }

  // Don't render the chart if there's no data
  if (chartData.length === 0 || chartData.reduce((sum, val) => sum + val, 0) === 0) {
    return (
      <div className={`${!hideTitle ? "bg-white rounded-xl border border-gray-200 p-5" : ""} w-full h-full flex flex-col`}>
        {!hideTitle && (
          <div className="flex items-center gap-2 font-semibold text-md text-gray-800 mb-4 border-b border-gray-100 pb-3">
            <Ticket size={20} className="text-gray-600" />
            Attendance by Ticket Type
          </div>
        )}
        <div className="flex-grow flex items-center justify-center" style={{ minHeight: "235px" }}>
          <div className="w-full flex flex-col items-center justify-center text-center">
            <p className="text-lg font-semibold text-gray-800">No attendance data yet</p>
            <p className="text-sm text-gray-500 mt-2">Checked-in attendees will appear here.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${!hideTitle ? "bg-white rounded-xl border border-gray-200 p-5" : ""} w-full h-full flex flex-col`}>
      {/* Card Header */}
      {!hideTitle && (
        <div className="flex items-center gap-2 font-semibold text-md text-gray-800 mb-4 border-b border-gray-100 pb-3">
          <Ticket size={20} className="text-gray-600" />
          Attendance by Ticket Type
        </div>
      )}
      {/* Chart Area */}
      <div className="relative flex-grow flex items-center justify-center" style={{ minHeight: "300px" }}>
        {!isFranchiseLoading && data && data.labels && data.labels.length > 0 && data.datasets && data.datasets.length > 0 ? (
          <Doughnut data={data} options={options} />
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <span className="mt-3 text-gray-600 text-sm">Loading Registration data...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceByTicket;
