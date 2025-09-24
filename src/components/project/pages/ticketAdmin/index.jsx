import React, { useEffect, useState } from "react";
import Layout from "../../../core/layout";
import { Container } from "../../../core/layout/styels";
import { checkprivilege, privileges } from "../../brand/previliage";
import { getData, postData, putData, deleteData } from "../../../../backend/api";
import { useToast } from "../../../core/toast";
import Pagination from "../../../core/list/pagination";
import ListTableSkeleton from "../../../core/loader/shimmer";

const EventTicketAdmin = (props) => {
  useEffect(() => {
    document.title = `Events & Admin Assignment - EventHex Portal`;
  }, []);

  const toast = useToast();
  const [activeTab, setActiveTab] = useState("events");
  const [events, setEvents] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventAdmins, setEventAdmins] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [newAssignment, setNewAssignment] = useState({
    member: "",
    role: "Event Admin",
  });

  // Show more/less state for administrators - Controls visibility of additional data
  const [showMoreEventAdmins, setShowMoreEventAdmins] = useState({});
  const [showMoreTicketAdmins, setShowMoreTicketAdmins] = useState({});
  const [showMoreTickets, setShowMoreTickets] = useState({});

  // Pagination state - controls current index and rows per page
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rowLimit, setRowLimit] = useState(10);

  // Fetch events and admins data
  useEffect(() => {
    fetchEventsData();
    fetchTeamMembers();
  }, []);

  // Refetch events when search term changes
  useEffect(() => {
    if (activeTab === "events") {
      fetchEventsData();
    }
  }, [searchTerm, activeTab]);

  const fetchEventsData = async () => {
    try {
      setLoading(true);

      // Fetch BOTH ticket-admins and event-admins, then merge by event
      const [ticketAdminsRes, eventAdminsRes] = await Promise.all([
        getData({ searchkey: searchTerm, skip: 0, limit: 50 }, "user/ticket-admin"),
        getData({ searchkey: searchTerm, skip: 0, limit: 50 }, "user/eventAdmin"),
      ]);

      if ((ticketAdminsRes.status === 200 || ticketAdminsRes.status === 204) && (eventAdminsRes.status === 200 || eventAdminsRes.status === 204)) {
        const eventMap = {};

        const addAdminToEvent = (admin, eventItem, roleLabel, ticketsFromAdmin) => {
          if (!eventItem || !eventItem._id) return;
          if (!eventMap[eventItem._id]) {
            eventMap[eventItem._id] = {
              id: eventItem._id,
              name: eventItem.title,
              date: eventItem.startDate || "2024-03-11",
              administrators: [],
              tickets: [],
            };
          }
          eventMap[eventItem._id].administrators.push({
            id: admin._id,
            name: admin.name || admin.email,
            email: admin.email,
            role: roleLabel,
            tickets: ticketsFromAdmin || [],
          });
        };

        const ticketAdmins = Array.isArray(ticketAdminsRes.data?.response) ? ticketAdminsRes.data.response : [];
        ticketAdmins.forEach((admin) => {
          if (Array.isArray(admin.event)) {
            admin.event.forEach((ev) => {
              const ticketsForThisEvent = Array.isArray(admin.ticket) ? admin.ticket.filter((t) => t.event === ev._id).map((t) => t.title) : [];
              addAdminToEvent(admin, ev, "Ticket Admin", ticketsForThisEvent);
            });
          }
        });

        const eventAdmins = Array.isArray(eventAdminsRes.data?.response) ? eventAdminsRes.data.response : [];
        eventAdmins.forEach((admin) => {
          if (Array.isArray(admin.event)) {
            admin.event.forEach((ev) => addAdminToEvent(admin, ev, "Event Organizer", []));
          } else if (admin.event && admin.event._id) {
            addAdminToEvent(admin, admin.event, "Event Organizer", []);
          }
        });

        // Fetch tickets per event to populate count and labels
        const eventIds = Object.keys(eventMap);
        await Promise.all(
          eventIds.map(async (eid) => {
            try {
              const ticketRes = await getData({ event: eid }, "ticket");
              if (ticketRes.status === 200 && ticketRes.data?.success) {
                eventMap[eid].tickets = (ticketRes.data.response || []).map((t) => ({ id: t._id, title: t.title }));
              }
            } catch (e) {
              console.log("Ticket fetch failed for event", eid, e);
            }
          })
        );

        setEvents(Object.values(eventMap));
      } else {
        toast.error("Failed to fetch events data");
      }
    } catch (error) {
      console.error("Error fetching events data:", error);
      toast.error("Error loading events data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // Fetch both event admins and ticket admins using proper API methods
      const [eventAdminResponse, ticketAdminResponse] = await Promise.all([
        getData({ searchkey: "", skip: 0, limit: 50 }, "user/eventAdmin"),
        getData({ searchkey: "", skip: 0, limit: 50 }, "user/ticket-admin"),
      ]);

      const allMembers = [];

      if (eventAdminResponse.status === 200 && eventAdminResponse.data?.success) {
        if (eventAdminResponse.data.response && Array.isArray(eventAdminResponse.data.response)) {
          eventAdminResponse.data.response.forEach((admin) => {
            allMembers.push({
              id: admin._id,
              name: admin.name,
              email: admin.email,
              type: "Event Admin",
            });
          });
        }
      }

      if (ticketAdminResponse.status === 200 && ticketAdminResponse.data?.success) {
        if (ticketAdminResponse.data.response && Array.isArray(ticketAdminResponse.data.response)) {
          ticketAdminResponse.data.response.forEach((admin) => {
            if (!allMembers.find((m) => m.id === admin._id)) {
              allMembers.push({
                id: admin._id,
                name: admin.name,
                email: admin.email,
                type: "Ticket Admin",
              });
            }
          });
        }
      }

      setTeamMembers(allMembers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Error loading team members");
    }
  };

  const openManageModal = async (event) => {
    console.log("Opening manage modal for event:", event);
    setSelectedEvent(event);
    setEventAdmins(event.administrators || []);
    setAvailableMembers(teamMembers.filter((member) => !event.administrators.some((admin) => admin.id === member.id)));
    setShowManageModal(true);
    console.log("Modal should now be visible");
  };

  const addNewAssignment = () => {
    if (!newAssignment.member) return;

    const member = teamMembers.find((m) => m.id === newAssignment.member);
    if (!member) return;

    const newAdmin = {
      id: member.id,
      name: member.name,
      email: member.email,
      role: newAssignment.role,
      tickets: [],
    };

    setEventAdmins([...eventAdmins, newAdmin]);
    setAvailableMembers(availableMembers.filter((m) => m.id !== member.id));
    setNewAssignment({ member: "", role: "Event Admin" });

    // Here you would make an API call to actually assign the role
    console.log("Adding assignment:", newAdmin, "to event:", selectedEvent.name);
  };

  const removeAdmin = (adminId) => {
    const adminToRemove = eventAdmins.find((admin) => admin.id === adminId);
    setEventAdmins(eventAdmins.filter((admin) => admin.id !== adminId));
    setAvailableMembers([...availableMembers, teamMembers.find((m) => m.id === adminId)]);

    // Here you would make an API call to remove the assignment
    console.log("Removing admin:", adminToRemove, "from event:", selectedEvent.name);
  };

  const filteredEvents = events.filter((event) => event.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const displayEvents = filteredEvents.slice(currentIndex, currentIndex + rowLimit);

  // Helper functions for show more/less functionality - Toggle visibility of additional administrators and tickets
  const toggleShowMoreEventAdmins = (eventId) => {
    setShowMoreEventAdmins((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const toggleShowMoreTicketAdmins = (eventId) => {
    setShowMoreTicketAdmins((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const toggleShowMoreTickets = (adminId) => {
    setShowMoreTickets((prev) => ({
      ...prev,
      [adminId]: !prev[adminId],
    }));
  };

  const { userType } = props;

  if (loading) {
    return (
      <Container className="noshadow">
        <div className="p-6">
          <ListTableSkeleton viewMode="table" />
        </div>
      </Container>
    );
  }

  return (
    <Container className="noshadow">
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        {/* Tab Navigation */}

        {activeTab === "events" && (
          <>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#1f2937", marginBottom: "8px" }}>Events & Admin Assignment</h1>
              <p style={{ color: "#6b7280", fontSize: "16px" }}>Overview of events and their assigned administrators in a list format.</p>
            </div>

            {/* Events Section */}
            <div style={{ backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
              {/* Section Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #e5e7eb" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#1f2937", margin: 0 }}>Events</h2>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      paddingLeft: "36px",
                      width: "250px",
                      fontSize: "14px",
                    }}
                  />
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>🔍</span>
                </div>
              </div>

              {/* Table Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "200px 120px 200px 200px 200px 120px",
                  padding: "16px 24px",
                  backgroundColor: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#6b7280",
                  textTransform: "uppercase",
                }}
              >
                <div>EVENT NAME</div>
                <div>DATE</div>
                <div>EVENT ADMIN</div>
                <div>TICKET ADMIN</div>
                {/* <div>TICKETS</div> */}
                <div>ACTIONS</div>
              </div>

              {/* Events List */}
              {displayEvents.map((event) => (
                <div
                  key={event.id}
                  style={{ display: "grid", gridTemplateColumns: "200px 120px 200px 200px 200px 120px", padding: "20px 24px", borderBottom: "1px solid #e5e7eb", alignItems: "center" }}
                >
                  {/* Event Name */}
                  <div style={{ fontWeight: "500", color: "#1f2937" }}>{event.name}</div>

                  {/* Date */}
                  <div style={{ fontSize: "14px", color: "#6b7280" }}>{new Date(event.date).toLocaleDateString()}</div>

                  {/* Event Admin */}
                  <div>
                    {(() => {
                      const eventAdmins = event.administrators.filter((admin) => admin.role === "Event Admin" || admin.role === "Event Organizer");
                      const showMore = showMoreEventAdmins[event.id];
                      const displayAdmins = showMore ? eventAdmins : eventAdmins.slice(0, 2);

                      return (
                        <>
                          {displayAdmins.map((admin, index) => (
                            <div key={index} style={{ marginBottom: "4px" }}>
                              <div style={{ fontWeight: "500", color: "#1f2937", fontSize: "14px" }}>{admin.name}</div>
                              <div style={{ fontSize: "12px", color: "#6b7280" }}>{admin.email}</div>
                            </div>
                          ))}
                          {eventAdmins.length > 2 && (
                            <button
                              onClick={() => toggleShowMoreEventAdmins(event.id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#3b82f6",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "500",
                                marginTop: "4px",
                                textDecoration: "underline",
                              }}
                            >
                              {showMore ? "Show Less" : `Show ${eventAdmins.length - 2} More`}
                            </button>
                          )}
                          {eventAdmins.length === 0 && <div style={{ fontSize: "12px", color: "#9ca3af", fontStyle: "italic" }}>No event admin assigned</div>}
                        </>
                      );
                    })()}
                  </div>

                  {/* Ticket Admin */}
                  <div>
                    {(() => {
                      const ticketAdmins = event.administrators.filter((admin) => admin.role === "Ticket Admin");
                      const showMore = showMoreTicketAdmins[event.id];
                      const displayAdmins = showMore ? ticketAdmins : ticketAdmins.slice(0, 2);

                      return (
                        <>
                          {displayAdmins.map((admin, index) => (
                            <div key={index} style={{ marginBottom: "8px" }}>
                              <div style={{ fontWeight: "500", color: "#1f2937", fontSize: "14px" }}>{admin.name}</div>
                              <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>{admin.email}</div>
                              {admin.tickets && admin.tickets.length > 0 && (
                                <div>
                                  <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "2px" }}>Tickets ({admin.tickets.length}):</div>
                                  <div style={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
                                    {(() => {
                                      const showMoreTicketsForAdmin = showMoreTickets[admin.id];
                                      const displayTickets = showMoreTicketsForAdmin ? admin.tickets : admin.tickets.slice(0, 3);

                                      return (
                                        <>
                                          {displayTickets.map((ticket, ticketIndex) => (
                                            <span
                                              key={ticketIndex}
                                              style={{
                                                backgroundColor: "#d1fae5",
                                                color: "#059669",
                                                padding: "1px 4px",
                                                borderRadius: "3px",
                                                fontSize: "10px",
                                              }}
                                            >
                                              {ticket}
                                            </span>
                                          ))}
                                          {admin.tickets.length > 3 && (
                                            <button
                                              onClick={() => toggleShowMoreTickets(admin.id)}
                                              style={{
                                                background: "none",
                                                border: "none",
                                                color: "#3b82f6",
                                                cursor: "pointer",
                                                fontSize: "10px",
                                                fontWeight: "500",
                                                textDecoration: "underline",
                                                padding: "1px 4px",
                                                borderRadius: "3px",
                                                backgroundColor: "#d1fae5",
                                              }}
                                            >
                                              {showMoreTicketsForAdmin ? "Show Less" : `+${admin.tickets.length - 3} more`}
                                            </button>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          {ticketAdmins.length > 2 && (
                            <button
                              onClick={() => toggleShowMoreTicketAdmins(event.id)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#3b82f6",
                                cursor: "pointer",
                                fontSize: "12px",
                                fontWeight: "500",
                                marginTop: "4px",
                                textDecoration: "underline",
                              }}
                            >
                              {showMore ? "Show Less" : `Show ${ticketAdmins.length - 2} More`}
                            </button>
                          )}
                          {ticketAdmins.length === 0 && <div style={{ fontSize: "12px", color: "#9ca3af", fontStyle: "italic" }}>No ticket admin assigned</div>}
                        </>
                      );
                    })()}
                  </div>

                  {/* Actions */}
                  <div>
                    <button
                      onClick={() => openManageModal(event)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#3b82f6",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      Manage Access
                    </button>
                  </div>
                </div>
              ))}

              {filteredEvents.length === 0 && <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>No events found matching your search.</div>}

              {filteredEvents.length > rowLimit && (
                <div style={{ padding: "16px 24px" }}>
                  <Pagination
                    totalRows={filteredEvents.length}
                    perPage={rowLimit}
                    onClick={(index, PerPage) => {
                      setRowLimit(PerPage);
                      setCurrentIndex(index);
                    }}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Manage Access Modal */}
        {showManageModal && selectedEvent && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "12px",
                width: "700px",
                maxHeight: "80vh",
                overflow: "auto",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "600", margin: 0 }}>Manage Access for {selectedEvent.name}</h3>
                <button onClick={() => setShowManageModal(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>
                  ✕
                </button>
              </div>

              {/* Current Administrators */}
              <div style={{ marginBottom: "32px" }}>
                <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>Current Administrators</h4>

                {eventAdmins.map((admin) => (
                  <div
                    key={admin.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "500", fontSize: "16px", marginBottom: "4px" }}>{admin.name}</div>
                      <span
                        style={{
                          backgroundColor: admin.role === "Event Admin" ? "#dbeafe" : "#d1fae5",
                          color: admin.role === "Event Admin" ? "#1d4ed8" : "#059669",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {admin.role}
                      </span>
                      {admin.tickets.length > 0 && (
                        <div style={{ marginTop: "8px" }}>
                          <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Tickets:</div>
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                            {(() => {
                              const showMoreTicketsForAdmin = showMoreTickets[admin.id];
                              const displayTickets = showMoreTicketsForAdmin ? admin.tickets : admin.tickets.slice(0, 5);

                              return (
                                <>
                                  {displayTickets.map((ticket, index) => (
                                    <span
                                      key={index}
                                      style={{
                                        backgroundColor: "#f3e8ff",
                                        color: "#7c3aed",
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        fontSize: "11px",
                                      }}
                                    >
                                      {ticket}
                                    </span>
                                  ))}
                                  {admin.tickets.length > 5 && (
                                    <button
                                      onClick={() => toggleShowMoreTickets(admin.id)}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "11px",
                                        fontWeight: "500",
                                        textDecoration: "underline",
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        backgroundColor: "#f3e8ff",
                                        color: "#7c3aed",
                                      }}
                                    >
                                      {showMoreTicketsForAdmin ? "Show Less" : `+${admin.tickets.length - 5} more`}
                                    </button>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        style={{
                          background: "none",
                          border: "none",
                          color: "#3b82f6",
                          cursor: "pointer",
                          fontSize: "16px",
                        }}
                      >
                        🔧
                      </button>
                      <button
                        onClick={() => removeAdmin(admin.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "16px",
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Administrator */}
              <div style={{ marginBottom: "24px" }}>
                <h4 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px" }}>Add New Administrator</h4>

                <div style={{ display: "flex", gap: "12px", alignItems: "end" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>Select Member</label>
                    <select
                      value={newAssignment.member}
                      onChange={(e) => setNewAssignment((prev) => ({ ...prev, member: e.target.value }))}
                      style={{
                        width: "100%",
                        border: "1px solid #d1d5db",
                        borderRadius: "6px",
                        padding: "10px",
                        fontSize: "14px",
                      }}
                    >
                      <option value="">-- Select Team Member --</option>
                      {availableMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}>Assign Role</label>
                    <div style={{ display: "flex", gap: "16px", marginBottom: "10px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <input
                          type="radio"
                          name="role"
                          value="Event Admin"
                          checked={newAssignment.role === "Event Admin"}
                          onChange={(e) => setNewAssignment((prev) => ({ ...prev, role: e.target.value }))}
                        />
                        Event Admin
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <input
                          type="radio"
                          name="role"
                          value="Ticket Admin"
                          checked={newAssignment.role === "Ticket Admin"}
                          onChange={(e) => setNewAssignment((prev) => ({ ...prev, role: e.target.value }))}
                        />
                        Ticket Admin
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={addNewAssignment}
                    disabled={!newAssignment.member}
                    style={{
                      backgroundColor: newAssignment.member ? "#3b82f6" : "#d1d5db",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      padding: "10px 20px",
                      fontSize: "14px",
                      cursor: newAssignment.member ? "pointer" : "not-allowed",
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Done Button */}
              <div style={{ textAlign: "right" }}>
                <button
                  onClick={() => setShowManageModal(false)}
                  style={{
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default Layout(EventTicketAdmin);
