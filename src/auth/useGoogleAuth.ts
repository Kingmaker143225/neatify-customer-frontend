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


















import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle() {
  try {
    // Get the redirect URL
    const redirectTo = Linking.createURL("google-auth");
    
    console.log("🔐 Google redirect URL:", redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: false, // Change to false
      },
    });

    if (error) {
      console.error("❌ Google auth error:", error);
      throw error;
    }

    if (!data?.url) {
      throw new Error("Google authentication URL was not generated.");
    }

    console.log("🔐 Opening Google auth URL...");
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    
    console.log("🔐 Google auth result type:", result.type);

    if (result.type === "cancel") {
      throw new Error("Google sign-in was cancelled");
    }

    // If we get a success with URL, process it
    if (result.type === "success" && result.url) {
      console.log("✅ Google auth successful!");
      
      // The session should now be set by the deep link handler
      // Wait a moment for the session to be set
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if we have a session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session) {
        console.log("✅ Session established for:", sessionData.session.user.email);
        return sessionData.session;
      } else {
        console.warn("⚠️ No session found after Google auth");
        // Try to check the URL for tokens manually
        if (result.url) {
          const url = result.url;
          const fragment = url.split("#")[1];
          if (fragment) {
            const params = new URLSearchParams(fragment);
            const accessToken = params.get("access_token");
            const refreshToken = params.get("refresh_token");
            
            if (accessToken && refreshToken) {
              console.log("🔐 Manually setting session with tokens...");
              const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              
              if (!setSessionError && setSessionData.user) {
                console.log("✅ Manual session set for:", setSessionData.user.email);
                return setSessionData.session;
              }
            }
          }
        }
        throw new Error("Failed to establish session after Google authentication");
      }
    }

    return result;

  } catch (error) {
    console.error("❌ Google sign-in error:", error);
    throw error;
  }
}