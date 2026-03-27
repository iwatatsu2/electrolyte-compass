import { WorkupFlow } from '@/components/WorkupFlow';
import { hypoCaFlow } from '@/data/hypoCaFlow';

export function Section6_HypoCa() {
  return <WorkupFlow def={hypoCaFlow} />;
}
