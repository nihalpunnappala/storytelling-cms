import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RowContainer } from "../../../styles/containers/styles";
import { PageHeader } from "../../../core/input/heading";
import ListTable from "../../../core/list/list";
import { useToast } from "../../../core/toast";
import { getData } from "../../../../backend/api";
import { ListTableSkeleton } from "../../../core/loader/shimmer";

const TicketResponseViewer = ({ ticketData, eventId, onClose }) => {
  const [attributes, setAttributes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const toast = useToast();
  const themeColors = useSelector((state) => state.themeColors);

  // Build attributes for the ListTable
  useEffect(() => {
    const buildAttributes = async () => {
      if (!ticketData?._id) return;
      
      setIsLoading(true);
      try {
        console.log("Building attributes for ticket:", ticketData._id);
        console.log("Event ID:", ticketData.event?._id || eventId);
        
        // Get ticket registrations with form structure - filter by specific ticket
        const formResponse = await getData({ 
          event: ticketData.event?._id || eventId,
          ticket: ticketData._id, // Add ticket filter
          type: "Ticket",
          skip: 0,
          limit: 25
        }, `ticket-registration`);
        
        console.log("Form response:", formResponse);
        
        if (formResponse.status === 200) {
          const { response: registrations } = formResponse.data;
          
          console.log("Registrations response:", registrations);
          
          // Build attributes array for the ListTable based on the first registration
          const baseAttributes = [
            {
              type: "text",
              placeholder: "Registration ID",
              name: "_id",
              label: "Registration ID",
              required: false,
              view: true,
              add: false,
              update: false,
              tag: false,
              export: true,
            },
            {
              type: "text",
              placeholder: "Full Name",
              name: "fullName",
              label: "Full Name",
              required: false,
              view: true,
              add: false,
              update: false,
              tag: true,
              export: true,
            },
            {
              type: "text",
              placeholder: "Email",
              name: "emailId",
              label: "Email",
              required: false,
              view: true,
              add: false,
              update: false,
              tag: true,
              export: true,
            },
            {
              type: "text",
              placeholder: "Phone",
              name: "authenticationId",
              label: "Phone",
              required: false,
              view: true,
              add: false,
              update: false,
              tag: true,
              export: true,
            },
            {
              type: "date",
              placeholder: "Registration Date",
              name: "createdAt",
              label: "Registration Date",
              required: false,
              view: true,
              add: false,
              update: false,
              tag: true,
              export: true,
            },
          ];

          // Note: Removed dynamic form field addition to keep table clean
          // Only showing essential registration fields

          console.log("Built attributes:", baseAttributes);
          setAttributes(baseAttributes);
        }
      } catch (error) {
        console.error("Error building attributes:", error);
        toast.error("Failed to load form structure");
      } finally {
        setIsLoading(false);
      }
    };

    buildAttributes();
  }, [ticketData?._id, ticketData?.event?._id, eventId, toast]);

  return (
    <RowContainer className="data-layout">
      {/* Content */}
      {isLoading ? (
        <ListTableSkeleton viewMode="table" tableColumnCount={5} />
      ) : (
        <ListTable
          api={`ticket-registration`}
          attributes={attributes}
          itemTitle={{ name: "fullName", type: "text", collection: "" }}
          shortName="Registration"
          addPrivilege={false}
          updatePrivilege={false}
          delPrivilege={false}
          exportPrivilege={true}
          customClass="medium"
          viewMode="table"
          showEditInDotMenu={false}
          formMode="single"
          popupMode="medium"
          popupMenu="vertical-menu"
          preFilter={{ 
            event: ticketData?.event?._id || eventId,
            ticket: ticketData?._id, // Add ticket filter
            type: "Ticket",
            skip: 0,
            limit: 25
          }}
          parents={{ 
            event: ticketData?.event?._id || eventId,
            ticket: ticketData?._id, // Add ticket filter
            type: "Ticket" 
          }}
          onDataLoaded={(data) => {
            console.log("ListTable data loaded:", data);
            console.log("API endpoint:", `ticket-registration`);
            console.log("PreFilter:", { 
              event: ticketData?.event?._id || eventId, 
              ticket: ticketData?._id,
              type: "Ticket" 
            });
          }}
        />
      )}
    </RowContainer>
  );
};

export default TicketResponseViewer;
