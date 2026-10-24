import { liveEnrollments } from '../services/academics.js';

const DAY_ORDER = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export async function show(req, res) {
  const { session, rows } = await liveEnrollments(req.student.id);
  res.json({
    session: session.name, dayOrder: DAY_ORDER,
    rows: rows.map((e) => {
      const days = {};
      for (const s of e.slots) (days[s.day] ??= []).push({ start: s.start, end: s.end, room: s.room });
      return { title: e.title, code: e.code, sectionCode: e.sectionCode, faculty: e.facultyName ?? 'To be Confirmed', rooms: [...new Set(e.slots.map((s) => s.room))], days };
    }),
  });
}
