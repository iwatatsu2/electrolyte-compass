import { WorkupFlow } from '@/components/WorkupFlow';
import { acidBaseFlow } from '@/data/acidBaseFlow';

export function Section1_AcidBase() {
  return <WorkupFlow def={acidBaseFlow} />;
}
