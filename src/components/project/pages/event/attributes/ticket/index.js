// import React from "react";
import { COMPARE_TYPES } from "../../../../../core/functions/conditions";
import moment from "moment";

export const ticketAttributes = [
  {
    type: "title",
    title: "Basic Ticket Information",
    name: "ticketDetails",
    icon: "configuration",
    add: true,
    update: true,
  },
  {
    type: "hidden",
    apiType: "CSV",
    placeholder: "Type",
    name: "type",
    selectApi: "Form,Ticket",
    validation: "",
    default: "Ticket",
    label: "Type",
    tag: false,
    required: false,
    view: true,
    add: true,
    update: true,
  },
  {
    type: "text",
    placeholder: "Early Bird,VIP Access..",
    name: "title",
    validation: "",
    default: "",
    label: "Ticket Name",
    required: true,
    view: true,
    add: true,
    update: true,
    tag: true,
    icon: "ticket",
    // description: { type: "text", field: "slug", collection: "" },
    // render: (value, rowData, attribute, props) => {
    //   const ticketSlug =
    //     rowData.slug ||
    //     value
    //       .toLowerCase()
    //       .replace(/[^a-z0-9\s-]/g, "")
    //       .replace(/\s+/g, "-")
    //       .replace(/-+/g, "-")
    //       .replace(/^-|-$/g, "");

    //   // State to store the full URL for display
    //   const [fullUrl, setFullUrl] = React.useState(`/register/${ticketSlug}`);
    //   const [isLoading, setIsLoading] = React.useState(true);

    //   // Function to get the full URL
    //   const getFullUrl = async () => {
    //     try {
    //       const { getData } = await import("../../../../../../backend/api");

    //       getData({ event: rowData.event }, "whitelisted-Domains")
    //         .then((domainRes) => {
    //           if (domainRes.status === 200) {
    //             const domains = domainRes.data.response || [];
    //             const activeDomain = domains.find((domain) => domain.appType === "eventhex" && domain.status && (domain.verified || domain.domainType === "subdomain"));

    //             if (activeDomain) {
    //               const websiteUrl = activeDomain.domain.includes("http") ? activeDomain.domain : `https://${activeDomain.domain}`;
    //               const url = `${websiteUrl}/register/${ticketSlug}`;
    //               setFullUrl(url);
    //               setIsLoading(false);
    //             } else {
    //               getData({ id: rowData.event }, "event/website").then((res) => {
    //                 if (res.status === 200 && res.data.data) {
    //                   const websiteUrl = res.data.data.includes("http") ? res.data.data : `https://${res.data.data}`;
    //                   const url = `${websiteUrl}/register/${ticketSlug}`;
    //                   setFullUrl(url);
    //                 } else {
    //                   setFullUrl(`https://example.com/register/${ticketSlug}`);
    //                 }
    //                 setIsLoading(false);
    //               });
    //             }
    //           } else {
    //             setFullUrl(`https://example.com/register/${ticketSlug}`);
    //             setIsLoading(false);
    //           }
    //         })
    //         .catch((error) => {
    //           setFullUrl(`https://example.com/register/${ticketSlug}`);
    //           setIsLoading(false);
    //         });
    //     } catch (error) {
    //       setFullUrl(`https://example.com/register/${ticketSlug}`);
    //       setIsLoading(false);
    //     }
    //   };

    //   // Load the full URL on component mount
    //   React.useEffect(() => {
    //     getFullUrl();
    //   }, []);

    //   const handleCopyUrl = async (clickedButton) => {
    //     try {
    //       const { getData } = await import("../../../../../../backend/api");

    //       const setMessage = props?.setMessage || window.setMessage || (() => {});

    //       getData({ event: rowData.event }, "whitelisted-Domains")
    //         .then((domainRes) => {
    //           if (domainRes.status === 200) {
    //             const domains = domainRes.data.response || [];
    //             const activeDomain = domains.find((domain) => domain.appType === "eventhex" && domain.status && (domain.verified || domain.domainType === "subdomain"));

    //             if (activeDomain) {
    //               const websiteUrl = activeDomain.domain.includes("http") ? activeDomain.domain : `https://${activeDomain.domain}`;
    //               const fullUrl = `${websiteUrl}/register/${ticketSlug}`;
    //               copyToClipboard(fullUrl, setMessage, clickedButton);
    //             } else {
    //               getData({ id: rowData.event }, "event/website").then((res) => {
    //                 if (res.status === 200 && res.data.data) {
    //                   const websiteUrl = res.data.data.includes("http") ? res.data.data : `https://${res.data.data}`;
    //                   const fullUrl = `${websiteUrl}/register/${ticketSlug}`;
    //                   copyToClipboard(fullUrl, setMessage, clickedButton);
    //                 } else {
    //                   copyToClipboard(`https://example.com/register/${ticketSlug}`, setMessage, clickedButton);
    //                 }
    //               });
    //             }
    //           } else {
    //             copyToClipboard(`https://example.com/register/${ticketSlug}`, setMessage, clickedButton);
    //           }
    //         })
    //         .catch((error) => {
    //           copyToClipboard(`https://example.com/register/${ticketSlug}`, setMessage, clickedButton);
    //         });
    //     } catch (error) {
    //       const setMessage = props?.setMessage || window.setMessage || (() => {});
    //       copyToClipboard(`https://example.com/register/${ticketSlug}`, setMessage, clickedButton);
    //     }
    //   };

    //   const handleNavigateUrl = async () => {
    //     try {
    //       const { getData } = await import("../../../../../../backend/api");

    //       getData({ event: rowData.event }, "whitelisted-Domains")
    //         .then((domainRes) => {
    //           if (domainRes.status === 200) {
    //             const domains = domainRes.data.response || [];
    //             const activeDomain = domains.find((domain) => domain.appType === "eventhex" && domain.status && (domain.verified || domain.domainType === "subdomain"));

    //             if (activeDomain) {
    //               const websiteUrl = activeDomain.domain.includes("http") ? activeDomain.domain : `https://${activeDomain.domain}`;
    //               const fullUrl = `${websiteUrl}/register/${ticketSlug}`;
    //               window.open(fullUrl, "_blank");
    //             } else {
    //               getData({ id: rowData.event }, "event/website").then((res) => {
    //                 if (res.status === 200 && res.data.data) {
    //                   const websiteUrl = res.data.data.includes("http") ? res.data.data : `https://${res.data.data}`;
    //                   const fullUrl = `${websiteUrl}/register/${ticketSlug}`;
    //                   window.open(fullUrl, "_blank");
    //                 } else {
    //                   window.open(`https://example.com/register/${ticketSlug}`, "_blank");
    //                 }
    //               });
    //             }
    //           } else {
    //             window.open(`https://example.com/register/${ticketSlug}`, "_blank");
    //           }
    //         })
    //         .catch((error) => {
    //           window.open(`https://example.com/register/${ticketSlug}`, "_blank");
    //         });
    //     } catch (error) {
    //       window.open(`https://example.com/register/${ticketSlug}`, "_blank");
    //     }
    //   };

    //   const copyToClipboard = (url, setMessage, clickedButton) => {
    //     navigator.clipboard
    //       .writeText(url)
    //       .then(() => {
    //         setMessage && setMessage({ type: 1, content: "URL copied to clipboard!", proceed: "Okay", icon: "success" });

    //         if (clickedButton) {
    //           const originalContent = clickedButton.innerHTML;
    //           const checkSvg =
    //             '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5"/></svg>';
    //           clickedButton.innerHTML = checkSvg;
    //           clickedButton.style.color = "#16A34A";

    //           setTimeout(() => {
    //             clickedButton.innerHTML = originalContent;
    //             clickedButton.style.color = "";
    //           }, 2000);
    //         }
    //       })
    //       .catch((err) => {
    //         setMessage && setMessage({ type: 1, content: "Failed to copy URL to clipboard", proceed: "Okay", icon: "error" });
    //       });
    //   };

    //   return React.createElement(
    //     "div",
    //     null,
    //     React.createElement("div", { className: "font-medium text-gray-900" }, value),

    //     React.createElement(
    //       "div",
    //       { className: "mt-1", style: { display: "flex", alignItems: "center", gap: "6px" } },
    //       React.createElement(
    //         "span",
    //         {
    //           style: {
    //             fontSize: "0.75rem",
    //             color: "#9CA3AF",
    //             fontFamily: "monospace",
    //             backgroundColor: "#F9FAFB",
    //             padding: "2px 6px",
    //             borderRadius: "4px",
    //             border: "1px solid #E5E7EB",
    //             display: "inline-block",
    //             maxWidth: "300px",
    //             overflow: "hidden",
    //             textOverflow: "ellipsis",
    //             whiteSpace: "nowrap",
    //           },
    //         },
    //         fullUrl
    //       ),

    //       React.createElement(
    //         "div",
    //         { style: { position: "relative", display: "inline-flex", alignItems: "center", gap: "4px" } },
    //         React.createElement(
    //           "button",
    //           {
    //             onClick: (e) => {
    //               e.stopPropagation();
    //               handleCopyUrl(e.currentTarget);
    //             },
    //             style: {
    //               padding: "6px",
    //               borderRadius: "6px",
    //               border: "none",
    //               backgroundColor: "transparent",
    //               cursor: "pointer",
    //               transition: "all 0.2s ease",
    //               display: "flex",
    //               alignItems: "center",
    //               justifyContent: "center",
    //             },
    //             className: "text-gray-400 hover:text-blue-600 hover:bg-blue-50",
    //             title: "Copy URL",
    //           },
    //           React.createElement(
    //             "svg",
    //             { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
    //             React.createElement("path", {
    //               strokeLinecap: "round",
    //               strokeLinejoin: "round",
    //               strokeWidth: "2",
    //               d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
    //             })
    //           )
    //         ),
    //         React.createElement(
    //           "button",
    //           {
    //             onClick: (e) => {
    //               e.stopPropagation();
    //               handleNavigateUrl();
    //             },
    //             style: {
    //               padding: "6px",
    //               borderRadius: "6px",
    //               border: "none",
    //               backgroundColor: "transparent",
    //               cursor: "pointer",
    //               transition: "all 0.2s ease",
    //               display: "flex",
    //               alignItems: "center",
    //               justifyContent: "center",
    //             },
    //             className: "text-gray-400 hover:text-blue-600 hover:bg-blue-50",
    //             title: "Navigate to URL",
    //           },
    //           React.createElement(
    //             "svg",
    //             { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
    //             React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" })
    //           )
    //         )
    //       )
    //     )
    //   );
    // },
  },
  {
    type: "textarea",
    placeholder: "Tell attendees what's included with this ticket",
    name: "description",
    validation: "",
    default: "",
    label: "Description",
    sublabel: "Optional",
    required: false,
    view: true,
    add: true,
    update: true,
  },
  {
    type: "image",
    placeholder: "Thumbnail Image",
    name: "thumbnail",
    validation: "",
    default: "",
    tag: false,
    label: "Ticket Thumbnail",
    sublabel: "Optional",
    required: false,
    view: true,
    add: true,
    update: true,
  },
  {
    type: "title",
    title: "Availability and Capacity",
    name: "availabilityAndCapacity",
    icon: "configuration",
    add: true,
    update: true,
  },
  {
    type: "select",
    placeholder: "Ticket Status",
    name: "status",
    validation: "",
    tag: false,
    label: "Ticket Status",
    default: "Open",
    required: false,
    view: true,
    filter: true,
    add: true,
    update: true,
    apiType: "CSV",
    selectApi: "Open,Closed,Sold Out",
    footnote: "Control whether attendees can purchase this ticket",
    icon: "ticket",
  },
  {
    type: "toggle",
    placeholder: "",
    name: "enableNumberOfTickets",
    validation: "",
    default: "",
    label: "Limit Number of Tickets",
    tag: false,
    required: false,
    view: true,
    add: true,
    update: true,
    footnote: "Enable to limit the number of tickets available. By default, it's unlimited.",
  },
  {
    type: "text",
    placeholder: "Maximum number of tickets available",
    name: "numberOfTicketsToBeSold",
    condition: {
      item: "enableNumberOfTickets",
      if: true,
      then: "enabled",
      else: "disabled",
    },
    validation: "",
    default: "",
    label: "No of Tickets",
    tag: false,
    view: true,
    required: true,
    add: true,
    update: true,
    icon: "ticket",
  },
  {
    type: "toggle",
    placeholder: "Enable Coupon Code",
    name: "enableCoupenCode",
    default: false,
    label: "Enable Coupon Code",
    required: false,
    view: true,
    add: true,
    update: true,
  },
  {
    type: "toggle",
    placeholder: "Show limit in ticket",
    name: "showLimit",
    condition: {
      item: "enableNumberOfTickets",
      if: true,
      then: "enabled",
      else: "disabled",
    },
    validation: "",
    default: 0,
    label: "Show limit in ticket",
    tag: false,
    view: true,
    add: true,
    update: true,
    icon: "ticket",
  },
  {
    type: "datetime",
    split: true,
    placeholder: "Sales Start On",
    name: "saleStartDate",
    validation: "",
    default: moment().add(1, "day").set({ hour: 9, minute: 0, second: 0 }).toDate(), // Tomorrow 9 AM,
    minDate: moment().add(1, "day").startOf("day").toDate(), // Cannot select before tomorrow 12 AM
    tag: false,
    label: "Sales Start On",
    required: false,
    view: true,
    add: true,
    update: true,
    icon: "date",
    customClass: "full",
  },
  {
    type: "datetime",
    split: true,
    placeholder: "Live until",
    name: "saleEndDate",
    statusLabel: {
      nextLine: true,
      size: "small",
      conditions: [
        {
          when: "status",
          condition: COMPARE_TYPES.EQUALS,
          compare: "Closed",
          type: "string",
          label: "Sale Closed",
          icon: "close",
          color: "beige",
        },
        {
          when: "status",
          condition: COMPARE_TYPES.EQUALS,
          compare: "Sold Out",
          type: "string",
          label: "Sold Out",
          icon: "close",
          color: "beige",
        },
        {
          when: "bookingCount",
          condition: COMPARE_TYPES.GREATER_EQUAL,
          compare: "numberOfTicketsToBeSold",
          type: "string",
          label: "Sold Out",
          icon: "close",
          color: "red",
        },
        {
          when: "currentDate",
          condition: COMPARE_TYPES.BEFORE_DATE,
          compare: "saleStartDate",
          type: "date",
          label: "Starts on {{saleStartDate}}",
          icon: "time",
          color: "gray",
        },
        {
          when: "currentDate",
          condition: COMPARE_TYPES.DATE_BETWEEN,
          type: "date",
          compare: {
            start: "saleStartDate",
            end: "saleEndDate",
          },
          label: "Sale Started",
          icon: "tick",
          color: "mint",
        },
        {
          when: "currentDate",
          condition: COMPARE_TYPES.AFTER_DATE,
          compare: "saleEndDate",
          type: "date",
          label: "Sale Closed",
          icon: "close",
          color: "beige",
        },
      ],
    },
    render: (value, rowData, attribute, props) => {
      if (!value || !moment(value).isValid()) {
        return "--";
      }
      // Format date as "MMM DD, hh:mm A" (e.g., "Sep 05, 10:00 PM") without year/timezone
      return moment(value).format("MMM DD, hh:mmA");
    },
    validation: "",
    tag: true,
    default: moment().add(1, "day").set({ hour: 9, minute: 0, second: 0 }).toDate(), // Tomorrow 9 AM
    minDate: moment().add(1, "day").startOf("day").toDate(), // Cannot select before tomorrow 12 AM
    label: "Live until",
    required: false,
    view: true,
    add: true,
    update: true,
    sort: true,
    icon: "date",
    customClass: "full",
  },
  {
    type: "toggle",
    placeholder: "",
    name: "needsApproval",
    validation: "",
    default: "",
    label: "Require Approval?",
    tag: false,
    required: false,
    view: true,
    add: true,
    update: true,
    footnote: "Review and approve each registration before confirming",
  },
  {
    type: "title",
    title: "Pricing and Purchase",
    name: "pricingAndPurchase",
    icon: "configuration",
    add: true,
    update: true,
  },
  {
    type: "hidden",
    apiType: "JSON",
    placeholder: "Free/Paid",
    name: "enablePricing",
    selectApi: "Free,Paid",
    validation: "",
    default: "Free",
    label: "Free/Paid",
    tag: true,
    required: false,
    view: true,
    add: true,
    update: false,
    hide: true,
    statusLabel: {
      nextLine: true,
      size: "small",
      conditions: [
        {
          when: "enablePricing",
          condition: COMPARE_TYPES.IS_FALSE,
          compare: false,
          type: "boolean",
          label: "Free",
          icon: "ticket",
          color: "mint",
        },
        {
          when: "enablePricing",
          condition: COMPARE_TYPES.IS_TRUE,
          compare: true,
          type: "boolean",
          label: "Paid",
          icon: "ticket",
          color: "red",
        },
      ],
    },
  },
  {
    type: "select",
    placeholder: "Ticket Price",
    name: "enablePricing",
    editable: true,
    label: "Ticket Price",
    required: false,
    customClass: "full",
    filter: false,
    tag: false,
    view: true,
    add: true,
    update: true,
    apiType: "JSON",
    selectType: "card",
    selectApi: [
      { value: "Free", id: false },
      { value: " Paid", id: true },
    ],
  },
  {
    type: "number",
    placeholder: "Price",
    name: "paymentAmount",
    condition: {
      item: "enablePricing",
      if: true,
      then: "enabled",
      else: "disabled",
    },
    displayFormat: "price",
    validation: "",
    tag: true,
    label: "Price",
    decimalPlaces: 2,
    showItem: "",
    required: true,
    view: true,
    filter: false,
    add: true,
    update: true,
    sort: true,
  },
  {
    type: "toggle",
    placeholder: "Enable Offer Price",
    name: "enableDiscount",
    condition: {
      item: "enablePricing",
      if: true,
      then: "enabled",
      else: "disabled",
    },
    default: false,
    label: "Enable Offer Price",
    required: false,
    view: true,
    add: true,
    update: true,
  },
  {
    type: "number",
    placeholder: "Offer Price",
    name: "discountValue",
    condition: {
      item: "enableDiscount",
      if: true,
      then: "enabled",
      else: "disabled",
    },
    validation: "",
    default: 0,
    decimalPlaces: 2,
    label: "Offer Price",
    required: true,
    view: true,
    add: true,
    update: true,
  },
  {
    type: "text",
    placeholder: "Offer Price Tag",
    name: "discountTag",
    validation: "",
    default: "",
    label: "Offer Price Tag",
    required: true,
    view: true,
    add: true,
    update: true,
    condition: {
      item: "enableDiscount",
      if: true,
      then: "enabled",
      else: "disabled",
    },
  },
  {
    type: "number",
    placeholder: "Offer Price Limit",
    sublabel: "No. of Tickets",
    name: "discountLimit",
    validation: "",
    default: 0,
    label: "Offer Price Limit",
    required: false,
    view: true,
    add: true,
    update: true,
    condition: {
      item: "enableDiscount",
      if: true,
      then: "enabled",
      else: "disabled",
    },
  },
  {
    type: "date",
    placeholder: "End Date for Offer Price",
    name: "discountEndDate",
    validation: "",
    default: null,
    label: "End Date for Offer Price",
    required: true,
    view: true,
    add: true,
    update: true,
    icon: "date",
    condition: {
      item: "enableDiscount",
      if: true,
      then: "enabled",
      else: "disabled",
    },
  },
  {
    type: "title",
    title: "Ticket Buying Limit",
    name: "ticketBuyingLimit",
    icon: "configuration",
    add: true,
    update: true,
    footnote: "The most tickets a customer can purchase",
  },
  {
    type: "number",
    placeholder: "Minimum",
    name: "minimumBuying",
    validation: "",
    default: "1",
    label: "Minimum",
    view: true,
    add: true,
    update: true,
    customClass: "quarter",
    icon: "minimum",
  },
  {
    type: "number",
    placeholder: "Maximum",
    name: "maximumBuying",
    validation: "",
    default: "1",
    label: "Maximum",
    view: true,
    add: true,
    update: true,
    customClass: "quarter",
    icon: "maximum",
  },
  {
    type: "select",
    placeholder: "Validity Type",
    name: "discountValidityType",
    validation: "",
    apiType: "JSON",
    icon: "date",
    selectApi: [
      { id: "endDate", value: "End Date" },
      { id: "tickets", value: "No of Tickets" },
      { id: "both", value: "End Date or Tickets" },
    ],
    default: "both",
    label: "Validity Type",
    required: true,
    view: true,
    add: true,
    update: true,
    condition: {
      item: "enableDiscount",
      if: true,
      then: "enabled",
      else: "disabled",
    },
  },
  {
    type: "toggle",
    placeholder: "Enable Tax",
    name: "enableTax",
    validation: "",
    condition: {
      item: "enablePricing",
      if: true,
      then: "enabled",
      else: "disabled",
    },
    default: "",
    label: "Enable Tax",
    tag: false,
    required: false,
    view: true,
    add: true,
    update: true,
  },
  {
    type: "number",
    placeholder: "Tax Percentage",
    name: "taxPercentage",
    validation: "",
    condition: {
      item: "enableTax",
      if: true,
      then: "enabled",
      else: "disabled",
    },
    default: true,
    tag: false,
    label: "Tax Percentage",
    required: false,
    view: true,
    add: true,
    update: true,
  },
  {
    type: "number",
    placeholder: "Sales",
    name: "bookingCount",
    validation: "",
    default: 0,
    label: "Sales",
    required: true,
    view: true,
    add: false,
    update: false,
    tag: true,
    sort: true,
  },
  {
    type: "text",
    placeholder: "Slug",
    name: "slug",
    validation: "",
    default: "",
    label: "Slug",
    tag: false,
    required: false,
    view: true,
    add: true,
    update: true,
  },
];

export const ticketCoupenAttributes = [
  {
    type: "text",
    placeholder: "eg: EARLY2025 or SPRING25",
    name: "code",
    validation: "",
    default: "",
    label: "Coupon Code",
    group: "Coupon",
    tag: true,
    required: true,
    view: true,
    add: true,
    update: true,
    icon: "coupon",
    statusLabel: {
      nextLine: false,
      size: "small",
      conditions: [
        {
          // Sold Out - highest priority
          when: "isActive",
          condition: COMPARE_TYPES.IS_TRUE,
          compare: "true",
          type: "boolean",
          label: "Live",
          icon: "tick",
          color: "mint",
        },
        {
          when: "currentDate",
          condition: COMPARE_TYPES.IS_FALSE,
          compare: "false",
          type: "boolean",
          label: "Paused  ",
          icon: "time",
          color: "gray",
        },
      ],
    },
    footnote: "Enter a unique code that attendees will use during checkout",
  },
  {
    type: "select",
    apiType: "CSV",
    selectApi: "Percentage,Fixed Amount",
    placeholder: "Discount Type",
    name: "type",
    validation: "",
    tag: true,
    label: "Discount Type",
    group: "Coupon",
    default: "Percentage",
    required: true,
    view: true,
    filter: false,
    add: true,
    update: true,
    icon: "percentage",
  },
  {
    type: "number",
    placeholder: "Discount  Value",
    name: "value",
    validation: "",
    default: "",
    label: "Discount  Value",
    group: "Coupon",
    tag: true,
    required: true,
    view: true,
    add: true,
    update: true,
    icon: "discount",
  },
  {
    type: "number",
    placeholder: "Max Usage",
    name: "usageLimit",
    validation: "",
    default: "",
    label: "Max Usage",
    group: "Limits",
    tag: true,
    view: true,
    add: true,
    update: true,
    footnote: "Limit how many times this code can be used (leave empty for unlimited)",
    icon: "maximum",
  },

  {
    type: "date",
    placeholder: "Valid From",
    name: "startDate",
    validation: "",
    default: "",
    label: "Valid From",
    group: "Validity",
    required: false,
    view: true,
    add: true,
    update: true,
    icon: "date",
    customClass: "half",
  },
  {
    type: "time",
    placeholder: "Time",
    name: "startDate",
    validation: "",
    default: "",
    label: "Time",
    group: "Validity",
    required: false,
    view: true,
    add: true,
    update: true,
    icon: "date",
    customClass: "half",
  },
  {
    type: "date",
    placeholder: "Valid Until",
    name: "endDate",
    validation: "",
    default: "",
    label: "Valid Until",
    group: "Validity",
    required: false,
    view: true,
    add: true,
    update: true,
    icon: "date",
    customClass: "half",
  },
  {
    type: "datetime",
    placeholder: "Valid Until",
    name: "endDate",
    validation: "",
    default: "",
    label: "Valid Until",
    group: "Validity",
    tag: true,
    required: false,
    view: true,
    add: false,
    update: false,
    icon: "date",
    customClass: "half",
  },
  {
    type: "time",
    placeholder: "Time",
    name: "endDate",
    validation: "",
    default: "",
    label: "Time",
    group: "Validity",
    required: false,
    view: true,
    add: true,
    update: true,
    icon: "date",
    customClass: "half",
  },

  {
    type: "select",
    placeholder: "Applicable Tickets",
    name: "availability",
    validation: "",
    tag: true,
    editable: true,
    label: "Applicable Tickets",
    group: "Scope",
    sublabel: "",
    showItem: "",
    required: true,
    customClass: "full",
    filter: false,
    view: true,
    add: true,
    update: true,
    apiType: "JSON",
    selectType: "card",
    selectApi: [
      { value: "All Tickets", id: "All" },
      { value: "Selected Tickets", id: "Selected" },
    ],
  },
  {
    type: "multiSelect",
    apiType: "API",
    selectApi: "ticket/event-ticket",
    updateOn: "event",
    // collection: "ticket",
    placeholder: "Tickets",
    name: "tickets",
    condition: {
      item: "availability",
      if: "Selected",
      then: "enabled",
      else: "disabled",
    },
    showItem: "title",
    validation: "",
    default: "",
    tag: false,
    label: "Tickets",
    group: "Scope",
    required: true,
    view: true,
    add: true,
    update: true,
    filter: false,
  },
];
