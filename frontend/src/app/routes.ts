import { createBrowserRouter, Navigate } from 'react-router';
import type { ComponentType, ReactNode } from 'react';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RoleSelectPage from './pages/RoleSelectPage';
import ExplorePage from './pages/ExplorePage';
import PricingPage from './pages/PricingPage';

// Client Dashboard Pages
import ClientDashboard from './pages/client/DashboardPage';
import ClientProjects from './pages/client/ProjectsPage';
import ClientProjectDetail from './pages/client/ProjectDetailPage';
import ClientFindFreelancer from './pages/client/FindFreelancerPage';
import ClientMessages from './pages/client/MessagesPage';
import ClientNotifications from './pages/client/NotificationsPage';
import ClientPayments from './pages/client/PaymentsPage';
import ClientPaymentDetail from './pages/client/PaymentDetailPage';
import ClientSettings from './pages/client/SettingsPage';

// Freelancer Dashboard Pages
import FreelancerDashboard from './pages/freelancer/DashboardPage';
import FreelancerJobRequests from './pages/freelancer/JobRequestsPage';
import FreelancerProjects from './pages/freelancer/ProjectsPage';
import FreelancerProjectDetail from './pages/freelancer/ProjectDetailPage';
import FreelancerPortfolio from './pages/freelancer/PortfolioPage';
import FreelancerEarnings from './pages/freelancer/EarningsPage';
import FreelancerMessages from './pages/freelancer/MessagesPage';
import FreelancerNotifications from './pages/freelancer/NotificationsPage';
import FreelancerSettings from './pages/freelancer/SettingsPage';

// Shared Pages
import PostJobPage from './pages/PostJobPage';
import FreelancerProfilePage from './pages/FreelancerProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import PageTransition from './components/PageTransition';
import { canUseRole, getCurrentUser, getDefaultDashboardPath } from './lib/mockAuth';
import type { UserRole } from './lib/mockAuth';

function AnimatedPage({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}

function publicPage(Page: ComponentType) {
  return (
    <AnimatedPage>
      <Page />
    </AnimatedPage>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  return <AnimatedPage>{children}</AnimatedPage>;
}

function RequireRole({ role, children }: { role: UserRole; children: ReactNode }) {
  const user = getCurrentUser();

  if (!user) return <Navigate to="/login" replace />;
  if (!user.roles.length) return <Navigate to="/role-select" replace />;
  if (!canUseRole(role)) return <Navigate to={getDefaultDashboardPath(user)} replace />;

  return <AnimatedPage>{children}</AnimatedPage>;
}

function rolePage(role: UserRole, Page: ComponentType) {
  return (
    <RequireRole role={role}>
      <Page />
    </RequireRole>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: publicPage(LandingPage),
  },
  {
    path: '/login',
    element: publicPage(LoginPage),
  },
  {
    path: '/register',
    element: publicPage(RegisterPage),
  },
  {
    path: '/role-select',
    element: (
      <RequireAuth>
        <RoleSelectPage />
      </RequireAuth>
    ),
  },
  {
    path: '/explore',
    element: publicPage(ExplorePage),
  },
  {
    path: '/pricing',
    element: publicPage(PricingPage),
  },
  // Client Dashboard Routes
  {
    path: '/dashboard/client',
    element: rolePage('client', ClientDashboard),
  },
  {
    path: '/dashboard/client/projects',
    element: rolePage('client', ClientProjects),
  },
  {
    path: '/dashboard/client/projects/:id',
    element: rolePage('client', ClientProjectDetail),
  },
  {
    path: '/dashboard/client/find-freelancer',
    element: rolePage('client', ClientFindFreelancer),
  },
  {
    path: '/dashboard/client/messages',
    element: rolePage('client', ClientMessages),
  },
  {
    path: '/dashboard/client/notifications',
    element: rolePage('client', ClientNotifications),
  },
  {
    path: '/dashboard/client/payments',
    element: rolePage('client', ClientPayments),
  },
  {
    path: '/dashboard/client/payments/:id',
    element: rolePage('client', ClientPaymentDetail),
  },
  {
    path: '/dashboard/client/settings',
    element: rolePage('client', ClientSettings),
  },
  // Freelancer Dashboard Routes
  {
    path: '/dashboard/freelancer',
    element: rolePage('freelancer', FreelancerDashboard),
  },
  {
    path: '/dashboard/freelancer/requests',
    element: rolePage('freelancer', FreelancerJobRequests),
  },
  {
    path: '/dashboard/freelancer/projects',
    element: rolePage('freelancer', FreelancerProjects),
  },
  {
    path: '/dashboard/freelancer/projects/:id',
    element: rolePage('freelancer', FreelancerProjectDetail),
  },
  {
    path: '/dashboard/freelancer/portfolio',
    element: rolePage('freelancer', FreelancerPortfolio),
  },
  {
    path: '/dashboard/freelancer/earnings',
    element: rolePage('freelancer', FreelancerEarnings),
  },
  {
    path: '/dashboard/freelancer/messages',
    element: rolePage('freelancer', FreelancerMessages),
  },
  {
    path: '/dashboard/freelancer/notifications',
    element: rolePage('freelancer', FreelancerNotifications),
  },
  {
    path: '/dashboard/freelancer/settings',
    element: rolePage('freelancer', FreelancerSettings),
  },
  // Shared Routes
  {
    path: '/post-job',
    element: rolePage('client', PostJobPage),
  },
  {
    path: '/freelancer/:id',
    element: publicPage(FreelancerProfilePage),
  },
  // 404 Catch-all route
  {
    path: '*',
    element: publicPage(NotFoundPage),
  },
]);
