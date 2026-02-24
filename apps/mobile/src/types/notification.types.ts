// src/types/notification.types.ts

export interface NotificationData {
  reward_id: string;
  business_id: string;
  points_cost: number;
}

export interface Notification {
  id: string;
  customer_id: string;
  business_id: string;
  type: string;
  title: string;
  body: string;
  data: NotificationData;
  is_read: boolean;
  created_at: string;
  business?: {
    name: string;
    logo_url: string | null;
  };
}
