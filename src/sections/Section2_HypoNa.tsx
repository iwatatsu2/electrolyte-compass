import { WorkupFlow } from '@/components/WorkupFlow';
import { hypoNaFlow } from '@/data/hypoNaFlow';

export function Section2_HypoNa() {
  return <WorkupFlow def={hypoNaFlow} />;
}
