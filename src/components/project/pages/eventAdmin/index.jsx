import React, { useEffect, useState } from "react";
import Layout from "../../../core/layout";
import { Container } from "../../../core/layout/styels";
import { checkprivilege, privileges } from "../../brand/previliage";
import { getData, postData, putData, deleteData } from "../../../../backend/api";
import { useToast } from "../../../core/toast";

const EventAdmin = (props) => {
  useEffect(() => {
    document.title = `Event Team Management - EventHex Portal`;
  }, []);

  const toast = useToast();
  const [teamMembers, setTeamMembers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMembers, setExpandedMembers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [ticketTypes, setTicketTypes] = useState({});
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    password: "",
    assignments: [{ event: "", role: "Event Admin", tickets: [] }]
  });
  const [editingMember, setEditingMember] = useState(null);

  // Fetch team members from API
  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      const response = await getData({}, "user/eventAdmin");
      
      if (response.status === 200 && response.data.success) {
        // Transform data to match our component structure
        const transformedMembers = response.data.response.map(user => {
          console.log("Raw user data:", user); // Debug log
          
          // Handle different event data structures
          let eventTitle = "Unknown Event";
          let userRole = "Event Admin";
          let tickets = [];
          
          if (user.event) {
            // Handle both single event object and array of events
            if (Array.isArray(user.event)) {
              eventTitle = user.event[0]?.title || "Unknown Event";
            } else {
              eventTitle = user.event.title || "Unknown Event";
            }
          }
          
          // Handle userType structure - check multiple possible formats
          if (user.userType) {
            console.log("Raw userType:", user.userType, "Type:", typeof user.userType);
            
            if (typeof user.userType === 'object') {
              // If userType is an object with role property
              userRole = user.userType.role || "Event Admin";
            } else if (typeof user.userType === 'string') {
              // If userType is a string - handle hex encoding
              if (user.userType === "Ticket Admin" || user.userType === "5469636b65742041646d696e") {
                userRole = "Ticket Admin";
              } else if (user.userType === "Event Admin" || user.userType === "Event Organisor") {
                userRole = "Event Admin";
              } else {
                // Try to decode hex if it's encoded
                try {
                  const decoded = Buffer.from(user.userType, 'hex').toString('utf8');
                  console.log("Decoded userType:", decoded);
                  if (decoded === "Ticket Admin") {
                    userRole = "Ticket Admin";
                  } else if (decoded === "Event Admin" || decoded === "Event Organisor") {
                    userRole = "Event Admin";
                  }
                } catch (e) {
                  console.log("Could not decode userType:", e);
                  userRole = "Event Admin"; // Default
                }
              }
            }
          }
          
          // Also check if there's a direct role field
          if (user.role) {
            userRole = user.role === "Ticket Admin" ? "Ticket Admin" : "Event Admin";
          }
          
          // Handle ticket data
          if (user.ticket && Array.isArray(user.ticket)) {
            tickets = user.ticket;
          }
          
          console.log(`User ${user.name || user.email}: role=${userRole}, event=${eventTitle}, tickets=${tickets.length}`);
          
          return {
            id: user._id,
            name: user.name || user.email,
            email: user.email,
            initials: (user.name || user.email).split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            assignments: [{
              event: eventTitle,
              role: userRole,
              tickets: tickets
            }]
          };
        });
        
        setTeamMembers(transformedMembers);
      } else {
        toast.error("Failed to fetch team members");
      }
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast.error("Error loading team members");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available events
  const fetchEvents = async () => {
    try {
      const response = await getData({}, "event");
      
      if (response.status === 200 && response.data.success) {
        setAvailableEvents(response.data.response.map(event => ({
          id: event._id,
          title: event.title,
          ticketTypes: [] // Will be populated when event is selected
        })));
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  // Fetch ticket types for a specific event
  const fetchTicketTypes = async (eventId) => {
    try {
      const response = await getData({ event: eventId }, "ticket");
      
      if (response.status === 200 && response.data.success) {
        const tickets = response.data.response.map(ticket => ({
          id: ticket._id,
          title: ticket.title
        }));
        
        setTicketTypes(prev => ({
          ...prev,
          [eventId]: tickets
        }));
        
        // Update availableEvents with ticket types
        setAvailableEvents(prev => prev.map(event => 
          event.id === eventId 
            ? { ...event, ticketTypes: tickets }
            : event
        ));
      }
    } catch (error) {
      console.error("Error fetching ticket types:", error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchTeamMembers();
    fetchEvents();
  }, []);

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleExpanded = (memberId) => {
    setExpandedMembers(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const addEventAssignment = () => {
    setNewMember(prev => ({
      ...prev,
      assignments: [...prev.assignments, { event: "", role: "Event Admin", tickets: [] }]
    }));
  };

  const updateAssignment = (index, field, value) => {
    setNewMember(prev => ({
      ...prev,
      assignments: prev.assignments.map((assignment, i) => 
        i === index ? { ...assignment, [field]: value } : assignment
      )
    }));

    // If event is selected, fetch ticket types for that event
    if (field === 'event' && value) {
      const selectedEvent = availableEvents.find(e => e.title === value);
      if (selectedEvent && !ticketTypes[selectedEvent.id]) {
        fetchTicketTypes(selectedEvent.id);
      }
    }
  };

  const removeAssignment = (index) => {
    setNewMember(prev => ({
      ...prev,
      assignments: prev.assignments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Validate form
      if (!newMember.name || !newMember.email) {
        toast.error("Name and email are required");
        return;
      }

      if (newMember.assignments.some(assignment => !assignment.event)) {
        toast.error("Please select an event for all assignments");
        return;
      }

      // Get event IDs from event titles
      const eventIds = newMember.assignments
        .map(assignment => {
          const event = availableEvents.find(e => e.title === assignment.event);
          return event ? event.id : null;
        })
        .filter(id => id);

      if (eventIds.length === 0) {
        toast.error("Please select valid events");
        return;
      }

      // Prepare data for API based on role
      let memberData = {
        name: newMember.name,
        email: newMember.email,
        password: newMember.password,
        event: eventIds
      };

      // Determine if this is an Event Admin or Ticket Admin
      const isTicketAdmin = newMember.assignments.some(assignment => assignment.role === "Ticket Admin");
      
      if (isTicketAdmin) {
        // For Ticket Admin, we need ticket IDs
        const ticketIds = [];
        newMember.assignments.forEach(assignment => {
          if (assignment.role === "Ticket Admin" && assignment.tickets.length > 0) {
            // assignment.tickets now contains ticket IDs directly
            ticketIds.push(...assignment.tickets);
          }
        });
        
        memberData.ticket = ticketIds;
        memberData.userType = "Ticket Admin";
      } else {
        memberData.userType = "Event Admin";
      }

      console.log("Submitting member data:", memberData);

      // Use the correct endpoint based on role
      const endpoint = isTicketAdmin ? "user/ticket-admin" : "user/eventAdmin";
      const response = await postData(memberData, endpoint);
      
      // Handle both 200 and 204 status codes
      if ((response.status === 200 || response.status === 204) && response.data?.success !== false) {
        toast.success("Team member added successfully");
        setShowModal(false);
        setNewMember({ name: "", email: "", password: "", assignments: [{ event: "", role: "Event Admin", tickets: [] }] });
        fetchTeamMembers(); // Refresh the list
      } else {
        toast.error(response.data?.message || "Failed to add team member");
      }
    } catch (error) {
      console.error("Error adding team member:", error);
      toast.error("Error adding team member");
    } finally {
      setIsLoading(false);
    }
  };

  const editMember = async (member) => {
    setEditingMember(member);
    
    // Prepare assignments with proper data structure
    const assignments = member.assignments.length > 0 ? member.assignments : [{ event: "", role: "Event Admin", tickets: [] }];
    
    // Fetch ticket types for existing events if they're not already loaded
    for (const assignment of assignments) {
      if (assignment.event && assignment.role === "Ticket Admin") {
        const event = availableEvents.find(e => e.title === assignment.event);
        if (event && (!event.ticketTypes || event.ticketTypes.length === 0)) {
          await fetchTicketTypes(event.id);
        }
      }
    }
    
    const newMemberData = {
      name: member.name,
      email: member.email,
      password: "",
      assignments: assignments
    };
    
    setNewMember(newMemberData);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // Validate form
      if (!newMember.name || !newMember.email) {
        toast.error("Name and email are required");
        return;
      }

      if (newMember.assignments.some(assignment => !assignment.event)) {
        toast.error("Please select an event for all assignments");
        return;
      }

      // Get event IDs from event titles
      const eventIds = newMember.assignments
        .map(assignment => {
          const event = availableEvents.find(e => e.title === assignment.event);
          return event ? event.id : null;
        })
        .filter(id => id);

      if (eventIds.length === 0) {
        toast.error("Please select valid events");
        return;
      }

      // Prepare data for API based on role
      let memberData = {
        id: editingMember.id,
        name: newMember.name,
        email: newMember.email,
        event: eventIds // This should be an array of event IDs
      };

      // Only include password if it's provided
      if (newMember.password) {
        memberData.password = newMember.password;
      }

      // Determine if this is an Event Admin or Ticket Admin
      const isTicketAdmin = newMember.assignments.some(assignment => assignment.role === "Ticket Admin");
      
      if (isTicketAdmin) {
        // For Ticket Admin, we need ticket IDs
        const ticketIds = [];
        newMember.assignments.forEach(assignment => {
          if (assignment.role === "Ticket Admin" && assignment.tickets.length > 0) {
            // assignment.tickets now contains ticket IDs directly
            ticketIds.push(...assignment.tickets);
          }
        });
        
        memberData.ticket = ticketIds;
        memberData.userType = "Ticket Admin";
      } else {
        memberData.userType = "Event Admin";
      }

      // Always include userType in the payload
      console.log("Final memberData for update:", memberData);
      
      // Ensure we're sending the correct data structure
      // Remove any undefined or null values
      Object.keys(memberData).forEach(key => {
        if (memberData[key] === undefined || memberData[key] === null) {
          delete memberData[key];
        }
      });

      console.log("Updating member data:", memberData);

      // Use the main user endpoint for updates - it handles all user types
      let response;
      console.log("Sending update request with data:", JSON.stringify(memberData, null, 2));
      
      try {
        // Use the main user endpoint for all updates
        console.log("Using main user endpoint for update");
        response = await putData(memberData, "user");
      } catch (error) {
        console.log("PUT request failed, trying POST as fallback:", error);
        // Fallback to POST if PUT fails
        response = await postData(memberData, "user");
      }
      
      console.log("Update response:", response);
      
      // Handle both 200 and 204 status codes
      if ((response.status === 200 || response.status === 204) && response.data?.success !== false) {
        toast.success("Team member updated successfully");
        setShowEditModal(false);
        setEditingMember(null);
        setNewMember({ name: "", email: "", password: "", assignments: [{ event: "", role: "Event Admin", tickets: [] }] });
        fetchTeamMembers(); // Refresh the list
      } else {
        toast.error(response.data?.message || "Failed to update team member");
      }
    } catch (error) {
      console.error("Error updating team member:", error);
      toast.error("Error updating team member");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMember = async (memberId) => {
    try {
      console.log("Deleting member with ID:", memberId);
      
      // Use the proper deleteData function
      const response = await deleteData({ id: memberId }, "user");
      console.log("Delete response:", response);
      
      if ((response.status === 200 || response.status === 204) && response.data?.success !== false) {
        toast.success("Team member removed successfully");
        fetchTeamMembers(); // Refresh the list
      } else {
        console.error("Delete failed:", response);
        toast.error(response.data?.message || "Failed to remove team member");
      }
    } catch (error) {
      console.error("Error deleting team member:", error);
      toast.error("Error removing team member");
    }
  };

  const { userType } = props;

  return (
    <Container className="noshadow">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Event Team Management
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Seamlessly manage event and ticket administrators, assigning specific roles and ticket access.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            + Add Team Member
          </button>
          <button
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📋 Bulk Assign
          </button>
        </div>

        {/* Team Members Section */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              Team Members
            </h2>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  paddingLeft: '36px',
                  width: '250px',
                  fontSize: '14px'
                }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                🔍
              </span>
            </div>
          </div>

          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 120px', padding: '16px 24px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
            <div>MEMBER</div>
            <div>EVENT ASSIGNMENTS</div>
            <div>ACTIONS</div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              Loading team members...
            </div>
          )}

          {/* Team Members List */}
          {!isLoading && filteredMembers.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              No team members found
            </div>
          )}

          {!isLoading && filteredMembers.map((member) => (
            <div key={member.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 120px', padding: '20px 24px', alignItems: 'flex-start' }}>
                {/* Member Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#e0e7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#3730a3'
                  }}>
                    {member.initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500', color: '#1f2937' }}>{member.name}</div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>{member.email}</div>
                  </div>
                </div>

                {/* Event Assignments */}
                <div>
                  {member.assignments.slice(0, expandedMembers[member.id] ? member.assignments.length : 2).map((assignment, index) => (
                    <div key={index} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                          {assignment.event}:
                        </span>
                        <span style={{
                          backgroundColor: assignment.role === 'Event Admin' ? '#dbeafe' : '#d1fae5',
                          color: assignment.role === 'Event Admin' ? '#1d4ed8' : '#059669',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {assignment.role}
                        </span>
                      </div>
                      {assignment.tickets.length > 0 && (
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                          Tickets: {assignment.tickets.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {member.assignments.length > 2 && (
                    <button
                      onClick={() => toggleExpanded(member.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '0'
                      }}
                    >
                      Show {expandedMembers[member.id] ? 'Less' : `${member.assignments.length - 2} More...`}
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={() => editMember(member)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3b82f6',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px 0',
                      textAlign: 'left'
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => deleteMember(member.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px 0',
                      textAlign: 'left'
                    }}
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Team Member Modal */}
        {showModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Add Team Member</h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setNewMember({ name: "", email: "", password: "", assignments: [{ event: "", role: "Event Admin", tickets: [] }] });
                  }}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Name and Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                      Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={newMember.name}
                      onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                      style={{
                        width: '100%',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '10px',
                        fontSize: '14px'
                      }}
                      placeholder="Full Name"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                      Email <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                      style={{
                        width: '100%',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '10px',
                        fontSize: '14px'
                      }}
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                    Password (Optional for Edit)
                  </label>
                  <input
                    type="password"
                    value={newMember.password}
                    onChange={(e) => setNewMember(prev => ({ ...prev, password: e.target.value }))}
                    style={{
                      width: '100%',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '10px',
                      fontSize: '14px'
                    }}
                    placeholder="Enter password"
                  />
                  <div style={{ textAlign: 'right', marginTop: '6px' }}>
                    <a href="#" style={{ color: '#3b82f6', fontSize: '14px', textDecoration: 'none' }}>
                      Forgot Password?
                    </a>
                  </div>
                </div>

                {/* Event Assignments */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500' }}>
                      Assign Roles Per Event
                    </label>
                    <button
                      type="button"
                      onClick={addEventAssignment}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      + Add
                    </button>
                  </div>

                  {newMember.assignments.map((assignment, index) => (
                    <div key={index} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <select
                            value={assignment.event}
                            onChange={(e) => updateAssignment(index, 'event', e.target.value)}
                            style={{
                              width: '100%',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              padding: '8px',
                              fontSize: '14px',
                              marginBottom: '12px'
                            }}
                            required
                          >
                            <option value="">-- Select Event --</option>
                            {availableEvents.map(event => (
                              <option key={event.id} value={event.title}>{event.title}</option>
                            ))}
                          </select>

                          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="radio"
                                name={`role-${index}`}
                                value="Event Admin"
                                checked={assignment.role === 'Event Admin'}
                                onChange={(e) => updateAssignment(index, 'role', e.target.value)}
                              />
                              Event Admin
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="radio"
                                name={`role-${index}`}
                                value="Ticket Admin"
                                checked={assignment.role === 'Ticket Admin'}
                                onChange={(e) => updateAssignment(index, 'role', e.target.value)}
                              />
                              Ticket Admin
                            </label>
                          </div>

                          {assignment.role === 'Ticket Admin' && assignment.event && (
                            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', fontWeight: '500' }}>
                                Select tickets this admin can manage.
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {availableEvents.find(e => e.title === assignment.event)?.ticketTypes.map(ticket => (
                                  <label key={ticket.id} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    padding: '6px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    ':hover': { backgroundColor: '#f3f4f6' }
                                  }}>
                                    <input
                                      type="checkbox"
                                      checked={assignment.tickets.includes(ticket.id)}
                                      onChange={(e) => {
                                        const tickets = e.target.checked
                                          ? [...assignment.tickets, ticket.id]
                                          : assignment.tickets.filter(t => t !== ticket.id);
                                        updateAssignment(index, 'tickets', tickets);
                                      }}
                                      style={{ margin: 0 }}
                                    />
                                    <span style={{ fontSize: '14px', color: '#374151' }}>{ticket.title}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAssignment(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '18px',
                            marginLeft: '12px'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Form Actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setNewMember({ name: "", email: "", password: "", assignments: [{ event: "", role: "Event Admin", tickets: [] }] });
                    }}
                    style={{
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      color: '#374151',
                      borderRadius: '6px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isLoading ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Team Member Modal */}
        {showEditModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              width: '600px',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Edit Team Member</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                    setNewMember({ name: "", email: "", password: "", assignments: [{ event: "", role: "Event Admin", tickets: [] }] });
                  }}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleEditSubmit}>
                {/* Name and Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                      Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={newMember.name}
                      onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                      style={{
                        width: '100%',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '10px',
                        fontSize: '14px'
                      }}
                      placeholder="Full Name"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                      Email <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                      style={{
                        width: '100%',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '10px',
                        fontSize: '14px'
                      }}
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>
                    Password (Optional for Edit)
                  </label>
                  <input
                    type="password"
                    value={newMember.password}
                    onChange={(e) => setNewMember(prev => ({ ...prev, password: e.target.value }))}
                    style={{
                      width: '100%',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '10px',
                      fontSize: '14px'
                    }}
                    placeholder="Enter password"
                  />
                  <div style={{ textAlign: 'right', marginTop: '6px' }}>
                    <a href="#" style={{ color: '#3b82f6', fontSize: '14px', textDecoration: 'none' }}>
                      Forgot Password?
                    </a>
                  </div>
                </div>

                {/* Event Assignments */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500' }}>
                      Assign Roles Per Event
                    </label>
                    <button
                      type="button"
                      onClick={addEventAssignment}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      + Add
                    </button>
                  </div>

                  {newMember.assignments.map((assignment, index) => (
                    <div key={index} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <select
                            value={assignment.event}
                            onChange={(e) => updateAssignment(index, 'event', e.target.value)}
                            style={{
                              width: '100%',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              padding: '8px',
                              fontSize: '14px',
                              marginBottom: '12px'
                            }}
                            required
                          >
                            <option value="">-- Select Event --</option>
                            {availableEvents.map(event => (
                              <option key={event.id} value={event.title}>{event.title}</option>
                            ))}
                          </select>

                          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="radio"
                                name={`edit-role-${index}`}
                                value="Event Admin"
                                checked={assignment.role === 'Event Admin'}
                                onChange={(e) => updateAssignment(index, 'role', e.target.value)}
                              />
                              Event Admin
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="radio"
                                name={`edit-role-${index}`}
                                value="Ticket Admin"
                                checked={assignment.role === 'Ticket Admin'}
                                onChange={(e) => updateAssignment(index, 'role', e.target.value)}
                              />
                              Ticket Admin
                            </label>
                          </div>

                          {assignment.role === 'Ticket Admin' && assignment.event && (
                            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', fontWeight: '500' }}>
                                Select tickets this admin can manage.
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {availableEvents.find(e => e.title === assignment.event)?.ticketTypes.map(ticket => (
                                  <label key={ticket.id} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    padding: '6px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    ':hover': { backgroundColor: '#f3f4f6' }
                                  }}>
                                    <input
                                      type="checkbox"
                                      checked={assignment.tickets.includes(ticket.id)}
                                      onChange={(e) => {
                                        const tickets = e.target.checked
                                          ? [...assignment.tickets, ticket.id]
                                          : assignment.tickets.filter(t => t !== ticket.id);
                                        updateAssignment(index, 'tickets', tickets);
                                      }}
                                      style={{ margin: 0 }}
                                    />
                                    <span style={{ fontSize: '14px', color: '#374151' }}>{ticket.title}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAssignment(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '18px',
                            marginLeft: '12px'
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Form Actions */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingMember(null);
                      setNewMember({ name: "", email: "", password: "", assignments: [{ event: "", role: "Event Admin", tickets: [] }] });
                    }}
                    style={{
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      color: '#374151',
                      borderRadius: '6px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                      backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isLoading ? 'Updating...' : 'Update Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default Layout(EventAdmin);