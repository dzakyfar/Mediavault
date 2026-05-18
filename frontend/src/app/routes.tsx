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
import RequireAuth from "./components/auth/RequireAuth";

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
    Component: () => (
      <RequireAuth>
        <RoleSelectPage />
      </RequireAuth>
    ),
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
    Component: () => (
      <RequireAuth roles={["CLIENT", "BOTH"]}>
        <ClientDashboard />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/client/projects",
    Component: () => (
      <RequireAuth roles={["CLIENT", "BOTH"]}>
        <ClientProjects />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/client/projects/:id",
    Component: () => (
      <RequireAuth roles={["CLIENT", "BOTH"]}>
        <ClientProjectDetail />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/client/find-freelancer",
    Component: () => (
      <RequireAuth roles={["CLIENT", "BOTH"]}>
        <ClientFindFreelancer />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/client/messages",
    Component: () => (
      <RequireAuth roles={["CLIENT", "BOTH"]}>
        <ClientMessages />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/client/notifications",
    Component: () => (
      <RequireAuth roles={["CLIENT", "BOTH"]}>
        <ClientNotifications />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/client/payments",
    Component: () => (
      <RequireAuth roles={["CLIENT", "BOTH"]}>
        <ClientPayments />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/client/payments/:id",
    Component: () => (
      <RequireAuth roles={["CLIENT", "BOTH"]}>
        <ClientPaymentDetail />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/client/settings",
    Component: () => (
      <RequireAuth roles={["CLIENT", "BOTH"]}>
        <ClientSettings />
      </RequireAuth>
    ),
  },
  // Freelancer Dashboard Routes
  {
    path: "/dashboard/freelancer",
    Component: () => (
      <RequireAuth roles={["FREELANCER", "BOTH"]}>
        <FreelancerDashboard />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/freelancer/requests",
    Component: () => (
      <RequireAuth roles={["FREELANCER", "BOTH"]}>
        <FreelancerJobRequests />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/freelancer/projects",
    Component: () => (
      <RequireAuth roles={["FREELANCER", "BOTH"]}>
        <FreelancerProjects />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/freelancer/projects/:id",
    Component: () => (
      <RequireAuth roles={["FREELANCER", "BOTH"]}>
        <FreelancerProjectDetail />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/freelancer/portfolio",
    Component: () => (
      <RequireAuth roles={["FREELANCER", "BOTH"]}>
        <FreelancerPortfolio />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/freelancer/earnings",
    Component: () => (
      <RequireAuth roles={["FREELANCER", "BOTH"]}>
        <FreelancerEarnings />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/freelancer/messages",
    Component: () => (
      <RequireAuth roles={["FREELANCER", "BOTH"]}>
        <FreelancerMessages />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/freelancer/notifications",
    Component: () => (
      <RequireAuth roles={["FREELANCER", "BOTH"]}>
        <FreelancerNotifications />
      </RequireAuth>
    ),
  },
  {
    path: "/dashboard/freelancer/settings",
    Component: () => (
      <RequireAuth roles={["FREELANCER", "BOTH"]}>
        <FreelancerSettings />
      </RequireAuth>
    ),
  },
  // Shared Routes
  {
    path: "/post-job",
    Component: () => (
      <RequireAuth roles={["CLIENT", "BOTH"]}>
        <PostJobPage />
      </RequireAuth>
    ),
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
