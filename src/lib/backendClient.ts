// import { supabase } from "./supabase";

// const API_BASE_URL = (
//   process.env.EXPO_PUBLIC_API_URL ||
//   process.env.EXPO_PUBLIC_BACKEND_URL ||
//   ""
// ).trim();

// console.log("🔥 CUSTOMER API BASE URL:", API_BASE_URL);

// if (!API_BASE_URL) {
//   console.warn(
//     "⚠️ [Backend] EXPO_PUBLIC_API_URL is missing."
//   );
// }

// function buildUrl(path: string) {
//   const base = API_BASE_URL.replace(/\/+$/, "");
//   const cleanPath = path.startsWith("/")
//     ? path
//     : `/${path}`;

//   return `${base}${cleanPath}`;
// }

// async function getAccessToken(): Promise<string | null> {
//   const {
//     data: { session },
//   } = await supabase.auth.getSession();

//   return session?.access_token ?? null;
// }

// async function request<T>(
//   path: string,
//   options: RequestInit = {}
// ): Promise<T> {
//   console.log(`📡 [Backend] Request: ${options.method || 'GET'} ${path}`);
  
//   const accessToken = await getAccessToken();
//   console.log(`📡 [Backend] Access token: ${accessToken ? '✅ Present' : '❌ Missing'}`);

//   const headers = new Headers(
//     options.headers || {}
//   );

//   headers.set("Content-Type", "application/json");

//   if (accessToken) {
//     headers.set(
//       "Authorization",
//       `Bearer ${accessToken}`
//     );
//     console.log("📡 [Backend] Authorization header set");
//   }

//   const url = buildUrl(path);
//   console.log(`📡 [Backend] Full URL: ${url}`);

//   const response = await fetch(
//     url,
//     {
//       ...options,
//       headers,
//     }
//   );

//   console.log(`📡 [Backend] Response status: ${response.status}`);

//   const text = await response.text();
//   console.log(`📡 [Backend] Response body: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);

//   let data: any = null;

//   try {
//     data = text ? JSON.parse(text) : null;
//   } catch {
//     data = text;
//   }

//   if (!response.ok) {
//     const detail =
//       data?.detail ||
//       data?.message ||
//       `Backend request failed: ${response.status}`;

//     console.error(`❌ [Backend] Request failed: ${detail}`);
//     throw new Error(detail);
//   }

//   console.log(`✅ [Backend] Request successful`);
//   return data as T;
// }


// // =========================================================
// // CUSTOMER AUTH
// // =========================================================

// export async function customerLogin(
//   email: string,
//   password: string
// ) {
//   console.log("📡 [Backend] customerLogin called");
//   console.log("📡 [Backend] API_BASE_URL:", API_BASE_URL);

//   return request<{
//     access_token: string;
//     refresh_token: string;
//     token_type: string;
//     user_id: string;
//     email: string;
//     profile_exists: boolean;
//   }>("/api/v1/customer/auth/login", {
//     method: "POST",
//     body: JSON.stringify({
//       email,
//       password,
//     }),
//   });
// }

// export async function customerSignup(
//   fullName: string,
//   email: string,
//   phone: string,
//   password: string
// ) {
//   console.log("📡 [Backend] customerSignup called");
  
//   return request<{
//     user_id: string;
//     email: string;
//     profile_created: boolean;
//     email_confirmation_required: boolean;
//     message: string;
//   }>("/api/v1/customer/auth/signup", {
//     method: "POST",
//     body: JSON.stringify({
//       full_name: fullName,
//       email,
//       phone,
//       password,
//     }),
//   });
// }

// export async function getCustomerMe() {
//   console.log("📡 [Backend] getCustomerMe called");
  
//   return request<{
//     id: string;
//     email: string;
//     email_confirmed: boolean;
//     profile_exists: boolean;
//     profile_complete: boolean;
//     profile: any | null;
//   }>("/api/v1/customer/auth/me");
// }

// export async function getCustomerProfileCompleteness() {
//   console.log("📡 [Backend] getCustomerProfileCompleteness called");
  
//   return request<{
//     profile_exists: boolean;
//     profile_complete: boolean;
//     email_confirmed: boolean;
//     missing_fields: string[];
//   }>("/api/v1/customer/auth/profile-completeness");
// }

// export async function customerLogout() {
//   console.log("🔴🔴🔴 [Backend] customerLogout() function called 🔴🔴🔴");
//   console.log("📡 [Backend] API_BASE_URL:", API_BASE_URL);
//   console.log("📡 [Backend] Full URL:", buildUrl("/api/v1/customer/auth/logout"));
  
//   try {
//     const result = await request<{
//       success: boolean;
//       message: string;
//     }>("/api/v1/customer/auth/logout", {
//       method: "POST",
//     });
    
//     console.log("✅ [Backend] customerLogout() response:", result);
//     return result;
//   } catch (error) {
//     console.error("❌ [Backend] customerLogout() error:", error);
//     throw error;
//   }
// }


// // =========================================================
// // CUSTOMER CATEGORIES
// // =========================================================

// export async function getCustomerCategories() {
//   console.log("📡 [Backend] getCustomerCategories called");
  
//   return request<any[]>(
//     "/api/v1/customer/categories"
//   );
// }


// // =========================================================
// // CUSTOMER SERVICES
// // =========================================================

// export async function getCustomerServices(
//   params?: {
//     main_category_id?: string;
//     service_type?: string;
//   }
// ) {
//   console.log("📡 [Backend] getCustomerServices called", params);
  
//   const searchParams =
//     new URLSearchParams();

//   if (params?.main_category_id) {
//     searchParams.set(
//       "main_category_id",
//       params.main_category_id
//     );
//   }

//   if (params?.service_type) {
//     searchParams.set(
//       "service_type",
//       params.service_type
//     );
//   }

//   const query =
//     searchParams.toString();

//   return request<any[]>(
//     `/api/v1/customer/services${
//       query ? `?${query}` : ""
//     }`
//   );
// }

// export async function getCustomerServiceById(
//   serviceId: string
// ) {
//   console.log("📡 [Backend] getCustomerServiceById called", serviceId);
  
//   return request<any>(
//     `/api/v1/customer/services/${encodeURIComponent(
//       serviceId
//     )}`
//   );
// }

// export async function getCustomerServiceBySlug(
//   slug: string
// ) {
//   console.log("📡 [Backend] getCustomerServiceBySlug called", slug);
  
//   return request<any>(
//     `/api/v1/customer/services/slug/${encodeURIComponent(
//       slug
//     )}`
//   );
// }


// // =========================================================
// // CUSTOMER ADD-ONS
// // =========================================================

// export async function getCustomerAddOns(
//   serviceType?: string
// ) {
//   console.log("📡 [Backend] getCustomerAddOns called", serviceType);
  
//   const query = serviceType
//     ? `?service_type=${encodeURIComponent(
//         serviceType
//       )}`
//     : "";

//   return request<any[]>(
//     `/api/v1/customer/add-ons${query}`
//   );
// }











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