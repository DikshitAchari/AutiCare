import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { AppointmentProvider } from './context/AppointmentContext';
import { NotificationProvider } from './context/NotificationContext';
import { MessageProvider } from './context/MessageContext';

import { ToastContainer } from './components/ui/Toast';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute, RoleRoute } from './routes/RouteGuards';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';

// Parent Portal Pages
import { ParentDashboard } from './pages/parent/ParentDashboard';
import { ChildrenPage } from './pages/parent/ChildrenPage';
import { AssessmentPage } from './pages/parent/AssessmentPage';
import { VideoUploadPage } from './pages/parent/VideoUploadPage';
import { AssessmentResultsPage } from './pages/parent/AssessmentResultsPage';
import { TherapistsPage } from './pages/parent/TherapistsPage';
import { TherapistProfilePage } from './pages/parent/TherapistProfilePage';
import { ParentAppointmentsPage } from './pages/parent/ParentAppointmentsPage';
import { ParentMessagesPage } from './pages/parent/ParentMessagesPage';
import { ParentNotificationsPage } from './pages/parent/ParentNotificationsPage';
import { ParentProfilePage } from './pages/parent/ParentProfilePage';

// Therapist Portal Pages
import { TherapistDashboard } from './pages/therapist/TherapistDashboard';
import { TherapistChildrenPage } from './pages/therapist/TherapistChildrenPage';
import { TherapistAppointmentsPage } from './pages/therapist/TherapistAppointmentsPage';
import { TherapistSchedulePage } from './pages/therapist/TherapistSchedulePage';
import { BehaviorAnalysisPage } from './pages/therapist/BehaviorAnalysisPage';
import { TherapistReportsPage } from './pages/therapist/TherapistReportsPage';
import { TherapistMessagesPage } from './pages/therapist/TherapistMessagesPage';
import { TherapistProfilePage as TherapistOwnProfilePage } from './pages/therapist/TherapistProfilePage';

// Admin Portal Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminTherapistsPage } from './pages/admin/AdminTherapistsPage';
import { AdminParentsPage } from './pages/admin/AdminParentsPage';
import { AdminChildrenPage } from './pages/admin/AdminChildrenPage';
import { AdminAppointmentsPage } from './pages/admin/AdminAppointmentsPage';
import { AdminAssessmentsPage } from './pages/admin/AdminAssessmentsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminSystemPage } from './pages/admin/AdminSystemPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppointmentProvider>
          <NotificationProvider>
            <MessageProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public Landing & Authentication */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />

                  {/* Protected Portals */}
                  <Route element={<ProtectedRoute />}>
                    {/* PARENT PORTAL */}
                    <Route element={<RoleRoute allowedRole="PARENT" />}>
                      <Route
                        path="/parent/*"
                        element={
                          <DashboardLayout>
                            <Routes>
                              <Route path="dashboard" element={<ParentDashboard />} />
                              <Route path="children" element={<ChildrenPage />} />
                              <Route path="assessment" element={<AssessmentPage />} />
                              <Route path="assessment/new" element={<AssessmentPage />} />
                              <Route path="upload-video" element={<VideoUploadPage />} />
                              <Route path="results" element={<AssessmentResultsPage />} />
                              <Route path="therapists" element={<TherapistsPage />} />
                              <Route path="therapists/:id" element={<TherapistProfilePage />} />
                              <Route path="appointments" element={<ParentAppointmentsPage />} />
                              <Route path="progress" element={<ChildrenPage />} />
                              <Route path="messages" element={<ParentMessagesPage />} />
                              <Route path="notifications" element={<ParentNotificationsPage />} />
                              <Route path="profile" element={<ParentProfilePage />} />
                              <Route path="*" element={<Navigate to="dashboard" replace />} />
                            </Routes>
                          </DashboardLayout>
                        }
                      />
                    </Route>

                    {/* THERAPIST PORTAL */}
                    <Route element={<RoleRoute allowedRole="THERAPIST" />}>
                      <Route
                        path="/therapist/*"
                        element={
                          <DashboardLayout>
                            <Routes>
                              <Route path="dashboard" element={<TherapistDashboard />} />
                              <Route path="children" element={<TherapistChildrenPage />} />
                              <Route path="appointments" element={<TherapistAppointmentsPage />} />
                              <Route path="schedule" element={<TherapistSchedulePage />} />
                              <Route path="behavior-analysis" element={<BehaviorAnalysisPage />} />
                              <Route path="reports" element={<TherapistReportsPage />} />
                              <Route path="messages" element={<TherapistMessagesPage />} />
                              <Route path="profile" element={<TherapistOwnProfilePage />} />
                              <Route path="*" element={<Navigate to="dashboard" replace />} />
                            </Routes>
                          </DashboardLayout>
                        }
                      />
                    </Route>

                    {/* ADMIN PORTAL */}
                    <Route element={<RoleRoute allowedRole="ADMIN" />}>
                      <Route
                        path="/admin/*"
                        element={
                          <DashboardLayout>
                            <Routes>
                              <Route path="dashboard" element={<AdminDashboard />} />
                              <Route path="therapists" element={<AdminTherapistsPage />} />
                              <Route path="parents" element={<AdminParentsPage />} />
                              <Route path="children" element={<AdminChildrenPage />} />
                              <Route path="appointments" element={<AdminAppointmentsPage />} />
                              <Route path="assessments" element={<AdminAssessmentsPage />} />
                              <Route path="reports" element={<AdminReportsPage />} />
                              <Route path="system" element={<AdminSystemPage />} />
                              <Route path="profile" element={<AdminProfilePage />} />
                              <Route path="*" element={<Navigate to="dashboard" replace />} />
                            </Routes>
                          </DashboardLayout>
                        }
                      />
                    </Route>
                  </Route>

                  {/* Fallback route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <ToastContainer />
              </BrowserRouter>
            </MessageProvider>
          </NotificationProvider>
        </AppointmentProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
