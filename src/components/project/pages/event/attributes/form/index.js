import React from "react";
import { COMPARE_TYPES } from "../../../../../core/functions/conditions";

export const formAttributes = [
  {
    type: "text",
    placeholder: "Form Name",
    name: "title",
    validation: "",
    default: "",
    label: "Form Name",
    tag: true,
    required: true,
    view: true,
    add: true,
    update: true,
    description: { type: "text", field: "slug", collection: "" },
    render: (value, rowData, attribute, props) => {
      const formSlug =
        rowData.slug ||
        value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");

      // State to store the full URL for display
      const [fullUrl, setFullUrl] = React.useState(`/register/${formSlug}`);
      const [isLoading, setIsLoading] = React.useState(true);

      // Function to get the full URL
      const getFullUrl = async () => {
        try {
          const { getData } = await import("../../../../../../backend/api");

          getData({ event: rowData.event }, "whitelisted-Domains")
            .then((domainRes) => {
              if (domainRes.status === 200) {
                const domains = domainRes.data.response || [];
                const activeDomain = domains.find((domain) => domain.appType === "eventhex" && domain.status && (domain.verified || domain.domainType === "subdomain"));

                if (activeDomain) {
                  const websiteUrl = activeDomain.domain.includes("http") ? activeDomain.domain : `https://${activeDomain.domain}`;
                  const url = `${websiteUrl}/register/${formSlug}`;
                  setFullUrl(url);
                  setIsLoading(false);
                } else {
                  getData({ id: rowData.event }, "event/website").then((res) => {
                    if (res.status === 200 && res.data.data) {
                      const websiteUrl = res.data.data.includes("http") ? res.data.data : `https://${res.data.data}`;
                      const url = `${websiteUrl}/register/${formSlug}`;
                      setFullUrl(url);
                    } else {
                      setFullUrl(`https://example.com/register/${formSlug}`);
                    }
                    setIsLoading(false);
                  });
                }
              } else {
                setFullUrl(`https://example.com/register/${formSlug}`);
                setIsLoading(false);
              }
            })
            .catch((error) => {
              setFullUrl(`https://example.com/register/${formSlug}`);
              setIsLoading(false);
            });
        } catch (error) {
          setFullUrl(`https://example.com/register/${formSlug}`);
          setIsLoading(false);
        }
      };

      // Load the full URL on component mount
      React.useEffect(() => {
        getFullUrl();
      }, []);

      const handleCopyUrl = async (clickedButton) => {
        try {
          const { getData } = await import("../../../../../../backend/api");

          const setMessage = props?.setMessage || window.setMessage || (() => {});

          getData({ event: rowData.event }, "whitelisted-Domains")
            .then((domainRes) => {
              if (domainRes.status === 200) {
                const domains = domainRes.data.response || [];
                const activeDomain = domains.find((domain) => domain.appType === "eventhex" && domain.status && (domain.verified || domain.domainType === "subdomain"));

                if (activeDomain) {
                  const websiteUrl = activeDomain.domain.includes("http") ? activeDomain.domain : `https://${activeDomain.domain}`;
                  const fullUrl = `${websiteUrl}/register/${formSlug}`;
                  copyToClipboard(fullUrl, setMessage, clickedButton);
                } else {
                  getData({ id: rowData.event }, "event/website").then((res) => {
                    if (res.status === 200 && res.data.data) {
                      const websiteUrl = res.data.data.includes("http") ? res.data.data : `https://${res.data.data}`;
                      const fullUrl = `${websiteUrl}/register/${formSlug}`;
                      copyToClipboard(fullUrl, setMessage, clickedButton);
                    } else {
                      copyToClipboard(`https://example.com/register/${formSlug}`, setMessage, clickedButton);
                    }
                  });
                }
              } else {
                copyToClipboard(`https://example.com/register/${formSlug}`, setMessage, clickedButton);
              }
            })
            .catch((error) => {
              copyToClipboard(`https://example.com/register/${formSlug}`, setMessage, clickedButton);
            });
        } catch (error) {
          const setMessage = props?.setMessage || window.setMessage || (() => {});
          copyToClipboard(`https://example.com/register/${formSlug}`, setMessage, clickedButton);
        }
      };

      const handleNavigateUrl = async () => {
        try {
          const { getData } = await import("../../../../../../backend/api");

          getData({ event: rowData.event }, "whitelisted-Domains")
            .then((domainRes) => {
              if (domainRes.status === 200) {
                const domains = domainRes.data.response || [];
                const activeDomain = domains.find((domain) => domain.appType === "eventhex" && domain.status && (domain.verified || domain.domainType === "subdomain"));

                if (activeDomain) {
                  const websiteUrl = activeDomain.domain.includes("http") ? activeDomain.domain : `https://${activeDomain.domain}`;
                  const fullUrl = `${websiteUrl}/register/${formSlug}`;
                  window.open(fullUrl, "_blank");
                } else {
                  getData({ id: rowData.event }, "event/website").then((res) => {
                    if (res.status === 200 && res.data.data) {
                      const websiteUrl = res.data.data.includes("http") ? res.data.data : `https://${res.data.data}`;
                      const fullUrl = `${websiteUrl}/register/${formSlug}`;
                      window.open(fullUrl, "_blank");
                    } else {
                      window.open(`https://example.com/register/${formSlug}`, "_blank");
                    }
                  });
                }
              } else {
                window.open(`https://example.com/register/${formSlug}`, "_blank");
              }
            })
            .catch((error) => {
              window.open(`https://example.com/register/${formSlug}`, "_blank");
            });
        } catch (error) {
          window.open(`https://example.com/register/${formSlug}`, "_blank");
        }
      };

      const copyToClipboard = (url, setMessage, clickedButton) => {
        navigator.clipboard
          .writeText(url)
          .then(() => {
            setMessage && setMessage({ type: 1, content: "URL copied to clipboard!", proceed: "Okay", icon: "success" });

            if (clickedButton) {
              const originalContent = clickedButton.innerHTML;
              const checkSvg =
                '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5"/></svg>';
              clickedButton.innerHTML = checkSvg;
              clickedButton.style.color = "#16A34A";

              setTimeout(() => {
                clickedButton.innerHTML = originalContent;
                clickedButton.style.color = "";
              }, 2000);
            }
          })
          .catch((err) => {
            setMessage && setMessage({ type: 1, content: "Failed to copy URL to clipboard", proceed: "Okay", icon: "error" });
          });
      };

      return React.createElement(
        "div",
        null,
        React.createElement("div", { className: "font-medium text-gray-900" }, value),

        React.createElement(
          "div",
          { className: "mt-1", style: { display: "flex", alignItems: "center", gap: "6px" } },
          React.createElement(
            "span",
            {
              style: {
                fontSize: "0.75rem",
                color: "#9CA3AF",
                fontFamily: "monospace",
                backgroundColor: "#F9FAFB",
                padding: "2px 6px",
                borderRadius: "4px",
                border: "1px solid #E5E7EB",
                display: "inline-block",
                maxWidth: "300px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
            },
            fullUrl
          ),

          React.createElement(
            "div",
            { style: { position: "relative", display: "inline-flex", alignItems: "center", gap: "4px" } },
            React.createElement(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  handleCopyUrl(e.currentTarget);
                },
                style: {
                  padding: "6px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                },
                className: "text-gray-400 hover:text-blue-600 hover:bg-blue-50",
                title: "Copy URL",
              },
              React.createElement(
                "svg",
                { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                React.createElement("path", {
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  strokeWidth: "2",
                  d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z",
                })
              )
            ),
            React.createElement(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  handleNavigateUrl();
                },
                style: {
                  padding: "6px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                },
                className: "text-gray-400 hover:text-blue-600 hover:bg-blue-50",
                title: "Navigate to URL",
              },
              React.createElement(
                "svg",
                { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor" },
                React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" })
              )
            )
          )
        )
      );
    },
  },
  {
    type: "hidden",
    apiType: "CSV",
    placeholder: "Form Type",
    name: "type",
    selectApi: "Form,Ticket",
    validation: "",
    default: "Form",
    label: "Form Type",
    tag: true,
    required: false,
    view: true,
    add: true,
    update: false,
    sort: true,
    hide: true,
    statusLabel: {
      nextLine: false,
      size: "small",
      conditions: [
        {
          when: "type",
          condition: COMPARE_TYPES.EQUALS,
          compare: "Form",
          type: "string",
          label: "Form",
          icon: "form-builder",
          color: "mint",
        },
        {
          when: "type",
          condition: COMPARE_TYPES.EQUALS,
          compare: "Ticket",
          type: "string",
          label: "Ticket",
          icon: "ticket",
          color: "red",
        },
        {
          when: "type",
          condition: COMPARE_TYPES.EQUALS,
          compare: "Default",
          type: "string",
          label: "Participant Type",
          icon: "participant-type",
          color: "mint",
        },
        {
          when: "type",
          condition: COMPARE_TYPES.EQUALS,
          compare: "User-Created",
          type: "string",
          label: "Participant Type",
          icon: "participant-type",
          color: "mint",
        },
      ],
    },
  },
  {
    type: "textarea",
    placeholder: "A brief description if this a standalone form",
    name: "description",
    validation: "",
    default: "",
    label: "Description",
    required: true,
    view: true,
    add: false,
    update: true,
  },
  {
    type: "line",
    add: false,
    update: true,
  },
  {
    type: "number",
    placeholder: "No of Tickets",
    name: "numberOfTicketsToBeSold",
    validation: "",
    default: "",
    label: "No of Tickets",
    required: true,
    view: true,
    add: false,
    update: true,
    icon: "ticket",
  },
  {
    type: "line",
    add: false,
    update: true,
  },
  {
    type: "title",
    title: "Buying Limit",
    name: "sm",
    add: false,
    update: true,
  },
  {
    type: "number",
    placeholder: "Minimum",
    name: "minimumBuying",
    validation: "",
    default: "",
    label: "Minimum",
    required: true,
    view: true,
    add: false,
    update: true,
    customClass: "half",
  },
  {
    type: "number",
    placeholder: "Maximum",
    name: "maximumBuying",
    validation: "",
    default: "",
    label: "Maximum",
    required: true,
    view: true,
    add: false,
    update: true,
    customClass: "half",
  },
  {
    type: "line",
    add: false,
    update: true,
  },
  {
    type: "select",
    placeholder: "Status",
    name: "status",
    validation: "",
    tag: false,
    label: "Status",
    showItem: "Open",
    required: false,
    view: true,
    filter: false,
    add: false,
    update: true,
    apiType: "CSV",
    selectApi: "Open,Closed,Sold Out",
  },
  {
    type: "number",
    placeholder: "Sales",
    name: "bookingCount",
    validation: "",
    default: 0,
    label: "Registration Count",
    required: true, // Required if enableDiscount is true
    view: true,
    add: false,
    update: false,
    tag: true,
    sort: true,
  },
  {
    type: "datetime",
    split: true,
    placeholder: "Sales Start On",
    name: "saleStartDate",
    validation: "",
    default: "",
    tag: false,
    label: "Sales Start On",
    required: false,
    view: true,
    add: false,
    update: true,
    icon: "date",
    customClass: "full",
  },
  {
    type: "datetime",
    split: true,
    placeholder: "Live until",
    name: "saleEndDate",
    validation: "",
    default: "",
    tag: true,
    label: "Live until",
    required: false,
    view: true,
    add: false,
    update: true,
    sort: true,
    icon: "date",
    customClass: "full",
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
