import React, { useState, useEffect, useCallback } from "react";
import { getData, postData, deleteData, putData } from "../../../../backend/api";
import AutoForm from "../../../core/autoform/AutoForm";
import { dateFormat, timeFormat } from "../../../core/functions/date";
import { PageHeader, SubPageHeader } from "../../../core/input/heading";
import { AddButton, Filter } from "../../../core/list/styles";
import { AddIcon, GetIcon } from "../../../../icons";
import Search from "../../../core/search";
import NoDataFound from "../../../core/list/nodata";
import moment from "moment";
import UploadAudio from "../event/uploadAudio";
import PopupView from "../../../core/popupview";
import LiveTest from "../liveTest";

// Custom Shimmer Component for Sessions Transcripts Page
const SessionsTranscriptsShimmer = () => (
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
                            <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-auto md:ml-4 mt-4 md:mt-0">
                      <div className="animate-pulse">
                        <div className="h-8 w-24 bg-gray-200 rounded"></div>
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
  const [openAudioUploadModal, setOpenAudioUploadModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [editSessionData, setEditSessionData] = useState(null);
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
    // {
    //   type: "text",
    //   name: "audioProcess",
    //   label: "Audio Process",
    //   view: true,
    //   add: false,
    //   update: true,
    //   default: "",
    //   tag: false,
    //   required: false,
    //   view: true,
    //   add: true,
    //   update: true,
    // },
  ]);
  const [avCode, setAvCode] = useState(null);
  const [goLiveOpen, setGoLiveOpen] = useState(false);
  const [translatedLanguages, setTranslatedLanguages] = useState([]);

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

  // Function to reload sessions data
  const reloadSessions = useCallback(async () => {
    if (eventId) {
      setLoading(true);
      try {
        // Reset pagination
        setSkip(0);
        setSessions([]);
        setHasMore(true);

        const response = await getData({ event: eventId }, "sessions", { limit: 10, skip: 0 });
        const transformedSessions = transformSessionData(response.data.response);
        const mainSessions = transformedSessions.filter((session) => !session.isSubSession);

        setSessions(mainSessions);
        setHasMore(response.data.response.length === 10);
      } catch (error) {
        console.error("Error reloading sessions:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [eventId]);

  // Function to fetch audio status for all sessions
  const fetchAudioStatus = useCallback(async () => {
    if (eventId && sessions.length > 0) {
      try {
        const response = await getData({ event: eventId }, "sessions/audio-status");
        if (response.data.success) {
          const audioStatus = response.data.data;

          // Update sessions with new audio status
          setSessions((prevSessions) =>
            prevSessions.map((session) => {
              const sessionId = session.id;
              if (audioStatus[sessionId]) {
                return {
                  ...session,
                  audioProcess: audioStatus[sessionId].audioProcess,
                };
              }
              return session;
            })
          );
        }
      } catch (error) {
        console.error("Error fetching audio status:", error);
        // Don't show error toast for status updates to avoid spam
      }
    }
  }, [eventId, sessions.length]);

  // Transform real session data to match expected format
  const transformSessionData = (rawSessions) => {
    return rawSessions.map((session) => {
      const startDate = new Date(session.startTime);
      const endDate = new Date(session.endTime);
      const durationMinutes = Math.round((endDate - startDate) / (1000 * 60)); // duration in minutes

      // Custom time formatter without timezone suffix
      const formatTimeWithoutTimezone = (date) => {
        if (!moment(date).isValid()) return "--";
        return moment(date).format("hh:mm A");
      };

      const mainSession = {
        id: session._id,
        title: session.title,
        type: session.sessiontype?.value || "General",
        startTime: formatTimeWithoutTimezone(session.startTime),
        duration: formatDuration(durationMinutes),
        stage: session.stage?.value || session.stage || "Main Stage",
        speakers: session.speakers || [],
        audioProcess: session.audioProcess, // Preserve audioProcess field
        // Add missing properties for grouping and sorting
        startDateTime: startDate,
        date: dateFormat(startDate),
        weekday: startDate.toLocaleDateString("en-US", { weekday: "long" }),
        sortDate: startDate,
        dateKey: startDate.toISOString().split("T")[0], // YYYY-MM-DD format for grouping
        rawData: session, // Keep raw data for editing
        isLive: session.isLive,
      };

      // Debug: Log the audioProcess value
      console.log(`Session ${session.title}: audioProcess = ${session.audioProcess}, transformed = ${mainSession.audioProcess}`);

      return mainSession;
    });
  };

  useEffect(() => {
    const fetchSessions = async () => {
      if (eventId) {
        setLoading(true);
        try {
          const response = await getData({ event: eventId }, "sessions", { limit, skip });

          const transformedSessions = transformSessionData(response.data.response);

          const mainSessions = transformedSessions.filter((session) => !session.isSubSession);

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

  useEffect(() => {
    const fetchAvCode = async () => {
      const response = await getData({ event: eventId }, "av-code");
      setAvCode(response.data.response);
      // console.log("response", response);
    };

    // console.log("eventId", eventId);
    if (eventId) {
      fetchAvCode();
    }
  }, [eventId]);

  useEffect(() => {
    const fetchTranslatedLanguages = async () => {
      try {
        const response = await getData({ event: eventId }, "instarecap-setting");
        if (response.data.success) {
          console.log("Translated languages:", response.data.response[0].translationLanguages);
          setTranslatedLanguages(response.data.response[0].translationLanguages);
        }
      } catch (error) {
        console.error("Error fetching translated languages:", error);
        toast.error("Error fetching translated languages, error: " + error);
      }
    };
    fetchTranslatedLanguages();
  }, [eventId]);

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      if (props.setMessage) {
        props.setMessage({ type: 1, content: "AV code copied to clipboard", icon: "success" });
      }
    } catch (e) {
      if (props.setMessage) {
        props.setMessage({ type: 1, content: "Failed to copy code", icon: "error" });
      }
    }
  };

  const allTypes = [...new Set(sessions.map((s) => s.type))];
  const allSpeakers = [...new Map(sessions.flatMap((s) => [...s.speakers]).map((speaker) => [speaker._id || speaker.id, speaker])).values()];

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

  // const handleEditSession = (session) => {
  //   setSelectedSession(session);
  //   const formattedData = {
  //     ...session.rawData,
  //     stage: session.rawData.stage?._id || session.rawData.stage,
  //     sessiontype: session.rawData.sessiontype?._id || session.rawData.sessiontype,
  //     speakers: session.rawData.speakers?.map((speaker) => (typeof speaker === "object" ? speaker._id || speaker.id : speaker)) || [],
  //     ticket: session.rawData.ticket?.map((ticket) => (typeof ticket === "object" ? ticket._id || ticket.id : ticket)) || [],
  //   };
  //   setEditSessionData(formattedData);
  //   setOpenEditSessionModal(true);
  // };

  const handleDeleteSession = async (sessionId) => {
    try {
      const response = await deleteData({ id: sessionId }, `sessions`);
      if (response.data.success) {
        // Show success notification for deletion
        if (props.setMessage) {
          props.setMessage({
            type: 1,
            content: "Session deleted successfully!",
            proceed: "Okay",
            icon: "success",
          });
        }

        // Reload sessions to get the latest data
        reloadSessions();
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      if (props.setMessage) {
        props.setMessage("Error deleting session");
      }
    }
  };

  const handleUploadAudio = (session) => {
    // console.log("session", session);
    const formattedSession = {
      ...session,
      _id: session._id,
    };
    setSelectedSession(formattedSession);
    setOpenAudioUploadModal(true);
  };

  const generateSessionHTML = useCallback(
    (session) => {
      const allSessionSpeakers = [...session.speakers];
      // console.log("avCode", avCode);
      // console.log("session", session);
      const sessionAvCodes = Array.isArray(avCode)
        ? Array.from(new Set(avCode.filter((item) => Array.isArray(item.assignerSessions) && item.assignerSessions.some((s) => String(s._id || s.id) === String(session.id))).map((item) => item.code)))
        : [];
      // console.log("sessionAvCodes", sessionAvCodes);

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
                    {sessionAvCodes.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {sessionAvCodes.map((code) => (
                          <button key={code} type="button" className="chip border-gray-300 text-gray-700" onClick={() => handleCopyCode(code)} title="Copy AV code">
                            <span className="mr-2">AV CODE: {code}</span>
                            <GetIcon icon="copy" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0 ml-auto md:ml-4 mt-4 md:mt-0">
                {session.audioProcess === "processed" && (
                  <button className="secondary-button text-xs py-1 px-3" onClick={() => handleUploadAudio(session)}>
                    <svg className="w-4 h-4 mr-0 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span className="hidden md:inline">View Transcript</span>
                  </button>
                )}

                {!session.audioProcess && (
                  <>
                    {session.isLive === false && (
                      <button className="secondary-button text-xs py-1 px-3" onClick={() => handleUploadAudio(session)}>
                        <svg className="w-4 h-4 mr-0 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                          />
                        </svg>
                        <span className="hidden md:inline">Upload Audio</span>
                      </button>
                    )}
                    <button
                      className="secondary-button text-xs py-1 px-3"
                      onClick={() => {
                        setGoLiveOpen(true);
                        setSelectedSession(session.id);
                      }}
                    >
                      <svg className="w-4 h-4 mr-0 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      {session.isLive === true ? <span className="hidden md:inline text-green-500">On Live</span> : <span className="hidden md:inline">Go Live</span>}
                    </button>
                  </>
                )}

                {session.audioProcess && session.audioProcess !== "processed" && <div className="chip border-gray-300 text-gray-700 text-xs py-1 px-2">{session.audioProcess}</div>}
                {/* <button className="secondary-button text-xs py-1 px-3" onClick={() => handleEditSession(session)}>
                  Edit
                </button>
                <button className="secondary-button text-xs py-1 px-3 text-red-600 hover:text-red-700" onClick={() => handleDeleteSession(session.id)}>
                  Delete
                </button> */}
              </div>
            </div>
            <div className="mt-4 md:pl-28">{generateSpeakerHTML(session.speakers)}</div>
          </div>
        </div>
      );
    },
    [generateSpeakerHTML, avCode]
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
      const allSessionSpeakers = [...session.speakers];

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

  // Periodic audio status fetching
  useEffect(() => {
    // Only start periodic fetching if we have sessions
    if (sessions.length > 0) {
      // Initial fetch
      fetchAudioStatus();

      // Set up interval to fetch every 30 seconds
      const intervalId = setInterval(fetchAudioStatus, 30000);

      // Cleanup function to clear interval
      return () => clearInterval(intervalId);
    }
  }, [sessions.length, fetchAudioStatus]);

  // Update filtered sessions when sessions change
  useEffect(() => {
    const filtered = sessions.filter((session) => {
      const allSessionSpeakers = [...session.speakers];

      const typeMatch = activeFilters.types.length === 0 || activeFilters.types.includes(session.type);
      const speakerMatch = activeFilters.speakers.length === 0 || activeFilters.speakers.some((speakerId) => allSessionSpeakers.some((speaker) => (speaker._id || speaker.id) === speakerId));
      const searchMatch = searchTerm === "" || session.title.toLowerCase().includes(searchTerm.toLowerCase());

      return typeMatch && speakerMatch && searchMatch;
    });

    setFilteredSessions(filtered);
  }, [sessions, activeFilters, searchTerm]);

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
  const formatTimeWithoutTimezone = (time) => {
    const date = new Date(time);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const handleFormSubmit = async (data, isSubSession = false) => {
    try {
      const sessionData = {
        ...data,
        event: eventId,
        speakers: data.speakers || [],
      };
      console.log("sessionData", sessionData);
      // if (isSubSession) {
      //   // This functionality is no longer needed since we're using audio upload instead
      //   console.log("Sub-session creation is deprecated, use audio upload instead");
      //   return;
      // }

      const response = await postData(sessionData, "sessions");
      if (response.data.success) {
        setOpenAddSessionModal(false);

        if (props.setMessage) {
          props.setMessage({
            type: 1,
            content: "Session created successfully!",
            proceed: "Okay",
            icon: "success",
          });
        }

        // Reload sessions to get the latest data
        reloadSessions();
      }
    } catch (error) {
      console.error("Error creating session:", error);
      if (props.setMessage) {
        props.setMessage("Error creating session");
      }
    }
  };

  const handleEditFormSubmit = async (data) => {
    try {
      const response = await putData(data, `sessions`);
      if (response.data.success) {
        setOpenEditSessionModal(false);
        setSelectedSession(null);

        if (props.setMessage) {
          props.setMessage({
            type: 1,
            content: "Session updated successfully!",
            proceed: "Okay",
            icon: "success",
          });
        }

        // Reload sessions to get the latest data
        reloadSessions();
      }
    } catch (error) {
      console.error("Error updating session:", error);
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
                        --gray-50: #F9FAFB;
                        --gray-100: #F3F4F6;
                        --gray-200: #E5E7EB;
                        --gray-300: #D1D5DB;
                        --gray-400: #9CA3AF;
                        --gray-600: #4B5563;
                        --gray-900: #111827;
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
          {sessions.length === 0 && loading && <SessionsTranscriptsShimmer />}

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
            api="sessions"
            formType="post"
            formInput={sessionFields}
            formMode="single"
            isOpenHandler={() => {
              setOpenAddSessionModal(false);
              reloadSessions();
            }}
            setLoaderBox={props.setLoaderBox}
            setMessage={props.setMessage}
            parentReference={"event"}
            referenceId={props.openData.data._id}
            onClose={() => {
              setOpenAddSessionModal(false);
              reloadSessions();
            }}
            onCancel={() => {
              setOpenAddSessionModal(false);
              reloadSessions();
            }}
            submitHandler={handleFormSubmit}
            // disabled={isSubmitting}
          />
        )}

        {/* Edit Session Modal */}
        {/* {openEditSessionModal && selectedSession && (
          <AutoForm
            header="Edit Session"
            api="sessions"
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
        )} */}

        {/* Upload Audio Modal */}
        {/* {openAudioUploadModal && selectedSession && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Upload Audio for: {selectedSession.title}
                  </h3>
                  <button
                    onClick={() => {
                      setOpenAudioUploadModal(false);
                      setSelectedSession(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <UploadAudio
                  data={{
                    _id: selectedSession.id,
                    id: selectedSession._id,
                    title: selectedSession.title,
                    type: selectedSession.type,
                    startTime: selectedSession.startTime,
                    duration: selectedSession.duration,
                    stage: selectedSession.stage,
                    speakers: selectedSession.speakers,
                    startDateTime: selectedSession.startDateTime,
                    date: selectedSession.date,
                    weekday: selectedSession.weekday,
                    sortDate: selectedSession.sortDate,
                    dateKey: selectedSession.dateKey,
                    rawData: selectedSession.rawData
                  }}
                  translatedLanguages={translatedLanguages}
                  user={props.user}
                  closeModal={() => {
                    setOpenAudioUploadModal(false);
                    setSelectedSession(null);
                  }}
                  setMessage={props.setMessage}
                  selectedAudio={null}
                />
              </div>
            </div>
          </div>
        )} */}

        {/* Live Test Modal */}
        {goLiveOpen && (
          <PopupView
            popupData={<LiveTest selectedSession={selectedSession} openData={props.openData} translatedLanguages={translatedLanguages} />}
            // themeColors={themeColors}
            closeModal={() => {
              setGoLiveOpen(false);
              reloadSessions();
            }}
            itemTitle={{ name: "Live Page", type: "text" }}
            // selectedSession={selectedSession}
            customClass={"full-page"}
            openData={{
              data: {
                _id: "live_page",
                title: "Go Live",
              },
            }}
          ></PopupView>
        )}
        {/* Upload Audio Modal */}

        {openAudioUploadModal && selectedSession && (
          <PopupView
            itemTitle={{ name: "title", type: "text", collection: "" }}
            popupData={<UploadAudio {...props} data={{ title: selectedSession.title, _id: selectedSession.id }} translatedLanguages={translatedLanguages} />}
            openData={{
              data: {
                _id: "upload_audio",
                title: "Upload Audio / " + selectedSession?.title,
              },
            }}
            customClass={"large"}
            closeModal={() => {
              setOpenAudioUploadModal(false);
              reloadSessions();
            }}
          ></PopupView>
        )}
      </div>
    </>
  );
};

export default Sessions;
