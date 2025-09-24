import React, { useState, useEffect, useCallback } from "react";
import { getData, postData, deleteData, putData } from "../../../../backend/api";
import AutoForm from "../../../../components/core/autoform/AutoForm";
import { dateFormat, timeFormat } from "../../../core/functions/date";
import { PageHeader, SubPageHeader } from "../../../core/input/heading";
import { AddButton, Filter } from "../../../core/list/styles";
import { AddIcon, GetIcon } from "../../../../icons";
import Search from "../../../core/search";
import NoDataFound from "../../../core/list/nodata";
import moment from "moment";

// Custom Shimmer Component for Sessions Page
const SessionsShimmer = () => (
  <div className="">
    <div className="mx-auto">
      {/* Header Shimmer */}
      <div className="animate-pulse mb-6">
        <div className="h-8 w-64 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-96 bg-gray-200 rounded"></div>
      </div>

      {/* Action Bar Shimmer */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 mt-4">
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="animate-pulse">
            <div className="h-10 w-20 bg-gray-200 rounded"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-10 w-48 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex items-center space-x-2 self-start md:self-center mr-0 ml-auto">
          <div className="animate-pulse">
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-10 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Sessions Shimmer */}
      <div className="space-y-8">
        {/* Day Group Shimmer */}
        <div>
          <div className="animate-pulse mb-4">
            <div className="h-6 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between">
                    <div className="flex items-center md:items-start mb-3 md:mb-0">
                      <div className="w-20 text-left md:text-center mr-4 md:mr-6 flex-shrink-0">
                        <div className="animate-pulse">
                          <div className="h-4 w-12 bg-gray-200 rounded mb-1"></div>
                          <div className="h-3 w-8 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                      <div className="w-px bg-gray-200 self-stretch hidden md:block md:mr-6"></div>
                      <div className="flex-grow">
                        <div className="animate-pulse">
                          <div className="h-5 w-64 bg-gray-200 rounded mb-2"></div>
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                            <div className="h-4 w-24 bg-gray-200 rounded"></div>
                            <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-auto md:ml-4 mt-4 md:mt-0">
                      <div className="animate-pulse">
                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                      </div>
                      <div className="animate-pulse">
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
                      </div>
                      <div className="animate-pulse">
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:pl-28">
                    <div className="animate-pulse">
                      <div className="flex items-center">
                        <div className="flex items-center -space-x-2 md:space-x-0">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="h-4 w-32 bg-gray-200 rounded ml-2"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const imageCDN = import.meta.env.VITE_CDN;
const Sessions = (props) => {
  const [currentGrouping, setCurrentGrouping] = useState("day");
  const [activeFilters, setActiveFilters] = useState({ types: [], speakers: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [eventId, setEventId] = useState(props.openData.data._id);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const limit = 10;
  const [openAddSessionModal, setOpenAddSessionModal] = useState(false);
  const [openEditSessionModal, setOpenEditSessionModal] = useState(false);
  const [openAddSubSessionModal, setOpenAddSubSessionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [editSessionData, setEditSessionData] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [sessionFields] = useState([
    {
      type: "text",
      placeholder: "Give your session a clear, descriptive name",
      name: "title",
      validation: "",
      default: "",
      label: "Session Title",
      icon: "session",
      tag: false,
      required: true,
      view: true,
      add: true,
      update: true,
    },
    {
      type: "select",
      apiType: "API",
      selectApi: "session-type/master/select",
      placeholder: "Select a session format",
      name: "sessiontype",
      validation: "",
      showItem: "value",
      default: "",
      icon: "session-input",
      tag: true,
      addNew: {
        attributes: [
          {
            type: "text",
            placeholder: "Enter Session Type",
            name: "sessionType",
            validation: "",
            default: "",
            label: "Add a session format",
            required: true,
            view: true,
            add: true,
            update: true,
            icon: "session",
          },
        ],
        api: "session-type",
        submitButtonText: "Create",
      },
      highlight: true,
      label: "Session Type",
      required: true,
      view: true,
      add: true,
      update: true,
      filter: true,
    },
    {
      type: "line",
      add: true,
      update: true,
    },
    {
      type: "datetime",
      placeholder: "Start Time",
      split: true,
      name: "startTime",
      validation: "",
      icon: "time",
      default: moment().add(1, "day").set({ hour: 9, minute: 0, second: 0 }).toDate(), // Tomorrow 9 AM,
      minDate: moment().add(1, "day").startOf("day").toDate(), // Cannot select before tomorrow 12 AM
      tag: true,
      label: "Start Time",
      required: false,
      view: true,
      add: true,
      update: true,
      customClass: "half",
    },
    {
      type: "datetime",
      placeholder: "End Time",
      split: true,
      name: "endTime",
      icon: "time",
      validation: "",
      default: moment().add(1, "day").set({ hour: 9, minute: 0, second: 0 }).toDate(), // Tomorrow 9 AM,
      minDate: moment().add(1, "day").startOf("day").toDate(), // Cannot select before tomorrow 12 AM
      tag: true,
      label: "End Time",
      required: false,
      view: true,
      add: true,
      update: true,
      customClass: "half",
    },
    {
      type: "line",
      add: true,
      update: true,
    },
    {
      type: "select",
      apiType: "API",
      selectApi: "stage/master/select",
      placeholder: "Enter session location",
      name: "stage",
      validation: "",
      showItem: "value",
      default: "",
      icon: "stage",
      addNew: {
        label: "Add stage or hall",
        attributes: [
          {
            type: "text",
            placeholder: "Enter session location",
            name: "stage",
            validation: "",
            default: "",
            label: "Stage or Hall",
            required: true,
            view: true,
            add: true,
            update: true,
          },
        ],
        api: "stage",
        submitButtonText: "Create",
      },
      label: "Stage or Hall",
      required: false,
      view: true,
      add: true,
      update: true,
      filter: true,
    },
    {
      type: "multiSelect",
      apiType: "API",
      // selectApi: `speakers/speaker-event?event=${props.openData.data._id}`,
      selectApi: `speakers/speaker-event`,
      placeholder: "Select speaker for this session",
      // updateOn: "event",
      name: "speakers",
      validation: "",
      showItem: "value",
      icon: "speakers",
      addNew: {
        label: "Add speaker",
        attributes: [
          {
            type: "text",
            placeholder: "Title",
            name: "name",
            validation: "",
            default: "",
            label: "Add a speaker",
            required: true,
            view: true,
            add: true,
            update: true,
            icon: "speakers",
          },
          {
            type: "text",
            placeholder: "Organization or Affiliation",
            name: "company",
            validation: "",
            default: "",
            label: "Company",
            tag: true,
            required: false,
            view: true,
            add: true,
            update: true,
            icon: "company",
          },
          {
            type: "text",
            placeholder: "Marketing Manager",
            name: "designation",
            validation: "",
            default: "",
            label: "Designation",
            tag: true,
            required: false,
            view: true,
            add: true,
            update: true,
            icon: "user-group",
          },
          {
            type: "image",
            placeholder: "Image",
            name: "photo",
            validation: "",
            default: "false",
            tag: false,
            label: "Profile Picture",
            sublabel: "Optional",
            required: false,
            view: true,
            add: true,
            update: true,
          },
        ],
        api: "speakers",
        submitButtonText: "Create",
      },
      default: "",
      tag: false,
      label: "Speakers",
      required: false,
      view: true,
      add: true,
      update: true,
      filter: true,
      search: true,
      footnote: "Speakers can be assigned to this session after it is created",
    },
    {
      type: "textarea",
      placeholder: "Describe session content and benefits",
      name: "description",
      validation: "",
      default: "",
      label: "Session Description",
      sublabel: "Optional",
      customClass: "full",
      tag: false,
      required: false,
      view: true,
      add: true,
      update: true,
      icon: "description",
    },
    {
      type: "select",
      placeholder: "Applicable Tickets",
      name: "ticketType",
      validation: "",
      tag: false,
      editable: true,
      label: "Who Can Attend?",
      sublabel: "",
      showItem: "",
      required: false,
      customClass: "full",
      filter: false,
      view: true,
      add: true,
      update: true,
      apiType: "JSON",
      selectType: "card",
      selectApi: [
        { value: "All Tickets", id: 0, description: "Everyone with any ticket type can join" },
        { value: "Selected Tickets & Participant types", id: 1, description: "Limit access to specific ticket types only" },
      ],
    },
    {
      type: "multiSelect",
      placeholder: "Select Tickets",
      name: "ticket",
      condition: {
        item: "ticketType",
        if: 1,
        then: "enabled",
        else: "disabled",
      },
      validation: "",
      tag: false,
      editable: true,
      label: "Select Tickets",
      showItem: "",
      required: false,
      view: true,
      filter: false,
      add: true,
      update: true,
      updateOn: "event",
      apiType: "API",
      selectApi: "ticket/event-ticket",
    },
    {
      type: "toggle",
      placeholder: "Limit Number Of Attendees",
      name: "limitNumOfAttendees",
      validation: "",
      default: "",
      label: "Limit Number Of Attendees",
      required: false,
      view: true,
      add: true,
      update: true,
    },
    {
      type: "number",
      placeholder: "Number Of Bookings",
      name: "numOfBookings",
      validation: "",
      default: 0,
      label: "Number Of Bookings",
      condition: {
        item: "limitNumOfAttendees",
        if: true,
        then: "enabled",
        else: "disabled",
      },
      required: false,
      view: true,
      add: true,
      update: true,
    },
  ]);

  useEffect(() => {
    setSkip(0);
    setSessions([]);
    setHasMore(true);
  }, [props.openData.data._id]);

  // Format duration in a user-friendly way
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      if (remainingMinutes === 0) {
        return `${hours} hr`;
      } else {
        return `${hours} hr ${remainingMinutes} min`;
      }
    }
  };

  // Transform real session data to match expected format
  const transformSessionData = (rawSessions) => {
    console.log("rawSessions", rawSessions);
    return rawSessions.map((session) => {
      console.log("session", session);
      const startDate = new Date(session.startTime);
      const endDate = new Date(session.endTime);
      const durationMinutes = Math.round((endDate - startDate) / (1000 * 60)); // duration in minutes

      // Custom time formatter without timezone suffix
      const formatTimeWithoutTimezone = (date) => {
        if (!moment(date).isValid()) return "--";
        return moment(date).format("hh:mm A");
      };

      return {
        id: session._id,
        title: session.title,
        day: session.day?.value || "Day 1", // Keep original day field for reference
        date: dateFormat(startDate),
        weekday: startDate.toLocaleDateString("en-US", { weekday: "long" }),
        startTime: formatTimeWithoutTimezone(startDate),
        duration: formatDuration(durationMinutes),
        stage: session.stage?.stage || "Main Stage", // Use dummy data if missing
        type: session.sessiontype?.value || "Session", // Use dummy data if missing
        speakers: session.speakers || [],
        subPrograms: [], // Will be populated by subsessions
        description: session.description || "",
        startDateTime: startDate, // Keep original date object for sorting
        dateKey: startDate.toISOString().split("T")[0], // YYYY-MM-DD format for grouping
        isSubSession: session.isSubSession || false,
        parentSession: session.parentSession || null,
        rawData: session, // Keep raw data for editing
        limitNumOfAttendees: session.limitNumOfAttendees || false,
        numOfBookings: session.numOfBookings || 0,
      };
    });
  };

  useEffect(() => {
    const fetchSessions = async () => {
      if (eventId) {
        setLoading(true);
        try {
          const response = await getData({ event: eventId }, "mobile/sessions", { limit, skip });

          const transformedSessions = transformSessionData(response.data.response);

          // Separate main sessions and subsessions
          const mainSessions = transformedSessions.filter((session) => !session.isSubSession);
          const subSessions = transformedSessions.filter((session) => session.isSubSession);

          // Attach subsessions to their parent sessions
          mainSessions.forEach((mainSession) => {
            mainSession.subPrograms = subSessions
              .filter((subSession) => subSession.parentSession === mainSession.id)
              .map((subSession) => ({
                id: subSession.id,
                title: subSession.title,
                startTime: subSession.startTime,
                duration: subSession.duration,
                type: subSession.type,
                speakers: subSession.speakers,
                rawData: subSession.rawData,
              }));
          });

          if (skip === 0) {
            setSessions(mainSessions);
          } else {
            setSessions((prev) => [...prev, ...mainSessions]);
          }

          // Check if there are more sessions to load
          setHasMore(response.data.response.length === limit);
        } catch (error) {
          console.error("Error fetching sessions:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchSessions();
  }, [eventId, skip]);

  const allTypes = [...new Set(sessions.map((s) => s.type))];
  const allSpeakers = [
    ...new Map(sessions.flatMap((s) => [...s.speakers, ...(s.subPrograms || []).flatMap((sp) => sp.speakers || [])]).map((speaker) => [speaker._id || speaker.id, speaker])).values(),
  ];

  const speakerImage = useCallback(
    (speaker) => {
      if (speaker.photo && speaker.photo !== "false") {
        return `${imageCDN}${speaker.photo}`;
      }
      // Fallback to random image if no photo
      const name = speaker.value || speaker.name || "Unknown";
      const isMale = (name.charCodeAt(1) || 0) % 2 === 0;
      const gender = isMale ? "men" : "women";
      const num = (name.length * 5) % 100;
      return `https://randomuser.me/api/portraits/${gender}/${num}.jpg`;
    },
    [imageCDN]
  );

  const generateSpeakerHTML = useCallback(
    (speakers) => {
      if (!speakers || speakers.length === 0) return null;

      const avatars = speakers.slice(0, 3).map((speaker, index) => {
        const speakerName = speaker.value || speaker.name || "Unknown";
        return <img key={speaker._id || speaker.id || index} className={`w-8 h-8 rounded-full border-2 border-white ${index > 0 ? "md:-ml-3" : ""}`} src={speakerImage(speaker)} alt={speakerName} />;
      });

      const names =
        speakers.length > 2
          ? `${speakers
              .slice(0, 2)
              .map((s) => s.value || s.name)
              .join(", ")}, and others`
          : speakers.map((s) => s.value || s.name).join(" & ");

      return (
        <div className="flex items-center mt-3">
          <div className="flex items-center -space-x-2 md:space-x-0">{avatars}</div>
          <span className="text-sm font-medium text-gray-800 ml-2">{names}</span>
        </div>
      );
    },
    [speakerImage]
  );

  const handleEditSession = (session) => {
    setSelectedSession(session);
    const formattedData = {
      ...session.rawData,
      stage: session.rawData.stage?._id || session.rawData.stage,
      sessiontype: session.rawData.sessiontype?._id || session.rawData.sessiontype,
      speakers: session.rawData.speakers?.map((speaker) => (typeof speaker === "object" ? speaker._id || speaker.id : speaker)) || [],
      ticket: session.rawData.ticket?.map((ticket) => (typeof ticket === "object" ? ticket._id || ticket.id : ticket)) || [],
    };
    setEditSessionData(formattedData);
    setOpenEditSessionModal(true);
  };

  const handleDeleteSession = async (sessionId, isSubSession = false) => {
    try {
      const response = await deleteData({ id: sessionId }, `mobile/sessions`);
      if (response.data.success) {
        if (isSubSession) {
          // Remove subsession from parent session
          setSessions((prevSessions) =>
            prevSessions.map((session) => ({
              ...session,
              subPrograms: session.subPrograms.filter((sub) => sub.id !== sessionId),
            }))
          );

          // Show success notification for sub-session deletion
          if (props.setMessage) {
            props.setMessage({
              type: 1,
              content: "Sub program deleted successfully!",
              proceed: "Okay",
              icon: "success",
            });
          }
        } else {
          // Remove main session from the state
          setSessions((prevSessions) => prevSessions.filter((session) => session.id !== sessionId));

          // Show success notification for deletion
          if (props.setMessage) {
            props.setMessage({
              type: 1,
              content: "Session deleted successfully!",
              proceed: "Okay",
              icon: "success",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      if (props.setMessage) {
        props.setMessage("Error deleting session");
      }
    }
  };

  const showDeleteConfirmation = (session, isSubSession = false) => {
    setSessionToDelete({ session, isSubSession });
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (sessionToDelete) {
      await handleDeleteSession(sessionToDelete.session.id, sessionToDelete.isSubSession);
      setIsDeleteModalOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleAddSubSession = (session) => {
    setSelectedSession(session);
    setOpenAddSubSessionModal(true);
  };

  const generateSubProgramHTML = useCallback(
    (subProgram) => (
      <div key={subProgram.id} className="flex items-start justify-between">
        <div className="flex items-start flex-grow">
          <div className="w-[100px] text-center mr-4 md:mr-6 flex-shrink-0">
            <p className="text-sm font-semibold text-gray-700">{subProgram.startTime}</p>
            <p className="text-xs text-gray-500">{subProgram.duration}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-800">{subProgram.title}</h4>
            <div className="chip bg-gray-100 border-gray-200 text-gray-700 mt-1.5">{subProgram.type}</div>
            {generateSpeakerHTML(subProgram.speakers)}
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-2 md:ml-4">
          <button className="secondary-button text-xs py-1 px-3" onClick={() => handleEditSession({ ...subProgram, isSubSession: true })}>
            Edit
          </button>
          <button className="secondary-button text-xs py-1 px-3 text-red-600 hover:text-red-700" onClick={() => showDeleteConfirmation(subProgram, true)}>
            Delete
          </button>
        </div>
      </div>
    ),
    [generateSpeakerHTML]
  );

  const generateSessionHTML = useCallback(
    (session) => {
      const allSessionSpeakers = [...session.speakers, ...(session.subPrograms || []).flatMap((sp) => sp.speakers || [])];

      return (
        <div key={session.id} className="session-card" data-session-id={session.id} data-type={session.type} data-speakers={JSON.stringify(allSessionSpeakers)}>
          <div className="p-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between">
              <div className="flex items-center md:items-start mb-3 md:mb-0">
                <div className="w-20 text-left md:text-center mr-4 md:mr-6 flex-shrink-0">
                  <p className="text-sm font-semibold text-primary-blue">{session.startTime}</p>
                  <p className="text-xs text-gray-500">{session.duration}</p>
                </div>
                <div className="w-px bg-gray-200 self-stretch hidden md:block md:mr-6"></div>
                <div className="flex-grow">
                  <h3 className="text-base font-semibold text-gray-900">{session.title}</h3>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      <span>{session.stage}</span>
                    </div>
                    <div className="chip bg-purple-50 border-purple-200 text-purple-700">{session.type}</div>
                    {session.limitNumOfAttendees && <div className="chip bg-green-50 border-green-200 text-green-700">Booking Enabled ({session.numOfBookings})</div>}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0 ml-auto md:ml-4 mt-4 md:mt-0">
                <button className="secondary-button text-xs py-1 px-3" onClick={() => handleAddSubSession(session)}>
                  <svg className="w-4 h-4 mr-0 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  <span className="hidden md:inline">Add Sub Program</span>
                </button>
                <button className="secondary-button text-xs py-1 px-3" onClick={() => handleEditSession(session)}>
                  Edit
                </button>
                <button className="secondary-button text-xs py-1 px-3 text-red-600 hover:text-red-700" onClick={() => showDeleteConfirmation(session, false)}>
                  Delete
                </button>
              </div>
            </div>
            <div className="mt-4 md:pl-28">{generateSpeakerHTML(session.speakers)}</div>
          </div>
          {session.subPrograms.length > 0 && (
            <div className="pl-4 pr-4 pb-4 md:pl-12 md:pr-4 md:pb-4">
              <div className="border-t border-gray-200 pt-4 mt-4 md:ml-12 space-y-4">{session.subPrograms.map(generateSubProgramHTML)}</div>
            </div>
          )}
        </div>
      );
    },
    [generateSpeakerHTML, generateSubProgramHTML]
  );

  const renderSessions = useCallback(() => {
    let groups = {};

    const sessionsToRender = filteredSessions.length > 0 || activeFilters.types.length > 0 || activeFilters.speakers.length > 0 || searchTerm ? filteredSessions : sessions;

    if (currentGrouping === "day") {
      groups = sessionsToRender.reduce((acc, session) => {
        const key = session.dateKey;
        if (!acc[key]) {
          acc[key] = {
            meta: {
              weekday: session.weekday,
              date: session.date,
              sortDate: session.startDateTime,
            },
            sessions: [],
          };
        }
        acc[key].sessions.push(session);
        return acc;
      }, {});
    } else if (currentGrouping === "stage") {
      groups = sessionsToRender.reduce((acc, session) => {
        if (!acc[session.stage]) {
          acc[session.stage] = { sessions: [] };
        }
        acc[session.stage].sessions.push(session);
        return acc;
      }, {});
    }

    const sortedGroups = Object.entries(groups);
    if (currentGrouping === "day") {
      sortedGroups.sort(([, a], [, b]) => {
        return new Date(a.meta.sortDate) - new Date(b.meta.sortDate);
      });
    }

    return sortedGroups.map(([groupKey, groupData]) => {
      let dayNumber = 1;
      if (currentGrouping === "day") {
        const allDates = sortedGroups.map(([, data]) => data.meta.sortDate);
        const sortedDates = [...allDates].sort((a, b) => new Date(a) - new Date(b));
        dayNumber = sortedDates.findIndex((date) => date.getTime() === groupData.meta.sortDate.getTime()) + 1;
      }

      return (
        <div key={groupKey}>
          <SubPageHeader title={currentGrouping === "day" ? `Day ${dayNumber}` : groupKey} description="" />
          {props.openData.data.timezone && (
            <div className="flex justify-between items-center mt-2">
              <div className="text-sm text-gray-500">{currentGrouping === "day" ? `${groupData.meta.weekday}, ${groupData.meta.date}` : ""}</div>
              <div className="text-sm text-gray-500">Timezone: {props.openData.data.timezone}</div>
            </div>
          )}
          <div className="space-y-5 mt-4">{groupData.sessions.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)).map(generateSessionHTML)}</div>
        </div>
      );
    });
  }, [currentGrouping, generateSessionHTML, sessions, filteredSessions, activeFilters, searchTerm]);

  const applyActiveFiltersAndSearch = useCallback(() => {
    const filtered = sessions.filter((session) => {
      const allSessionSpeakers = [...session.speakers, ...(session.subPrograms || []).flatMap((sp) => sp.speakers || [])];

      const typeMatch = activeFilters.types.length === 0 || activeFilters.types.includes(session.type);
      const speakerMatch = activeFilters.speakers.length === 0 || activeFilters.speakers.some((speakerId) => allSessionSpeakers.some((speaker) => (speaker._id || speaker.id) === speakerId));
      const searchMatch = searchTerm === "" || session.title.toLowerCase().includes(searchTerm.toLowerCase());

      return typeMatch && speakerMatch && searchMatch;
    });

    setFilteredSessions(filtered);
  }, [activeFilters, searchTerm, sessions]);

  const loadMoreSessions = () => {
    if (!loading && hasMore) {
      setSkip((prev) => prev + limit);
    }
  };

  useEffect(() => {
    applyActiveFiltersAndSearch();
  }, [applyActiveFiltersAndSearch]);

  const handleGroupByChange = (group) => {
    setCurrentGrouping(group);
  };

  const toggleFilterPanel = (open) => {
    setIsFilterPanelOpen(open);
  };

  const handleApplyFilters = () => {
    const typeCheckboxes = document.querySelectorAll("#type-filters input:checked");
    const speakerCheckboxes = document.querySelectorAll("#speaker-filters input:checked");

    const types = Array.from(typeCheckboxes).map((el) => el.value);
    const speakers = Array.from(speakerCheckboxes).map((el) => el.value);

    setActiveFilters({ types, speakers });
    toggleFilterPanel(false);
  };

  const handleFormSubmit = async (data, isSubSession = false) => {
    try {
      const submitData = {
        event: eventId,
        ...data,
      };

      if (isSubSession && selectedSession) {
        submitData.isSubSession = true;
        submitData.parentSession = selectedSession.id;
      }

      const response = await postData(submitData, "mobile/sessions");

      if (response.data.success) {
        if (!response.data.data) {
          if (props.setMessage) {
            props.setMessage("Invalid response from server");
          }
          return;
        }

        const newSession = transformSessionData([response.data.data])[0];

        if (!newSession || !newSession.id) {
          if (props.setMessage) {
            props.setMessage("Failed to process session data");
          }
          return;
        }

        if (isSubSession && selectedSession) {
          setSessions((prevSessions) =>
            prevSessions.map((session) =>
              session.id === selectedSession.id
                ? {
                    ...session,
                    subPrograms: [
                      ...session.subPrograms,
                      {
                        id: newSession.id,
                        title: newSession.title,
                        startTime: newSession.startTime,
                        duration: newSession.duration,
                        type: newSession.type,
                        speakers: newSession.speakers,
                        rawData: newSession,
                      },
                    ],
                  }
                : session
            )
          );
          setOpenAddSubSessionModal(false);
          setSelectedSession(null);

          if (props.setMessage) {
            props.setMessage({
              type: 1,
              content: "Sub program added successfully!",
              proceed: "Okay",
              icon: "success",
            });
          }
        } else {
          setSessions((prevSessions) => [newSession, ...prevSessions]);
          setOpenAddSessionModal(false);

          if (props.setMessage) {
            props.setMessage({
              type: 1,
              content: "Session added successfully!",
              proceed: "Okay",
              icon: "success",
            });
          }
        }
      } else {
        if (props.setMessage) {
          props.setMessage("Failed to save session");
        }
      }
    } catch (error) {
      if (props.setMessage) {
        props.setMessage("Error submitting form");
      }
    }
  };

  const handleEditFormSubmit = async (data) => {
    try {
      if (data.speakers && Array.isArray(data.speakers)) {
        data.speakers = data.speakers.map((speaker) => {
          if (typeof speaker === "object" && (speaker._id || speaker.id)) {
            return speaker._id || speaker.id;
          }
          return speaker;
        });
      }

      const submitData = {
        id: selectedSession.id,
        event: eventId,
        ...data,
      };

      const response = await putData(submitData, `mobile/sessions`);

      if (response.data.success) {
        if (!response.data.data) {
          if (props.setMessage) {
            props.setMessage("Invalid response from server");
          }
          return;
        }

        const updatedSession = transformSessionData([response.data.data])[0];

        if (!updatedSession || !updatedSession.id) {
          if (props.setMessage) {
            props.setMessage("Failed to process updated session data");
          }
          return;
        }

        if (selectedSession.isSubSession) {
          setSessions((prevSessions) =>
            prevSessions.map((session) => ({
              ...session,
              subPrograms: session.subPrograms.map((sub) =>
                sub.id === selectedSession.id
                  ? {
                      id: updatedSession.id,
                      title: updatedSession.title,
                      startTime: updatedSession.startTime,
                      duration: updatedSession.duration,
                      type: updatedSession.type,
                      speakers: updatedSession.speakers,
                      rawData: updatedSession.rawData,
                    }
                  : sub
              ),
            }))
          );
        } else {
          setSessions((prevSessions) => prevSessions.map((session) => (session.id === selectedSession.id ? { ...updatedSession, subPrograms: session.subPrograms } : session)));
        }

        setOpenEditSessionModal(false);
        setSelectedSession(null);

        if (props.setMessage) {
          props.setMessage({
            type: 1,
            content: selectedSession.isSubSession ? "Sub program updated successfully!" : "Sessions updated successfully!",
            proceed: "Okay",
            icon: "success",
          });
        }
      } else {
        if (props.setMessage) {
          props.setMessage("Failed to update session");
        }
      }
    } catch (error) {
      if (props.setMessage) {
        props.setMessage("Error updating session");
      }
    }
  };

  return (
    <>
      <style>
        {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    
                    :root {
                        --primary-blue: #4F46E5;
                        --primary-blue-hover: #4338CA;
                        --danger-red: #EF4444;
                        --danger-red-hover: #DC2626;
                        --gray-50: #F9FAFB;
                        --gray-100: #F3F4F6;
                        --gray-200: #E5E7EB;
                        --gray-300: #D1D5DB;
                        --gray-400: #9CA3AF;
                        --gray-600: #4B5563;
                        --gray-900: #111827;
                        --white: #FFFFFF;
                    }
                    
                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                        background-color: #FFFFFF;
                    }
                    
                    .primary-button {
                        background-color: var(--primary-blue);
                        color: white;
                        padding: 10px 16px;
                        border-radius: 8px;
                        font-weight: 500;
                        font-size: 14px;
                        display: inline-flex;
                        align-items: center;
                        cursor: pointer;
                        transition: background-color 0.2s;
                        justify-content: center;
                        border: none;
                    }
                    .primary-button:hover {
                        background-color: var(--primary-blue-hover);
                    }

                    .secondary-button {
                        background-color: white;
                        color: var(--gray-900);
                        padding: 8px 14px;
                        border-radius: 8px;
                        font-weight: 500;
                        font-size: 14px;
                        border: 1px solid var(--gray-200);
                        display: inline-flex;
                        align-items: center;
                        cursor: pointer;
                        transition: background-color 0.2s, border-color 0.2s;
                        justify-content: center;
                    }
                    .secondary-button:hover {
                        background-color: var(--gray-50);
                    }
                    .secondary-button.active {
                        background-color: var(--gray-100);
                        border-color: var(--gray-300);
                    }

                    .danger-button {
                        background-color: var(--danger-red);
                        color: var(--white);
                        padding: 8px 16px;
                        border-radius: 8px;
                        font-weight: 500;
                        font-size: 14px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        border: 1px solid transparent;
                        transition: background-color 0.2s;
                    }
                    .danger-button:hover {
                        background-color: var(--danger-red-hover);
                    }
                    .secondary-button.text-red-600:hover {
                        background-color: #FEF2F2;
                        border-color: #FCA5A5;
                    }

                    .chip {
                        display: inline-flex;
                        align-items: center;
                        padding: 4px 10px;
                        border-radius: 16px;
                        font-weight: 500;
                        font-size: 12px;
                        border: 1px solid;
                        flex-shrink: 0;
                    }
                    
                    .session-card {
                         background-color: #FFFFFF;
                         border: 1px solid var(--gray-200);
                         border-radius: 8px;
                         box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07);
                         transition: opacity 0.3s, transform 0.3s;
                    }
                    .session-card.hidden {
                        display: none;
                    }

                    /* Filter Panel Styles */
                    #filter-panel {
                        transition: transform 0.3s ease-in-out;
                        transform: translateX(100%);
                    }
                    #filter-panel.open {
                        transform: translateX(0);
                    }
                    .filter-overlay {
                        transition: opacity 0.3s ease-in-out;
                    }

                    /* Focus styles for accessibility */
                    .primary-button:focus,
                    .secondary-button:focus {
                        outline: 2px solid var(--primary-blue);
                        outline-offset: 2px;
                    }

                    input:focus {
                        outline: 2px solid var(--primary-blue);
                        outline-offset: 2px;
                    }

                    /* Loading spinner animation */
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    .animate-spin {
                        animation: spin 1s linear infinite;
                    }

                    /* Responsive adjustments */
                    @media (max-width: 768px) {
                        .session-card {
                            margin-bottom: 1rem;
                        }
                        
                        .primary-button,
                        .secondary-button {
                            width: 100%;
                            justify-content: center;
                        }
                    }
                `}
      </style>
      <div className="">
        <div className=" mx-auto">
          <PageHeader line={false} dynamicClass="sub inner" title="Agenda & Sessions" description="Organize your event's schedule by adding sessions, workshops, and keynotes." />
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 mt-4">
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Filter
                className={"filter-button" + (isFilterPanelOpen ? "active" : "")}
                onClick={() => {
                  toggleFilterPanel(true);
                }}
              >
                <div className="flex items-center gap-2  justify-end">
                  <GetIcon icon={"filter"} />
                  <span className="text-sm">Filter</span>
                </div>
              </Filter>
              <Search title={"Search"} placeholder="Search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center space-x-2 self-start md:self-center mr-0 ml-auto">
              <span className="text-sm font-medium text-gray-600">Group by:</span>
              <button className={`secondary-button p-2 group-by-btn ${currentGrouping === "day" ? "active" : ""}`} onClick={() => handleGroupByChange("day")}>
                Day
              </button>
              <button className={`secondary-button px-2 group-by-btn ${currentGrouping === "stage" ? "active" : ""}`} onClick={() => handleGroupByChange("stage")}>
                Stage
              </button>
            </div>
            <AddButton onClick={() => setOpenAddSessionModal(true)}>
              <AddIcon></AddIcon>
              <span>Add Session</span>
            </AddButton>
          </div>

          {/* Sessions Container */}
          <div className="space-y-8">{renderSessions()}</div>

          {/* Load More / Loader */}
          {sessions.length > 0 && (
            <div className="mt-8 text-center">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-3">
                    <div className="animate-pulse">
                      <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                    </div>
                    <span className="text-gray-600">Loading more sessions...</span>
                  </div>
                </div>
              ) : hasMore ? (
                <button onClick={loadMoreSessions} className="primary-button">
                  Load More Sessions
                </button>
              ) : (
                <p className="text-gray-500">No more sessions to load</p>
              )}
            </div>
          )}

          {/* Initial Loading State */}
          {sessions.length === 0 && loading && <SessionsShimmer />}

          {/* No Sessions Message */}
          {sessions.length === 0 && !loading && (
            // <div className="text-center py-12">
            //   <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            //     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            //   </svg>
            //   <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions</h3>
            //   <p className="mt-1 text-sm text-gray-500">Get started by creating your first session.</p>
            // </div>
            <NoDataFound
              shortName={"Sessions"}
              icon={"session"}
              addPrivilege={true}
              addLabel={"Add Session"}
              isCreatingHandler={() => setOpenAddSessionModal(true)}
              className="white-list"
              description={"Get started by creating your first session."}
            ></NoDataFound>
          )}
        </div>

        {/* Filter Panel */}
        <div className={`fixed inset-0 z-40 overflow-hidden ${isFilterPanelOpen ? "" : "pointer-events-none"}`}>
          <div
            className={`absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${isFilterPanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            onClick={() => toggleFilterPanel(false)}
          ></div>
          <div className={`absolute top-0 right-0 h-full w-full max-w-sm bg-white shadow-xl transition-transform duration-300 ${isFilterPanelOpen ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Filter Sessions</h2>
                <button className="p-2 -mr-2 text-gray-500 hover:text-gray-800" onClick={() => toggleFilterPanel(false)}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              {/* Filters */}
              <div className="p-6 flex-grow overflow-y-auto">
                <h3 className="text-sm font-medium text-gray-500 mb-2">SESSION TYPE</h3>
                <div id="type-filters" className="space-y-2">
                  {allTypes.map((type) => (
                    <label key={type} className="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" value={type} className="h-4 w-4 rounded border-gray-300 text-primary-blue focus:ring-primary-blue" defaultChecked={activeFilters.types.includes(type)} />
                      <span className="text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>

                <h3 className="text-sm font-medium text-gray-500 mt-6 mb-2">SPEAKERS</h3>
                <div id="speaker-filters" className="space-y-2">
                  {allSpeakers.map((speaker) => {
                    const speakerId = speaker._id || speaker.id;
                    const speakerName = speaker.value || speaker.name || "Unknown";
                    return (
                      <label key={speakerId} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          value={speakerId}
                          className="h-4 w-4 rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
                          defaultChecked={activeFilters.speakers.includes(speakerId)}
                        />
                        <img className="w-6 h-6 rounded-full" src={speakerImage(speaker)} alt={speakerName} />
                        <span className="text-gray-700">{speakerName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              {/* Footer */}
              <div className="p-4 border-t bg-gray-50">
                <button className="w-full primary-button justify-center" onClick={handleApplyFilters}>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add Session Modal */}
        {openAddSessionModal && (
          <AutoForm
            header="Add Session"
            api="mobile/sessions"
            formType="post"
            formInput={sessionFields}
            formMode="single"
            isOpenHandler={() => setOpenAddSessionModal(false)}
            setLoaderBox={props.setLoaderBox}
            setMessage={props.setMessage}
            parentReference={"event"}
            referenceId={props.openData.data._id}
            onClose={() => setOpenAddSessionModal(false)}
            onCancel={() => setOpenAddSessionModal(false)}
            submitHandler={handleFormSubmit}
            // disabled={isSubmitting}
          />
        )}

        {/* Edit Session Modal */}
        {openEditSessionModal && selectedSession && (
          <AutoForm
            header="Edit Session"
            api="mobile/sessions"
            formType="put"
            formInput={sessionFields}
            formMode="single"
            formValues={editSessionData}
            isOpenHandler={() => {
              setOpenEditSessionModal(false);
              setSelectedSession(null);
            }}
            setLoaderBox={props.setLoaderBox}
            setMessage={props.setMessage}
            parentReference={"event"}
            referenceId={props.openData.data._id}
            onClose={() => {
              setOpenEditSessionModal(false);
              setSelectedSession(null);
            }}
            onCancel={() => {
              setOpenEditSessionModal(false);
              setSelectedSession(null);
            }}
            submitHandler={handleEditFormSubmit}
          />
        )}

        {/* Add Sub-Session Modal */}
        {openAddSubSessionModal && selectedSession && (
          <AutoForm
            header="Add Sub-Session"
            api="mobile/sessions"
            formType="post"
            formInput={sessionFields}
            formMode="single"
            isOpenHandler={() => {
              setOpenAddSubSessionModal(false);
              setSelectedSession(null);
            }}
            setLoaderBox={props.setLoaderBox}
            setMessage={props.setMessage}
            parentReference={"event"}
            referenceId={props.openData.data._id}
            onClose={() => {
              setOpenAddSubSessionModal(false);
              setSelectedSession(null);
            }}
            onCancel={() => {
              setOpenAddSubSessionModal(false);
              setSelectedSession(null);
            }}
            submitHandler={(data) => handleFormSubmit(data, true)}
          />
        )}

        {/* Delete Confirmation Modal */}
        <div
          className={`panel-container fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 p-4 ${
            isDeleteModalOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsDeleteModalOpen(false)}
        >
          <div
            className={`bg-white rounded-lg shadow-xl w-full max-w-md p-4 md:p-6 transform transition-transform duration-200 ${isDeleteModalOpen ? "scale-100" : "scale-95"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center mb-3 md:mb-4">
              <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  ></path>
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Delete {sessionToDelete?.isSubSession ? "Sub Program" : "Session"}</h3>
              <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6">
                Are you sure you want to delete <span className="font-medium">{sessionToDelete?.session?.title}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="secondary-button text-xs md:text-sm">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} className="danger-button text-xs md:text-sm">
                Delete {sessionToDelete?.isSubSession ? "Sub Program" : "Session"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sessions;
