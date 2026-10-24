import { ActivityLog } from '../models/index.js';

/** Appends to the student-visible activity trail ("My Activities"). */
export const log = (studentId, action, detail, ip) => ActivityLog.create({ studentId, action, detail, ip });
