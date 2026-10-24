import { initials } from '../../models/format.js';

/** Square avatar: the student's uploaded picture, or their initial on the original's teal tile. */
export function Avatar({ student, size, letterOnly = true }) {
  const style = size ? { '--avatar': `${size}px` } : undefined;
  return student.hasAvatar
    ? <img className="avatar avatar--img" style={style} src={`/api/profile/avatar?v=${student.avatarVersion ?? 0}`} alt="" width={size ?? 35} height={size ?? 35} />
    : <span className="avatar" style={style} aria-hidden="true">{letterOnly ? initials(student.fullName).slice(0, 1) : initials(student.fullName)}</span>;
}
