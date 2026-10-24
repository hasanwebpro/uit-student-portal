/** Read-mostly "noticeboard" features: announcements, surveys/feedback and the activity log. */
import {
  AcademicSession, ActivityLog, Announcement, Course, Enrollment, Faculty, Op, Section, Survey, SurveyResponse,
} from '../models/index.js';
import { conflict, forbidden, notFound, parse } from '../middleware/errors.js';
import { parseId, today } from '../lib/ids.js';
import { activityQuery, surveyQuery, surveyResponseBody } from '../validators/index.js';

export async function announcements(_req, res) {
  const rows = await Announcement.findAll({ order: [['postedOn', 'DESC'], ['id', 'DESC']] });
  res.json({ rows: rows.map((a) => ({ id: a.id, title: a.title, body: a.body, postedOn: a.postedOn, author: a.author })) });
}

const surveyStatus = (survey, responded) => (responded ? 'Submitted' : survey.closesOn < today() ? 'Closed' : survey.opensOn > today() ? 'Upcoming' : 'Pending');
const mySectionIds = async (studentId) => (await Enrollment.findAll({ where: { studentId }, attributes: ['sectionId'], raw: true })).map((e) => e.sectionId);

export async function surveys(req, res) {
  const { kind } = parse(surveyQuery, req.query);
  const sectionIds = await mySectionIds(req.student.id);
  const rows = await Survey.findAll({
    where: { ...(kind && { kind }), [Op.or]: [{ sectionId: null }, { sectionId: { [Op.in]: sectionIds } }] },
    order: ['closesOn'],
    include: [{ model: Section, as: 'section', include: [{ model: Course, as: 'course', attributes: ['title'] }, { model: Faculty, as: 'faculty', attributes: ['name'] }, { model: AcademicSession, as: 'session', attributes: ['name'] }] }],
  });
  const responses = new Map((await SurveyResponse.findAll({ where: { studentId: req.student.id, surveyId: { [Op.in]: rows.map((r) => r.id) } }, raw: true })).map((r) => [r.surveyId, r.rating]));
  res.json({
    rows: rows.map((v) => ({
      id: v.id, kind: v.kind, title: v.title, opensOn: v.opensOn, closesOn: v.closesOn,
      course: v.section?.course.title ?? null, faculty: v.section?.faculty?.name ?? null, session: v.section?.session.name ?? null,
      myRating: responses.get(v.id) ?? null, status: surveyStatus(v, responses.has(v.id)),
    })),
  });
}

export async function respondToSurvey(req, res) {
  const body = parse(surveyResponseBody, req.body);
  const survey = await Survey.findByPk(parseId(req.params.id, 'Survey not found.'));
  if (!survey) throw notFound('Survey not found.');
  if (survey.closesOn < today() || survey.opensOn > today()) throw forbidden('This survey is not open.');
  if (survey.sectionId && !(await Enrollment.count({ where: { studentId: req.student.id, sectionId: survey.sectionId } }))) throw forbidden('This survey is not for your courses.');
  try {
    await SurveyResponse.create({ surveyId: survey.id, studentId: req.student.id, rating: body.rating, comment: body.comment ?? null });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') throw conflict('You have already submitted this form.');
    throw err;
  }
  res.status(201).json({ ok: true });
}

export async function activity(req, res) {
  const { limit } = parse(activityQuery, req.query);
  const rows = await ActivityLog.findAll({ where: { studentId: req.student.id }, order: [['createdAt', 'DESC'], ['id', 'DESC']], limit });
  res.json({ rows: rows.map((a) => ({ id: a.id, action: a.action, detail: a.detail, ip: a.ip, at: a.createdAt })) });
}
