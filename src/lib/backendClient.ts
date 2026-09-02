import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { Service } from "../types/service";

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

const ACCESS_TOKEN_KEY = "customer_access_token";

async function getAccessToken(): Promise<string | null> {
  return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
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

  const result = await request<{
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

  await AsyncStorage.setItem(
    ACCESS_TOKEN_KEY,
    result.access_token
  );

  return result;
}
// =========================================================
// CUSTOMER PUSH NOTIFICATIONS
// =========================================================

export type CustomerPushTokenRequest = {
  token: string;
  platform: string;
};

export type CustomerPushTokenResponse = {
  success: boolean;
  message: string;
};


// =========================================================
// SAVE CUSTOMER PUSH TOKEN
// =========================================================

export async function saveCustomerPushToken(
  token: string,
  platform: string
) {
  console.log(
    "📡 [Backend] saveCustomerPushToken called:",
    {
      platform,
      token,
    }
  );

  return request<CustomerPushTokenResponse>(
    "/api/v1/customer/push-token",
    {
      method: "POST",
      body: JSON.stringify({
        token,
        platform,
      }),
    }
  );
}


// =========================================================
// REMOVE CUSTOMER PUSH TOKEN
// =========================================================

export async function removeCustomerPushToken(
  token: string
) {
  console.log(
    "📡 [Backend] removeCustomerPushToken called:",
    token
  );

  return request<CustomerPushTokenResponse>(
    "/api/v1/customer/push-token",
    {
      method: "DELETE",
      body: JSON.stringify({
        token,
        platform: Platform.OS,
      }),
    }
  );
}
// =========================================================
// CUSTOMER PROFILE
// =========================================================

export type CustomerProfile = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  pincode: string | null;
  referral_code?: string | null;
  referred_by_id?: string | null;
};

export type CustomerProfileUpdateRequest = {
  full_name: string;
  phone: string;
  address: string;
  pincode: string;
};

// =========================================================
// GET CUSTOMER PROFILE
// =========================================================

export async function getCustomerProfile() {
  console.log("📡 [Backend] getCustomerProfile called");

  return request<CustomerProfile>(
    "/api/v1/customer/profile"
  );
}

// =========================================================
// UPDATE CUSTOMER PROFILE
// =========================================================

export async function updateCustomerProfile(
  data: CustomerProfileUpdateRequest
) {
  console.log(
    "📡 [Backend] updateCustomerProfile called:",
    data
  );

  return request<CustomerProfile>(
    "/api/v1/customer/profile",
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
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
    
    await AsyncStorage.removeItem(
      ACCESS_TOKEN_KEY
    );

    console.log(
      "✅ [Backend] Local customer token removed"
    );

    return result;
  } catch (error) {
    console.error("❌ [Backend] customerLogout() error:", error);
    
    // Even if backend logout fails, remove the local token
    await AsyncStorage.removeItem(
      ACCESS_TOKEN_KEY
    );
    
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
  const searchParams = new URLSearchParams();

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

  const query = searchParams.toString();

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
// CHECK CUSTOMER SERVICE AVAILABILITY
// =========================================================

export type CustomerServiceAvailabilityResponse = {
  available: boolean;
  message?: string;
  [key: string]: any;
};

export async function checkCustomerServiceAvailability(
  pincode: string,
  serviceCategories: string[],
) {
  console.log(
    "📡 [Backend] checkCustomerServiceAvailability called:",
    {
      pincode,
      serviceCategories,
    }
  );

  const params = new URLSearchParams({
    pincode: pincode.trim(),
    service_categories: serviceCategories.join(","),
  });

  return request<CustomerServiceAvailabilityResponse>(
    `/api/v1/customer/service-availability?${params.toString()}`
  );
}
// =========================================================
// GET SINGLE CUSTOMER BOOKING
// =========================================================

export async function getCustomerBooking(
  bookingId: string
) {
  console.log(
    "📡 [Backend] getCustomerBooking called:",
    bookingId
  );

  return request<{
    success: boolean;
    item: CustomerBooking;
    message: string;
  }>(
    `/api/v1/customer/bookings/${bookingId}`
  );
}


// =========================================================
// GET CUSTOMER BOOKING STAFF
// =========================================================

export async function getCustomerBookingStaff(
  bookingId: string
) {
  console.log(
    "📡 [Backend] getCustomerBookingStaff called:",
    bookingId
  );

  return request<{
    success: boolean;
    item: {
      name?: string | null;
      phone?: string | null;
    } | null;
  }>(
    `/api/v1/customer/bookings/${bookingId}/staff`
  );
}


// =========================================================
// GET CUSTOMER BOOKING REVIEW
// =========================================================

export async function getCustomerBookingReview(
  bookingId: string
) {
  console.log(
    "📡 [Backend] getCustomerBookingReview called:",
    bookingId
  );

  return request<{
    success: boolean;
    item: {
      id?: string;
      rating: number;
      comment?: string | null;
    } | null;
  }>(
    `/api/v1/customer/bookings/${bookingId}/review`
  );
}


// =========================================================
// SUBMIT CUSTOMER BOOKING REVIEW
// =========================================================

export async function submitCustomerBookingReview(
  bookingId: string,
  rating: number,
  comment: string
) {
  console.log(
    "📡 [Backend] submitCustomerBookingReview called:",
    bookingId
  );

  return request<{
    success: boolean;
    item?: {
      id?: string;
      rating: number;
      comment?: string | null;
    };
    message: string;
  }>(
    `/api/v1/customer/bookings/${bookingId}/review`,
    {
      method: "POST",
      body: JSON.stringify({
        rating,
        comment,
      }),
    }
  );
}


// =========================================================
// GET CANCELLATION DETAILS
// =========================================================

export async function getCustomerCancellationDetails(
  bookingId: string
) {
  console.log(
    "📡 [Backend] getCustomerCancellationDetails called:",
    bookingId
  );

  return request<{
    fee: number;
    refund_amount: number;
    is_free: boolean;
    hours_until_service: number;
    total_amount?: number;
  }>(
    `/api/v1/customer/bookings/${bookingId}/cancellation-details`
  );
}


// =========================================================
// CANCEL CUSTOMER BOOKING
// =========================================================

export async function cancelCustomerBooking(
  bookingId: string,
  reason: string
) {
  console.log(
    "📡 [Backend] cancelCustomerBooking called:",
    bookingId
  );

  return request<{
    success: boolean;
    item?: CustomerBooking;
    message: string;
  }>(
    `/api/v1/customer/bookings/${bookingId}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({
        reason,
      }),
    }
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
  // order_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  // key_id: string;
  razorpay_key_id: string;

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


// =========================================================
// CUSTOMER OTP
// =========================================================

export async function sendCustomerOtp(phone: string) {
  console.log("📡 [Backend] sendCustomerOtp called");

  return request<{
    success: boolean;
    message: string;
  }>("/api/v1/customer/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({
      phone,
    }),
  });
}

export async function verifyCustomerOtp(
  phone: string,
  otp: string
) {
  console.log("📡 [Backend] verifyCustomerOtp called");

  const result = await request<{
    success: boolean;
    isNewUser: boolean;
    email?: string;
    tempPassword?: string;
    user_id?: string;
    message?: string;
    access_token?: string;
    refresh_token?: string;
  }>("/api/v1/customer/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({
      phone,
      otp,
    }),
  });

  // Store backend-issued access token if OTP verification logs in an existing customer
  if (result.access_token) {
    await AsyncStorage.setItem(
      ACCESS_TOKEN_KEY,
      result.access_token
    );

    console.log(
      "✅ Customer OTP access token stored"
    );
  }

  return result;
}

// =========================================================
// CUSTOMER PROFILE
// =========================================================

// export async function getCustomerProfile() {
//   console.log("📡 [Backend] getCustomerProfile called");

//   return request<any>(
//     "/api/v1/customer/profile"
//   );
// }

// export async function updateCustomerProfile(data: {
//   full_name: string;
//   phone: string;
//   address: string;
//   pincode: string;
// }) {
//   console.log(
//     "📡 [Backend] updateCustomerProfile called:",
//     data
//   );

//   return request<any>(
//     "/api/v1/customer/profile",
//     {
//       method: "PUT",
//       body: JSON.stringify(data),
//     }
//   );
// }


// =========================================================
// CUSTOMER POLICIES
// =========================================================

export async function getCustomerPolicies() {
  console.log("📡 [Backend] getCustomerPolicies called");

  return request<any>(
    "/api/v1/customer/policies"
  );
}


// =========================================================
// CUSTOMER COUPONS
// =========================================================

export async function getCustomerCoupons() {
  console.log("📡 [Backend] getCustomerCoupons called");

  return request<any>(
    "/api/v1/customer/coupons"
  );
}


export async function validateCustomerCoupon(
  couponCode: string,
  subtotal: number,
  serviceId?: string,
  phoneNumber?: string
) {
  console.log(
    "📡 [Backend] validateCustomerCoupon called:",
    {
      couponCode,
      subtotal,
      serviceId,
      phoneNumber,
    }
  );

  const params = new URLSearchParams();

  params.append(
    "coupon_code",
    couponCode.trim()
  );

  params.append(
    "subtotal",
    String(subtotal)
  );

  if (serviceId) {
    params.append(
      "service_id",
      serviceId
    );
  }

  if (phoneNumber) {
    params.append(
      "phone_number",
      phoneNumber
    );
  }

  return request<any>(
    `/api/v1/customer/coupons/validate?${params.toString()}`
  );
}


export async function markCustomerCouponUsed(
  couponId: string
) {
  console.log(
    "📡 [Backend] markCustomerCouponUsed called:",
    couponId
  );

  return request<any>(
    `/api/v1/customer/coupons/${couponId}/use`,
    {
      method: "POST",
    }
  );
}

// =========================================================
// CUSTOMER WALLET
// =========================================================

export async function getCustomerWallet() {
  console.log("📡 [Backend] getCustomerWallet called");

  return request<any>(
    "/api/v1/customer/wallet"
  );
}

export async function getCustomerWalletTransactions(
  limit: number = 50
) {
  console.log(
    "📡 [Backend] getCustomerWalletTransactions called:",
    limit
  );

  return request<any>(
    `/api/v1/customer/wallet/transactions?limit=${limit}`
  );
}

export async function deductCustomerWallet(
  amount: number,
  description: string = "Booking payment"
) {
  console.log(
    "📡 [Backend] deductCustomerWallet called:",
    {
      amount,
      description,
    }
  );

  const params = new URLSearchParams();

  params.append(
    "amount",
    String(amount)
  );

  params.append(
    "description",
    description
  );

  return request<any>(
    `/api/v1/customer/wallet/deduct?${params.toString()}`,
    {
      method: "POST",
    }
  );
}


// =========================================================
// CUSTOMER COUPONS
// =========================================================

export type CustomerCoupon = {
  id: string;
  coupon_code: string;
  discount_percentage?: number | null;
  phone_number?: string | null;
  is_used?: boolean;
  created_at?: string;
  discount_amount?: number | null;
  is_active?: boolean;
  service_id?: string | null;
  user_id?: string | null;
};

export type CustomerCouponsResponse = {
  success: boolean;
  items: CustomerCoupon[];
  message: string;
};

// export async function getCustomerCoupons() {
//   console.log("📡 [Backend] getCustomerCoupons called");

//   return request<CustomerCouponsResponse>(
//     "/api/v1/customer/coupons"
//   );
// }

// export async function validateCustomerCoupon(
//   couponCode: string,
//   subtotal: number,
//   serviceId?: string,
//   phoneNumber?: string
// ) {
//   console.log(
//     "📡 [Backend] validateCustomerCoupon called:",
//     couponCode
//   );

//   const params = new URLSearchParams({
//     coupon_code: couponCode,
//     subtotal: String(subtotal),
//   });

//   if (serviceId) {
//     params.append("service_id", serviceId);
//   }

//   if (phoneNumber) {
//     params.append("phone_number", phoneNumber);
//   }

//   return request<{
//     success: boolean;
//     valid: boolean;
//     coupon: CustomerCoupon;
//     discount_amount: number;
//     final_amount: number;
//     message: string;
//   }>(
//     `/api/v1/customer/coupons/validate?${params.toString()}`
//   );
// }

// export async function markCustomerCouponUsed(
//   couponId: string
// ) {
//   console.log(
//     "📡 [Backend] markCustomerCouponUsed called:",
//     couponId
//   );

//   return request<{
//     success: boolean;
//     items: any[];
//     message: string;
//   }>(
//     `/api/v1/customer/coupons/${couponId}/use`,
//     {
//       method: "POST",
//     }
//   );
// }



// =========================================================
// CUSTOMER WALLET DEDUCTION
// =========================================================

// export const deductCustomerWallet = async (
//   amount: number,
//   bookingId: string
// ) => {
//   return apiRequest("/api/v1/customer/wallet/deduct", {
//     method: "POST",
//     body: JSON.stringify({
//       amount,
//       booking_id: bookingId,
//     }),
//   });
// };

// =========================================================
// CLEAR CUSTOMER CART
// =========================================================

// export const clearCustomerCart = async () => {
//   return apiRequest("/api/v1/customer/cart", {
//     method: "DELETE",
//   });
// };


// =========================================================
// CUSTOMER REFERRAL
// =========================================================
// =========================================================
// CUSTOMER REFERRAL
// =========================================================

export const validateCustomerReferralCode = async (
  code: string
): Promise<string | null> => {
  const cleanCode = code.trim().toUpperCase();

  if (!cleanCode) {
    return null;
  }

  const response = await request(
    `/api/v1/customer/referral/validate?code=${encodeURIComponent(cleanCode)}`,
    {
      method: "GET",
    }
  );

  const data = response as {
    referrer_id?: string | null;
  };

  return data.referrer_id ?? null;
};


export type CompleteCustomerProfileRequest = {
  full_name: string;
  email: string;
  phone: string;
  password?: string | null;
  referral_code?: string | null;
};

export async function completeCustomerProfile(
  data: CompleteCustomerProfileRequest
) {
  console.log(
    "📡 [Backend] completeCustomerProfile called:",
    data
  );

  return request<CustomerProfile>(
    "/api/v1/customer/profile/complete",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}