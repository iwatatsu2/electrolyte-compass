import { WorkupFlow } from '@/components/WorkupFlow';
import { hyperNaFlow } from '@/data/hyperNaFlow';

export function Section3_HyperNa() {
  return <WorkupFlow def={hyperNaFlow} />;
}
