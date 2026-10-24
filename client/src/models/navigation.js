/** Single source of truth for the menu — sidebar, drawer, bottom bar and page titles all read from here. */
export const NAV = [
  { label: 'Dashboard', to: '/', icon: 'layers', end: true },
  { label: 'Course', to: '/courses', icon: 'book' },
  { label: 'Exam', icon: 'exam', children: [
    { label: 'Assessment Result', to: '/exams/assessments' },
    { label: 'Exam Seating Plan', to: '/exams/seating' },
    { label: 'Online Exam', to: '/exams/online' },
    { label: 'Student Unofficial Transcript', to: '/exams/transcript' },
    { label: 'Print Admit Card', to: '/exams/admit-card' },
    { label: 'Print Lab Admit Card', to: '/exams/lab-admit-card' },
  ] },
  { label: 'Fee', icon: 'money', children: [
    { label: 'My General Ledger', to: '/fees/ledger' },
    { label: 'Student Advance Fee', to: '/fees/advance' },
  ] },
  { label: 'General', icon: 'list', children: [
    { label: 'Time Table', to: '/general/timetable' },
    { label: 'Todo List', to: '/general/todo' },
    { label: 'Attendance', to: '/general/attendance' },
    { label: 'New Communication', to: '/general/communication' },
    { label: 'Road Map', to: '/general/roadmap' },
    { label: 'Work Flow', to: '/general/workflow' },
    { label: 'Change Password', to: '/general/password' },
    { label: 'Student Program Outcome (PLO) Attainment', to: '/general/plo' },
  ] },
  { label: 'Registration', icon: 'laptop', children: [{ label: 'Register Online (For Regular)', to: '/registration' }] },
  { label: 'More', icon: 'user', children: [
    { label: 'My Profile', to: '/profile' },
    { label: 'Announcements', to: '/announcements' },
    { label: 'Feedback & Surveys', to: '/surveys' },
    { label: 'Activity Log', to: '/activity' },
    { label: 'My Messages', to: '/communicator' },
  ] },
];

/** The five destinations students use most, for thumb-reach on phones. */
export const BOTTOM_NAV = [
  { label: 'Home', to: '/', icon: 'home', end: true },
  { label: 'Attendance', to: '/general/attendance', icon: 'check' },
  { label: 'Timetable', to: '/general/timetable', icon: 'calendar' },
  { label: 'Fees', to: '/fees/ledger', icon: 'wallet' },
];

const flat = NAV.flatMap((n) => (n.children ? n.children.map((c) => ({ ...c, group: n.label })) : [n]));
export const titleFor = (pathname) => flat.find((n) => n.to === pathname)?.label ?? (pathname.startsWith('/courses/') ? 'Course' : null);
export const groupFor = (pathname) => flat.find((n) => n.to === pathname)?.group ?? null;
