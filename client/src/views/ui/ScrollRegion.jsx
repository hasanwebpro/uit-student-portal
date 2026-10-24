/** A horizontally scrollable area that keyboard users can focus and scroll (WCAG 2.1.1), with an accessible name. */
export const ScrollRegion = ({ label, children, className = 'table-wrap' }) => (
  <div className={className} role="region" aria-label={label} tabIndex={0}>{children}</div>
);
