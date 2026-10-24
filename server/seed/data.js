/**
 * Demo data. The *shape* mirrors what the live UIT portal exposes (modules, columns, status codes);
 * every person, number and message is fictional.
 */
export const DEMO_PASSWORD = 'Portal@2026';

export const SESSIONS = [
  ['Fall 2023', '2023-08-14', '2023-12-22'], ['Spring 2024', '2024-02-19', '2024-06-14'],
  ['Fall 2024', '2024-08-19', '2024-12-20'], ['Spring 2025', '2025-02-17', '2025-06-13'],
  ['Summer 2025', '2025-06-23', '2025-08-08'], ['Fall 2025', '2025-08-18', '2025-12-19'],
  ['Spring 2026', '2026-02-16', '2026-06-12'], ['Fall 2026', '2026-08-17', '2026-12-18'],
  ['Spring 2027', '2027-02-15', '2027-06-11'],
];
export const CURRENT_SESSION = 'Fall 2026';
export const NEXT_SESSION = 'Spring 2027';

export const FACULTY = [
  ['601', 'Dr. Nadia Farooqui'], ['602', 'Prof. Imran Siddiqui'], ['603', 'Ms. Hina Qureshi'],
  ['604', 'Mr. Faisal Mehmood'], ['605', 'Dr. Sana Rizvi'], ['606', 'Mr. Danish Ansari'],
  ['607', 'Ms. Rabia Hashmi'], ['608', 'Dr. Tariq Lodhi'], ['609', 'Mr. Owais Jamil'],
];

export const STAFF = [
  ['720', 'Aamir Siddiqui', 'Registrar Office'], ['721', 'Sadia Parveen', 'Accounts Office'], ['722', 'Kamran Ali', 'Examination Cell'],
];

export const CLASSMATES = ['Hamza Iqbal', 'Maryam Siddiqui', 'Zain Ul Abideen', 'Areeba Khan', 'Saad Mirza', 'Noor Fatima'];

// [semester, code, title, kind, credits, category, requirement, prereq, session, facultyIdx]
export const CURRICULUM = [
  [1, 'CSE-101', 'Programming Fundamentals', 'TH', 3, 'Comp.Core', 'Core', null, 'Fall 2023', 0],
  [1, 'CSE-101 (P)', 'Programming Fundamentals Lab', 'LAB', 1, 'Comp.Core', 'Core', null, 'Fall 2023', 0],
  [1, 'MSC-101', 'Calculus & Analytical Geometry', 'TH', 3, 'Comp.Supporting', 'Core', null, 'Fall 2023', 1],
  [1, 'HUM-101', 'English Composition', 'TH', 3, 'Humanities', 'Core', null, 'Fall 2023', 2],
  [1, 'HUM-103', 'Islamic Studies', 'TH', 2, 'Humanities', 'Core', null, 'Fall 2023', 3],

  [2, 'CSE-102', 'Object Oriented Programming', 'TH', 3, 'Comp.Core', 'Core', 'CSE-101', 'Spring 2024', 0],
  [2, 'CSE-102 (P)', 'Object Oriented Programming Lab', 'LAB', 1, 'Comp.Core', 'Core', null, 'Spring 2024', 0],
  [2, 'CSE-104', 'Digital Logic Design', 'TH', 3, 'Comp.Core', 'Core', null, 'Spring 2024', 4],
  [2, 'CSE-104 (P)', 'Digital Logic Design Lab', 'LAB', 1, 'Comp.Core', 'Core', null, 'Spring 2024', 4],
  [2, 'MSC-102', 'Linear Algebra', 'TH', 3, 'Comp.Supporting', 'Core', 'MSC-101', 'Spring 2024', 1],
  [2, 'HUM-102', 'Communication Skills', 'TH', 3, 'Humanities', 'Core', 'HUM-101', 'Spring 2024', 2],
  [2, 'PHY-101', 'Applied Physics', 'TH', 3, 'Comp.Supporting', 'Core', null, 'Spring 2024', 5],
  [2, 'PHY-101 (P)', 'Applied Physics Lab', 'LAB', 1, 'Comp.Supporting', 'Core', null, 'Spring 2024', 5],

  [3, 'CSE-201', 'Data Structures & Algorithms', 'TH', 3, 'Comp Sc.Core', 'Core', 'CSE-102', 'Fall 2024', 6],
  [3, 'CSE-201 (P)', 'Data Structures & Algorithms Lab', 'LAB', 1, 'Comp Sc.Core', 'Core', null, 'Fall 2024', 6],
  [3, 'CSE-203', 'Discrete Structures', 'TH', 3, 'Comp Sc.Core', 'Core', 'MSC-101', 'Fall 2024', 1],
  [3, 'CSE-205', 'Database Systems', 'TH', 3, 'Comp Sc.Core', 'Core', 'CSE-102', 'Fall 2024', 7],
  [3, 'CSE-205 (P)', 'Database Systems Lab', 'LAB', 1, 'Comp Sc.Core', 'Core', null, 'Fall 2024', 7],
  [3, 'HUM-201', 'Pakistan Studies', 'TH', 2, 'Humanities', 'Core', null, 'Fall 2024', 3],

  [4, 'CSE-202', 'Software Engineering', 'TH', 3, 'Comp Sc.Core', 'Core', 'CSE-102', 'Spring 2025', 8],
  [4, 'CSE-204', 'Operating Systems', 'TH', 3, 'Comp Sc.Core', 'Core', 'CSE-201', 'Spring 2025', 7],
  [4, 'CSE-206', 'Computer Organization & Assembly', 'TH', 3, 'Comp.Core', 'Core', 'CSE-104', 'Spring 2025', 4],
  [4, 'CSE-208', 'Web Engineering', 'TH', 3, 'Comp Sc.Core', 'Core', 'CSE-205', 'Spring 2025', 8],
  [4, 'CSE-208 (P)', 'Web Engineering Lab', 'LAB', 1, 'Comp Sc.Core', 'Core', null, 'Spring 2025', 8],

  [4, 'HUM-202', 'Ethics & Professional Practices', 'TH', 2, 'Humanities', 'Core', null, 'Summer 2025', 3],

  [5, 'CSE-302', 'Software Requirements Engineering', 'TH', 3, 'Comp Sc.Core', 'Core', 'CSE-202', 'Fall 2025', 8],
  [5, 'CSE-303', 'Software Quality Engineering', 'TH', 3, 'Comp Sc.Core', 'Core', 'CSE-202', 'Fall 2025', 0],
  [5, 'CSE-305', 'Computer Networks', 'TH', 3, 'Comp Sc.Core', 'Core', 'CSE-204', 'Fall 2025', 5],
  [5, 'CSE-305 (P)', 'Computer Networks Lab', 'LAB', 1, 'Comp Sc.Core', 'Core', null, 'Fall 2025', 5],
  [5, 'CSE-307', 'Human Computer Interaction', 'TH', 3, 'Comp Sc.Core', 'Core', null, 'Fall 2025', 2],
  [5, 'CSC-310', 'Artificial Intelligence', 'TH', 3, 'Comp Sc.Core', 'Core', 'CSE-201', 'Fall 2025', 4],
  [5, 'CSC-310 (P)', 'Artificial Intelligence Lab', 'LAB', 1, 'Comp Sc.Core', 'Core', null, 'Fall 2025', 4],

  [6, 'CSE-306', 'Software Design & Architecture', 'TH', 3, 'Comp Sc.Core', 'Core', 'CSE-202', 'Spring 2026', 8],
  [6, 'CSE-308', 'Mobile Application Development', 'TH', 3, 'Comp Sc.Core', 'Elective', 'CSE-102', 'Spring 2026', 6],
  [6, 'CSE-308 (P)', 'Mobile Application Development Lab', 'LAB', 1, 'Comp Sc.Core', 'Elective', null, 'Spring 2026', 6],
  [6, 'CSE-310', 'Theory of Automata', 'TH', 3, 'Comp Sc.Core', 'Core', 'CSE-203', 'Spring 2026', 1],
  [6, 'CSC-312', 'Machine Learning', 'TH', 3, 'Comp Sc.Core', 'Elective', 'CSC-310', 'Spring 2026', 4],
  [6, 'CSC-312 (P)', 'Machine Learning Lab', 'LAB', 1, 'Comp Sc.Core', 'Elective', null, 'Spring 2026', 4],
  [6, 'MSC-204', 'Technical & Business Writing', 'TH', 3, 'University Electives', 'Elective', 'HUM-102', 'Spring 2026', 2],
  [6, 'CSE-314', 'Cloud Computing', 'TH', 3, 'Comp Sc.Core', 'Elective', 'CSE-305', 'Spring 2026', 5],

  // current term (Fall 2026)
  [7, 'ASC-201', 'Probability and Statistics', 'TH', 3, 'Comp.Supporting', 'Core', 'MSC-101', 'Fall 2026', 2],
  [7, 'CSE-301', 'Software Construction and Development', 'TH', 3, 'Comp Sc.Core', 'Core', 'CSE-202', 'Fall 2026', 6],
  [7, 'CSE-301 (P)', 'Software Construction and Development Lab', 'LAB', 1, 'Comp Sc.Core', 'Core', null, 'Fall 2026', 6],
  [7, 'MSC-301', 'Technopreneurship', 'TH', 3, 'University Electives', 'Core', null, 'Fall 2026', 3],
  [7, 'CSE-304', 'Software Project Management', 'TH', 3, 'Comp Sc.Core', 'Core', 'CSE-202', 'Fall 2026', 8],
  [7, 'MSC-203', 'Principles of Management', 'TH', 3, 'University Electives', 'Core', null, 'Fall 2026', 1],
  [7, 'CSC-320', 'Information Systems Audit', 'TH', 3, 'Comp Sc.Core', 'Elective', 'CSE-205', 'Fall 2026', 7],
  [7, 'CSE-496', 'Capstone Project - I', 'TH', 3, 'Comp Sc.Core', 'Core', 'CSE-302', 'Fall 2026', null],

  // offered for Spring 2027 registration
  [8, 'CSE-497', 'Capstone Project - II', 'TH', 3, 'Comp Sc.Core', 'Core', 'CSE-496', 'Spring 2027', 0],
  [8, 'CSE-401', 'Software Re-engineering', 'TH', 3, 'Comp Sc.Core', 'Core', 'CSE-306', 'Spring 2027', 8],
  [8, 'CSE-403', 'Information Security', 'TH', 3, 'Comp Sc.Core', 'Core', 'CSE-305', 'Spring 2027', 5],
  [8, 'CSE-403 (P)', 'Information Security Lab', 'LAB', 1, 'Comp Sc.Core', 'Core', null, 'Spring 2027', 5],
  [8, 'CSC-421', 'Data Mining', 'TH', 3, 'Comp Sc.Core', 'Elective', 'CSC-312', 'Spring 2027', 4],
  [8, 'CSE-405', 'DevOps Engineering', 'TH', 3, 'Comp Sc.Core', 'Elective', 'CSE-314', 'Spring 2027', 6],
  [8, 'CSE-405 (P)', 'DevOps Engineering Lab', 'LAB', 1, 'Comp Sc.Core', 'Elective', null, 'Spring 2027', 6],
  [8, 'UE-401', 'Introduction to Psychology', 'TH', 2, 'University Electives', 'Elective', null, 'Spring 2027', 3],
  [8, 'CSE-407', 'Game Development', 'TH', 3, 'Comp Sc.Core', 'Elective', 'CSE-201', 'Spring 2027', 7],
];

// weekly contact blocks: course code → [[day, start, end, room], …]
export const FALL26_SLOTS = {
  'CSC-320': [['Tuesday', '10:30', '11:25', 'R-201'], ['Tuesday', '11:30', '12:25', 'R-201'], ['Tuesday', '12:30', '13:25', 'R-201']],
  'CSE-496': [['Sunday', '16:30', '17:25', 'Auditorium']],
  'MSC-301': [['Tuesday', '14:30', '15:25', 'Lecture Hall-B'], ['Tuesday', '15:30', '16:25', 'Lecture Hall-B'], ['Tuesday', '16:30', '17:25', 'Lecture Hall-B']],
  'ASC-201': [['Thursday', '10:30', '11:25', 'R-203'], ['Wednesday', '12:30', '13:25', 'R-303'], ['Wednesday', '13:30', '14:25', 'R-303']],
  'CSE-301 (P)': [['Friday', '14:30', '17:25', 'Communication System Lab']],
  'CSE-301': [['Thursday', '15:30', '16:25', 'Computing Lab-Library'], ['Thursday', '16:30', '17:25', 'Computing Lab-Library']],
  'CSE-304': [['Monday', '08:30', '09:25', 'R-303'], ['Monday', '09:30', '10:25', 'R-303'], ['Monday', '10:30', '11:25', 'R-303']],
  'MSC-203': [['Saturday', '12:30', '13:25', 'R-301'], ['Saturday', '13:30', '14:25', 'R-301'], ['Saturday', '14:30', '15:25', 'R-202']],
};
export const SPRING27_SLOTS = {
  'CSE-497': [['Monday', '14:30', '15:25', 'R-101']],
  'CSE-401': [['Tuesday', '10:30', '12:25', 'R-204']],
  'CSE-403': [['Wednesday', '10:30', '12:25', 'R-204']],
  'CSE-403 (P)': [['Wednesday', '14:30', '17:25', 'Security Lab']],
  'CSC-421': [['Thursday', '10:30', '12:25', 'R-205']],
  'CSE-405': [['Tuesday', '14:30', '16:25', 'R-205']],
  'CSE-405 (P)': [['Friday', '14:30', '17:25', 'DevOps Lab']],
  'UE-401': [['Saturday', '10:30', '12:25', 'R-102']],
  'CSE-407': [['Tuesday', '11:30', '13:25', 'R-204']],   // deliberately clashes with CSE-401 to demo clash detection
};

export const GRADES = [['A', 4.0], ['A-', 3.67], ['B+', 3.33], ['B', 3.0], ['B-', 2.67], ['C+', 2.33], ['C', 2.0]];
export const SO_POOL = [1, 2, 3, 4, 5, 7, 9];
export const FINALS = [['CSC-320', '2026-12-21'], ['MSC-301', '2026-12-22'], ['ASC-201', '2026-12-23'], ['CSE-304', '2026-12-24'], ['MSC-203', '2026-12-28'], ['CSE-301', '2026-12-29']];
