export interface CarXAccount {
  id: string;
  name: string;
  silver: number;
  gold: number;
  xp: number;
  cars_unlocked: number;
  maps_unlocked: number;
  price: number;
  image_url?: string;
  car_images?: string; // Comma-separated or JSON list of car URLs
  credentials?: string; // encrypted or masked
  is_sold: boolean;
  max_replacements?: number;
  max_refills?: number;
  created_at: string;
}

export interface PatchOrder {
  id: string;
  order_id: string;
  customer_email: string;
  carx_email: string;
  carx_password?: string; // encrypted
  patch_type: string;
  custom_details?: {
    silver?: number;
    gold?: number;
    xp?: number;
    car_id?: string;
  };
  stripe_session_id?: string;
  status: "pending" | "paid" | "completed" | "rejected" | "pending_fulfillment";
  order_type: "account" | "patch";
  account_id?: string;
  amount_paid: number;
  replacements_count?: number;
  refills_count?: number;
  last_replacement_at?: string;
  last_refill_at?: string;
  created_at: string;
}

export interface Stats {
  totalRevenue: number;
  ordersCount: {
    pending: number;
    paid: number;
    completed: number;
  };
  ordersToday: number;
  activeAccountsCount: number;
  soldAccountsCount: number;
}
