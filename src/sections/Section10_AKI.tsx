import { WorkupFlow } from '@/components/WorkupFlow';
import { akiFlow } from '@/data/akiFlow';

export function Section10_AKI() {
  return <WorkupFlow def={akiFlow} />;
}
