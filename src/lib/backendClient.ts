import { supabase } from "./supabase";

const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  ""
).trim();

console.log("🔥 CUSTOMER API BASE URL:", API_BASE_URL);

if (!API_BASE_URL) {
  console.warn(
    "⚠️ [Backend] EXPO_PUBLIC_API_URL is missing."
  );
}

function buildUrl(path: string) {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${base}${cleanPath}`;
}

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token ?? null;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  console.log(`📡 [Backend] Request: ${options.method || 'GET'} ${path}`);
  
  const accessToken = await getAccessToken();
  console.log(`📡 [Backend] Access token: ${accessToken ? '✅ Present' : '❌ Missing'}`);

  const headers = new Headers(
    options.headers || {}
  );

  headers.set("Content-Type", "application/json");

  if (accessToken) {
    headers.set(
      "Authorization",
      `Bearer ${accessToken}`
    );
    console.log("📡 [Backend] Authorization header set");
  }

  const url = buildUrl(path);
  console.log(`📡 [Backend] Full URL: ${url}`);

  const response = await fetch(
    url,
    {
      ...options,
      headers,
    }
  );

  console.log(`📡 [Backend] Response status: ${response.status}`);

  const text = await response.text();
  console.log(`📡 [Backend] Response body: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);

  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const detail =
      data?.detail ||
      data?.message ||
      `Backend request failed: ${response.status}`;

    console.error(`❌ [Backend] Request failed: ${detail}`);
    throw new Error(detail);
  }

  console.log(`✅ [Backend] Request successful`);
  return data as T;
}


// =========================================================
// CUSTOMER AUTH
// =========================================================

export async function customerLogin(
  email: string,
  password: string
) {
  console.log("📡 [Backend] customerLogin called");
  console.log("📡 [Backend] API_BASE_URL:", API_BASE_URL);

  return request<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    user_id: string;
    email: string;
    profile_exists: boolean;
  }>("/api/v1/customer/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function customerSignup(
  fullName: string,
  email: string,
  phone: string,
  password: string
) {
  console.log("📡 [Backend] customerSignup called");
  
  return request<{
    user_id: string;
    email: string;
    profile_created: boolean;
    email_confirmation_required: boolean;
    message: string;
  }>("/api/v1/customer/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      full_name: fullName,
      email,
      phone,
      password,
    }),
  });
}

export async function getCustomerMe() {
  console.log("📡 [Backend] getCustomerMe called");
  
  return request<{
    id: string;
    email: string;
    email_confirmed: boolean;
    profile_exists: boolean;
    profile_complete: boolean;
    profile: any | null;
  }>("/api/v1/customer/auth/me");
}

export async function getCustomerProfileCompleteness() {
  console.log("📡 [Backend] getCustomerProfileCompleteness called");
  
  return request<{
    profile_exists: boolean;
    profile_complete: boolean;
    email_confirmed: boolean;
    missing_fields: string[];
  }>("/api/v1/customer/auth/profile-completeness");
}

// =========================================================
// CUSTOMER REWARDS / OFFERS
// =========================================================

export type CustomerRewardsResponse = {
  show_welcome_reward: boolean;
  welcome_coupon_code: string | null;

  show_signup_offer_popup: boolean;
  signup_service_title: string | null;
  signup_service_id: string | null;
};

export type CustomerRewardsUpdateRequest = {
  show_welcome_reward?: boolean;
  show_signup_offer_popup?: boolean;
};


// =========================================================
// GET CUSTOMER REWARDS
// =========================================================

export async function getCustomerRewards() {
  console.log("📡 [Backend] getCustomerRewards called");

  return request<CustomerRewardsResponse>(
    "/api/v1/customer/auth/rewards"
  );
}


// =========================================================
// UPDATE CUSTOMER REWARDS
// =========================================================

export async function updateCustomerRewards(
  data: CustomerRewardsUpdateRequest
) {
  console.log(
    "📡 [Backend] updateCustomerRewards called:",
    data
  );

  return request<CustomerRewardsResponse>(
    "/api/v1/customer/auth/rewards",
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export async function customerLogout() {
  console.log("🔴🔴🔴 [Backend] customerLogout() function called 🔴🔴🔴");
  console.log("📡 [Backend] API_BASE_URL:", API_BASE_URL);
  console.log("📡 [Backend] Full URL:", buildUrl("/api/v1/customer/auth/logout"));
  console.log("📡 [Backend] About to make fetch request...");
  
  try {
    const result = await request<{
      success: boolean;
      message: string;
    }>("/api/v1/customer/auth/logout", {
      method: "POST",
    });
    
    console.log("✅ [Backend] customerLogout() response:", result);
    return result;
  } catch (error) {
    console.error("❌ [Backend] customerLogout() error:", error);
    throw error;
  }
}


// =========================================================
// CUSTOMER CATEGORIES
// =========================================================

export async function getCustomerCategories() {
  console.log("📡 [Backend] getCustomerCategories called");
  
  return request<any[]>(
    "/api/v1/customer/categories"
  );
}


// =========================================================
// CUSTOMER SERVICES
// =========================================================

export async function getCustomerServices(
  params?: {
    main_category_id?: string;
    service_type?: string;
  }
) {
  console.log("📡 [Backend] getCustomerServices called", params);
  
  const searchParams =
    new URLSearchParams();

  if (params?.main_category_id) {
    searchParams.set(
      "main_category_id",
      params.main_category_id
    );
  }

  if (params?.service_type) {
    searchParams.set(
      "service_type",
      params.service_type
    );
  }

  const query =
    searchParams.toString();

  return request<any[]>(
    `/api/v1/customer/services${
      query ? `?${query}` : ""
    }`
  );
}

export async function getCustomerServiceById(
  serviceId: string
) {
  console.log("📡 [Backend] getCustomerServiceById called", serviceId);
  
  return request<any>(
    `/api/v1/customer/services/${encodeURIComponent(
      serviceId
    )}`
  );
}

export async function getCustomerServiceBySlug(
  slug: string
) {
  console.log("📡 [Backend] getCustomerServiceBySlug called", slug);
  
  return request<any>(
    `/api/v1/customer/services/slug/${encodeURIComponent(
      slug
    )}`
  );
}


// =========================================================
// CUSTOMER ADD-ONS
// =========================================================

export async function getCustomerAddOns(
  serviceType?: string
) {
  console.log("📡 [Backend] getCustomerAddOns called", serviceType);
  
  const query = serviceType
    ? `?service_type=${encodeURIComponent(
        serviceType
      )}`
    : "";

  return request<any[]>(
    `/api/v1/customer/add-ons${query}`
  );
}


// =========================================================
// CUSTOMER CART
// =========================================================

export type CustomerCartItem = {
  id: string;
  service_id: string;
  title: string;
  duration: string | null;
  price: string;
  image: string | null;
  created_at: string | null;
};

export type CustomerCartResponse = {
  success: boolean;
  items: CustomerCartItem[];
  message: string;
};

export type CustomerCartAddResponse = {
  success: boolean;
  item: CustomerCartItem;
  message: string;
};

export type CustomerCartActionResponse = {
  success: boolean;
  message: string;
};


// =========================================================
// GET CUSTOMER CART
// =========================================================

export async function getCustomerCart() {
  console.log("📡 [Backend] getCustomerCart called");

  return request<CustomerCartResponse>(
    "/api/v1/customer/cart"
  );
}


// =========================================================
// ADD SERVICE TO CUSTOMER CART
// =========================================================

export async function addCustomerCartItem(
  serviceId: string
) {
  console.log(
    "📡 [Backend] addCustomerCartItem called:",
    serviceId
  );

  return request<CustomerCartAddResponse>(
    "/api/v1/customer/cart",
    {
      method: "POST",
      body: JSON.stringify({
        service_id: serviceId,
      }),
    }
  );
}


// =========================================================
// REMOVE SERVICE FROM CUSTOMER CART
// =========================================================

export async function removeCustomerCartItem(
  serviceId: string
) {
  console.log(
    "📡 [Backend] removeCustomerCartItem called:",
    serviceId
  );

  return request<CustomerCartActionResponse>(
    `/api/v1/customer/cart/${encodeURIComponent(
      serviceId
    )}`,
    {
      method: "DELETE",
    }
  );
}


// =========================================================
// CLEAR CUSTOMER CART
// =========================================================

export async function clearCustomerCart() {
  console.log("📡 [Backend] clearCustomerCart called");

  return request<CustomerCartActionResponse>(
    "/api/v1/customer/cart",
    {
      method: "DELETE",
    }
  );
}

// =========================================================
// CUSTOMER BOOKINGS
// =========================================================

export type CustomerBookingServiceItem = {
  id: string;
  quantity: number;
};

export type CustomerBookingAddOnItem = {
  id: string;
  quantity: number;
};

export type CustomerBookingCreateRequest = {
  customer_name: string;
  email: string;
  phone_number: string;
  full_address: string;

  services: CustomerBookingServiceItem[];

  add_ons?: CustomerBookingAddOnItem[];

  booking_date: string;
  booking_time: string;

  latitude?: number | null;
  longitude?: number | null;

  location_link?: string | null;
};

export type CustomerBookingCreateResponse = {
  success: boolean;
  booking_id: string;
  message: string;
  payment_status: string;
  payment_verified: boolean;
  total_amount: number;
};

export type CustomerBooking = {
  id?: string;
  booking_id?: string;

  customer_name?: string;
  email?: string;
  phone_number?: string;
  full_address?: string;

  services?: any[];

  booking_date?: string;
  booking_time?: string;

  assigned_staff_email?: string | null;

  total_amount?: number;

  payment_status?: string | null;
  payment_verified?: boolean;

  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;

  payment_method?: string | null;

  assigned_staff_name?: string | null;
  assigned_staff_phone?: string | null;

  hub_name?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  location_link?: string | null;

  work_status?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  [key: string]: any;
};

export type CustomerBookingsResponse = {
  success: boolean;
  items: CustomerBooking[];
  message: string;
};


// =========================================================
// CREATE CUSTOMER BOOKING
// =========================================================

export async function createCustomerBooking(
  booking: CustomerBookingCreateRequest
) {
  console.log(
    "📡 [Backend] createCustomerBooking called"
  );

  console.log(
    "📡 [Backend] Booking payload:",
    JSON.stringify(booking, null, 2)
  );

  return request<CustomerBookingCreateResponse>(
    "/api/v1/customer/bookings",
    {
      method: "POST",
      body: JSON.stringify(booking),
    }
  );
}


// =========================================================
// GET CUSTOMER BOOKINGS
// =========================================================

export async function getCustomerBookings() {
  console.log(
    "📡 [Backend] getCustomerBookings called"
  );

  return request<CustomerBookingsResponse>(
    "/api/v1/customer/bookings"
  );
}


// =========================================================
// CUSTOMER PAYMENT
// =========================================================

export type CustomerPaymentCreateOrderRequest = {
  booking_id: string;
};

export type CustomerPaymentCreateOrderResponse = {
  success: boolean;
  booking_id: string;
  order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  message: string;
};

export type CustomerPaymentVerifyRequest = {
  booking_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type CustomerPaymentVerifyResponse = {
  success: boolean;
  booking_id: string;
  payment_status: string;
  payment_verified: boolean;
  message: string;
};


// =========================================================
// CREATE RAZORPAY ORDER
// =========================================================

export async function createCustomerPaymentOrder(
  bookingId: string
) {
  console.log(
    "📡 [Backend] createCustomerPaymentOrder called:",
    bookingId
  );

  const payload: CustomerPaymentCreateOrderRequest = {
    booking_id: bookingId,
  };

  console.log(
    "📡 [Backend] Payment order payload:",
    payload
  );

  return request<CustomerPaymentCreateOrderResponse>(
    "/api/v1/customer/payment/create-order",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}


// =========================================================
// VERIFY RAZORPAY PAYMENT
// =========================================================

export async function verifyCustomerPayment(
  payment: CustomerPaymentVerifyRequest
) {
  console.log(
    "📡 [Backend] verifyCustomerPayment called"
  );

  console.log(
    "📡 [Backend] Payment verification payload:",
    JSON.stringify(payment, null, 2)
  );

  return request<CustomerPaymentVerifyResponse>(
    "/api/v1/customer/payment/verify",
    {
      method: "POST",
      body: JSON.stringify(payment),
    }
  );
}

// =========================================================
// CUSTOMER WHY CHOOSE US
// =========================================================

export type CustomerWhyChooseUsResponse = {
  title: string;
  subtitle: string;
  features: {
    icon: string;
    iconFamily:
      | 'Ionicons'
      | 'MaterialCommunityIcons';
    title: string;
    description: string;
  }[];
  bottom_title: string;
  bottom_desc: string;
  bottom_button_text: string;
};

export async function getCustomerWhyChooseUs() {
  console.log(
    '📡 [Backend] getCustomerWhyChooseUs called'
  );

  return request<CustomerWhyChooseUsResponse>(
    '/api/v1/customer/why-choose-us'
  );
}

// =========================================================
// CUSTOMER HOME
// =========================================================

export async function getCustomerHeroBanners() {
  console.log(
    "📡 [Backend] getCustomerHeroBanners called"
  );

  return request<any[]>(
    "/api/v1/customer/hero-banners"
  );
}


export async function getCustomerPopups() {
  console.log(
    "📡 [Backend] getCustomerPopups called"
  );

  return request<any[]>(
    "/api/v1/customer/popups"
  );
}


export async function getCustomerOffers() {
  console.log(
    "📡 [Backend] getCustomerOffers called"
  );

  return request<any[]>(
    "/api/v1/customer/offers"
  );
}

