// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useEffect } from "react";
// import { supabase } from "../lib/supabase";

// export function useAuthListener(navigation: any) {
//   useEffect(() => {
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange(async (event, session) => {
//       // Handle token refresh errors
//       if (event === "TOKEN_REFRESHED" && !session) {
//         console.log("⚠️ Token refresh failed, clearing session");
//         await supabase.auth.signOut();
//         await AsyncStorage.removeItem("supabase.auth.token");
//       }

//       if (session) {
//         navigation.reset({
//           index: 0,
//           routes: [{ name: "Home" }],
//         });
//       }
//     });

//     // Handle refresh token errors globally
//     const checkSession = async () => {
//       try {
//         const { data: { session }, error } = await supabase.auth.getSession();

//         if (error) {
//           console.log("⚠️ Session error:", error.message);
//           if (error.message.includes("refresh_token_not_found") ||
//             error.message.includes("Invalid Refresh Token")) {
//             console.log("🔄 Clearing invalid session");
//             await supabase.auth.signOut();
//             await AsyncStorage.clear();
//           }
//         }
//       } catch (err) {
//         console.error("Error checking session:", err);
//       }
//     };

//     checkSession();

//     return () => {
//       subscription.unsubscribe();
//     };
//   }, [navigation]);
// }




















import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { getCustomerMe } from "../lib/backendClient";

const ACCESS_TOKEN_KEY = "customer_access_token";

export function useAuthListener() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    let isMounted = true;
    let checkInterval: ReturnType<typeof setInterval> | null = null; // ✅ FIX: Use ReturnType<typeof setInterval>

    // =========================================================
    // CHECK SESSION VALIDITY
    // =========================================================

    const checkSession = async (): Promise<boolean> => {
      try {
        console.log("🔐 [AuthListener] Checking session...");

        // 1. Check if we have a token stored
        const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);

        if (!token) {
          console.log("❌ [AuthListener] No access token found");
          return false;
        }

        // 2. Verify token with backend
        try {
          const customer = await getCustomerMe();
          
          if (customer?.id) {
            console.log("✅ [AuthListener] Session valid for:", customer.email);
            
            // Navigate to Home if authenticated
            if (isMounted) {
              navigation.reset({
                index: 0,
                routes: [{ name: "HomeDrawer" }],
              });
            }
            
            return true;
          }
        } catch (error: any) {
          console.error("❌ [AuthListener] Token validation failed:", error.message);
          
          // Token is invalid or expired - clear it
          await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
          console.log("🗑️ [AuthListener] Invalid token cleared");
        }

        return false;

      } catch (error) {
        console.error("❌ [AuthListener] Session check error:", error);
        return false;
      }
    };

    // =========================================================
    // INITIAL SESSION CHECK
    // =========================================================

    checkSession();

    // =========================================================
    // PERIODIC SESSION CHECK (every 5 minutes)
    // =========================================================

    checkInterval = setInterval(() => {
      checkSession();
    }, 5 * 60 * 1000); // 5 minutes

    // =========================================================
    // CLEANUP
    // =========================================================

    return () => {
      isMounted = false;
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };

  }, [navigation]);
}

// =========================================================
// HELPER: Clear all auth data
// =========================================================

export async function clearAuthData() {
  try {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    await AsyncStorage.removeItem("refresh_token");
    console.log("🗑️ [AuthListener] Auth data cleared");
  } catch (error) {
    console.error("❌ [AuthListener] Failed to clear auth data:", error);
  }
}

// =========================================================
// HELPER: Check if user is authenticated
// =========================================================

export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return false;

    const customer = await getCustomerMe();
    return !!customer?.id;

  } catch (error) {
    // Token is invalid - clean it up
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    return false;
  }
}