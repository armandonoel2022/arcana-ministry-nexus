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
  // Seed from the cached profile so a slow server never shows "pending approval"
  // or a blank loader to someone who already signed in on this device.
  const [initialCache] = useState(() => loadProfileFromCache());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(initialCache?.needs_password_change ?? false);
  const [isApproved, setIsApproved] = useState(initialCache?.is_approved ?? false);
  const [userProfile, setUserProfile] = useState<any | null>(initialCache);
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

  const checkUserProfile = async (userId: string, attempt = 0): Promise<void> => {
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
        if (!(cached && cached.id === userId) && attempt < 2 && error.code !== 'PGRST116') {
          await new Promise((r) => setTimeout(r, 3000));
          return checkUserProfile(userId, attempt + 1);
        }
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
      if (!(cached && cached.id === userId) && attempt < 2) {
        await new Promise((r) => setTimeout(r, 3000));
        return checkUserProfile(userId, attempt + 1);
      }
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
    let settled = false;
    const markSettled = () => { settled = true; clearTimeout(safetyTimer); };

    // If the server is too slow to confirm the session, continue with the
    // profile cached on this device instead of staying on "Cargando...".
    const safetyTimer = setTimeout(() => {
      if (settled) return;
      const cachedProfile = loadProfileFromCache();
      if (cachedProfile) {
        console.warn('⏱️ [Auth] Servidor lento, usando perfil guardado en el dispositivo');
        setUserProfile(cachedProfile);
        setNeedsPasswordChange(cachedProfile.needs_password_change ?? false);
        setIsApproved(cachedProfile.is_approved ?? false);
        setUser((current) => current ?? ({ id: cachedProfile.id, email: cachedProfile.email } as User));
      }
      setLoading(false);
    }, 6000);

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // A failed token refresh on a slow network must not kick a cached user out
        if (!session && event !== 'SIGNED_OUT' && !settled && loadProfileFromCache()) return;
        markSettled();
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
      if (settled && !session) return; // already resolved from cache; keep it
      markSettled();
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
      markSettled();
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

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
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