export interface UserInfo {
  id: string;
  email: string | null;
  phone: string | null;
  nickname: string;
  role: string;
  is_blocked: boolean;
  subscription_plan: string;
  auth_provider: string;
  created_at: string | null;
}

export interface DashboardData {
  total_users: number;
  new_users_30d: number;
  active_subscriptions: number;
  revenue_30d_cents: number;
  total_conversions: number;
}

export interface OrderItem {
  id: number;
  user_id: string;
  user_email: string;
  plan: string;
  amount_cents: number;
  currency: string;
  provider: string;
  order_status: string;
  order_time: string | null;
  paid_time: string | null;
}

export interface TrackingItem {
  id: number;
  user_id: string | null;
  event_type: string;
  event_data: Record<string, unknown> | null;
  ip_address: string;
  page_url: string;
  session_id: string;
  created_at: string | null;
}

export interface Paginated<T> {
  total: number;
  page: number;
  size: number;
  items: T[];
}
