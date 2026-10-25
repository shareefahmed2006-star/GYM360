import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { RoleRoute } from './components/guards/RoleRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { MemberLayout } from './components/layout/MemberLayout';
import { TrainerLayout } from './components/layout/TrainerLayout';
import { useAuth } from './hooks/useAuth';

// Suspense loading fallback
const PageLoader: React.FC = () => (
  <div className="flex min-h-[400px] w-full items-center justify-center p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gym-600 border-t-transparent" />
      <span className="text-sm font-medium text-gray-500">Loading page...</span>
    </div>
  </div>
);

const withSuspense = (LazyComponent: React.LazyExoticComponent<React.ComponentType<any>>) => (
  <Suspense fallback={<PageLoader />}>
    <LazyComponent />
  </Suspense>
);

// Lazy-loaded Auth & Error Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const UnauthorizedPage = lazy(() => import('./pages/error/UnauthorizedPage').then((m) => ({ default: m.UnauthorizedPage })));
const NotFoundPage = lazy(() => import('./pages/error/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// Lazy-loaded Admin Pages
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const BranchListPage = lazy(() => import('./pages/admin/BranchListPage').then((m) => ({ default: m.BranchListPage })));
const BranchDetailPage = lazy(() => import('./pages/admin/BranchDetailPage').then((m) => ({ default: m.BranchDetailPage })));
const MemberListPage = lazy(() => import('./pages/admin/MemberListPage').then((m) => ({ default: m.MemberListPage })));
const MemberDetailPage = lazy(() => import('./pages/admin/MemberDetailPage').then((m) => ({ default: m.MemberDetailPage })));
const PlanListPage = lazy(() => import('./pages/admin/PlanListPage').then((m) => ({ default: m.PlanListPage })));
const PlanDetailPage = lazy(() => import('./pages/admin/PlanDetailPage').then((m) => ({ default: m.PlanDetailPage })));
const MembershipListPage = lazy(() => import('./pages/admin/MembershipListPage').then((m) => ({ default: m.MembershipListPage })));
const MembershipDetailPage = lazy(() => import('./pages/admin/MembershipDetailPage').then((m) => ({ default: m.MembershipDetailPage })));
const PaymentListPage = lazy(() => import('./pages/admin/PaymentListPage').then((m) => ({ default: m.PaymentListPage })));
const PaymentDetailPage = lazy(() => import('./pages/admin/PaymentDetailPage').then((m) => ({ default: m.PaymentDetailPage })));
const AttendanceListPage = lazy(() => import('./pages/admin/AttendanceListPage').then((m) => ({ default: m.AttendanceListPage })));
const TrainerListPage = lazy(() => import('./pages/admin/TrainerListPage').then((m) => ({ default: m.TrainerListPage })));
const TrainerDetailPage = lazy(() => import('./pages/admin/TrainerDetailPage').then((m) => ({ default: m.TrainerDetailPage })));
const EquipmentListPage = lazy(() => import('./pages/admin/EquipmentListPage').then((m) => ({ default: m.EquipmentListPage })));
const EquipmentDetailPage = lazy(() => import('./pages/admin/EquipmentDetailPage').then((m) => ({ default: m.EquipmentDetailPage })));
const MaintenanceListPage = lazy(() => import('./pages/admin/MaintenanceListPage').then((m) => ({ default: m.MaintenanceListPage })));
const MaintenanceDetailPage = lazy(() => import('./pages/admin/MaintenanceDetailPage').then((m) => ({ default: m.MaintenanceDetailPage })));
const NotificationListPage = lazy(() => import('./pages/admin/NotificationListPage').then((m) => ({ default: m.NotificationListPage })));
const NotificationDetailPage = lazy(() => import('./pages/admin/NotificationDetailPage').then((m) => ({ default: m.NotificationDetailPage })));
const AnalyticsPage = lazy(() => import('./pages/admin/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));
const AuditLogListPage = lazy(() => import('./pages/admin/AuditLogListPage').then((m) => ({ default: m.AuditLogListPage })));
const OrganizationPage = lazy(() => import('./pages/admin/OrganizationPage').then((m) => ({ default: m.OrganizationPage })));
const ExportDataPage = lazy(() => import('./pages/admin/ExportDataPage').then((m) => ({ default: m.ExportDataPage })));

// Lazy-loaded Member Pages
const MemberDashboardPage = lazy(() => import('./pages/member/MemberDashboardPage').then((m) => ({ default: m.MemberDashboardPage })));
const MemberCheckInPage = lazy(() => import('./pages/member/MemberCheckInPage').then((m) => ({ default: m.MemberCheckInPage })));
const MemberWorkoutsPage = lazy(() => import('./pages/member/MemberWorkoutsPage').then((m) => ({ default: m.MemberWorkoutsPage })));
const MemberSessionsPage = lazy(() => import('./pages/member/MemberSessionsPage').then((m) => ({ default: m.MemberSessionsPage })));
const MemberNotificationsPage = lazy(() => import('./pages/member/MemberNotificationsPage').then((m) => ({ default: m.MemberNotificationsPage })));

// Lazy-loaded Trainer Pages
const TrainerDashboardPage = lazy(() => import('./pages/trainer/TrainerDashboardPage').then((m) => ({ default: m.TrainerDashboardPage })));
const TrainerSessionsPage = lazy(() => import('./pages/trainer/TrainerSessionsPage').then((m) => ({ default: m.TrainerSessionsPage })));
const TrainerClientsPage = lazy(() => import('./pages/trainer/TrainerClientsPage').then((m) => ({ default: m.TrainerClientsPage })));

// Root redirect handler based on authenticated role
const RootRedirect = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (user.role === 'trainer') {
    return <Navigate to="/trainer/dashboard" replace />;
  }
  return <Navigate to="/member/dashboard" replace />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/login',
    element: withSuspense(LoginPage),
  },
  {
    path: '/forgot-password',
    element: withSuspense(ForgotPasswordPage),
  },
  {
    path: '/reset-password',
    element: withSuspense(ResetPasswordPage),
  },
  {
    path: '/unauthorized',
    element: withSuspense(UnauthorizedPage),
  },

  // ADMIN SECTION
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <RoleRoute allowedRoles={['admin']}>
          <AdminLayout />
        </RoleRoute>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: withSuspense(AdminDashboardPage),
      },
      {
        path: 'organization',
        element: withSuspense(OrganizationPage),
      },
      {
        path: 'branches',
        element: withSuspense(BranchListPage),
      },
      {
        path: 'branches/:branchId',
        element: withSuspense(BranchDetailPage),
      },
      {
        path: 'members',
        element: withSuspense(MemberListPage),
      },
      {
        path: 'members/:memberId',
        element: withSuspense(MemberDetailPage),
      },
      {
        path: 'plans',
        element: withSuspense(PlanListPage),
      },
      {
        path: 'plans/:planId',
        element: withSuspense(PlanDetailPage),
      },
      {
        path: 'memberships',
        element: withSuspense(MembershipListPage),
      },
      {
        path: 'memberships/:membershipId',
        element: withSuspense(MembershipDetailPage),
      },
      {
        path: 'payments',
        element: withSuspense(PaymentListPage),
      },
      {
        path: 'payments/:paymentId',
        element: withSuspense(PaymentDetailPage),
      },
      {
        path: 'attendance',
        element: withSuspense(AttendanceListPage),
      },
      {
        path: 'trainers',
        element: withSuspense(TrainerListPage),
      },
      {
        path: 'trainers/:trainerId',
        element: withSuspense(TrainerDetailPage),
      },
      {
        path: 'equipment',
        element: withSuspense(EquipmentListPage),
      },
      {
        path: 'equipment/:equipmentId',
        element: withSuspense(EquipmentDetailPage),
      },
      {
        path: 'maintenance',
        element: withSuspense(MaintenanceListPage),
      },
      {
        path: 'maintenance/:maintenanceLogId',
        element: withSuspense(MaintenanceDetailPage),
      },
      {
        path: 'notifications',
        element: withSuspense(NotificationListPage),
      },
      {
        path: 'notifications/:notificationId',
        element: withSuspense(NotificationDetailPage),
      },
      {
        path: 'analytics',
        element: withSuspense(AnalyticsPage),
      },
      {
        path: 'audit-logs',
        element: withSuspense(AuditLogListPage),
      },
      {
        path: 'export',
        element: withSuspense(ExportDataPage),
      },
    ],
  },

  // MEMBER SECTION
  {
    path: '/member',
    element: (
      <ProtectedRoute>
        <RoleRoute allowedRoles={['member']}>
          <MemberLayout />
        </RoleRoute>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/member/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: withSuspense(MemberDashboardPage),
      },
      {
        path: 'check-in',
        element: withSuspense(MemberCheckInPage),
      },
      {
        path: 'workouts',
        element: withSuspense(MemberWorkoutsPage),
      },
      {
        path: 'sessions',
        element: withSuspense(MemberSessionsPage),
      },
      {
        path: 'notifications',
        element: withSuspense(MemberNotificationsPage),
      },
    ],
  },

  // TRAINER SECTION
  {
    path: '/trainer',
    element: (
      <ProtectedRoute>
        <RoleRoute allowedRoles={['trainer']}>
          <TrainerLayout />
        </RoleRoute>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/trainer/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: withSuspense(TrainerDashboardPage),
      },
      {
        path: 'sessions',
        element: withSuspense(TrainerSessionsPage),
      },
      {
        path: 'clients',
        element: withSuspense(TrainerClientsPage),
      },
    ],
  },

  // 404 CATCH-ALL
  {
    path: '*',
    element: withSuspense(NotFoundPage),
  },
]);
