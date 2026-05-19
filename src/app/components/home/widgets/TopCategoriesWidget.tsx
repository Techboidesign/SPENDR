/**
 * Top Categories widget — archived from Home (month view).
 * Bar chart of category spend for the selected period.
 *
 * Usage:
 *   <TopCategoriesWidget
 *     segments={insights.categorySegments}
 *     formatCurrency={formatCurrency}
 *   />
 */
import { CategorySpendingChart } from '../CategorySpendingChart';
import { SectionTitle } from '../../ui/SectionTitle';
import { SurfaceCard } from '../../ui/SurfaceCard';

export type TopCategoriesSegment = {
  id: string;
  name: string;
  color: string;
  amount: number;
};

export function TopCategoriesWidget({
  segments,
  formatCurrency,
}: {
  segments: TopCategoriesSegment[];
  formatCurrency: (n: number) => string;
}) {
  return (
    <section style={{ paddingTop: 8 }}>
      <SectionTitle>Top categories</SectionTitle>
      <SurfaceCard>
        <CategorySpendingChart segments={segments} formatCurrency={formatCurrency} />
      </SurfaceCard>
    </section>
  );
}
