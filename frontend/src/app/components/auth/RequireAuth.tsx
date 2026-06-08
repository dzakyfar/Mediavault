import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { UserRole } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface RequireAuthProps {
  children: ReactNode;
  roles?: UserRole[];
}

export default function RequireAuth({ children, roles }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        Loading MediaVault...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !user.role) {
    return <Navigate to="/role-select" replace />;
  }

  const needsFreelancerProfile = Boolean(
    roles?.includes('FREELANCER')
    && user.role
    && ['FREELANCER', 'BOTH'].includes(user.role)
    && (!user.bio || !user.specialty || !user.startingPrice)
    && location.pathname !== '/freelancer-onboarding'
  );

  if (needsFreelancerProfile) {
    return <Navigate to="/freelancer-onboarding" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const fallback = user.role === 'FREELANCER' ? '/dashboard/freelancer' : '/dashboard/client';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
