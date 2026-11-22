import { Reward } from '../types/game';
import { LivesRow } from './Modal';
import { SHOT_INFO } from './shots';

/** "+1 ♥" or "+1 Homing shot". */
export const RewardText = ({ reward }: { reward: Reward }) =>
  reward.kind === 'life'
    ? <>+<LivesRow lives={1} /></>
    : <span title={SHOT_INFO[reward.shot].hint}>+1 {SHOT_INFO[reward.shot].label} shot</span>;
