// import * as AuthSession from "expo-auth-session";
// import * as WebBrowser from "expo-web-browser";
// import { Platform } from "react-native";
// import { supabase } from "../lib/supabase";

// WebBrowser.maybeCompleteAuthSession();

// export async function signInWithGoogle() {
//   // Get the redirect URL
//   let redirectTo;
  
//   try {
//     redirectTo = AuthSession.makeRedirectUri({
//       scheme: "theneatifyteam",
//       path: "google-auth",
//     });
//   } catch (error) {
//     console.warn("⚠️ Failed to make redirect URI, using fallback:", error);
//     // Fallback for Expo Go
//     redirectTo = "exp://127.0.0.1:19000/--/google-auth";
//   }

//   console.log("🔐 Google redirect URL:", redirectTo);
//   console.log("🔐 Platform:", Platform.OS);

//   const { data, error } = await supabase.auth.signInWithOAuth({
//     provider: "google",
//     options: {
//       redirectTo,
//       skipBrowserRedirect: true,
//     },
//   });

//   if (error) {
//     console.error("❌ Google auth error:", error);
//     throw error;
//   }

//   if (!data?.url) {
//     throw new Error("Google authentication URL was not generated.");
//   }

//   console.log("🔐 Opening Google auth URL...");
//   console.log("🔐 Auth URL:", data.url.substring(0, 100) + "...");
  
//   const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  
//   console.log("🔐 Google auth result type:", result.type);
  
//   // Check if the auth was successful
//   if (result.type === "cancel") {
//     throw new Error("Google sign-in was cancelled");
//   }

//   // For success, the deep link handler in App.tsx will process the tokens
//   if (result.type === "success") {
//     console.log("✅ Google auth successful, waiting for deep link processing...");
//     // The App.tsx deep link handler will process this
//   }

//   return result;
// }


















// import * as WebBrowser from "expo-web-browser";
// import * as Linking from "expo-linking";
// import { supabase } from "../lib/supabase";

// WebBrowser.maybeCompleteAuthSession();

// export async function signInWithGoogle() {
//   try {
//     // Get the redirect URL
//     const redirectTo = Linking.createURL("google-auth");
    
//     console.log("🔐 Google redirect URL:", redirectTo);

//     const { data, error } = await supabase.auth.signInWithOAuth({
//       provider: "google",
//       options: {
//         redirectTo,
//         skipBrowserRedirect: false, // Change to false
//       },
//     });

//     if (error) {
//       console.error("❌ Google auth error:", error);
//       throw error;
//     }

//     if (!data?.url) {
//       throw new Error("Google authentication URL was not generated.");
//     }

//     console.log("🔐 Opening Google auth URL...");
//     const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    
//     console.log("🔐 Google auth result type:", result.type);

//     if (result.type === "cancel") {
//       throw new Error("Google sign-in was cancelled");
//     }

//     // If we get a success with URL, process it
//     if (result.type === "success" && result.url) {
//       console.log("✅ Google auth successful!");
      
//       // The session should now be set by the deep link handler
//       // Wait a moment for the session to be set
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       // Check if we have a session
//       const { data: sessionData } = await supabase.auth.getSession();
      
//       if (sessionData.session) {
//         console.log("✅ Session established for:", sessionData.session.user.email);
//         return sessionData.session;
//       } else {
//         console.warn("⚠️ No session found after Google auth");
//         // Try to check the URL for tokens manually
//         if (result.url) {
//           const url = result.url;
//           const fragment = url.split("#")[1];
//           if (fragment) {
//             const params = new URLSearchParams(fragment);
//             const accessToken = params.get("access_token");
//             const refreshToken = params.get("refresh_token");
            
//             if (accessToken && refreshToken) {
//               console.log("🔐 Manually setting session with tokens...");
//               const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
//                 access_token: accessToken,
//                 refresh_token: refreshToken,
//               });
              
//               if (!setSessionError && setSessionData.user) {
//                 console.log("✅ Manual session set for:", setSessionData.user.email);
//                 return setSessionData.session;
//               }
//             }
//           }
//         }
//         throw new Error("Failed to establish session after Google authentication");
//       }
//     }

//     return result;

//   } catch (error) {
//     console.error("❌ Google sign-in error:", error);
//     throw error;
//   }
// }




















// src/auth/useGoogleAuth.ts

import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Backend import
import { getCustomerProfileCompleteness } from "../lib/backendClient";

WebBrowser.maybeCompleteAuthSession();

const ACCESS_TOKEN_KEY = "customer_access_token";

// =========================================================
// GOOGLE SIGN-IN - BACKEND VERSION
// =========================================================

export async function signInWithGoogle() {
  try {
    console.log("🔐 [GoogleAuth] Starting Google sign-in...");

    // Get the redirect URL
    const redirectTo = Linking.createURL("google-auth");
    console.log("🔐 [GoogleAuth] Redirect URL:", redirectTo);

    // =========================================================
    // STEP 1: Get Google OAuth URL from BACKEND
    // =========================================================
    
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
    
    const oauthResponse = await fetch(
      `${apiUrl}/api/v1/customer/auth/google/oauth-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          redirect_to: redirectTo,
        }),
      }
    );

    if (!oauthResponse.ok) {
      const error = await oauthResponse.json();
      throw new Error(error.detail || "Failed to get Google OAuth URL");
    }

    const { oauth_url } = await oauthResponse.json();

    if (!oauth_url) {
      throw new Error("Google authentication URL was not generated.");
    }

    console.log("🔐 [GoogleAuth] Opening Google auth URL...");

    // =========================================================
    // STEP 2: Open Google Auth in browser
    // =========================================================

    const result = await WebBrowser.openAuthSessionAsync(oauth_url, redirectTo);
    console.log("🔐 [GoogleAuth] Result type:", result.type);

    if (result.type === "cancel") {
      throw new Error("Google sign-in was cancelled");
    }

    // =========================================================
    // STEP 3: Process success result
    // =========================================================

    if (result.type === "success" && result.url) {
      console.log("✅ [GoogleAuth] Google auth successful!");

      // Extract the authorization code from the URL
      const authCode = extractAuthCodeFromUrl(result.url);

      if (authCode) {
        console.log("🔐 [GoogleAuth] Auth code extracted successfully");

        // =========================================================
        // STEP 4: Exchange auth code for tokens via BACKEND
        // =========================================================

        const exchangeResponse = await fetch(
          `${apiUrl}/api/v1/customer/auth/google/exchange`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              auth_code: authCode,
            }),
          }
        );

        if (!exchangeResponse.ok) {
          const error = await exchangeResponse.json();
          throw new Error(error.detail || "Failed to exchange Google auth code");
        }

        const authData = await exchangeResponse.json();

        // =========================================================
        // STEP 5: Store backend access token
        // =========================================================

        await AsyncStorage.setItem(ACCESS_TOKEN_KEY, authData.access_token);
        console.log("✅ [GoogleAuth] Backend token stored");

        // =========================================================
        // STEP 6: Check if profile is complete
        // =========================================================

        try {
          const profileStatus = await getCustomerProfileCompleteness();
          console.log("📋 [GoogleAuth] Profile status:", profileStatus);

          return {
            success: true,
            user: {
              id: authData.user_id,
              email: authData.email,
              user_metadata: {
                full_name: authData.full_name || "",
              },
            },
            profileComplete: profileStatus.profile_exists && profileStatus.profile_complete,
            access_token: authData.access_token,
            is_new_user: authData.is_new_user || false,
          };

        } catch (error) {
          console.error("❌ [GoogleAuth] Failed to check profile:", error);
          return {
            success: true,
            user: {
              id: authData.user_id,
              email: authData.email,
              user_metadata: {
                full_name: authData.full_name || "",
              },
            },
            profileComplete: false,
            access_token: authData.access_token,
            is_new_user: authData.is_new_user || false,
          };
        }

      } else {
        console.error("❌ [GoogleAuth] No auth code found in URL");
        throw new Error("No authentication code found");
      }
    }

    throw new Error("Google sign-in failed");

  } catch (error) {
    console.error("❌ [GoogleAuth] Error:", error);
    throw error;
  }
}

// =========================================================
// HELPER: Extract auth code from URL
// =========================================================

function extractAuthCodeFromUrl(url: string): string | null {
  try {
    // Check query params (?) - OAuth code usually comes here
    const queryString = url.split("?")[1];
    if (queryString) {
      const params = new URLSearchParams(queryString);
      const code = params.get("code");
      if (code) return code;
    }

    // Check fragment (#) - Some OAuth flows use this
    const fragment = url.split("#")[1];
    if (fragment) {
      const params = new URLSearchParams(fragment);
      const code = params.get("code");
      if (code) return code;
    }

    return null;

  } catch (error) {
    console.error("❌ [GoogleAuth] Failed to extract auth code:", error);
    return null;
  }
}

// =========================================================
// HELPER: Google Sign Out
// =========================================================

export async function signOutGoogle() {
  try {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    console.log("✅ [GoogleAuth] Google sign out successful");
    
    await WebBrowser.dismissBrowser();
    
    return { success: true };
    
  } catch (error) {
    console.error("❌ [GoogleAuth] Sign out error:", error);
    throw error;
  }
}

// =========================================================
// HELPER: Check if user is authenticated with Google
// =========================================================

export async function isGoogleAuthenticated(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    return !!token;
  } catch {
    return false;
  }
}