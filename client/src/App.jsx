import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './controllers/AuthContext.jsx';
import { AppShell } from './views/layout/AppShell.jsx';
import { DefaultSkeleton } from './views/ui/Async.jsx';
import { Spinner } from './views/ui/primitives.jsx';

// Each page is its own chunk: the first screen downloads only what it needs.
const page = (loader) => lazy(loader);
const Login = page(() => import('./views/pages/Login.jsx'));
const Dashboard = page(() => import('./views/pages/Dashboard.jsx'));
const Courses = page(() => import('./views/pages/Courses.jsx'));
const CourseDetail = page(() => import('./views/pages/CourseDetail.jsx'));
const Assessments = page(() => import('./views/pages/Assessments.jsx'));
const Seating = page(() => import('./views/pages/Seating.jsx'));
const OnlineExams = page(() => import('./views/pages/OnlineExams.jsx'));
const Transcript = page(() => import('./views/pages/Transcript.jsx'));
const AdmitCard = page(() => import('./views/pages/AdmitCard.jsx'));
const Ledger = page(() => import('./views/pages/Ledger.jsx'));
const AdvanceFee = page(() => import('./views/pages/AdvanceFee.jsx'));
const Timetable = page(() => import('./views/pages/Timetable.jsx'));
const Todo = page(() => import('./views/pages/Todo.jsx'));
const Attendance = page(() => import('./views/pages/Attendance.jsx'));
const Communication = page(() => import('./views/pages/Communication.jsx'));
const Messages = page(() => import('./views/pages/Messages.jsx'));
const Roadmap = page(() => import('./views/pages/Roadmap.jsx'));
const Workflow = page(() => import('./views/pages/Workflow.jsx'));
const Plo = page(() => import('./views/pages/Plo.jsx'));
const ChangePassword = page(() => import('./views/pages/ChangePassword.jsx'));
const Registration = page(() => import('./views/pages/Registration.jsx'));
const Profile = page(() => import('./views/pages/Profile.jsx'));
const Announcements = page(() => import('./views/pages/Announcements.jsx'));
const Surveys = page(() => import('./views/pages/Surveys.jsx'));
const Activity = page(() => import('./views/pages/Activity.jsx'));
const NotFound = page(() => import('./views/pages/NotFound.jsx'));

function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <div className="login__panel"><Spinner label="Checking your session" /></div>;
  if (status === 'anon') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <AppShell />;
}

export function App() {
  return (
    <Suspense fallback={<div className="main"><DefaultSkeleton /></div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="exams/assessments" element={<Assessments />} />
          <Route path="exams/seating" element={<Seating />} />
          <Route path="exams/online" element={<OnlineExams />} />
          <Route path="exams/transcript" element={<Transcript />} />
          <Route path="exams/admit-card" element={<AdmitCard kind="FINAL" />} />
          <Route path="exams/lab-admit-card" element={<AdmitCard kind="LAB" />} />
          <Route path="fees/ledger" element={<Ledger />} />
          <Route path="fees/advance" element={<AdvanceFee />} />
          <Route path="general/timetable" element={<Timetable />} />
          <Route path="general/todo" element={<Todo />} />
          <Route path="general/attendance" element={<Attendance />} />
          <Route path="general/communication" element={<Communication />} />
          <Route path="communicator" element={<Messages />} />
          <Route path="general/roadmap" element={<Roadmap />} />
          <Route path="general/workflow" element={<Workflow />} />
          <Route path="general/plo" element={<Plo />} />
          <Route path="general/password" element={<ChangePassword />} />
          <Route path="registration" element={<Registration />} />
          <Route path="profile" element={<Profile />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="surveys" element={<Surveys />} />
          <Route path="activity" element={<Activity />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
