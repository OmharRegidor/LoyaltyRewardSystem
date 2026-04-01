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
}
