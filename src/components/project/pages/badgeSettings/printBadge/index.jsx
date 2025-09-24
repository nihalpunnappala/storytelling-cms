
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  ChevronRight, ArrowLeft, QrCode, Image as ImageIcon, Type, User, UserCheck, Building, Ticket, GripVertical, Lock, Unlock, Trash2, Printer, Download, X, Users, CheckCircle2, Layers, FileText, Settings, File, LayoutGrid, Eye, Monitor
} from 'lucide-react';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "qrcode";
// import { getData, postData } from "../../../../../../backend/api";
import { getData, postData } from "../../../../../backend/api";

// --- Reusable Components ---
const OptionCard = ({ value, title, subtitle, icon: Icon, selection, setSelection, color = 'blue' }) => {
    const isSelected = selection === value;
    const selectedClasses = isSelected ? `border-blue-500 bg-blue-50 ring-2 ring-blue-200` : 'border-gray-200 bg-white hover:border-gray-300';
    return (
        <div onClick={() => setSelection(value)} className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3 ${selectedClasses}`}>
            <div className={`p-2 rounded-md bg-${color}-100`}><Icon size={20} className={`text-${color}-600`} /></div>
            <div className="flex-grow"><h4 className="font-semibold text-gray-800 text-sm">{title}</h4>{subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}</div>
            {isSelected && <CheckCircle2 size={20} className={`text-blue-500`} />}
        </div>
    )
};

// --- Main Print Badge Component ---
const PrintBadge = ({ onClose, badge, eventId }) => {
    const [currentStep, setCurrentStep] = useState(1);
    
    // Step 1 State
    const [attendeeSelection, setAttendeeSelection] = useState('all');
    const [badgeFormat, setBadgeFormat] = useState('both');
    
    // Step 2 State
    const [paperSize, setPaperSize] = useState('A4');
    const [orientation, setOrientation] = useState('portrait');
    const [badgesPerPage, setBadgesPerPage] = useState('auto');
    const [includeTrimMarks, setIncludeTrimMarks] = useState(false);
    
    // Data State
    const [registrations, setRegistrations] = useState([]);
    const [registrationCounts, setRegistrationCounts] = useState({ total: 0, new: 0 });
    const [unprintedCount, setUnprintedCount] = useState(0);
    const [isPrinting, setIsPrinting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [previewRegistration, setPreviewRegistration] = useState(null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

    // Helper to extract string ID from event or ticket
    const getId = (id) => {
        if (!id) return undefined;
        if (typeof id === "object" && id.$oid) return id.$oid;
        if (typeof id === "object" && id._id) return id._id;
        return id;
    };

    // Helper function to generate QR code as data URL
    const generateQRCodeDataURL = async (text, options = {}) => {
        try {
            const qrDataURL = await QRCode.toDataURL(text, {
                width: options.size || 150,
                margin: options.includeMargin ? 2 : 0,
                color: {
                    dark: options.fgColor || "#000000",
                    light: options.bgColor || "#FFFFFF",
                },
                errorCorrectionLevel: options.level || "L",
            });
            return qrDataURL;
        } catch (error) {
            console.error("Error generating QR code:", error);
            return null;
        }
    };

    // Helper function to safely parse badgeData
    const parseBadgeData = (badgeData) => {
        try {
            if (!badgeData?.builderData) {
                console.warn("No builderData found in badgeData");
                return { elements: [], background: null, contentElements: [] };
            }

            const elements = JSON.parse(badgeData.builderData);
            if (!Array.isArray(elements)) {
                console.warn("builderData is not an array");
                return { elements: [], background: null, contentElements: [] };
            }

            const background = elements.find((el) => el.type === "background");
            const contentElements = elements.filter((el) => el.type !== "background");

            // Debug logging for print component
            console.log("PrintBadge - Parsed elements:", contentElements.map(el => ({
                type: el.type,
                positionX: el.positionX,
                positionY: el.positionY,
                width: el.width,
                height: el.height
            })));

            return { elements, background, contentElements };
        } catch (error) {
            console.error("Error parsing badgeData.builderData:", error);
            return { elements: [], background: null, contentElements: [] };
        }
    };

    // Helper function to get background image URL
    const getBackgroundImageUrl = (badgeData, backgroundElement) => {
        const CDN_PREFIX = "https://event-manager.syd1.digitaloceanspaces.com/";

        // Prefer badgeData.backgroundImage
        if (badgeData?.backgroundImage) {
            if (badgeData.backgroundImage.startsWith("http")) {
                return badgeData.backgroundImage;
            }
            if (badgeData.backgroundImage.startsWith("blob:")) {
                return badgeData.backgroundImage;
            }
            return CDN_PREFIX + badgeData.backgroundImage;
        }

        // Fallback to background element from builderData
        if (backgroundElement?.src) {
            if (backgroundElement.src.startsWith("http")) {
                return backgroundElement.src;
            }
            if (backgroundElement.src.startsWith("blob:")) {
                return backgroundElement.src;
            }
            return CDN_PREFIX + backgroundElement.src;
        }

        return null;
    };

    // Helper function to get badge dimensions in CM
    const getBadgeDimensions = (badgeData) => {
        const defaultWidthCM = 8.5;
        const defaultHeightCM = 5.5;
        const width = badgeData?.layoutWidth;
        const height = badgeData?.layoutHeight;
        return {
            width: width && width > 0 ? width : defaultWidthCM,
            height: height && height > 0 ? height : defaultHeightCM,
        };
    };

    // Fetch registration counts and preview registration
    useEffect(() => {
        const fetchRegistrationCountsAndPreview = async () => {
            try {
                const eventId = getId(badge?.event);
                const ticketId = getId(badge?.ticket);
                
                // Fetch all registrations for the event
                const registrationsResponse = await getData({ event: eventId, skip: 0, limit: 100000 }, "ticket-registration/form");
                const registrations = registrationsResponse?.data?.response || [];
                setRegistrations(registrations);
                const totalCount = registrations.length;

                // Fetch new registrations count (registered within 2 days before event)
                let newCount = 0;
                let eventStartDate = badge?.event?.startDate ? new Date(badge.event.startDate) : null;
                if (!eventStartDate && registrations.length > 0 && registrations[0].event?.startDate) {
                    eventStartDate = new Date(registrations[0].event.startDate);
                }
                const twoDaysBeforeEvent = eventStartDate ? new Date(eventStartDate.getTime() - 2 * 24 * 60 * 60 * 1000) : null;
                if (eventStartDate && twoDaysBeforeEvent) {
                    newCount = registrations.filter((reg) => {
                        const regDate = new Date(reg.createdAt || reg.created_at || reg.date);
                        return regDate >= twoDaysBeforeEvent && regDate <= eventStartDate;
                    }).length;
                }

                setRegistrationCounts({ total: totalCount, new: newCount });

                // Set the first registration for preview
                setPreviewRegistration(registrations[0] || null);
            } catch (error) {
                setRegistrationCounts({ total: 0, new: 0 });
                setPreviewRegistration(null);
                setRegistrations([]);
            }
        };

        if (badge?.event) {
            fetchRegistrationCountsAndPreview();
        }
    }, [badge?.event]);

    // Update unprinted count when attendee selection changes
    useEffect(() => {
        const fetchUnprintedCount = async () => {
            if (attendeeSelection === "new" && badge?.event?._id && badge?.ticket?._id) {
                try {
                    const response = await getData(
                        {
                            eventId: badge.event._id,
                            ticketId: badge.ticket._id,
                            filterType: "new",
                        },
                        "badge-download/undownloaded-registrations"
                    );
                    const data = response?.data;
                    if (data?.success) {
                        setUnprintedCount(data.data.count);
                    } else {
                        setUnprintedCount(0);
                    }
                } catch (error) {
                    setUnprintedCount(0);
                }
            } else {
                setUnprintedCount(0);
            }
        };

        fetchUnprintedCount();
    }, [badge?.event?._id, badge?.ticket?._id, attendeeSelection]);

    // Get selected count based on attendee selection
    const getSelectedCount = () => {
        switch (attendeeSelection) {
            case "all":
                return registrationCounts.total || 0;
            case "new":
                return unprintedCount;
            default:
                return 0;
        }
    };

    // Helper: Get page size in mm based on settings
    function getPageSize() {
        let width = 210, height = 297; // Default A4 portrait
        if (paperSize === "A4") {
            width = 210;
            height = 297;
        } else if (paperSize === "Letter") {
            width = 216;
            height = 279;
        } else if (paperSize === "A3") {
            width = 297;
            height = 420;
        } else if (paperSize === "Legal") {
            width = 216;
            height = 356;
        }
        if (orientation === "landscape") {
            return { width: height, height: width };
        }
        return { width, height };
    }

    // Helper: Calculate optimal grid layout
    function getGridLayout() {
        const { width: pageWidth, height: pageHeight } = getPageSize();
        const { width: badgeWidthCM, height: badgeHeightCM } = getBadgeDimensions(badge);
        
        // Convert badge dimensions from cm to mm
        const badgeWidthMM = badgeWidthCM * 10;
        const badgeHeightMM = badgeHeightCM * 10;

        // Ensure minimum reasonable size in mm
        const minBadgeWidthMM = 30;
        const minBadgeHeightMM = 20;
        const finalBadgeWidthMM = Math.max(badgeWidthMM, minBadgeWidthMM);
        const finalBadgeHeightMM = Math.max(badgeHeightMM, minBadgeHeightMM);

        const padding = 5; // 5mm page padding
        const spacing = 2; // 2mm spacing between badges

        const usableWidth = pageWidth - (padding * 2);
        const usableHeight = pageHeight - (padding * 2);

        let cols = Math.max(1, Math.floor((usableWidth + spacing) / (finalBadgeWidthMM + spacing)));
        let rows = Math.max(1, Math.floor((usableHeight + spacing) / (finalBadgeHeightMM + spacing)));

        const badgeWidthForGrid = (usableWidth - (cols - 1) * spacing) / cols;
        const badgeHeightForGrid = (usableHeight - (rows - 1) * spacing) / rows;

        return { 
            cols, 
            rows, 
            badgesPerPage: cols * rows, 
            badgeWidthMM: badgeWidthForGrid, 
            badgeHeightMM: badgeHeightForGrid 
        };
    }

    // Helper: Wait for all images in a container to load
    function waitForImagesToLoad(container) {
        const images = container.querySelectorAll("img");
        return Promise.all(
            Array.from(images).map((img) => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                    img.onload = img.onerror = resolve;
                });
            })
        );
    }

    // Render badge HTML for PDF generation
    function renderBadgeHTML(badgeData, registration, widthMM, heightMM, format = "both") {
        const { elements, background, contentElements } = parseBadgeData(badgeData);
        const backgroundImageUrl = getBackgroundImageUrl(badgeData, background);
        const { width: originalWidth, height: originalHeight } = getBadgeDimensions(badgeData);

        // Convert mm to px for rendering
        const widthPx = widthMM * 3.7795275591; // 1mm = 3.78px
        const heightPx = heightMM * 3.7795275591;
        
        // Original dimensions from badgeData are in cm, convert to a consistent unit (e.g., px) for scaling
        // Assuming 1cm = 37.8px
        const originalWidthPx = originalWidth * 37.795275591;
        const originalHeightPx = originalHeight * 37.795275591;


        // Determine what to show
        const showBackground = format === "print" || format === "both";
        const showContent = format === "both" || format === "kiosk";

        // Background handling
        let backgroundStyle = "";
        if (showBackground && backgroundImageUrl) {
            backgroundStyle = `background: url('${backgroundImageUrl}') center/cover no-repeat;`;
        } else if (showBackground) {
            backgroundStyle = "background: #ffffff;";
        } else {
            backgroundStyle = "background: transparent;";
        }

        // Enhanced getValue function
        const getValue = (el) => {
            let value = null;

            if (el.preset === "name" || el.var === "name" || el.label === "Name") {
                value = registration?.fullName || registration?.name || (registration?.firstName && registration?.lastName ? `${registration.firstName} ${registration.lastName}` : null) || registration?.firstName || "Attendee Name";
                return value;
            }

            if (el.preset === "event" || el.var === "event" || el.label === "Event") {
                if (registration?.event && typeof registration.event === "object") {
                    value = registration.event.title || registration.event.name || registration.event.value || "Event Name";
                } else {
                    value = registration?.event || "Event Name";
                }
                return value;
            }

            if (el.preset === "ticket" || el.var === "ticket" || el.label === "Ticket") {
                if (registration?.ticket && typeof registration.ticket === "object") {
                    value = registration.ticket.title || registration.ticket.name || registration.ticket.value || "Ticket Type";
                } else {
                    value = registration?.ticketName || registration?.ticket || "Ticket Type";
                }
                return value;
            }

            if (el.type === "qr") {
                return registration?._id || registration?.registrationId || registration?.id || "QR_CODE_DATA";
            }

            // Handle user field types
            if (el.var && registration?.formData) {
                const fieldValue = registration.formData[el.var];
                if (fieldValue !== undefined && fieldValue !== null) {
                    if (el.fieldType === "checkbox") {
                        return fieldValue ? "☑ Selected" : "☐ Not Selected";
                    } else if (el.fieldType === "multiplechoice") {
                        return `○ ${fieldValue}`;
                    } else if (el.fieldType === "select" || el.fieldType === "dropdown") {
                        return fieldValue;
                    } else if (el.fieldType === "date") {
                        return new Date(fieldValue).toLocaleDateString();
                    } else if (el.fieldType === "datetime") {
                        return new Date(fieldValue).toLocaleString();
                    } else if (el.fieldType === "textarea" || el.fieldType === "paragraph") {
                        return fieldValue.length > 50 ? fieldValue.substring(0, 50) + "..." : fieldValue;
                    }
                    return fieldValue;
                }
            }

            // Generic handling
            if (el.preset && registration?.[el.preset] !== undefined) {
                value = registration[el.preset];
            } else if (el.var && registration?.[el.var] !== undefined) {
                value = registration[el.var];
            } else {
                value = el.content || el.label || "Sample Text";
            }

            if (typeof value === "object" && value !== null) {
                if (value.value) return value.value;
                if (value.label) return value.label;
                if (value.name) return value.name;
                if (value.title) return value.title;
                if (Array.isArray(value)) return value.join(", ");
                return JSON.stringify(value);
            }

            return String(value || el.content || el.label || "");
        };

        // Generate QR codes as data URLs for proper PDF rendering
        const qrElements = contentElements.filter((el) => el.type === "qr");
        const qrPromises = qrElements.map(async (el) => {
            const qrValue = getValue(el);
            // Convert CM to pixels for QR size calculation
            const qrSizePx = Math.min(el.width, el.height) * 37.795275591;
            const qrDataURL = await generateQRCodeDataURL(qrValue, {
                size: qrSizePx * 3, // Scale up for better quality
                bgColor: el.bgColor || "#FFFFFF",
                fgColor: el.fgColor || "#000000",
                level: el.level || "L",
                includeMargin: el.includeMargin !== false,
            });
            return { element: el, dataURL: qrDataURL };
        });

        // Return a promise that resolves to the HTML with embedded QR codes
        return Promise.all(qrPromises).then((qrResults) => {
            const qrMap = new Map(qrResults.map((result) => [result.element.id, result.dataURL]));

            return `
            <div class="badge-canvas" style="
                position: relative;
                width: ${widthPx}px;
                height: ${heightPx}px;
                ${backgroundStyle}
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid #ccc;
                margin: auto;
                display: block;
            ">
                ${
                    showContent
                        ? contentElements
                            .map((el) => {
                                const scaleX = widthPx / originalWidthPx;
                                const scaleY = heightPx / originalHeightPx;

                                // Convert element dimensions from CM to pixels for positioning and sizing
                                const elPositionXPx = el.positionX * 37.795275591;
                                const elPositionYPx = el.positionY * 37.795275591;
                                const elWidthPx = el.width * 37.795275591;
                                const elHeightPx = el.height * 37.795275591;
                                
                                // Debug logging for element conversion
                                if (el.type === "qr") {
                                    console.log("QR Element conversion:", {
                                        original: { positionX: el.positionX, positionY: el.positionY, width: el.width, height: el.height },
                                        converted: { positionX: elPositionXPx, positionY: elPositionYPx, width: elWidthPx, height: elHeightPx },
                                        scale: { scaleX, scaleY }
                                    });
                                }

                                if (el.type === "text" || el.type === "textarea" || el.type === "paragraph" || el.type === "mobilenumber" || el.type === "number" || el.type === "date" || el.type === "datetime" || el.type === "email") {
                                    const textValue = getValue(el);
                                    return `
                                    <div style="
                                        position: absolute;
                                        left: ${elPositionXPx * scaleX}px;
                                        top: ${elPositionYPx * scaleY}px;
                                        width: ${elWidthPx * scaleX}px;
                                        height: ${elHeightPx * scaleY}px;
                                        color: ${el.color || "#000000"};
                                        font-size: ${(el.fontSize || 16) * scaleY}px;
                                        font-weight: ${el.fontWeight || "normal"};
                                        text-align: ${el.textAlign || "center"};
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-family: Arial, sans-serif;
                                        overflow: hidden;
                                    ">${textValue}</div>
                                `;
                                }

                                if (el.type === "select" || el.type === "dropdown" || el.type === "multiplechoice" || el.type === "checkbox") {
                                    const selectValue = getValue(el);
                                    return `
                        <div style="
                            position: absolute;
                            left: ${elPositionXPx * scaleX}px;
                            top: ${elPositionYPx * scaleY}px;
                            width: ${elWidthPx * scaleX}px;
                            height: ${elHeightPx * scaleY}px;
                            color: ${el.color || "#000000"};
                            font-size: ${(el.fontSize || 14) * scaleY}px;
                            font-weight: ${el.fontWeight || "normal"};
                            text-align: ${el.textAlign || "left"};
                            display: flex;
                            align-items: center;
                            font-family: Arial, sans-serif;
                            overflow: hidden;
                        ">${selectValue}</div>
                    `;
                                }

                                if (el.type === "qr") {
                                    const qrDataURL = qrMap.get(el.id);
                                    if (qrDataURL) {
                                        return `
                            <div style="
                                position: absolute;
                                left: ${elPositionXPx * scaleX}px;
                                top: ${elPositionYPx * scaleY}px;
                                width: ${elWidthPx * scaleX}px;
                                height: ${elHeightPx * scaleY}px;
                                background: ${el.bgColor || "#ffffff"};
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            ">
                                <img src="${qrDataURL}" style="width: 100%; height: 100%; object-fit: contain;" alt="QR Code" />
                            </div>
                        `;
                                    } else {
                                        return `
                            <div style="
                                position: absolute;
                                left: ${elPositionXPx * scaleX}px;
                                top: ${elPositionYPx * scaleY}px;
                                width: ${elWidthPx * scaleX}px;
                                height: ${elHeightPx * scaleY}px;
                                background: ${el.bgColor || "#ffffff"};
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                border: 1px solid #000;
                                font-size: 8px;
                                color: #666;
                            ">QR Error</div>
                        `;
                                    }
                                }

                                if (el.type === "image" || el.type === "file") {
                                    const imageValue = getValue(el);
                                    if (imageValue && imageValue !== "Sample Text") {
                                        return `
                            <div style="
                                position: absolute;
                                left: ${elPositionXPx * scaleX}px;
                                top: ${elPositionYPx * scaleY}px;
                                width: ${elWidthPx * scaleX}px;
                                height: ${elHeightPx * scaleY}px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                border-radius: ${(el.borderRadius || 0) * 37.795275591 * scaleX}px;
                                border: ${(el.borderWidth || 0) * 37.795275591 * scaleX}px solid ${el.borderColor || "#000000"};
                                overflow: hidden;
                            ">
                                <img src="${imageValue}" style="width: 100%; height: 100%; object-fit: cover;" alt="User Image" />
                            </div>
                        `;
                                    }
                                }

                                const fallbackValue = getValue(el);
                                return `
                    <div style="
                        position: absolute;
                        left: ${elPositionXPx * scaleX}px;
                        top: ${elPositionYPx * scaleY}px;
                        width: ${elWidthPx * scaleX}px;
                        height: ${elHeightPx * scaleY}px;
                        color: ${el.color || "#000000"};
                        font-size: ${(el.fontSize || 14) * scaleY}px;
                        font-weight: ${el.fontWeight || "normal"};
                        text-align: ${el.textAlign || "center"};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: Arial, sans-serif;
                        overflow: hidden;
                    ">${fallbackValue}</div>
                `;
                            })
                            .join("")
                        : ""
                }
            </div>
        `;
        });
    }

    const generatePdfPreview = async () => {
        if (!badge || !badge.builderData) {
          // alert("Invalid badge data. Please check badge configuration.");
          return;
        }
    
        const { elements } = parseBadgeData(badge);
        if (elements.length === 0) {
          // alert("No badge elements found. Please check badge configuration.");
          return;
        }
    
        // setIsDownloading(true);
    
        try {
        //   console.log("📥 Starting download process...");
    
          // Filter registrations based on selected filter
          let filteredRegistrations = [...registrations];
    
          if (attendeeSelection === "new") {
            try {
              const response = await getData(
                {
                  eventId: badge.event._id,
                  ticketId: badge.ticket._id,
                },
                "badge-download/undownloaded-registrations"
              );
    
              const data = response?.data;
              if (data?.success && Array.isArray(data.undownloadedIds)) {
                filteredRegistrations = registrations.filter((reg) =>
                  data.undownloadedIds.includes(reg._id)
                );
                // console.log(
                //   `📊 Found ${filteredRegistrations.length} undownloaded registrations`
                // );
              } else {
                // console.warn("No undownloaded registrations found");
                filteredRegistrations = [];
              }
            } catch (error) {
              console.error("Error fetching undownloaded registrations:", error);
              filteredRegistrations = [];
            }
          }
    
          // Calculate layout
          const { width: pageWidth, height: pageHeight } = getPageSize();
          const layout = getGridLayout();
          const cols = layout.cols;
          const rows = layout.rows;
          const badgesPerPage = layout.badgesPerPage;
          const totalPages = Math.ceil(filteredRegistrations.length / badgesPerPage);
    
          const badgeCellWidthMM = layout.badgeWidthMM;
          const badgeCellHeightMM = layout.badgeHeightMM;
    
          const format = badgeFormat;
    
          // Create container
          const container = document.createElement("div");
          container.style.position = "absolute";
          container.style.left = "-9999px";
          container.style.top = "-9999px";
          document.body.appendChild(container);
    
          // Generate HTML with proper async QR handling
          const pagePromises = [];
    
          for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            const badgePromises = [];
    
            for (let i = 0; i < badgesPerPage; i++) {
              const reg = filteredRegistrations[pageIndex * badgesPerPage + i];
              if (reg) {
                badgePromises.push(
                  renderBadgeHTML(badge, reg, badgeCellWidthMM, badgeCellHeightMM, format)
                );
              } else {
                badgePromises.push(
                  Promise.resolve(
                    `<div class="badge-canvas" style="width:${
                      badgeCellWidthMM * 3.78
                    }px;height:${
                      badgeCellHeightMM * 3.78
                    }px;border:1px solid #ccc;border-radius:8px;background:#fff;display:block;margin:auto;"></div>`
                  )
                );
              }
            }
    
            pagePromises.push(
              Promise.all(badgePromises).then(
                (badgeHTMLs) => `
                            <div class="page" style="width:${pageWidth}mm;height:${pageHeight}mm;page-break-after:always;display:block;">
                                <div class="badge-grid" style="
                                    display:grid;
                                    grid-template-columns:repeat(${cols}, 1fr);
                                    grid-template-rows:repeat(${rows}, 1fr);
                                    gap:5mm;
                                    width:100%;height:100%;padding:10mm;">
                                    ${badgeHTMLs.join("")}
                                </div>
                            </div>
                        `
              )
            );
          }
    
          const pageHTMLs = await Promise.all(pagePromises);
          container.innerHTML = pageHTMLs.join("");
    
        //   console.log("🧪 Generated HTML for PDF with QR codes");
    
          // Wait for all images (including QR codes) to load
          await waitForImagesToLoad(container);
    
          // Generate PDF
          const pdf = new jsPDF({
            orientation: orientation,
            unit: "mm",
            format: paperSize.toLowerCase(),
          });
    
          const pages = container.querySelectorAll(".page");
          for (let i = 0; i < pages.length; i++) {
            if (i > 0) pdf.addPage();
            const canvas = await html2canvas(pages[i], {
              scale: 2,
              useCORS: true,
              logging: false,
              allowTaint: true,
              backgroundColor: "#ffffff",
            });
            const imgData = canvas.toDataURL("image/png");
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
          }
    
        //   pdf.save("Badges.pdf");
        const pdfDataUri = pdf.output('datauristring');
        setPdfPreviewUrl(pdfDataUri);
          document.body.removeChild(container);
    
        //   console.log("✅ PDF download completed successfully with QR codes");
        } catch (error) {
          console.error("❌ Download error:", error);
          alert("Failed to generate PDF. Please try again.");
        } finally {
        //   setIsDownloading(false);
        }
      };

    useEffect(() => {
        generatePdfPreview();
      }, [
        badge,
        registrations,
        attendeeSelection,
        badgeFormat,
        paperSize,
        orientation,
        badgesPerPage,
      ]);

    // Handle PDF download
    const handleDownload = async () => {
        if (!badge || !badge.builderData) {
            alert("Invalid badge data. Please check badge configuration.");
            return;
        }

        const { elements } = parseBadgeData(badge);
        if (elements.length === 0) {
            alert("No badge elements found. Please check badge configuration.");
            return;
        }

        setIsDownloading(true);

        try {
            console.log("📥 Starting download process...");

            // Filter registrations based on selected filter
            let filteredRegistrations = [...registrations];

            if (attendeeSelection === "new") {
                try {
                    const response = await getData(
                        {
                            eventId: badge.event._id,
                            ticketId: badge.ticket._id,
                        },
                        "badge-download/undownloaded-registrations"
                    );

                    const data = response?.data;
                    if (data?.success && Array.isArray(data.undownloadedIds)) {
                        filteredRegistrations = registrations.filter((reg) => data.undownloadedIds.includes(reg._id));
                        console.log(`📊 Found ${filteredRegistrations.length} undownloaded registrations`);
                    } else {
                        console.warn("No undownloaded registrations found");
                        filteredRegistrations = [];
                    }
                } catch (error) {
                    console.error("Error fetching undownloaded registrations:", error);
                    filteredRegistrations = [];
                }
            }

            // Calculate layout
            const { width: pageWidth, height: pageHeight } = getPageSize();
            const layout = getGridLayout();
            const cols = layout.cols;
            const rows = layout.rows;
            const badgesPerPage = layout.badgesPerPage;
            const totalPages = Math.ceil(filteredRegistrations.length / badgesPerPage);

            const badgeCellWidthMM = layout.badgeWidthMM;
            const badgeCellHeightMM = layout.badgeHeightMM;

            const format = badgeFormat;

            // Create container
            const container = document.createElement("div");
            container.style.position = "absolute";
            container.style.left = "-9999px";
            container.style.top = "-9999px";
            document.body.appendChild(container);

            // Generate HTML with proper async QR handling
            const pagePromises = [];

            for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
                const badgePromises = [];

                for (let i = 0; i < badgesPerPage; i++) {
                    const reg = filteredRegistrations[pageIndex * badgesPerPage + i];
                    if (reg) {
                        badgePromises.push(renderBadgeHTML(badge, reg, badgeCellWidthMM, badgeCellHeightMM, format));
                    } else {
                        badgePromises.push(Promise.resolve(`<div class="badge-canvas" style="width:${badgeCellWidthMM * 3.78}px;height:${badgeCellHeightMM * 3.78}px;border:1px solid #ccc;border-radius:8px;background:#fff;display:block;margin:auto;"></div>`));
                    }
                }

                pagePromises.push(
                    Promise.all(badgePromises).then(
                        (badgeHTMLs) => `
                            <div class="page" style="width:${pageWidth}mm;height:${pageHeight}mm;page-break-after:always;display:block;">
                                <div class="badge-grid" style="
                                    display:grid;
                                    grid-template-columns:repeat(${cols}, 1fr);
                                    grid-template-rows:repeat(${rows}, 1fr);
                                    gap:5mm;
                                    width:100%;height:100%;padding:10mm;">
                                    ${badgeHTMLs.join("")}
                                </div>
                            </div>
                        `
                    )
                );
            }

            const pageHTMLs = await Promise.all(pagePromises);
            container.innerHTML = pageHTMLs.join("");

            console.log("🧪 Generated HTML for PDF with QR codes");

            // Wait for all images (including QR codes) to load
            await waitForImagesToLoad(container);

            // Generate PDF
            const pdf = new jsPDF({
                orientation: orientation,
                unit: "mm",
                format: paperSize.toLowerCase(),
            });

            const pages = container.querySelectorAll(".page");
            for (let i = 0; i < pages.length; i++) {
                if (i > 0) pdf.addPage();
                const canvas = await html2canvas(pages[i], {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    allowTaint: true,
                    backgroundColor: "#ffffff",
                });
                const imgData = canvas.toDataURL("image/png");
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
            }

            pdf.save("Badges.pdf");
            document.body.removeChild(container);

            console.log("✅ PDF download completed successfully with QR codes");
        } catch (error) {
            console.error("❌ Download error:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    // Handle print
    const handlePrint = async () => {
        if (!badge || !badge.builderData) {
            alert("Invalid badge data. Please check badge configuration.");
            return;
        }

        const { elements } = parseBadgeData(badge);
        if (elements.length === 0) {
            alert("No badge elements found. Please check badge configuration.");
            return;
        }

        setIsPrinting(true);

        try {
            console.log("🖨️ Starting print process...");

            // Filter registrations based on selected filter
            let filteredRegistrations = [...registrations];

            if (attendeeSelection === "new") {
                try {
                    const response = await getData(
                        {
                            eventId: badge.event._id,
                            ticketId: badge.ticket._id,
                        },
                        "badge-download/undownloaded-registrations"
                    );

                    const data = response?.data;
                    if (data?.success && Array.isArray(data.undownloadedIds)) {
                        filteredRegistrations = registrations.filter((reg) => data.undownloadedIds.includes(reg._id));
                        console.log(`📊 Found ${filteredRegistrations.length} undownloaded registrations`);
                    } else {
                        console.warn("No undownloaded registrations found");
                        filteredRegistrations = [];
                    }
                } catch (error) {
                    console.error("Error fetching undownloaded registrations:", error);
                    filteredRegistrations = [];
                }
            }

            // Calculate layout
            const { width: pageWidth, height: pageHeight } = getPageSize();
            const layout = getGridLayout();
            const cols = layout.cols;
            const rows = layout.rows;
            const badgesPerPage = layout.badgesPerPage;
            const totalPages = Math.ceil(filteredRegistrations.length / badgesPerPage);

            const badgeCellWidthMM = layout.badgeWidthMM;
            const badgeCellHeightMM = layout.badgeHeightMM;

            const format = badgeFormat;

            // Generate HTML for printing
            const pagePromises = [];

            for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
                const badgePromises = [];

                for (let i = 0; i < badgesPerPage; i++) {
                    const reg = filteredRegistrations[pageIndex * badgesPerPage + i];
                    if (reg) {
                        badgePromises.push(renderBadgeHTML(badge, reg, badgeCellWidthMM, badgeCellHeightMM, format));
                    } else {
                        badgePromises.push(Promise.resolve(`<div class="badge-canvas" style="width:${badgeCellWidthMM * 3.78}px;height:${badgeCellHeightMM * 3.78}px;border:1px solid #ccc;border-radius:8px;background:#fff;display:block;margin:auto;"></div>`));
                    }
                }

                pagePromises.push(
                    Promise.all(badgePromises).then(
                        (badgeHTMLs) => `
                            <div class="page">
                                <div class="badge-grid">
                                    ${badgeHTMLs.join("")}
                                </div>
                            </div>
                        `
                    )
                );
            }

            const pageHTMLs = await Promise.all(pagePromises);

            // Generate complete HTML
            const html = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Badge Print</title>
                        <style>
                            @page {
                                size: ${paperSize} ${orientation};
                                margin: 0;
                            }
                            body {
                                margin: 0;
                                padding: 0;
                                font-family: Arial, sans-serif;
                            }
                            .page {
                                width: ${pageWidth}mm;
                                height: ${pageHeight}mm;
                                page-break-after: always;
                                position: relative;
                                padding: 10mm;
                                box-sizing: border-box;
                            }
                            .badge-grid {
                                display: grid;
                                grid-template-columns: repeat(${cols}, 1fr);
                                grid-template-rows: repeat(${rows}, 1fr);
                                gap: 5mm;
                                width: 100%;
                                height: 100%;
                            }
                        </style>
                    </head>
                    <body>
                        ${pageHTMLs.join("")}
                    </body>
                </html>
            `;

            // Print handling
            try {
                const printWindow = window.open("", "_blank", "width=800,height=600");

                if (!printWindow) {
                    // Fallback if popup is blocked
                    const blob = new Blob([html], { type: "text/html" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "badges.html";
                    a.click();
                    URL.revokeObjectURL(url);
                    return;
                }

                printWindow.document.write(html);
                printWindow.document.close();

                // Wait for content to load before printing
                printWindow.onload = () => {
                    setTimeout(() => {
                        printWindow.focus();
                        printWindow.print();
                    }, 1000);
                };

                console.log("✅ Print window opened successfully");
            } catch (error) {
                console.error("❌ Print error:", error);
                // Fallback: download as HTML
                const blob = new Blob([html], { type: "text/html" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "badges.html";
                a.click();
                URL.revokeObjectURL(url);
            }
        } finally {
            setIsPrinting(false);
        }
    };

    // --- Preview Grid (true-to-print, like BadgeExport) ---
    const renderPreviewGrid = () => {
        if (!badge || !badge.builderData) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 p-4">
                    <div className="text-center text-gray-500">
                        <p>No badge data available</p>
                    </div>
                </div>
            );
        }

        const { elements, background, contentElements } = parseBadgeData(badge);
        if (elements.length === 0) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 p-4">
                    <div className="text-center text-gray-500">
                        <p>No badge elements found</p>
                    </div>
                </div>
            );
        }

        // Filter registrations based on selected filter
        let filteredRegistrations = [...registrations];
        if (attendeeSelection === "new") {
            // For preview, we'll use the unprinted count logic
            filteredRegistrations = registrations.slice(0, unprintedCount);
        }

        if (filteredRegistrations.length === 0) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 p-4">
                    <div className="text-center text-gray-500">
                        <p>No registrations to preview</p>
                    </div>
                </div>
            );
        }

        const backgroundImageUrl = getBackgroundImageUrl(badge, background);
        const { width: badgeWidth, height: badgeHeight } = getBadgeDimensions(badge);
        const { cols, rows, badgeWidthMM, badgeHeightMM } = getGridLayout();
        const badgesPerPage = cols * rows;
        const totalPages = Math.ceil(filteredRegistrations.length / badgesPerPage);
        
        const showBackground = badgeFormat === "print" || badgeFormat === "both";
        const showContent = badgeFormat === "both" || badgeFormat === "kiosk";

        // Calculate badge display size for preview (smaller than actual print size)
        const previewScale = 0.3; // Scale down for preview
        const badgeDisplayWidth = badgeWidthMM * 3.78 * previewScale; // Convert mm to px and scale
        const badgeDisplayHeight = badgeHeightMM * 3.78 * previewScale;

        // Calculate page dimensions for preview
        const { width: pageWidthMM, height: pageHeightMM } = getPageSize();
        const pageDisplayWidth = pageWidthMM * 3.78 * previewScale; // Convert mm to px and scale
        const pageDisplayHeight = pageHeightMM * 3.78 * previewScale;

        // Helper to get field value for a registration
        const getValue = (el, registration) => {
            if (el.preset === "name" || el.var === "name" || el.label === "Name") {
                return registration?.fullName || registration?.name || 
                       (registration?.firstName && registration?.lastName ? `${registration.firstName} ${registration.lastName}` : null) || 
                       registration?.firstName || "Attendee Name";
            }

            if (el.preset === "event" || el.var === "event" || el.label === "Event") {
                if (registration?.event && typeof registration.event === "object") {
                    return registration.event.title || registration.event.name || registration.event.value || "Event Name";
                } else {
                    return registration?.event || "Event Name";
                }
            }

            if (el.preset === "ticket" || el.var === "ticket" || el.label === "Ticket") {
                if (registration?.ticket && typeof registration.ticket === "object") {
                    return registration.ticket.title || registration.ticket.name || registration.ticket.value || "Ticket Type";
                } else {
                    return registration?.ticketName || registration?.ticket || "Ticket Type";
                }
            }

            if (el.type === "qr") {
                return registration?._id || registration?.registrationId || registration?.id || "QR_CODE_DATA";
            }

            // Handle user field types
            if (el.var && registration?.formData) {
                const fieldValue = registration.formData[el.var];
                if (fieldValue !== undefined && fieldValue !== null) {
                    if (el.fieldType === "checkbox") {
                        return fieldValue ? "☑ Selected" : "☐ Not Selected";
                    } else if (el.fieldType === "multiplechoice") {
                        return `○ ${fieldValue}`;
                    } else if (el.fieldType === "select" || el.fieldType === "dropdown") {
                        return fieldValue;
                    } else if (el.fieldType === "date") {
                        return new Date(fieldValue).toLocaleDateString();
                    } else if (el.fieldType === "datetime") {
                        return new Date(fieldValue).toLocaleString();
                    } else if (el.fieldType === "textarea" || el.fieldType === "paragraph") {
                        return fieldValue.length > 30 ? fieldValue.substring(0, 30) + "..." : fieldValue;
                    }
                    return fieldValue;
                }
            }

            // Generic handling
            if (el.preset && registration?.[el.preset] !== undefined) {
                const value = registration[el.preset];
                if (typeof value === "object" && value !== null) {
                    if (value.value) return value.value;
                    if (value.label) return value.label;
                    if (value.name) return value.name;
                    if (value.title) return value.title;
                    if (Array.isArray(value)) return value.join(", ");
                    return JSON.stringify(value);
                }
                return String(value);
            } else if (el.var && registration?.[el.var] !== undefined) {
                const value = registration[el.var];
                if (typeof value === "object" && value !== null) {
                    if (value.value) return value.value;
                    if (value.label) return value.label;
                    if (value.name) return value.name;
                    if (value.title) return value.title;
                    if (Array.isArray(value)) return value.join(", ");
                    return JSON.stringify(value);
                }
                return String(value);
            } else {
                return el.content || el.label || "Sample Text";
            }
        };

        // Render a single badge
        const renderBadge = (registration, index) => {
            return (
                <div
                    key={registration?._id || index}
                    style={{
                        width: badgeDisplayWidth,
                        height: badgeDisplayHeight,
                        position: 'relative',
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: '1px solid #ccc',
                        background: showBackground && backgroundImageUrl ? 
                            `url(${backgroundImageUrl}) center/cover no-repeat` : 
                            showBackground ? '#fff' : 'transparent',
                        margin: 'auto',
                        display: 'block',
                    }}
                >
                    {/* Render content elements */}
                    {showContent && contentElements.map((el) => {
                        const scaleX = badgeDisplayWidth / (badgeWidth * 37.8);
                        const scaleY = badgeDisplayHeight / (badgeHeight * 37.8);
                        
                        // Convert element dimensions from CM to pixels for positioning and sizing
                        const elPositionXPx = el.positionX * 37.795275591;
                        const elPositionYPx = el.positionY * 37.795275591;
                        const elWidthPx = el.width * 37.795275591;
                        const elHeightPx = el.height * 37.795275591;
                        
                        // Text elements
                        if (["text", "textarea", "paragraph", "mobilenumber", "number", "date", "datetime", "email"].includes(el.type)) {
                            const value = getValue(el, registration);
                            return (
                                <div
                                    key={el.id}
                                    style={{
                                        position: 'absolute',
                                        left: elPositionXPx * scaleX,
                                        top: elPositionYPx * scaleY,
                                        width: elWidthPx * scaleX,
                                        height: elHeightPx * scaleY,
                                        color: el.color || '#000',
                                        fontSize: Math.max((el.fontSize || 16) * scaleY, 8),
                                        fontWeight: el.fontWeight || 'normal',
                                        textAlign: el.textAlign || 'center',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontFamily: 'Arial, sans-serif',
                                        overflow: 'hidden',
                                        wordBreak: 'break-word',
                                    }}
                                >{value}</div>
                            );
                        }

                        // Select/dropdown/choice elements
                        if (["select", "dropdown", "multiplechoice", "checkbox"].includes(el.type)) {
                            const value = getValue(el, registration);
                            return (
                                <div
                                    key={el.id}
                                    style={{
                                        position: 'absolute',
                                        left: elPositionXPx * scaleX,
                                        top: elPositionYPx * scaleY,
                                        width: elWidthPx * scaleX,
                                        height: elHeightPx * scaleY,
                                        color: el.color || '#000',
                                        fontSize: Math.max((el.fontSize || 14) * scaleY, 8),
                                        fontWeight: el.fontWeight || 'normal',
                                        textAlign: el.textAlign || 'left',
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontFamily: 'Arial, sans-serif',
                                        overflow: 'hidden',
                                    }}
                                >{value}</div>
                            );
                        }

                        // QR code (show a placeholder)
                        if (el.type === "qr") {
                            return (
                                <div
                                    key={el.id}
                                    style={{
                                        position: 'absolute',
                                        left: elPositionXPx * scaleX,
                                        top: elPositionYPx * scaleY,
                                        width: elWidthPx * scaleX,
                                        height: elHeightPx * scaleY,
                                        background: el.bgColor || '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid #000',
                                    }}
                                >
                                    <QrCode size={Math.min(elWidthPx * scaleX, elHeightPx * scaleY) * 0.8} />
                                </div>
                            );
                        }

                        // Image/file elements
                        if (el.type === "image" || el.type === "file") {
                            const imageValue = getValue(el, registration);
                            if (imageValue && imageValue !== "Sample Text") {
                            return (
                                <div
                                    key={el.id}
                                    style={{
                                        position: 'absolute',
                                        left: elPositionXPx * scaleX,
                                        top: elPositionYPx * scaleY,
                                        width: elWidthPx * scaleX,
                                        height: elHeightPx * scaleY,
                                            borderRadius: (el.borderRadius || 0) * 37.795275591 * scaleX,
                                            overflow: 'hidden',
                                            border: el.borderWidth ? `${(el.borderWidth * 37.795275591 * scaleX)}px solid ${el.borderColor}` : 'none',
                                        }}
                                    >
                                        <img 
                                            src={imageValue} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                            alt="User Content" 
                                        />
                                    </div>
                                );
                            } else {
                                return (
                                    <div
                                        key={el.id}
                                        style={{
                                            position: 'absolute',
                                            left: elPositionXPx * scaleX,
                                            top: elPositionYPx * scaleY,
                                            width: elWidthPx * scaleX,
                                            height: elHeightPx * scaleY,
                                            borderRadius: (el.borderRadius || 0) * 37.795275591 * scaleX,
                                        overflow: 'hidden',
                                        border: el.borderWidth ? `${(el.borderWidth * 37.795275591 * scaleX)}px solid ${el.borderColor}` : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                            background: '#f0f0f0',
                                    }}
                                >
                                        <ImageIcon size={Math.min(elWidthPx * scaleX, elHeightPx * scaleY) * 0.6} color="#999" />
                                </div>
                                );
                        }
                        }

                        return null;
                    })}
                </div>
            );
        };
        
        // Render all pages
        const renderAllPages = () => {
            const pages = [];
            
            // Determine actual badges per page based on settings
            let actualBadgesPerPage = badgesPerPage;
            if (badgesPerPage === "one") {
                actualBadgesPerPage = 1;
            } else if (badgesPerPage === "auto") {
                // Use auto-calculated layout
                actualBadgesPerPage = cols * rows;
            } else {
                // Fallback for any numeric values or other strings
                actualBadgesPerPage = cols * rows;
            }
            
            const actualTotalPages = Math.ceil(filteredRegistrations.length / actualBadgesPerPage);
            
            for (let pageIndex = 0; pageIndex < actualTotalPages; pageIndex++) {
                const pageRegistrations = filteredRegistrations.slice(
                    pageIndex * actualBadgesPerPage, 
                    (pageIndex + 1) * actualBadgesPerPage
                );
                
                pages.push(
                    <div key={pageIndex} className="mb-8">
                        <div className="text-center mb-4">
                            <h4 className="font-semibold text-gray-700 text-sm">
                                Page {pageIndex + 1} of {actualTotalPages}
                            </h4>
                        <p className="text-xs text-gray-500">
                                {paperSize} • {orientation} • {pageRegistrations.length} badges
                        </p>
                    </div>
                        
                        <div 
                            className="bg-white border border-gray-300 rounded-lg mx-auto shadow-sm relative"
                            style={{
                                width: `${pageDisplayWidth}px`,
                                height: `${pageDisplayHeight}px`,
                                padding: `${5 * 3.78 * previewScale}px`, // 5mm padding scaled (reduced from 10mm)
                                boxSizing: 'border-box',
                            }}
                        >
                            {badgesPerPage === "one" ? (
                                // Single badge centered on page
                                <div className="w-full h-full flex items-center justify-center">
                                    {pageRegistrations[0] ? renderBadge(pageRegistrations[0], pageIndex) : (
                                        <div
                                            style={{
                                                width: badgeDisplayWidth,
                                                height: badgeDisplayHeight,
                                                border: '1px dashed #ccc',
                                                borderRadius: 4,
                                                background: '#f9f9f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#999',
                                                fontSize: '10px',
                                            }}
                                        >
                                            Empty
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Grid layout for multiple badges
                                <div 
                                    className="w-full h-full grid"
                                    style={{ 
                                        display: "grid", 
                                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                                        gridTemplateRows: `repeat(${rows}, 1fr)`,
                                        gap: `${2 * 3.78 * previewScale}px`, // 2mm gap scaled (reduced from 5mm)
                                        placeItems: 'center', // Center badges in grid cells
                                        boxSizing: 'border-box', // Ensure padding/border are included in size
                                    }}
                                >
                                    {Array.from({ length: actualBadgesPerPage }, (_, i) => {
                                        const reg = pageRegistrations[i];
                                        return reg ? renderBadge(reg, pageIndex * actualBadgesPerPage + i) : (
                                            <div
                                                key={i}
                                                style={{
                                                    width: badgeDisplayWidth,
                                                    height: badgeDisplayHeight,
                                                    border: '1px dashed #ccc',
                                                    borderRadius: 4,
                                                    background: '#f9f9f9',
                                                }}
                                            />
                                        );
                                    })}
                            </div>
                            )}
                            
                            {/* Paper size indicator */}
                            <div className="absolute top-2 left-2 text-xs text-gray-400 bg-white px-2 py-1 rounded">
                                {paperSize} {orientation}
                        </div>
                            
                            {/* Trim marks indicator (if enabled) */}
                            {includeTrimMarks && (
                                <>
                                    {/* Corner trim marks */}
                                    <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-gray-400"></div>
                                    <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-gray-400"></div>
                                    <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-gray-400"></div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-gray-400"></div>
                                </>
                            )}
                    </div>
                    </div>
                );
            }
            
            return pages;
        };

        return (
            <div className="w-full h-full bg-gray-100 p-4 overflow-y-auto">
                <div className="max-w-full mx-auto">
                    {renderAllPages()}
                </div>
            </div>
        );
    };

    const Step1 = () => (
        <>
            <section>
                <h3 className="text-base font-semibold text-gray-800 mb-3">Select Attendees</h3>
                <div className="space-y-3">
                    <OptionCard 
                        value="all" 
                        title="All Attendees" 
                        subtitle={`${registrationCounts.total || 0} registrations`} 
                        icon={Users} 
                        selection={attendeeSelection} 
                        setSelection={setAttendeeSelection} 
                    />
                    <OptionCard 
                        value="new" 
                        title="New Only" 
                        subtitle={`${unprintedCount} new`} 
                        icon={Users} 
                        selection={attendeeSelection} 
                        setSelection={setAttendeeSelection} 
                    />
                </div>
            </section>
            <section>
                <h3 className="text-base font-semibold text-gray-800 mb-3">Badge Format</h3>
                <div className="space-y-3">
                    <OptionCard 
                        value="print" 
                        title="Background Only" 
                        subtitle="No text/attributes" 
                        icon={ImageIcon} 
                        selection={badgeFormat} 
                        setSelection={setBadgeFormat} 
                        color="blue" 
                    />
                    <OptionCard 
                        value="both" 
                        title="Complete Badge" 
                        subtitle="Background + info" 
                        icon={Layers} 
                        selection={badgeFormat} 
                        setSelection={setBadgeFormat} 
                        color="purple" 
                    />
                    <OptionCard 
                        value="kiosk" 
                        title="No Background" 
                        subtitle="Content only" 
                        icon={FileText} 
                        selection={badgeFormat} 
                        setSelection={setBadgeFormat} 
                        color="green" 
                    />
                </div>
            </section>
        </>
    );

    const Step2 = () => (
         <>
            <section>
                <h3 className="text-base font-semibold text-gray-800 mb-3">Paper Size</h3>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <File size={16} className="text-gray-500" />
                    </div>
                    <select 
                        value={paperSize} 
                        onChange={e => setPaperSize(e.target.value)} 
                        className="w-full pl-10 p-3 bg-white border-2 border-gray-200 rounded-lg appearance-none cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                        <option value="A4">A4 (210 x 297 mm)</option>
                        <option value="Letter">Letter (8.5 x 11 in)</option>
                        <option value="Legal">Legal (8.5 x 14 in)</option>
                        <option value="A3">A3 (297 x 420 mm)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <ChevronRight size={16} className="text-gray-500" />
                    </div>
                </div>
            </section>
            <section>
                <h3 className="text-base font-semibold text-gray-800 mb-3">Orientation</h3>
                <div className="space-y-3">
                    <OptionCard 
                        value="portrait" 
                        title="Portrait" 
                        subtitle="Taller than wide" 
                        icon={LayoutGrid} 
                        selection={orientation} 
                        setSelection={setOrientation} 
                        color="blue" 
                    />
                    <OptionCard 
                        value="landscape" 
                        title="Landscape" 
                        subtitle="Wider than tall" 
                        icon={LayoutGrid} 
                        selection={orientation} 
                        setSelection={setOrientation} 
                        color="purple" 
                    />
                    </div>
            </section>
            <section>
                <h3 className="text-base font-semibold text-gray-800 mb-3">Layout</h3>
                 <div className="space-y-3">
                    <OptionCard 
                        value="auto" 
                        title="Auto Fit" 
                        subtitle="Fit as many as possible" 
                        icon={LayoutGrid} 
                        selection={badgesPerPage} 
                        setSelection={setBadgesPerPage} 
                        color="purple" 
                    />
                    <OptionCard 
                        value="one" 
                        title="One per page" 
                        subtitle="For pre-cut paper" 
                        icon={LayoutGrid} 
                        selection={badgesPerPage} 
                        setSelection={setBadgesPerPage} 
                        color="purple" 
                    />
                </div>
            </section>
             <section>
                 <label className="flex items-center gap-3 p-3 rounded-lg border-2 border-transparent has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 cursor-pointer">
                    <div className="p-2 rounded-md bg-green-100">
                        <Settings size={20} className="text-green-600"/>
                    </div>
                    <div className="flex-grow">
                        <h4 className="font-semibold text-gray-800 text-sm">Include trim marks</h4>
                    </div>
                    <input 
                        type="checkbox" 
                        checked={includeTrimMarks} 
                        onChange={e => setIncludeTrimMarks(e.target.checked)} 
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                    />
                </label>
            </section>
        </>
    );

    const getPaperStyle = () => {
        if (paperSize === 'Letter') return { width: '612px', height: '792px'};
        if (paperSize === 'Legal') return { width: '612px', height: '1008px'};
        if (paperSize === 'A3') return { width: '842px', height: '1191px'};
        return { width: '595px', height: '842px'}; // A4 default
    };

    const layout = getGridLayout();
    const totalPages = Math.ceil(getSelectedCount() / layout.badgesPerPage);

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-50 rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <Download size={20} className="text-gray-700"/>
                        <h2 className="text-lg font-bold text-gray-800">Badge Export & Print</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-200">
                        <X size={20} />
                    </button>
                </header>
                <div className="flex flex-grow overflow-hidden">
                    <main className="flex-1 bg-gray-200 p-8 overflow-y-auto">
                        {renderPreviewGrid()}
                    </main>
                    <aside className="w-80 border-l bg-white flex flex-col">
                        <div className="flex-grow p-6 space-y-6 overflow-y-auto">
                            {currentStep === 1 ? <Step1 /> : <Step2 />}
                        </div>
                        <footer className="p-4 bg-gray-50 border-t flex-shrink-0 flex items-center gap-3">
                            {currentStep === 2 && (
                                <button 
                                    onClick={() => setCurrentStep(1)} 
                                    className="bg-white border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <ArrowLeft size={18}/> Back
                                </button>
                            )}
                            {currentStep === 1 ? (
                                <button 
                                    onClick={() => setCurrentStep(2)} 
                                    className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    Next <ChevronRight size={18}/>
                                </button>
                            ) : (
                                <div className="flex gap-2 w-full">
                                    <button 
                                        onClick={handlePrint} 
                                        disabled={isPrinting || isDownloading}
                                        className="flex-1 bg-white border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-100 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isPrinting ? (
                                            <div className="animate-spin w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full" />
                                        ) : (
                                            <Printer size={18}/>
                                        )}
                                        {isPrinting ? "Printing..." : "Print"}
                                    </button>
                                    <button 
                                        onClick={handleDownload} 
                                        disabled={isPrinting || isDownloading}
                                        className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isDownloading ? (
                                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                        ) : (
                                            <Download size={18}/>
                                        )}
                                        {isDownloading ? "Downloading..." : "Download"}
                                </button>
                                </div>
                            )}
                        </footer>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default PrintBadge;
