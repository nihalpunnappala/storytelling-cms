
import React, { lazy, Suspense } from "react";

// Lazy load all components
const Signup = lazy(() => import("../../public/signup"));
const Landing = lazy(() => import("../pages/landing/landing"));
const Demo = lazy(() => import("../pages/landing/demo"));
const Menu = lazy(() => import("../pages/menu"));
const Franchise = lazy(() => import("../pages/franchise"));
const Page404 = lazy(() => import("../pages/page404"));
const UserType = lazy(() => import("../pages/user/userType"));
const Dashboard = lazy(() => import("../pages/dashboard"));
const Admin = lazy(() => import("../pages/franchise/admin"));
const Collection = lazy(() => import("../pages/collection"));
const Faq = lazy(() => import("../pages/faq"));
const Gallery = lazy(() => import("../pages/gallery"));
const News = lazy(() => import("../pages/news"));
const Speakers = lazy(() => import("../pages/speaker/index"));
const Registration = lazy(() => import("../pages/registration"));
const Testimonial = lazy(() => import("../pages/testimonial"));
const Event = lazy(() => import("../pages/event"));
const EventUser = lazy(() => import("../pages/eventUser"));
const CountDate = lazy(() => import("../pages/count"));
const Deconquista = lazy(() => import("../pages/deconquista"));
const LeadersNote = lazy(() => import("../pages/leadersNote"));
const PaidReg = lazy(() => import("../pages/paidReg"));
const Attendance = lazy(() => import("../pages/attendance"));
const PageSection = lazy(() => import("../pages/pageSection"));
const SectionTheme = lazy(() => import("../pages/sectionTheme"));
const Fpackage = lazy(() => import("../pages/franchisePackage"));
const Packages = lazy(() => import("../pages/package"));
const Settings = lazy(() => import("../pages/settings"));
const WhitelistedDomains = lazy(() => import("../pages/whitelistedDomains"));
const Ticket = lazy(() => import("../pages/ticket"));
const TicketFormData = lazy(() => import("../pages/ticketFormData"));
const TicketRegistration = lazy(() => import("../pages/ticketFormData/ticketRegistration"));
const LandingPageConfig = lazy(() => import("../pages/landingPageConfig"));
const Elements = lazy(() => import("../pages/settings/elements"));
const CertificationData = lazy(() => import("../pages/certificationData"));
const Authentication = lazy(() => import("../pages/authentication"));
const Country = lazy(() => import("../pages/country"));
const Currency = lazy(() => import("../pages/currency"));
const TicketAdmin = lazy(() => import("../pages/event/ticketAdmin"));
const MenuItem = lazy(() => import("../pages/menuItem"));
const Projects = lazy(() => import("../pages/projects"));
const Model = lazy(() => import("../pages/model/index"));
const LayoutComponent = lazy(() => import("../pages/layout/index"));
const SortFilter = lazy(() => import("../pages/sortFilter/index"));
const Exhibitor = lazy(() => import("../pages/exhibitor/index"));
const ExhibitorCategory = lazy(() => import("../pages/exhibitorCategory/index"));
// const RegistrationsLead = lazy(() => import("../pages/registrationsLead/index"));
const FormBuilder = lazy(() => import("../pages/formBuilder/index"));
const BadgeCertificate = lazy(() => import("../pages/badge/index"));
const SessionType = lazy(() => import("../pages/sessionType/index"));
const EventCategory = lazy(() => import("../pages/eventCategory/index"));
const PartnersSpotlight = lazy(() => import("../pages/partnersSpotlight/index"));
const AddonProductCategory = lazy(() => import("../pages/addonProductCategory/index"));
const PaymentMethod = lazy(() => import("../pages/paymentMethod/index"));
const Template = lazy(() => import("../pages/template/index"));
const ParticipantCategory = lazy(() => import("../pages/participantCategory/index"));
const SpeakerCategory = lazy(() => import("../pages/speakerCategory/index"));
const GraphType = lazy(() => import("../pages/graphType/index"));
// const AddOn = lazy(() => import("../pages/addOn/index"));
const EventModule = lazy(() => import("../pages/eventModule/index"));
// const AddOnPrice = lazy(() => import("../pages/addOnPrice/index"));
const EventAdmin = lazy(() => import("../pages/eventAdmin/index"));
const EventTicketAdmin = lazy(() => import("../pages/ticketAdmin/index"));
const BadgeTemplate = lazy(() => import("../pages/badgeTemplate/index"));
const ItemPages = lazy(() => import("../pages/itemPages/index"));
const SubscriptionPlan = lazy(() => import("../pages/subscriptionPlan/index"));
const SubscriptionCoupon = lazy(() => import("../pages/subscriptionCoupon/index"));
const SubscriptionPlanModule = lazy(() => import("../pages/subscriptionPlanModule/index"));
const SubscribedFranchise = lazy(() => import("../pages/subscribedFranchise/index"));
const BillingAddress = lazy(() => import("../pages/billingAddress/index"));
const SubscribedFranchiseModule = lazy(() => import("../pages/subscribedFranchiseModule/index"));
const Tax = lazy(() => import("../pages/tax/index"));
const Prompt = lazy(() => import("../pages/prompt/index"));
const Stage = lazy(() => import("../pages/stage/index"));
const Day = lazy(() => import("../pages/day/index"));
const Attendee = lazy(() => import("../pages/attendee/index"));
const OrganisationSetting = lazy(() => import("../pages/organisationSetting/index"));
const TeamMember = lazy(() => import("../pages/teamMember/index"));
const Analytics = lazy(() => import("../pages/analytics/index"));
const SubscriptionOrders = lazy(() => import("../pages/subscriptionOrders/index"));
const ListingPages = lazy(() => import("../pages/listingPages/index"));
const WebsiteSettings = lazy(() => import("../pages/websiteSettings/index"));
const ActivityLog = lazy(() => import("../pages/activityLog/index"));
const TemplateCollection = lazy(() => import("../pages/templateCollection"));
const adminAutomation = lazy(() => import("../pages/adminCollectionTab/index"));
const Modules = lazy(() => import("../pages/modules/index"));
const ModulePages = lazy(() => import("../pages/modulePages/index"));
const Statistics = lazy(() => import("../pages/statistics/index"));

const RenderPage = (page, key, privileges) => {
  const renderComponent = (Component) => (
    <Suspense>
      <Component key={key} {...privileges} />
    </Suspense>
  );
  // console.log(page);

  switch (page) {
    case "login":
      return renderComponent(Landing);
    case "demo-landing":
      return renderComponent(Demo);
    case "projects":
      return renderComponent(Projects);
    case "menu":
      return renderComponent(Menu);
    case "purchase-plan":
      return renderComponent(Signup);
    case "franchise":
      return renderComponent(Franchise);
    case "userRoles":
      return renderComponent(UserType);
    case "admin":
      return renderComponent(Admin);
    case "faq":
      return renderComponent(Faq);
    case "dashboard":
      return renderComponent(Dashboard);
    case "collection":
      return renderComponent(Collection);
    case "gallery":
      return renderComponent(Gallery);
    case "news":
      return renderComponent(News);
    case "speakers":
      return renderComponent(Speakers);
    case "registration":
      return renderComponent(Registration);
    case "testimonial":
      return renderComponent(Testimonial);
    case "event":
      return renderComponent(Event);
    case "event-user":
      return renderComponent(EventUser);
    case "count":
      return renderComponent(CountDate);
    case "deconquista":
      return renderComponent(Deconquista);
    case "leadersNote":
      return renderComponent(LeadersNote);
    case "paid-reg":
      return renderComponent(PaidReg);
    case "attendance":
      return renderComponent(Attendance);
    case "page-section":
      return renderComponent(PageSection);
    case "section-theme":
      return renderComponent(SectionTheme);
    case "franchise-package":
      return renderComponent(Fpackage);
    case "package":
      return renderComponent(Packages);
    case "settings":
      return renderComponent(Settings);
    case "whitelistedDomains":
      return renderComponent(WhitelistedDomains);
    case "ticket":
      return renderComponent(Ticket);
    case "ticket-form-data":
      return renderComponent(TicketFormData);
    case "ticketRegistration":
      return renderComponent(TicketRegistration);
    case "landingPageConfig":
      return renderComponent(LandingPageConfig);
    case "elements":
      return renderComponent(Elements);
    case "certification-data":
      return renderComponent(CertificationData);
    case "authentication":
      return renderComponent(Authentication);
    case "event-admin":
      return renderComponent(Event);
    case "demo":
      return renderComponent(Demo);
    case "country":
      return renderComponent(Country);
    case "currency":
      return renderComponent(Currency);
    case "ticket-admin-portal":
    case "ticket-admin":
      return renderComponent(TicketAdmin);
    case "menu-item":
      return renderComponent(MenuItem);
    case "model":
      return renderComponent(Model);
    case "layout":
      return renderComponent(LayoutComponent);
    case "sortFilter":
      return renderComponent(SortFilter);
    case "exhibitor":
      return renderComponent(Exhibitor);
    case "exhibitor-category":
      return renderComponent(ExhibitorCategory);
    // case "registrations-lead":
    //   return renderComponent(RegistrationsLead);
    case "formBuilder":
      return renderComponent(FormBuilder);
    case "badge-certificate":
      return renderComponent(BadgeCertificate);
    case "session-type":
      return renderComponent(SessionType);
    case "event-category":
      return renderComponent(EventCategory);
    case "partners-spotlight":
      return renderComponent(PartnersSpotlight);
    case "addon-product-category":
      return renderComponent(AddonProductCategory);
    case "payment-method":
      return renderComponent(PaymentMethod);
    case "template":
      return renderComponent(Template);
    case "participant-category":
      return renderComponent(ParticipantCategory);
    case "speaker-category":
      return renderComponent(SpeakerCategory);
    case "graph-type":
      return renderComponent(GraphType);
    case "add-on":
      return renderComponent(AddOn);
    case "event-module":
      return renderComponent(EventModule);
    case "add-on-price":
      return renderComponent(AddOnPrice);
    case "eventAdmin":
      return renderComponent(EventAdmin);
    case "ticketAdmin":
      return renderComponent(EventTicketAdmin);
    case "badge-template":
      return renderComponent(BadgeTemplate);
    case "item-pages":
      return renderComponent(ItemPages);
    case "subscription-plan":
      return renderComponent(SubscriptionPlan);
    case "subscription-coupon":
      return renderComponent(SubscriptionCoupon);
    case "subscription-plan-module":
      return renderComponent(SubscriptionPlanModule);
    case "subscribed-franchise":
      return renderComponent(SubscribedFranchise);
    case "billing-address":
      return renderComponent(BillingAddress);
    case "subscribed-franchise-module":
      return renderComponent(SubscribedFranchiseModule);
    case "tax":
      return renderComponent(Tax);
    case "prompt":
      return renderComponent(Prompt);
    case "stage":
      return renderComponent(Stage);
    case "day":
      return renderComponent(Day);
    case "ticket-registration":
      return renderComponent(Attendee);
    case "organisation-setting":
      return renderComponent(OrganisationSetting);
    case "team-member":
      return renderComponent(TeamMember);
    case "analytics":
      return renderComponent(Analytics);
    case "subscription-orders":
      return renderComponent(SubscriptionOrders);
    case "listing-page":
      return renderComponent(ListingPages);
    case "website-settings":
      return renderComponent(WebsiteSettings);
    case "activity-log":
      return renderComponent(ActivityLog);
    case "template-collection":
      return renderComponent(TemplateCollection);
    case "templateAutomationCollection":
      return renderComponent(adminAutomation);
    case "modules":
      return renderComponent(Modules);
    case "module-pages":
      return renderComponent(ModulePages);
    case "statistics":
      return renderComponent(Statistics);
    default:
      return <Page404 />;
  }
};

export default RenderPage;
