export type MetaActionSource =
  | "email"
  | "website"
  | "app"
  | "phone_call"
  | "chat"
  | "physical_store"
  | "system_generated"
  | "business_messaging"
  | "other";

export type MetaEventName =
  | "AddPaymentInfo"
  | "AddToCart"
  | "AddToWishlist"
  | "CompleteRegistration"
  | "Contact"
  | "CustomizeProduct"
  | "Donate"
  | "FindLocation"
  | "InitiateCheckout"
  | "Lead"
  | "PageView"
  | "Purchase"
  | "Schedule"
  | "Search"
  | "StartTrial"
  | "SubmitApplication"
  | "Subscribe"
  | "ViewContent";

export interface MetaUserData {
  em?: string[];
  ph?: string[];
  fn?: string[];
  ln?: string[];
  ge?: string[];
  db?: string[];
  ct?: string[];
  st?: string[];
  zp?: string[];
  country?: string[];
  external_id?: string[];
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string;
  fbp?: string;
  subscription_id?: string;
  fb_login_id?: string;
  lead_id?: string;
}

export interface MetaCustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  contents?: MetaContent[];
  num_items?: number;
  predicted_ltv?: number;
  search_string?: string;
  status?: string;
  delivery_category?: string;
  order_id?: string;
}

export interface MetaContent {
  id: string;
  quantity?: number;
  item_price?: number;
  title?: string;
  description?: string;
  brand?: string;
  category?: string;
  delivery_category?: string;
}

export interface MetaServerEvent {
  event_name: MetaEventName | string;
  event_time: number;
  action_source: MetaActionSource;
  event_source_url?: string;
  event_id?: string;
  user_data: MetaUserData;
  custom_data?: MetaCustomData;
  opt_out?: boolean;
  data_processing_options?: string[];
  data_processing_options_country?: number;
  data_processing_options_state?: number;
}

export interface MetaEventRequest {
  data: MetaServerEvent[];
  test_event_code?: string;
  partner_agent?: string;
}

export interface MetaEventResponse {
  events_received: number;
  messages: string[];
  fbtrace_id: string;
}

export interface MetaApiError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id: string;
}

export interface MetaPixelConfig {
  pixel_id: string;
  access_token: string;
  test_event_code?: string;
}

export interface SendEventParams {
  organizationId: string;
  pixelId: string;
  events: MetaServerEvent[];
  testEventCode?: string;
}

export interface MetaIntegrationConfig {
  id: string;
  organization_id: string;
  pixel_id: string;
  access_token: string;
  test_event_code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const META_EVENT_NAMES: Record<MetaEventName, string> = {
  AddPaymentInfo: "Add Payment Info",
  AddToCart: "Add to Cart",
  AddToWishlist: "Add to Wishlist",
  CompleteRegistration: "Complete Registration",
  Contact: "Contact",
  CustomizeProduct: "Customize Product",
  Donate: "Donate",
  FindLocation: "Find Location",
  InitiateCheckout: "Initiate Checkout",
  Lead: "Lead",
  PageView: "Page View",
  Purchase: "Purchase",
  Schedule: "Schedule",
  Search: "Search",
  StartTrial: "Start Trial",
  SubmitApplication: "Submit Application",
  Subscribe: "Subscribe",
  ViewContent: "View Content",
};

export const META_ACTION_SOURCES: Record<MetaActionSource, string> = {
  email: "Email",
  website: "Website",
  app: "App",
  phone_call: "Phone Call",
  chat: "Chat",
  physical_store: "Physical Store",
  system_generated: "System Generated",
  business_messaging: "Business Messaging",
  other: "Other",
};
