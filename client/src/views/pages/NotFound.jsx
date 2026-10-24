import { Link } from 'react-router-dom';
import { usePageTitle } from '../../controllers/usePageTitle.js';
import { EmptyState, PageHeader } from '../ui/primitives.jsx';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <>
      <PageHeader title="Page not found" />
      <EmptyState icon="map" title="We couldn’t find that page"><Link className="btn" to="/">Back to dashboard</Link></EmptyState>
    </>
  );
}
