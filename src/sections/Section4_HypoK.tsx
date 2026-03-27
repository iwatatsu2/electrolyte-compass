import { WorkupFlow } from '@/components/WorkupFlow';
import { hypoKFlow } from '@/data/hypoKFlow';

export function Section4_HypoK() {
  return <WorkupFlow def={hypoKFlow} />;
}
