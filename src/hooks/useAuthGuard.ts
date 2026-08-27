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









import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

export function useAuthGuard(redirectTo: string = 'Login') {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigation = useNavigation<any>();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async (customRedirect?: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setUser(null);
        navigation.reset({
          index: 0,
          routes: [{ name: customRedirect || redirectTo }],
        });
        return false;
      }

      if (session?.user) {
        setIsAuthenticated(true);
        setUser(session.user);
        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        navigation.reset({
          index: 0,
          routes: [{ name: customRedirect || redirectTo }],
        });
        return false;
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setIsAuthenticated(false);
      setUser(null);
      navigation.reset({
        index: 0,
        routes: [{ name: customRedirect || redirectTo }],
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

// Simple auth check function (non-hook)
export async function checkAuthStatus() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return {
      isAuthenticated: !!session?.user,
      user: session?.user || null,
      session: session || null,
    };
  } catch (err) {
    console.error('Auth status check failed:', err);
    return {
      isAuthenticated: false,
      user: null,
      session: null,
    };
  }
}

// Hook to check if user has completed profile
export function useProfileGuard(redirectTo: string = 'CompleteProfile') {
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const navigation = useNavigation<any>();

  useEffect(() => {
    checkProfile();
  }, []);

  const checkProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      const { data: profile } = await supabase
        .from('profile')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .maybeSingle();

      const hasFullProfile = !!(profile?.full_name && profile?.email && profile?.phone);
      const hasConfirmedEmail = !!user.email_confirmed_at;

      if (!hasFullProfile || !hasConfirmedEmail) {
        setProfileComplete(false);
        navigation.reset({
          index: 0,
          routes: [{ name: redirectTo }],
        });
      } else {
        setProfileComplete(true);
      }
    } catch (err) {
      console.error('Profile check failed:', err);
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