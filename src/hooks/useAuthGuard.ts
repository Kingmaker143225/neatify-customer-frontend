// import { useNavigation } from "@react-navigation/native";
// import { useState } from "react";
// import { supabase } from "../lib/supabase";
// import { useNotification } from "./useNotification";

// export function useAuthGuard() {
//     const { showAlert } = useNotification();
//     const navigation = useNavigation<any>();
//     const [isAuthenticated, setIsAuthenticated] = useState(false);

//     const checkAuth = async (action: string = "continue"): Promise<boolean> => {
//         try {
//             const { data } = await supabase.auth.getSession();

//             if (!data.session) {
//                 showAlert({
//                     type: "info",
//                     title: "Login Required",
//                     message: `Please login or sign up to ${action}`,
//                     showCancel: true,
//                     confirmText: "Login / Sign Up",
//                     onConfirm: () => {
//                         // Traverse to root and navigate to Login
//                         const parent = navigation.getParent("root-drawer") || navigation;
//                         parent.navigate("Login");
//                     }
//                 });
//                 return false;
//             }

//             setIsAuthenticated(true);
//             return true;
//         } catch (error) {
//             console.error("Auth check error:", error);
//             return false;
//         }
//     };

//     return { checkAuth, isAuthenticated };
// }









// import { useEffect, useState } from 'react';
// import { useNavigation } from '@react-navigation/native';
// import { supabase } from '../lib/supabase';

// export function useAuthGuard(redirectTo: string = 'Login') {
//   const [loading, setLoading] = useState(true);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [user, setUser] = useState<any>(null);
//   const navigation = useNavigation<any>();

//   useEffect(() => {
//     checkAuth();
//   }, []);

//   const checkAuth = async (customRedirect?: string): Promise<boolean> => {
//     try {
//       setLoading(true);
//       const { data: { session }, error } = await supabase.auth.getSession();
      
//       if (error) {
//         console.error('Auth check error:', error);
//         setIsAuthenticated(false);
//         setUser(null);
//         navigation.reset({
//           index: 0,
//           routes: [{ name: customRedirect || redirectTo }],
//         });
//         return false;
//       }

//       if (session?.user) {
//         setIsAuthenticated(true);
//         setUser(session.user);
//         return true;
//       } else {
//         setIsAuthenticated(false);
//         setUser(null);
//         navigation.reset({
//           index: 0,
//           routes: [{ name: customRedirect || redirectTo }],
//         });
//         return false;
//       }
//     } catch (err) {
//       console.error('Auth check failed:', err);
//       setIsAuthenticated(false);
//       setUser(null);
//       navigation.reset({
//         index: 0,
//         routes: [{ name: customRedirect || redirectTo }],
//       });
//       return false;
//     } finally {
//       setLoading(false);
//     }
//   };

//   return {
//     loading,
//     isAuthenticated,
//     user,
//     checkAuth,
//   };
// }

// // Simple auth check function (non-hook)
// export async function checkAuthStatus() {
//   try {
//     const { data: { session }, error } = await supabase.auth.getSession();
//     if (error) throw error;
//     return {
//       isAuthenticated: !!session?.user,
//       user: session?.user || null,
//       session: session || null,
//     };
//   } catch (err) {
//     console.error('Auth status check failed:', err);
//     return {
//       isAuthenticated: false,
//       user: null,
//       session: null,
//     };
//   }
// }

// // Hook to check if user has completed profile
// export function useProfileGuard(redirectTo: string = 'CompleteProfile') {
//   const [loading, setLoading] = useState(true);
//   const [profileComplete, setProfileComplete] = useState(false);
//   const navigation = useNavigation<any>();

//   useEffect(() => {
//     checkProfile();
//   }, []);

//   const checkProfile = async () => {
//     try {
//       setLoading(true);
//       const { data: { user } } = await supabase.auth.getUser();
      
//       if (!user) {
//         navigation.reset({
//           index: 0,
//           routes: [{ name: 'Login' }],
//         });
//         return;
//       }

//       const { data: profile } = await supabase
//         .from('profile')
//         .select('full_name, email, phone')
//         .eq('id', user.id)
//         .maybeSingle();

//       const hasFullProfile = !!(profile?.full_name && profile?.email && profile?.phone);
//       const hasConfirmedEmail = !!user.email_confirmed_at;

//       if (!hasFullProfile || !hasConfirmedEmail) {
//         setProfileComplete(false);
//         navigation.reset({
//           index: 0,
//           routes: [{ name: redirectTo }],
//         });
//       } else {
//         setProfileComplete(true);
//       }
//     } catch (err) {
//       console.error('Profile check failed:', err);
//       setProfileComplete(false);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return {
//     loading,
//     profileComplete,
//     checkProfile,
//   };
// }












import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  getCustomerMe,
  getCustomerProfileCompleteness,
} from "../lib/backendClient";

const ACCESS_TOKEN_KEY = "customer_access_token";

export function useAuthGuard(redirectTo: string = "Login") {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  const navigation = useNavigation<any>();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async (
    customRedirect?: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      console.log("🔵 [AuthGuard] Checking backend authentication...");

      /*
       * First check whether our backend access token exists.
       */
      const token = await AsyncStorage.getItem(
        ACCESS_TOKEN_KEY
      );

      if (!token) {
        console.log(
          "❌ [AuthGuard] No customer access token"
        );

        setIsAuthenticated(false);
        setUser(null);

        navigation.reset({
          index: 0,
          routes: [
            {
              name: customRedirect || redirectTo,
            },
          ],
        });

        return false;
      }

      /*
       * Token exists.
       *
       * Verify it with FastAPI /customer/auth/me.
       */
      try {
        const customer = await getCustomerMe();

        console.log(
          "✅ [AuthGuard] Backend customer authenticated:",
          customer
        );

        setIsAuthenticated(true);
        setUser(customer);

        return true;
      } catch (error) {
        console.error(
          "❌ [AuthGuard] Backend token is invalid:",
          error
        );

        /*
         * Remove invalid/expired token.
         */
        await AsyncStorage.removeItem(
          ACCESS_TOKEN_KEY
        );

        setIsAuthenticated(false);
        setUser(null);

        navigation.reset({
          index: 0,
          routes: [
            {
              name: customRedirect || redirectTo,
            },
          ],
        });

        return false;
      }
    } catch (err) {
      console.error(
        "❌ [AuthGuard] Authentication check failed:",
        err
      );

      setIsAuthenticated(false);
      setUser(null);

      navigation.reset({
        index: 0,
        routes: [
          {
            name: customRedirect || redirectTo,
          },
        ],
      });

      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    isAuthenticated,
    user,
    checkAuth,
  };
}


/*
 * Simple auth check function
 * (non-hook)
 *
 * Uses FastAPI instead of Supabase.
 */
export async function checkAuthStatus() {
  try {
    console.log(
      "🔵 [AuthStatus] Checking backend authentication..."
    );

    const token = await AsyncStorage.getItem(
      ACCESS_TOKEN_KEY
    );

    if (!token) {
      return {
        isAuthenticated: false,
        user: null,
        session: null,
      };
    }

    try {
      const customer = await getCustomerMe();

      return {
        isAuthenticated: true,
        user: customer,
        session: null,
      };
    } catch (error) {
      await AsyncStorage.removeItem(
        ACCESS_TOKEN_KEY
      );

      return {
        isAuthenticated: false,
        user: null,
        session: null,
      };
    }
  } catch (err) {
    console.error(
      "❌ [AuthStatus] Backend auth check failed:",
      err
    );

    return {
      isAuthenticated: false,
      user: null,
      session: null,
    };
  }
}


/*
 * Hook to check whether the customer profile
 * has been completed.
 *
 * IMPORTANT:
 * No Supabase calls are made here.
 */
export function useProfileGuard(
  redirectTo: string = "CompleteProfile"
) {
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] =
    useState(false);

  const navigation = useNavigation<any>();

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      setLoading(true);

      console.log(
        "🔵 [ProfileGuard] Checking profile through backend..."
      );

      const token = await AsyncStorage.getItem(
        ACCESS_TOKEN_KEY
      );

      if (!token) {
        console.log(
          "❌ [ProfileGuard] No customer token"
        );

        navigation.reset({
          index: 0,
          routes: [
            {
              name: "Login",
            },
          ],
        });

        return;
      }

      /*
       * Verify customer through FastAPI.
       */
      try {
        await getCustomerMe();
      } catch (error) {
        console.error(
          "❌ [ProfileGuard] Customer authentication failed:",
          error
        );

        await AsyncStorage.removeItem(
          ACCESS_TOKEN_KEY
        );

        navigation.reset({
          index: 0,
          routes: [
            {
              name: "Login",
            },
          ],
        });

        return;
      }

      /*
       * Check profile completeness through FastAPI.
       */
      const profileStatus =
        await getCustomerProfileCompleteness();

      console.log(
        "📋 [ProfileGuard] Profile status:",
        profileStatus
      );

      const hasFullProfile =
        profileStatus.profile_exists &&
        profileStatus.profile_complete;

      const hasConfirmedEmail =
        profileStatus.email_confirmed;

      if (
        !hasFullProfile ||
        !hasConfirmedEmail
      ) {
        console.log(
          "⚠️ [ProfileGuard] Profile incomplete"
        );

        setProfileComplete(false);

        navigation.reset({
          index: 0,
          routes: [
            {
              name: redirectTo,
            },
          ],
        });

        return;
      }

      console.log(
        "✅ [ProfileGuard] Profile complete"
      );

      setProfileComplete(true);
    } catch (err) {
      console.error(
        "❌ [ProfileGuard] Profile check failed:",
        err
      );

      setProfileComplete(false);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    profileComplete,
    checkProfile,
  };
}

