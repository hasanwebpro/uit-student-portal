import { Badge } from './primitives.jsx';

const LABEL = { good: 'On track', warn: 'Watch', risk: 'At risk', none: 'No classes yet' };
const KIND = { good: 'ok', warn: 'warn', risk: 'bad', none: 'neutral' };

/** Colour + words: attendance level is never communicated by colour alone. */
export const AttendanceBadge = ({ level, percentage }) => (
  <Badge kind={KIND[level]}>{level === 'none' ? LABEL.none : `${percentage}% · ${LABEL[level]}`}</Badge>
);
export const levelOf = (pct) => (pct >= 85 ? 'good' : pct >= 75 ? 'warn' : 'risk');
