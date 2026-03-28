import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const OFFLINE_PROFILE_KEY = 'arcana_offline_user_profile';
const OFFLINE_SESSION_KEY = 'arcana_offline_session_meta';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  needsPasswordChange: boolean;
  isApproved: boolean;
  userProfile: any | null;
  isOffline: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function saveProfileToCache(profile: any) {
  try {
    localStorage.setItem(OFFLINE_PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

function loadProfileFromCache(): any | null {
  try {
    const raw = localStorage.getItem(OFFLINE_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearProfileCache() {
  localStorage.removeItem(OFFLINE_PROFILE_KEY);
  localStorage.removeItem(OFFLINE_SESSION_KEY);
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const checkUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to cached profile if fetch fails
        const cached = loadProfileFromCache();
        if (cached && cached.id === userId) {
          setNeedsPasswordChange(cached.needs_password_change ?? false);
          setIsApproved(cached.is_approved ?? false);
          setUserProfile(cached);
        } else {
          setNeedsPasswordChange(false);
          setIsApproved(false);
          setUserProfile(null);
        }
        return;
      }

      setNeedsPasswordChange(profile?.needs_password_change ?? false);
      setIsApproved(profile?.is_approved ?? false);
      setUserProfile(profile);
      // Cache profile for offline use
      saveProfileToCache(profile);
    } catch (error) {
      console.error('Error checking user profile:', error);
      // Fallback to cached profile
      const cached = loadProfileFromCache();
      if (cached && cached.id === userId) {
        setNeedsPasswordChange(cached.needs_password_change ?? false);
        setIsApproved(cached.is_approved ?? false);
        setUserProfile(cached);
      } else {
        setNeedsPasswordChange(false);
        setIsApproved(false);
        setUserProfile(null);
      }
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          // Save session meta for offline reference
          try {
            localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify({
              userId: session.user.id,
              email: session.user.email,
              timestamp: Date.now(),
            }));
          } catch {}
          setTimeout(() => {
            checkUserProfile(session.user.id);
          }, 0);
        } else {
          setNeedsPasswordChange(false);
          setIsApproved(false);
          setUserProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setLoading(false);
        setTimeout(() => {
          checkUserProfile(session.user.id);
        }, 0);
      } else if (!navigator.onLine) {
        // Offline and no active session - try to restore from cache
        const cachedProfile = loadProfileFromCache();
        if (cachedProfile) {
          console.log('📴 [Auth] Usando perfil en caché para modo offline');
          setUserProfile(cachedProfile);
          setNeedsPasswordChange(cachedProfile.needs_password_change ?? false);
          setIsApproved(cachedProfile.is_approved ?? false);
          // Create a minimal user object from cached data
          setUser({ id: cachedProfile.id, email: cachedProfile.email } as User);
        }
        setLoading(false);
      } else {
        setLoading(false);
      }
    }).catch(() => {
      // Network error getting session - try offline fallback
      const cachedProfile = loadProfileFromCache();
      if (cachedProfile) {
        console.log('📴 [Auth] Error de red, usando perfil en caché');
        setUserProfile(cachedProfile);
        setNeedsPasswordChange(cachedProfile.needs_password_change ?? false);
        setIsApproved(cachedProfile.is_approved ?? false);
        setUser({ id: cachedProfile.id, email: cachedProfile.email } as User);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setSession(null);
    setNeedsPasswordChange(false);
    setIsApproved(false);
    setUserProfile(null);
    clearProfileCache();
  };

  const value = {
    user,
    session,
    loading,
    needsPasswordChange,
    isApproved,
    userProfile,
    isOffline,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};