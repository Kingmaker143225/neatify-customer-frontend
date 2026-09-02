// import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
// import * as Linking from "expo-linking";
// import React, { useEffect, useState } from "react";
// import { StatusBar, StyleSheet } from "react-native";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// import { LanguageProvider } from "./src/context/LanguageContext";
// import { NotificationProvider } from "./src/context/NotificationContext";
// import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
// import { supabase } from "./src/lib/supabase";
// import AppNavigator from "./src/navigation/AppNavigator";
// import * as Notifications from 'expo-notifications';
// import { registerForPushNotificationsAsync, savePushTokenToSupabase } from "./src/utils/pushNotifications";
// import { BookingCartProvider } from "./src/context/BookingCartContext";

// export default function App() {
//   const [initialRoute, setInitialRoute] = useState<"LocationAccess" | "Login" | "HomeDrawer" | "CompleteProfile">("HomeDrawer");
//   const [loading, setLoading] = useState(true);
//   const navigationRef = React.useRef<any>(null);
//   const skipAuthRedirect = React.useRef(false);

//   const handlePushToken = async (userId: string) => {
//     try {
//       const token = await registerForPushNotificationsAsync();
//       if (token) {
//         await savePushTokenToSupabase(userId, token);
//       }
//     } catch (err) {
//       console.error("Push token registration failed:", err);
//     }
//   };

//   useEffect(() => {
//     // Flag to prevent re-triggering on token refreshes
//     let hasCheckedOnce = false;

//     // Helper: check DB + Auth completeness
//     const checkCompleteness = async (userId: string, useNav = true): Promise<boolean> => {
//       if (!userId) return true;
//       try {
//         const { data: { user }, error: userError } = await supabase.auth.getUser();
        
//         if (userError || !user) {
//           if (userError?.message?.includes("Refresh Token") || userError?.status === 401) {
//             console.warn("Session invalid, signing out...");
//             await supabase.auth.signOut();
//           }
//           return true;
//         }

//         const { data: profile } = await supabase
//           .from("profile")
//           .select("full_name, email, phone")
//           .eq("id", user.id)
//           .maybeSingle();

//         const hasFullProfile = !!(profile?.full_name && profile?.email && profile?.phone);
//         const hasConfirmedIdentity =
//           !!user.email_confirmed_at ||
//           !!user.confirmed_at ||
//           user.app_metadata?.provider === "google" ||
//           (Array.isArray(user.app_metadata?.providers) && user.app_metadata.providers.includes("google"));

//         const isComplete = hasFullProfile && hasConfirmedIdentity;

//         if (!isComplete) {
//           if (useNav) {
//             navigationRef.current?.reset({
//               index: 0,
//               routes: [{ name: "CompleteProfile" }],
//             });
//           }
//           return false;
//         }
//         return true;
//       } catch (err) {
//         console.error("Onboarding check error:", err);
//         return true;
//       }
//     };

//     // 1. Initial Launch Check
//     const initApp = async () => {
//       try {
//         const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
//         if (sessionError) {
//           if (sessionError.message?.includes("Refresh Token") || sessionError.status === 400) {
//             console.warn("Broken session detected on init. Clearing...");
//             await supabase.auth.signOut();
//             setInitialRoute("LocationAccess");
//             setLoading(false);
//             return;
//           }
//           throw sessionError;
//         }

//         if (session?.user) {
//           handlePushToken(session.user.id);
//           hasCheckedOnce = true;
//         }
        
//         setInitialRoute("LocationAccess");
//       } catch (err) {
//         console.error("App init failed:", err);
//         setInitialRoute("LocationAccess");
//       } finally {
//         setLoading(false);
//       }
//     };
//     initApp();

//     // 2. Auth state changes
//     const { data: listener } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         if (event === "SIGNED_OUT") {
//           skipAuthRedirect.current = false;
//           hasCheckedOnce = false;
//           return;
//         }
//         if (skipAuthRedirect.current && event === "SIGNED_IN") {
//           console.log("Skipping auth redirect (password reset in progress)");
//           return;
//         }
//         if (event === "SIGNED_IN" && session?.user && !hasCheckedOnce) {
//           hasCheckedOnce = true;
//           handlePushToken(session.user.id);
//           setTimeout(async () => {
//             const isComplete = await checkCompleteness(session.user.id);
//             if (isComplete) {
//               navigationRef.current?.reset({
//                 index: 0,
//                 routes: [{ name: "HomeDrawer" }],
//               });
//             }
//           }, 300);
//         }
//       }
//     );

//     // 3. Deep link handler - UPDATED with debugging
//     // const handleDeepLink = async ({ url }: { url: string }) => {
//     //   if (!url) return;
//     //   console.log("🔗🔗🔗 DEEP LINK RECEIVED: 🔗🔗🔗");
//     //   console.log("Full URL:", url);
//     //   console.log("URL includes 'google-auth'?:", url.includes("google-auth"));
//     //   console.log("URL includes '?'?:", url.includes("?"));
//     //   console.log("URL includes '#'?:", url.includes("#"));

//     //   // =========================================================
//     //   // GOOGLE AUTH CALLBACK
//     //   // =========================================================
//     //   if (url.includes("google-auth")) {
//     //     console.log("🔐 Processing Google auth callback...");
        
//     //     // Try to get tokens from URL fragment (#)
//     //     let fragment = url.split("#")[1];
//     //     console.log("🔐 Fragment:", fragment ? fragment.substring(0, 50) + "..." : "No fragment");
        
//     //     if (fragment) {
//     //       const params = new URLSearchParams(fragment);
//     //       const accessToken = params.get("access_token");
//     //       const refreshToken = params.get("refresh_token");
          
//     //       console.log("🔐 Access token:", accessToken ? "✅ Present" : "❌ Missing");
//     //       console.log("🔐 Refresh token:", refreshToken ? "✅ Present" : "❌ Missing");
          
//     //       if (accessToken && refreshToken) {
//     //         console.log("🔐 Setting Supabase session...");
//     //         hasCheckedOnce = false;
//     //         const { data, error } = await supabase.auth.setSession({
//     //           access_token: accessToken,
//     //           refresh_token: refreshToken,
//     //         });
            
//     //         if (error) {
//     //           console.error("❌ Session error:", error.message);
//     //           return;
//     //         }
            
//     //         if (data.user) {
//     //           console.log("✅ Google sign-in successful for:", data.user.email);
//     //           handlePushToken(data.user.id);
//     //           const isComplete = await checkCompleteness(data.user.id);
//     //           if (isComplete) {
//     //             navigationRef.current?.reset({
//     //               index: 0,
//     //               routes: [{ name: "HomeDrawer" }],
//     //             });
//     //           } else {
//     //             navigationRef.current?.reset({
//     //               index: 0,
//     //               routes: [{ name: "CompleteProfile" }],
//     //             });
//     //           }
//     //         }
//     //       } else {
//     //         console.warn("⚠️ No tokens found in fragment");
//     //       }
//     //     } else {
//     //       // Try query string as fallback
//     //       const queryString = url.split("?")[1];
//     //       console.log("🔐 Query string:", queryString ? queryString.substring(0, 50) + "..." : "No query string");
          
//     //       if (queryString) {
//     //         const params = new URLSearchParams(queryString);
//     //         const accessToken = params.get("access_token");
//     //         const refreshToken = params.get("refresh_token");
            
//     //         console.log("🔐 Access token (query):", accessToken ? "✅ Present" : "❌ Missing");
//     //         console.log("🔐 Refresh token (query):", refreshToken ? "✅ Present" : "❌ Missing");
            
//     //         if (accessToken && refreshToken) {
//     //           hasCheckedOnce = false;
//     //           const { data, error } = await supabase.auth.setSession({
//     //             access_token: accessToken,
//     //             refresh_token: refreshToken,
//     //           });
              
//     //           if (!error && data.user) {
//     //             console.log("✅ Google sign-in successful for:", data.user.email);
//     //             handlePushToken(data.user.id);
//     //             const isComplete = await checkCompleteness(data.user.id);
//     //             if (isComplete) {
//     //               navigationRef.current?.reset({
//     //                 index: 0,
//     //                 routes: [{ name: "HomeDrawer" }],
//     //               });
//     //             }
//     //           }
//     //         }
//     //       }
//     //     }
//     //     return;
//     //   }

//     //   // =========================================================
//     //   // PASSWORD RESET
//     //   // =========================================================
//     //   if (url.includes("reset-password") || url.includes("type=recovery")) {
//     //     skipAuthRedirect.current = true;
//     //     const searchPart = url.includes("#") ? url.split("#")[1] : url.split("?")[1];
//     //     if (searchPart) {
//     //       const params = new URLSearchParams(searchPart);
//     //       const accessToken = params.get("access_token");
//     //       const refreshToken = params.get("refresh_token");
//     //       if (accessToken && refreshToken) {
//     //         console.log("✅ Reset tokens detected. Navigating to ResetPassword...");
//     //         setTimeout(() => {
//     //           navigationRef.current?.reset({
//     //             index: 0,
//     //             routes: [
//     //               {
//     //                 name: "ResetPassword",
//     //                 params: {
//     //                   access_token: accessToken,
//     //                   refresh_token: refreshToken,
//     //                 },
//     //               },
//     //             ],
//     //           });
//     //         }, 800);
//     //       }
//     //     }
//     //   }
//     // };

//     // 3. Deep link handler - UPDATED
// const handleDeepLink = async ({ url }: { url: string }) => {
//   if (!url) return;
//   console.log("🔗🔗🔗 DEEP LINK RECEIVED: 🔗🔗🔗");
//   console.log("Full URL:", url);
//   console.log("URL includes 'google-auth'?:", url.includes("google-auth"));

//   // =========================================================
//   // GOOGLE AUTH CALLBACK
//   // =========================================================
//   if (url.includes("google-auth")) {
//     console.log("🔐 Processing Google auth callback...");
    
//     // Try to get tokens from URL fragment (#)
//     const fragment = url.split("#")[1];
//     if (fragment) {
//       const params = new URLSearchParams(fragment);
//       const accessToken = params.get("access_token");
//       const refreshToken = params.get("refresh_token");
      
//       console.log("🔐 Access token:", accessToken ? "✅ Present" : "❌ Missing");
//       console.log("🔐 Refresh token:", refreshToken ? "✅ Present" : "❌ Missing");
      
//       if (accessToken && refreshToken) {
//         hasCheckedOnce = false;
//         const { data, error } = await supabase.auth.setSession({
//           access_token: accessToken,
//           refresh_token: refreshToken,
//         });
        
//         if (error) {
//           console.error("❌ Session error:", error.message);
//           return;
//         }
        
//         if (data.user) {
//           console.log("✅ Google sign-in successful for:", data.user.email);
//           handlePushToken(data.user.id);
//           const isComplete = await checkCompleteness(data.user.id);
//           if (isComplete) {
//             navigationRef.current?.reset({
//               index: 0,
//               routes: [{ name: "HomeDrawer" }],
//             });
//           } else {
//             navigationRef.current?.reset({
//               index: 0,
//               routes: [{ name: "CompleteProfile" }],
//             });
//           }
//         }
//       }
//     } else {
//       // Try query string as fallback
//       const queryString = url.split("?")[1];
//       if (queryString) {
//         const params = new URLSearchParams(queryString);
//         const accessToken = params.get("access_token");
//         const refreshToken = params.get("refresh_token");
        
//         if (accessToken && refreshToken) {
//           hasCheckedOnce = false;
//           const { data, error } = await supabase.auth.setSession({
//             access_token: accessToken,
//             refresh_token: refreshToken,
//           });
          
//           if (!error && data.user) {
//             console.log("✅ Google sign-in successful for:", data.user.email);
//             handlePushToken(data.user.id);
//             const isComplete = await checkCompleteness(data.user.id);
//             if (isComplete) {
//               navigationRef.current?.reset({
//                 index: 0,
//                 routes: [{ name: "HomeDrawer" }],
//               });
//             }
//           }
//         }
//       }
//     }
//     return;
//   }

//   // =========================================================
//   // PASSWORD RESET
//   // =========================================================
//   if (url.includes("reset-password") || url.includes("type=recovery")) {
//     skipAuthRedirect.current = true;
//     const searchPart = url.includes("#") ? url.split("#")[1] : url.split("?")[1];
//     if (searchPart) {
//       const params = new URLSearchParams(searchPart);
//       const accessToken = params.get("access_token");
//       const refreshToken = params.get("refresh_token");
//       if (accessToken && refreshToken) {
//         console.log("✅ Reset tokens detected. Navigating to ResetPassword...");
//         setTimeout(() => {
//           navigationRef.current?.reset({
//             index: 0,
//             routes: [
//               {
//                 name: "ResetPassword",
//                 params: {
//                   access_token: accessToken,
//                   refresh_token: refreshToken,
//                 },
//               },
//             ],
//           });
//         }, 800);
//       }
//     }
//   }
// };

//     // Check for initial URL (Cold Start)
//     Linking.getInitialURL().then((url) => {
//       if (url) handleDeepLink({ url });
//     });

//     const subscription = Linking.addEventListener("url", handleDeepLink);

//     // Listen for notification taps
//     const notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
//       const data = response.notification.request.content.data;
//       if (data?.screen === 'bookings') {
//         navigationRef.current?.navigate('HomeDrawer', {
//           screen: 'AuthenticatedScreens',
//           params: {
//             screen: 'MainTabs',
//             params: { screen: 'MyBookingsTab' }
//           }
//         });
//       }
//     });

//     return () => {
//       listener.subscription.unsubscribe();
//       subscription.remove();
//       notificationResponseSubscription.remove();
//     };
//   }, []);

//   const linking: any = {
//     prefixes: [
//       Linking.createURL("/"),
//       "neatifynation://",
//       "theneatifyteam://",
//       "https://www.theneatifyteam.in",
//       "https://theneatifyteam.in"
//     ],
//     config: {
//       screens: {
//         HomeDrawer: {
//           screens: {
//             AuthenticatedScreens: {
//               screens: {
//                 MainTabs: {
//                   screens: {
//                     HomeTab: {
//                       screens: {
//                         ServiceDetail: "service/:serviceId",
//                         HomeMain: "*"
//                       }
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       },
//     },
//     async getInitialURL() {
//       const url = await Linking.getInitialURL();
//       if (url) {
//         console.log("Deep link opened app:", url);
//         console.log("Parsing serviceId from URL:", url.match(/service\/([^/?]+)/)?.[1]);
//       }
//       return url;
//     },
//     subscribe(listener: (url: string) => void) {
//       const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
//         console.log("Deep link received:", url);
//         const serviceIdMatch = url.match(/service\/([^/?]+)/);
//         if (serviceIdMatch) {
//           console.log("Extracted serviceId:", serviceIdMatch[1]);
//         } else {
//           console.log("Deep link: No serviceId found, will navigate to Home");
//         }
//         listener(url);
//       });
//       return () => {
//         linkingSubscription.remove();
//       };
//     },
//   };

//   if (loading) return null;

//   return (
//     <SafeAreaProvider>
//       <ThemeProvider>
//         <LanguageProvider>
//           <NotificationProvider>
//             <BookingCartProvider>
//               <ThemedAppContent
//                 linking={linking}
//                 navigationRef={navigationRef}
//                 initialRoute={initialRoute}
//               />
//             </BookingCartProvider>
//           </NotificationProvider>
//         </LanguageProvider>
//       </ThemeProvider>
//     </SafeAreaProvider>
//   );
// }

// function ThemedAppContent({ linking, navigationRef, initialRoute }: any) {
//   const { theme, isDark } = useTheme();

//   const navTheme = {
//     ...(isDark ? DarkTheme : DefaultTheme),
//     colors: {
//       ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
//       background: theme.background,
//       card: theme.background,
//       text: theme.text,
//       border: theme.border,
//       notification: theme.primary,
//     },
//   };

//   return (
//     <>
//       <StatusBar
//         barStyle={isDark ? "light-content" : "dark-content"}
//         backgroundColor={theme.background}
//       />
//       <NavigationContainer linking={linking} ref={navigationRef} theme={navTheme}>
//         <AppNavigator initialRouteName={initialRoute} />
//       </NavigationContainer>
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
// });




















import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import * as Linking from "expo-linking";
import React, { useEffect, useState } from "react";
import { StatusBar, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { LanguageProvider } from "./src/context/LanguageContext";
import { NotificationProvider } from "./src/context/NotificationContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
// import { supabase } from "./src/lib/supabase";
import {
  getCustomerMe,
  getCustomerProfileCompleteness,
} from "./src/lib/backendClient";
import AppNavigator from "./src/navigation/AppNavigator";
import * as Notifications from 'expo-notifications';
// import { registerForPushNotificationsAsync, savePushTokenToSupabase } from "./src/utils/pushNotifications";
import { registerForPushNotificationsAsync } from "./src/utils/pushNotifications";
import { saveCustomerPushToken } from "./src/lib/backendClient";
import { BookingCartProvider } from "./src/context/BookingCartContext";

export default function App() {
  const [initialRoute, setInitialRoute] = useState<"LocationAccess" | "Login" | "HomeDrawer" | "CompleteProfile">("HomeDrawer");
  const [loading, setLoading] = useState(true);
  const navigationRef = React.useRef<any>(null);
  const skipAuthRedirect = React.useRef(false);

const handlePushToken = async () => {
  try {
    const token = await registerForPushNotificationsAsync();

    if (token) {
      await saveCustomerPushToken(token, "expo");
    }
  } catch (err) {
    console.error("Push token registration failed:", err);
  }
};
useEffect(() => {
  let isMounted = true;

  const checkCompleteness = async (
    useNav = true
  ): Promise<boolean> => {
    try {
      const result = await getCustomerProfileCompleteness();

      const isComplete =
        result.profile_complete &&
        result.email_confirmed;

      if (!isComplete && useNav && isMounted) {
        navigationRef.current?.reset({
          index: 0,
          routes: [{ name: "CompleteProfile" }],
        });

        return false;
      }

      return isComplete;
    } catch (error) {
      console.error(
        "❌ Backend onboarding check failed:",
        error
      );

      return true;
    }
  };

  // =========================================================
  // 1. INITIAL APP CHECK
  // =========================================================

  const initApp = async () => {
    try {
      const accessToken = await AsyncStorage.getItem(
        "customer_access_token"
      );

      console.log(
        "🔐 Stored customer token:",
        accessToken ? "✅ Present" : "❌ Missing"
      );

      if (accessToken) {
        try {
          const me = await getCustomerMe();

          console.log(
            "👤 Customer:",
            me.email
          );

          await handlePushToken();

          await checkCompleteness(false);
        } catch (error) {
          console.warn(
            "⚠️ Stored customer session is invalid:",
            error
          );

          await AsyncStorage.removeItem(
            "customer_access_token"
          );
        }
      }

      if (isMounted) {
        setInitialRoute("LocationAccess");
      }
    } catch (error) {
      console.error(
        "❌ App initialization failed:",
        error
      );

      if (isMounted) {
        setInitialRoute("LocationAccess");
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  initApp();

  // =========================================================
  // 2. DEEP LINK HANDLER
  // =========================================================

  const handleDeepLink = async ({
    url,
  }: {
    url: string;
  }) => {
    if (!url) return;

    console.log(
      "🔗 DEEP LINK RECEIVED:",
      url
    );

    // =====================================================
    // GOOGLE AUTH CALLBACK
    // =====================================================

    if (url.includes("google-auth")) {
      console.log(
        "🔐 Processing Google auth callback..."
      );

      let accessToken: string | null = null;
      let refreshToken: string | null = null;

      const fragment = url.split("#")[1];

      if (fragment) {
        const params = new URLSearchParams(fragment);

        accessToken =
          params.get("access_token");

        refreshToken =
          params.get("refresh_token");
      }

      if (!accessToken || !refreshToken) {
        const queryString = url.split("?")[1];

        if (queryString) {
          const params =
            new URLSearchParams(queryString);

          accessToken =
            params.get("access_token");

          refreshToken =
            params.get("refresh_token");
        }
      }

      if (!accessToken) {
        console.warn(
          "⚠️ No access token found in Google callback"
        );
        return;
      }

      try {
        // Store token for backend requests.
        await AsyncStorage.setItem(
          "customer_access_token",
          accessToken
        );

        console.log(
          "✅ Google access token stored"
        );

        const me = await getCustomerMe();

        console.log(
          "✅ Google customer:",
          me.email
        );

        await handlePushToken();

        const isComplete =
          await checkCompleteness(false);

        if (isComplete) {
          navigationRef.current?.reset({
            index: 0,
            routes: [
              { name: "HomeDrawer" },
            ],
          });
        } else {
          navigationRef.current?.reset({
            index: 0,
            routes: [
              { name: "CompleteProfile" },
            ],
          });
        }
      } catch (error) {
        console.error(
          "❌ Google backend session failed:",
          error
        );

        await AsyncStorage.removeItem(
          "customer_access_token"
        );
      }

      return;
    }

    // =====================================================
    // PASSWORD RESET
    // =====================================================

    if (
      url.includes("reset-password") ||
      url.includes("type=recovery")
    ) {
      skipAuthRedirect.current = true;

      const searchPart = url.includes("#")
        ? url.split("#")[1]
        : url.split("?")[1];

      if (searchPart) {
        const params =
          new URLSearchParams(searchPart);

        const accessToken =
          params.get("access_token");

        const refreshToken =
          params.get("refresh_token");

        if (accessToken && refreshToken) {
          console.log(
            "✅ Reset tokens detected."
          );

          setTimeout(() => {
            navigationRef.current?.reset({
              index: 0,
              routes: [
                {
                  name: "ResetPassword",
                  params: {
                    access_token:
                      accessToken,
                    refresh_token:
                      refreshToken,
                  },
                },
              ],
            });
          }, 800);
        }
      }

      return;
    }
  };

  // =========================================================
  // 3. DEEP LINK LISTENERS
  // =========================================================

  Linking.getInitialURL().then((url) => {
    if (url) {
      handleDeepLink({ url });
    }
  });

  const subscription =
    Linking.addEventListener(
      "url",
      handleDeepLink
    );

  // =========================================================
  // 4. NOTIFICATION TAP
  // =========================================================

  const notificationResponseSubscription =
    Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data =
          response.notification.request.content
            .data;

        if (data?.screen === "bookings") {
          navigationRef.current?.navigate(
            "HomeDrawer",
            {
              screen:
                "AuthenticatedScreens",
              params: {
                screen: "MainTabs",
                params: {
                  screen: "MyBookingsTab",
                },
              },
            }
          );
        }
      }
    );

  return () => {
    isMounted = false;

    subscription.remove();

    notificationResponseSubscription.remove();
  };
}, []);

  const linking: any = {
    prefixes: [
      Linking.createURL("/"),
      "neatifynation://",
      "theneatifyteam://",
      "https://www.theneatifyteam.in",
      "https://theneatifyteam.in"
    ],
    config: {
      screens: {
        HomeDrawer: {
          screens: {
            AuthenticatedScreens: {
              screens: {
                MainTabs: {
                  screens: {
                    HomeTab: {
                      screens: {
                        ServiceDetail: "service/:serviceId",
                        HomeMain: "*"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
    },
    async getInitialURL() {
      const url = await Linking.getInitialURL();
      if (url) {
        console.log("Deep link opened app:", url);
      }
      return url;
    },
    subscribe(listener: (url: string) => void) {
      const linkingSubscription = Linking.addEventListener("url", ({ url }) => {
        console.log("Deep link received:", url);
        listener(url);
      });
      return () => {
        linkingSubscription.remove();
      };
    },
  };

  if (loading) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <BookingCartProvider>
              <ThemedAppContent
                linking={linking}
                navigationRef={navigationRef}
                initialRoute={initialRoute}
              />
            </BookingCartProvider>
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedAppContent({ linking, navigationRef, initialRoute }: any) {
  const { theme, isDark } = useTheme();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: theme.background,
      card: theme.background,
      text: theme.text,
      border: theme.border,
      notification: theme.primary,
    },
  };

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />
      <NavigationContainer linking={linking} ref={navigationRef} theme={navTheme}>
        <AppNavigator initialRouteName={initialRoute} />
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});