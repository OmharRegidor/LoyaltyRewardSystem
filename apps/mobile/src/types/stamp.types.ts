export interface StampMilestone {
  position: number;
  label: string;
}

export interface RedeemedMilestone {
  position: number;
  redeemed_at: string;
  redeemed_by: string;
}

export interface StampCard {
  id: string;
  business_id: string;
  stamps_collected: number;
  total_stamps: number;
  reward_title: string;
  is_completed: boolean;
  completed_at: string | null;
  is_redeemed: boolean;
  created_at: string;
  business_name: string;
  business_logo_url: string | null;
  loyalty_mode: string;
  reward_image_url: string | null;
  reward_description: string | null;
  milestones: StampMilestone[];
  redeemed_milestones: RedeemedMilestone[];
  paused_at_milestone: number | null;
}
