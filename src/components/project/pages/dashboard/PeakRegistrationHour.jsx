import React, { useState, useEffect, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { getData } from "../../../../backend/api";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Static array of hour labels (0-23 hours in 12-hour format with AM/PM)
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i % 12 || 12} ${i < 12 ? "AM" : "PM"}`);

const PeakRegistrationHour = ({ propData, eventId, hideTitle = false }) => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [peakHour, setPeakHour] = useState(null);

  useEffect(() => {
    const fetchRegistrationTimeData = async () => {
      if (!eventId) {
        setIsLoading(false);
        return;
      }
      if (!propData) {
        return;
      }
      try {
        setIsLoading(true);
        // Fetch registrations data
        const response = propData ? propData : await getData({ ticket: "", searchkey: "", event: eventId, type: "Ticket", skip: 0, limit: 100000 }, "ticket-registration/all");

        if (response.status === 200) {
          // Extract registration data from response
          let registrationData = [];
          if (response.response && Array.isArray(response.response)) {
            registrationData = response.response;
          } else if (response.data?.response && Array.isArray(response.data.response)) {
            registrationData = response.data.response;
          } else if (Array.isArray(response.data)) {
            registrationData = response.data;
          }

          // Process hour distribution
          const hourCounts = Array(24).fill(0);
          registrationData.forEach((registration) => {
            const dateStr = registration.createdAt || registration.date;
            if (dateStr) {
              const date = new Date(dateStr);
              const hour = date.getHours();
              hourCounts[hour]++;
            }
          });

          // Find peak hour
          let maxCount = 0;
          let peakHourIndex = 0;

          hourCounts.forEach((count, hour) => {
            if (count > maxCount) {
              maxCount = count;
              peakHourIndex = hour;
            }
          });

          // Format peak hour
          const formattedPeakHour = `${peakHourIndex % 12 || 12} ${peakHourIndex < 12 ? "AM" : "PM"}`;
          setPeakHour(formattedPeakHour);
          setChartData(hourCounts);
        } else {
          setError("Failed to load hour distribution data");
        }
      } catch (error) {
        setError("Failed to load registration time data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRegistrationTimeData();
  }, [eventId, propData]);

  // Prepare chart data - memoized
  const memoizedChartJsData = useMemo(() => {
    if (chartData.length === 0) {
      return {
        labels: [],
        datasets: [{ label: "Registrations", data: [], backgroundColor: [], borderWidth: 1 }],
      };
    }

    // Filter out hours with zero registrations for a cleaner chart
    // Keep original indexing for color logic and peak hour reference
    const filteredHourData = chartData.map((count, index) => ({ count, index, label: HOUR_LABELS[index] })).filter((item) => item.count > 0);
    const labels = filteredHourData.map((item) => item.label);
    const dataPoints = filteredHourData.map((item) => item.count);
    const backgroundColors = filteredHourData.map((item) => {
      if (item.label === peakHour) {
        return "#FF6384";
      }
      if (item.index < 12) {
        return "#36A2EB";
      }
      return "#FFCE56";
    });

    return {
      labels: labels,
      datasets: [{ label: "Registrations", data: dataPoints, backgroundColor: backgroundColors, borderWidth: 1 }],
    };
  }, [chartData, peakHour]);

  const memoizedChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: false,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: false },
          grid: { color: "#f0f0f0" },
        },
        x: {
          grid: { display: false },
        },
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
            <BarChart3 size={20} className="text-gray-600" />
            Peak Ordering Hour
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
            <BarChart3 size={20} className="text-gray-600" />
            Peak Ordering Hour
          </div>
        )}
        <div className="flex-grow flex items-center justify-center text-gray-500">{error}</div>
      </div>
    );
  }

  // Check if there's any data
  if (chartData.length === 0 || chartData.every((val) => val === 0)) {
    return (
      <div className={`${!hideTitle ? "bg-white rounded-xl border border-gray-200 p-5" : ""} w-full h-full flex flex-col`}>
        {!hideTitle && (
          <div className="flex items-center gap-2 font-semibold text-md text-gray-800 mb-4 border-b border-gray-100 pb-3">
            <BarChart3 size={20} className="text-gray-600" />
            Peak Ordering Hour
          </div>
        )}
        <div className="flex-grow flex flex-col items-center justify-center text-center">
          <p className="text-lg font-semibold text-gray-800">No registration times to show</p>
          <p className="text-sm text-gray-500 mt-2">Registration hour trends will appear once attendees start signing up.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${!hideTitle ? "bg-white rounded-xl border border-gray-200 p-5" : ""} w-full h-full flex flex-col`}>
      {!hideTitle && (
        <div className="flex items-center gap-2 font-semibold text-md text-gray-800 mb-4 border-b border-gray-100 pb-3">
          <BarChart3 size={20} className="text-gray-600" />
          Peak Ordering Hour
        </div>
      )}
      <div className="flex-grow">
        <Bar data={memoizedChartJsData} options={memoizedChartOptions} />
      </div>
    </div>
  );
};

export default PeakRegistrationHour;
