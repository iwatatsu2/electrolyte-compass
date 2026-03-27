import { WorkupFlow } from '@/components/WorkupFlow';
import { hyperCaFlow } from '@/data/hyperCaFlow';

export function Section7_HyperCa() {
  return <WorkupFlow def={hyperCaFlow} />;
}
