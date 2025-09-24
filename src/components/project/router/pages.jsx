import { lazy } from "react";
import page404 from "../pages/page404";
const attendee = lazy(() => import("../pages/event/registrations"));
const approval = lazy(() => import("../pages/event/approval"));
const attendance = lazy(() => import("../pages/event/attendance"));
const dashboard = lazy(() => import("../pages/dashboard"));
const regdata = lazy(() => import("../pages/registrationFormData"));
const customDomain = lazy(() => import("../pages/event/customDomain"));
const emailCampaign = lazy(() => import("../pages/emailCampaign/EmailCampaignList"));
const whatsappCampaign = lazy(() => import("../pages/whatsappCampaign"));
const qrCode = lazy(() => import("../pages/qrCode"));
const faceMatch = lazy(() => import("../pages/event/instaPhotoAttendee"));
const instaAttendee = lazy(() => import("../pages/event/instaAttendeeNew"));
const recapUser = lazy(() => import("../pages/event/instaRecapAttendee"));
const InstaRecapDashboard = lazy(() => import("../pages/recapDashboard"));
const InstaSnapDashboard = lazy(() => import("../pages/snapDashboard"));
const eventAudio = lazy(() => import("../pages/eventAudioUpload"));
const analytics = lazy(() => import("../pages/analytics"));
const album = lazy(() => import("../pages/album"));
const watermark = lazy(() => import("../pages/watermark"));
const contributeAlbum = lazy(() => import("../pages/contributeAlbum"));
const automationTab = lazy(() => import("../pages/automationTab"));
const layoutContent = lazy(() => import("../pages/layoutContents"));
const menuSettings = lazy(() => import("../pages/menuSettings"));
const seoSettings = lazy(() => import("../pages/seoSettings"));
const sessions = lazy(() => import("../pages/sessions"));
const badgeSettings = lazy(() => import("../pages/badgeSettings"));
const speakers = lazy(() => import("../pages/speakers"));
const participantType = lazy(() => import("../pages/participantType"));
const form = lazy(() => import("../pages/form"));
const userType = lazy(() => import("../pages/user/userType"));
const integrations = lazy(() => import("../pages/integrations"));
const recapLive = lazy(() => import("../pages/recapLive"));
const wallFame = lazy(() => import("../pages/wallFame"));
const liveTest = lazy(() => import("../pages/liveTest")); 
const avTeam = lazy(() => import("../pages/avTeam"));
const sessionsTranscripts = lazy(() => import("../pages/sessionsTranscripts"));

const RenderSubPage = (element, content) => {
  if (content) {
    return content;
  } else {
    switch (element.page) {
      case "userRoles":
        return userType;
      case "attendee":
        return attendee;
      case "attendance":
        return attendance;
      case "dashboard":
        return dashboard;
      case "approval":
        return approval;
      case "regdata":
        return regdata;
      case "registration":
        return attendee;
      case "domain":
        return customDomain;
      case "emailCampaign":
        return emailCampaign;
      case "whatsappCampaign":
        return whatsappCampaign;
      case "qrCode":
        return qrCode;
      case "faceMatch":
        return faceMatch;
      case "instaAttendee":
        return instaAttendee;
      case "recapUser":
        return recapUser;
      case "InstaRecapDashboard":
        return InstaRecapDashboard;
      case "InstaSnapDashboard":
        return InstaSnapDashboard;
      case "eventAudio":
        return eventAudio;
      case "analytics":
        return analytics;
      case "album":
        return album;
      case "watermark":
        return watermark;
      case "contributeAlbum":
        return contributeAlbum;
      case "automationTab":
        return automationTab;
      case "layoutContent":
        return layoutContent;
      case "menuSettings":
        return menuSettings;
      case "seoSettings":
        return seoSettings;
      case "badgeSettings":
        return badgeSettings;
      case "sessions":
        return sessions;
      case "speakers":
        return speakers;
      case "participantType":
        return participantType;
      case "form":
        return form;
      case "integrations":
        return integrations;
      case "liveSession":
        return recapLive;
      case "wallFame":
        return wallFame;
      case "liveSessionTest":
        return liveTest;
      case "avTeam":
        return avTeam;
      case "sessionsTranscripts":
        return sessionsTranscripts;
      default:
        return page404;
    }
  }
};

export default RenderSubPage;
