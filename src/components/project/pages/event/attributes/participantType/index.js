import React from "react";
import { COMPARE_TYPES } from "../../../../../core/functions/conditions";
import { Toggle } from "../../../../../core/elements";

export const participantTypeAttributes = [
  {
    type: "text",
    placeholder: "Name",
    name: "name",
    validation: "",
    default: "",
    tag: true,
    label: "Name",
    required: false,
    view: true,
    add: true,
    update: true,
    icon: "name",
    description: { type: "text", field: "slug", collection: "" },
    render: (value, rowData, attribute, props) => {
      const participantSlug =
        rowData.slug ||
        value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");

      // State to store the full URL for display
      const [fullUrl, setFullUrl] = React.useState(`/register/${participantSlug}`);
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
                  const url = `${websiteUrl}/register/${participantSlug}`;
                  setFullUrl(url);
                  setIsLoading(false);
                } else {
                  getData({ id: rowData.event }, "event/website").then((res) => {
                    if (res.status === 200 && res.data.data) {
                      const websiteUrl = res.data.data.includes("http") ? res.data.data : `https://${res.data.data}`;
                      const url = `${websiteUrl}/register/${participantSlug}`;
                      setFullUrl(url);
                    } else {
                      setFullUrl(`https://example.com/register/${participantSlug}`);
                    }
                    setIsLoading(false);
                  });
                }
              } else {
                setFullUrl(`https://example.com/register/${participantSlug}`);
                setIsLoading(false);
              }
            })
            .catch((error) => {
              setFullUrl(`https://example.com/register/${participantSlug}`);
              setIsLoading(false);
            });
        } catch (error) {
          setFullUrl(`https://example.com/register/${participantSlug}`);
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
                  const fullUrl = `${websiteUrl}/register/${participantSlug}`;
                  copyToClipboard(fullUrl, setMessage, clickedButton);
                } else {
                  getData({ id: rowData.event }, "event/website").then((res) => {
                    if (res.status === 200 && res.data.data) {
                      const websiteUrl = res.data.data.includes("http") ? res.data.data : `https://${res.data.data}`;
                      const fullUrl = `${websiteUrl}/register/${participantSlug}`;
                      copyToClipboard(fullUrl, setMessage, clickedButton);
                    } else {
                      copyToClipboard(`https://example.com/register/${participantSlug}`, setMessage, clickedButton);
                    }
                  });
                }
              } else {
                copyToClipboard(`https://example.com/register/${participantSlug}`, setMessage, clickedButton);
              }
            })
            .catch((error) => {
              copyToClipboard(`https://example.com/register/${participantSlug}`, setMessage, clickedButton);
            });
        } catch (error) {
          const setMessage = props?.setMessage || window.setMessage || (() => {});
          copyToClipboard(`https://example.com/register/${participantSlug}`, setMessage, clickedButton);
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
                  const fullUrl = `${websiteUrl}/register/${participantSlug}`;
                  window.open(fullUrl, "_blank");
                } else {
                  getData({ id: rowData.event }, "event/website").then((res) => {
                    if (res.status === 200 && res.data.data) {
                      const websiteUrl = res.data.data.includes("http") ? res.data.data : `https://${res.data.data}`;
                      const fullUrl = `${websiteUrl}/register/${participantSlug}`;
                      window.open(fullUrl, "_blank");
                    } else {
                      window.open(`https://example.com/register/${participantSlug}`, "_blank");
                    }
                  });
                }
              } else {
                window.open(`https://example.com/register/${participantSlug}`, "_blank");
              }
            })
            .catch((error) => {
              window.open(`https://example.com/register/${participantSlug}`, "_blank");
            });
        } catch (error) {
          window.open(`https://example.com/register/${participantSlug}`, "_blank");
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
    apiType: "JSON",
    placeholder: "Type",
    name: "type",
    selectApi: "Default,User-Created",
    validation: "",
    default: "User-Created",
    label: "Type",
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
          when: "type",
          condition: COMPARE_TYPES.EQUALS,
          compare: "Default",
          type: "string",
          label: "Default",
          icon: "participant-type",
          color: "mint",
        },
        {
          when: "type",
          condition: COMPARE_TYPES.EQUALS,
          compare: "User-Created",
          type: "string",
          label: "User-Created",
          icon: "participant-type",
          color: "red",
        },
      ],
    },
  },
  {
    type: "hidden",
    apiType: "CSV",
    placeholder: "Status",
    name: "status",
    validation: "",
    default: true,
    label: "Status",
    tag: true,
    required: false,
    view: true,
    add: true,
    update: false,
    hide: false,
    render: (value, rowData, attribute, props) => {
      const StatusToggle = () => {
        let initialStatus;
        if (typeof value === "string") {
          initialStatus = value === "true" || value === "1" || value === "enabled";
        } else if (typeof value === "boolean") {
          initialStatus = value;
        } else if (typeof value === "number") {
          initialStatus = value === 1;
        } else {
          initialStatus = Boolean(value);
        }

        const [currentStatus, setCurrentStatus] = React.useState(initialStatus);
        const [isLoading, setIsLoading] = React.useState(false);

        const handleToggle = async (e) => {
          if (e && e.stopPropagation) {
            e.stopPropagation();
          }

          if (isLoading) return;

          const newStatus = !currentStatus;

          setCurrentStatus(newStatus);
          setIsLoading(true);

          try {
            const { putData } = await import("../../../../../../backend/api");

            const setLoaderBox = props?.setLoaderBox || window.setLoaderBox || (() => {});
            const setMessage = props?.setMessage || window.setMessage || (() => {});
            const refreshView = props?.refreshView || window.refreshView || (() => {});

            const apiPayload = { id: rowData._id, status: newStatus };

            const response = await putData(apiPayload, "participant-type");
            if (response && response.status === 200) {
              rowData.status = newStatus;

              if (refreshView && typeof refreshView === "function") {
                setTimeout(() => refreshView(), 100);
              }
            } else {
              setCurrentStatus(currentStatus);
              setMessage({ type: 1, content: `Failed to ${newStatus ? "enable" : "disable"} participant type. Please try again.`, proceed: "Okay", icon: "error" });
            }
          } catch (error) {
            setCurrentStatus(currentStatus);

            const setMessage = props?.setMessage || window.setMessage || (() => {});
            setMessage({ type: 1, content: "Failed to update status", proceed: "Okay", icon: "error" });
          } finally {
            setIsLoading(false);
          }
        };

        return React.createElement(
          "div",
          { onClick: (e) => e.stopPropagation(), style: { display: "inline-block" } },
          React.createElement(Toggle, {
            isEnabled: currentStatus,
            onToggle: handleToggle,
            size: "default",
            disabled: isLoading,
            title: currentStatus ? "Disable participant type" : "Enable participant type",
            style: { backgroundColor: currentStatus ? "#FF5F4A" : "#EF4444" },
          })
        );
      };

      return React.createElement(StatusToggle);
    },
    statusLabel: {
      nextLine: false,
      size: "small",
      conditions: [
        {
          when: "status",
          condition: COMPARE_TYPES.IS_TRUE,
          compare: true,
          type: "boolean",
          label: "Enabled",
          icon: "checked",
          color: "mint",
        },
        {
          when: "status",
          condition: COMPARE_TYPES.IS_FALSE,
          compare: false,
          type: "boolean",
          label: "Disabled",
          icon: "close",
          color: "red",
        },
      ],
    },
  },
  {
    type: "hidden",
    apiType: "API",
    selectApi: "event/select",
    placeholder: "Event",
    name: "event",
    validation: "",
    showItem: "title",
    default: "",
    tag: false,
    label: "Event",
    required: false,
    view: false,
    add: false,
    update: false,
    filter: false,
  },
  {
    type: "number",
    placeholder: "Booking Count",
    name: "bookingCount",
    validation: "",
    default: 0,
    label: "Booking Count",
    tag: true,
    required: false,
    view: true,
    add: true,
    update: true,
    icon: "count",
  },
  {
    type: "text",
    placeholder: "Slug",
    name: "slug",
    validation: "",
    default: "",
    label: "Slug",
    validate: "slug",
    group: "Event Details",
    required: true,
    add: true,
    update: true,
    customClass: "full",
    view: false,
    tag: false,
  },
];
