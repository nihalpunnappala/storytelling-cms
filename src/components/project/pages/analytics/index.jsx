import React, { useState, useEffect } from "react";
import { TabButtons } from "../../../core/elements";
import Dashboard from "../dashboard";
import InstaSnapDashboard from "../snapDashboard";
import InstaRecapDashboard from "../recapDashboard";
import { getData } from "../../../../backend/api/index.js";
import { useToast } from "../../../core/toast/ToastContext.jsx";

const Analytics = (props) => {
  console.log("Analytics component props:", props);
  console.log("Event core modules:", props.openData?.data?.coreModules);

  const [selectedTab, setSelectedTab] = useState(1);
  const [availableTabs, setAvailableTabs] = useState([]);
  const [dashboardCountData, setDashboardCountData] = useState(null);
  const toast = useToast();

  // Fetch dashboard count data to check CHECK-IN ATTENDEE count
  useEffect(() => {
    const fetchDashboardCounts = async () => {
      if (!props.openData?.data?._id) {
        setDashboardCountData(null);
        return;
      }

      try {
        const response = await getData({ event: props.openData.data._id }, "dashboard");
        if (response.status === 200) {
          setDashboardCountData(response.data || []);
        } else {
          console.error("Failed to fetch dashboard counts:", response);
          toast.error("Failed to load dashboard statistics");
        }
      } catch (error) {
        console.error("Error fetching dashboard counts:", error);
        toast.error("Error loading dashboard statistics");
      }
    };

    fetchDashboardCounts();
  }, [props.openData?.data?._id, toast]);

  // Generate tabs based on available core modules and CHECK-IN ATTENDEE count
  useEffect(() => {
    console.log("Generating tabs based on core modules and attendance count");
    const baseTabs = [{ key: 1, title: "Registration" }];

    // Check if there are any CHECK-IN ATTENDEE records (index 5 in dashboardCountData)
    const checkInAttendeeCount = dashboardCountData?.[5]?.count || "0";
    const hasCheckInAttendees = parseInt(checkInAttendeeCount) > 0;

    console.log("CHECK-IN ATTENDEE count:", checkInAttendeeCount, "Has check-ins:", hasCheckInAttendees);

    // Only add Attendance tab if there are check-in attendees
    if (hasCheckInAttendees) {
      console.log("Adding Attendance tab");
      baseTabs.push({ key: 2, title: "Attendance" });
    } else {
      console.log("No check-in attendees found, skipping Attendance tab");
    }

    const coreModules = props.openData?.data?.coreModules || [];
    console.log("Available core modules:", coreModules);

    // Add InstaSnap tab if it's in core modules
    if (coreModules.includes("InstaSnap")) {
      console.log("Adding InstaSnap tab");
      baseTabs.push({ key: 3, title: "InstaSnap" });
    }

    // Add InstaRecap tab if it's in core modules
    if (coreModules.includes("InstaRecap")) {
      console.log("Adding InstaRecap tab");
      baseTabs.push({ key: 4, title: "InstaRecap" });
    }

    console.log("Final tabs configuration:", baseTabs);
    setAvailableTabs(baseTabs);

    // Reset selected tab if current selection is not available
    if (!baseTabs.find((tab) => tab.key === selectedTab)) {
      console.log("Resetting selected tab to first available tab");
      setSelectedTab(baseTabs[0]?.key || 1);
    }
  }, [props.openData?.data?.coreModules, selectedTab, dashboardCountData]);

  // Get the current tab key for InstaSnap and InstaRecap
  const getTabKey = (tabName) => {
    return availableTabs.find((tab) => tab.title === tabName)?.key;
  };

  const instaSnapTabKey = getTabKey("InstaSnap");
  const instaRecapTabKey = getTabKey("InstaRecap");

  console.log("Current selected tab:", selectedTab);
  console.log("InstaSnap tab key:", instaSnapTabKey);
  console.log("InstaRecap tab key:", instaRecapTabKey);

  return (
    <div className="w-full">
      <div className="mb-6">
        <TabButtons tabs={availableTabs} selectedTab={selectedTab} selectedChange={setSelectedTab} />
      </div>

      {selectedTab === 1 && <Dashboard openData={props.openData} initialTab={1} showTabs={false} />}

      {selectedTab === 2 && <Dashboard openData={props.openData} initialTab={2} showTabs={false} />}

      {selectedTab === instaSnapTabKey && <InstaSnapDashboard openData={props.openData} isFromAnalytics={true} />}

      {selectedTab === instaRecapTabKey && <InstaRecapDashboard openData={props.openData} isFromAnalytics={true} />}
    </div>
  );
};

export default Analytics;
