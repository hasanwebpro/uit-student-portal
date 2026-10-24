/** Request-shape schemas. Controllers pass `req.body` / `req.query` through these before doing anything else. */
import { z } from 'zod';
import { WORKFLOW_KINDS } from '../models/index.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date.');
/** Ids arrive as strings in query strings and as numbers in JSON bodies; both normalise to a positive integer. */
const id = (label = 'Selection') => z.coerce.number({ invalid_type_error: `${label} is not valid.` }).int(`${label} is not valid.`).positive(`${label} is not valid.`);
const text = (max, label) => z.string().trim().min(1, `${label} is required.`).max(max, `Keep it under ${max} characters.`);
const optionalText = (max) => z.string().trim().max(max).optional().transform((v) => v || null);

// ── auth ───────────────────────────────────────────────────
export const loginBody = z.object({
  regNo: z.string().trim().min(3, 'Enter your registration number.').max(32),
  password: z.string().min(1, 'Enter your password.').max(128),
  remember: z.boolean().optional().default(false),
});

export const passwordBody = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: z.string().min(8, 'Use at least 8 characters.').max(128)
    .regex(/[A-Z]/, 'Include an uppercase letter.').regex(/[a-z]/, 'Include a lowercase letter.').regex(/\d/, 'Include a number.'),
  confirmPassword: z.string(),
}).refine((v) => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' })
  .refine((v) => v.newPassword !== v.currentPassword, { path: ['newPassword'], message: 'Choose a password you are not using now.' });

// ── academics ──────────────────────────────────────────────
export const assessmentQuery = z.object({ session: id('Session').optional(), course: id('Course').optional() });
export const transcriptQuery = z.object({ program: id('Program') });

// ── exams & fees ───────────────────────────────────────────
export const admitCardQuery = z.object({ kind: z.enum(['MID', 'FINAL', 'LAB']).default('FINAL') });
export const dateRangeQuery = z.object({ from: isoDate.optional(), to: isoDate.optional() });

// ── to-do ──────────────────────────────────────────────────
export const todoBody = z.object({
  task: text(200, 'Task'),
  dueDate: isoDate.nullable().optional(),
  active: z.boolean().default(true),
  status: z.enum(['Not Started', 'In Progress', 'Completed']).default('Not Started'),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
});

// ── messages ───────────────────────────────────────────────
export const messageListQuery = z.object({ box: z.enum(['inbox', 'sent']).default('inbox'), from: isoDate.optional(), to: isoDate.optional(), q: z.string().max(80).optional() });
export const COMM_TYPES = ['Announcement', 'Query', 'Request', 'Complaint', 'Feedback'];
export const COMM_CATEGORIES = ['Information', 'Academic', 'Administrative', 'Financial', 'Technical'];
export const recipientQuery = z.object({
  type: z.enum(['faculty', 'admin', 'student']), q: z.string().max(60).optional(),
  course: id('Course').optional(),                       // my enrolment id: narrows "student" to my classmates in that course
});
export const composeBody = z.object({
  recipients: z.array(z.object({ type: z.enum(['faculty', 'admin', 'student']), id: id('Recipient') }))
    .min(1, 'Choose at least one recipient.').max(25, 'You can write to at most 25 people at once.'),
  subject: text(120, 'Subject'),
  body: text(4000, 'Message'),
  commType: z.enum(COMM_TYPES).default('Announcement'),
  priority: z.enum(['Low', 'Medium', 'High']).default('Low'),
  category: z.enum(COMM_CATEGORIES).default('Information'),
  dueDate: isoDate.nullable().optional(),
  followUp: z.boolean().default(false),
  reminder: z.boolean().default(false),
});

// ── workflow, surveys, activity ────────────────────────────
export const workflowBody = z.object({ kind: z.enum(WORKFLOW_KINDS), dueDate: isoDate.nullable().optional(), description: text(1000, 'Description') });
export const surveyQuery = z.object({ kind: z.enum(['Feedback', 'Survey']).optional() });
export const surveyResponseBody = z.object({ rating: z.number().int().min(1, 'Choose a rating.').max(5), comment: z.string().trim().max(1000).optional() });
export const activityQuery = z.object({ limit: z.coerce.number().int().min(1).max(100).default(30) });

export const verificationBody = z.object({ verified: z.boolean(), comments: z.string().trim().max(500).optional().transform((v) => v || null) });

// ── registration ───────────────────────────────────────────
export const registrationBody = z.object({ sectionIds: z.array(id('Course')).max(12) });

// ── profile (only the groups a student may edit) ───────────
const phone = z.string().trim().regex(/^\+?[0-9][0-9 -]{8,17}$/, 'Enter a valid phone number, e.g. +92 300 1234567.');
const cnic = z.string().trim().regex(/^\d{5}-?\d{7}-?\d$/, 'CNIC must be 13 digits.');
const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(120);

export const profileBody = z.object({
  tax: z.object({
    payeeName: text(80, 'Tax payee name'), payeeNic: cnic, selfPayee: z.boolean(),
    ntn: z.string().trim().regex(/^\d{7}-?\d$/, 'NTN looks like 1234567-8.'), isFiler: z.boolean(),
  }),
  guardian: z.object({
    relation: z.enum(['Father', 'Mother', 'Brother', 'Sister', 'Uncle', 'Other']),
    name: text(80, 'Guardian name'), occupation: optionalText(80), cell: phone, cnic, email,
  }),
  address: z.object({ permanent: z.string().trim().min(5, 'Enter your permanent address.').max(200), present: z.string().trim().min(5, 'Enter your present address.').max(200) }),
  personal: z.object({ cell: phone, personalEmail: email, cnic }),
});
