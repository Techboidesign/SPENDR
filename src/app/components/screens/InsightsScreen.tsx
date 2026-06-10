import { Navigate } from 'react-router';

/** Insights live under Budget → Insights tab. */
export default function InsightsScreen() {
  return <Navigate to="/budget?tab=insights" replace />;
}
