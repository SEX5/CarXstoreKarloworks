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
  created_at: string;
}

export interface PatchOrder {
  id: string;
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
  status: "pending" | "paid" | "completed";
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
