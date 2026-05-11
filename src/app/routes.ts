import { createBrowserRouter } from "react-router";

// Public Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RoleSelectPage from "./pages/RoleSelectPage";
import ExplorePage from "./pages/ExplorePage";
import PricingPage from "./pages/PricingPage";

// Client Dashboard Pages
import ClientDashboard from "./pages/client/DashboardPage";
import ClientProjects from "./pages/client/ProjectsPage";
import ClientProjectDetail from "./pages/client/ProjectDetailPage";
import ClientFindFreelancer from "./pages/client/FindFreelancerPage";
import ClientMessages from "./pages/client/MessagesPage";
import ClientNotifications from "./pages/client/NotificationsPage";
import ClientPayments from "./pages/client/PaymentsPage";
import ClientPaymentDetail from "./pages/client/PaymentDetailPage";
import ClientSettings from "./pages/client/SettingsPage";

// Freelancer Dashboard Pages
import FreelancerDashboard from "./pages/freelancer/DashboardPage";
import FreelancerJobRequests from "./pages/freelancer/JobRequestsPage";
import FreelancerProjects from "./pages/freelancer/ProjectsPage";
import FreelancerProjectDetail from "./pages/freelancer/ProjectDetailPage";
import FreelancerPortfolio from "./pages/freelancer/PortfolioPage";
import FreelancerEarnings from "./pages/freelancer/EarningsPage";
import FreelancerMessages from "./pages/freelancer/MessagesPage";
import FreelancerNotifications from "./pages/freelancer/NotificationsPage";
import FreelancerSettings from "./pages/freelancer/SettingsPage";

// Shared Pages
import PostJobPage from "./pages/PostJobPage";
import FreelancerProfilePage from "./pages/FreelancerProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/register",
    Component: RegisterPage,
  },
  {
    path: "/role-select",
    Component: RoleSelectPage,
  },
  {
    path: "/explore",
    Component: ExplorePage,
  },
  {
    path: "/pricing",
    Component: PricingPage,
  },
  // Client Dashboard Routes
  {
    path: "/dashboard/client",
    Component: ClientDashboard,
  },
  {
    path: "/dashboard/client/projects",
    Component: ClientProjects,
  },
  {
    path: "/dashboard/client/projects/:id",
    Component: ClientProjectDetail,
  },
  {
    path: "/dashboard/client/find-freelancer",
    Component: ClientFindFreelancer,
  },
  {
    path: "/dashboard/client/messages",
    Component: ClientMessages,
  },
  {
    path: "/dashboard/client/notifications",
    Component: ClientNotifications,
  },
  {
    path: "/dashboard/client/payments",
    Component: ClientPayments,
  },
  {
    path: "/dashboard/client/payments/:id",
    Component: ClientPaymentDetail,
  },
  {
    path: "/dashboard/client/settings",
    Component: ClientSettings,
  },
  // Freelancer Dashboard Routes
  {
    path: "/dashboard/freelancer",
    Component: FreelancerDashboard,
  },
  {
    path: "/dashboard/freelancer/requests",
    Component: FreelancerJobRequests,
  },
  {
    path: "/dashboard/freelancer/projects",
    Component: FreelancerProjects,
  },
  {
    path: "/dashboard/freelancer/projects/:id",
    Component: FreelancerProjectDetail,
  },
  {
    path: "/dashboard/freelancer/portfolio",
    Component: FreelancerPortfolio,
  },
  {
    path: "/dashboard/freelancer/earnings",
    Component: FreelancerEarnings,
  },
  {
    path: "/dashboard/freelancer/messages",
    Component: FreelancerMessages,
  },
  {
    path: "/dashboard/freelancer/notifications",
    Component: FreelancerNotifications,
  },
  {
    path: "/dashboard/freelancer/settings",
    Component: FreelancerSettings,
  },
  // Shared Routes
  {
    path: "/post-job",
    Component: PostJobPage,
  },
  {
    path: "/freelancer/:id",
    Component: FreelancerProfilePage,
  },
  // 404 Catch-all route
  {
    path: "*",
    Component: NotFoundPage,
  },
]);
