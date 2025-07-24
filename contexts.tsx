import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase } from './services';
import { TRANSLATIONS } from './constants';
import { Database, LanguageCode, Translations, LanguageContextType, Theme, ThemeContextType, AuthContextType, User } from './types';
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

// --- Language Context ---
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [language, setLanguage] = useState<LanguageCode>('pt-BR');

    useEffect(() => {
        const savedLang = localStorage.getItem('language') as LanguageCode | null;
        if (savedLang && TRANSLATIONS[savedLang]) {
            setLanguage(savedLang);
        } else {
            setLanguage('pt-BR'); // Default language
        }
    }, []);

    const setLang = useCallback((lang: LanguageCode) => {
        setLanguage(lang);
        localStorage.setItem('language', lang);
    }, []);

    const t = useCallback((key: string, substitutions?: Record<string, string>): string => {
        let translation = TRANSLATIONS[language]?.[key] || TRANSLATIONS['en-US']?.[key] || key;
        if (substitutions) {
            Object.entries(substitutions).forEach(([subKey, subValue]) => {
                translation = translation.replace(`{${subKey}}`, subValue);
            });
        }
        return translation;
    }, [language]);
    

    return (
        <LanguageContext.Provider value={{ language, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

// --- Theme Context ---
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('dark'); // Default to dark, will be updated client-side

    useEffect(() => {
        const applySystemTheme = () => {
            const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const newTheme = isDarkMode ? 'dark' : 'light';
            
            setTheme(newTheme);

            const root = document.documentElement;
            // Ensure classes are clean before adding the new one
            root.classList.remove('light', 'dark');
            root.classList.add(newTheme);
        };

        applySystemTheme(); // Set theme on initial load

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', applySystemTheme); // Listen for changes

        return () => {
            mediaQuery.removeEventListener('change', applySystemTheme);
        };
    }, []);
    
    // The toggle is not needed to fulfill the request, but let's keep it a no-op as it was.
    const toggleTheme = useCallback(() => {
        // No-op. Theme is driven by system preference.
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

// --- Auth Context ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserAndProfile = async (supabaseUser: SupabaseUser | null) => {
            if (supabaseUser) {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', supabaseUser.id)
                    .single();
                
                if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
                     console.warn('Could not fetch user profile. This is normal for new users or if RLS is enabled. Falling back to auth data.', error.message);
                }

                setUser({
                    id: supabaseUser.id,
                    email: supabaseUser.email || null,
                    displayName: profile?.display_name || supabaseUser.user_metadata?.full_name || supabaseUser.email,
                    photoURL: profile?.photo_url || supabaseUser.user_metadata?.avatar_url,
                });
            } else {
                setUser(null);
            }
            setLoading(false);
        };

        // Fetch user on initial load
        supabase.auth.getSession().then(({ data: { session } }) => {
            fetchUserAndProfile(session?.user ?? null);
        });

        // Listen for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                await fetchUserAndProfile(session?.user ?? null);
            }
        );

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
             options: {
                redirectTo: window.location.origin, // Redirect back to the app after Google sign-in
            }
        });
        if (error) throw error;
    };

    const signInWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signUpWithEmail = async (email: string, password: string, displayName: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: displayName, // This goes to raw_user_meta_data
                }
            }
        });
        if (error) throw error;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    const updateUser = async (newDetails: Partial<User>) => {
        if (!user) return;

        const upsertPayload: { id: string, display_name?: string | null, photo_url?: string | null } = {
            id: user.id,
        };

        if (typeof newDetails.displayName !== 'undefined') {
            upsertPayload.display_name = newDetails.displayName;
        }

        if (typeof newDetails.photoURL !== 'undefined') {
            upsertPayload.photo_url = newDetails.photoURL;
        }

        if (Object.keys(upsertPayload).length <= 1) {
            return; // Nothing to update
        }

        const { data, error } = await supabase
            .from('profiles')
            .upsert(upsertPayload as any)
            .select()
            .single();

        if (error) {
            console.error('Error updating profile:', JSON.stringify(error, null, 2));
            throw error;
        }

        if (data) {
             setUser(prev => prev ? { ...prev, displayName: data.display_name, photoURL: data.photo_url } : null);
        }
    };

    const value = {
        user,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        loading,
        updateUser
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};