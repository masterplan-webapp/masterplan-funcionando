import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from './services';
import { TRANSLATIONS } from './constants';
import { Database, LanguageCode, Translations, LanguageContextType, Theme, ThemeContextType, AuthContextType, User } from './types';
import { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { getAuthRedirectUrl } from './config';

// --- Language Context ---
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{children: ReactNode}> = ({ children }) => {
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

export const ThemeProvider: React.FC<{children: ReactNode}> = ({ children }) => {
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

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserAndProfile = async (supabaseUser: SupabaseUser | null) => {
            try {
                setAuthError(null); // Clear any previous errors
                
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
            } catch (error) {
                console.error('Error fetching user profile:', error);
                const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido de autenticação';
                setAuthError(errorMessage);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        // Add timeout to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
            console.warn('Auth loading timeout - setting loading to false');
            setLoading(false);
        }, 10000); // 10 seconds timeout

        // Fetch user on initial load
        supabase.auth.getSession().then(({ data: { session } }) => {
            clearTimeout(loadingTimeout);
            fetchUserAndProfile(session?.user ?? null);
        }).catch((error) => {
            console.error('Error getting session:', error);
            clearTimeout(loadingTimeout);
            setLoading(false);
        });

        // Listen for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                await fetchUserAndProfile(session?.user ?? null);
            }
        );

        return () => {
            clearTimeout(loadingTimeout);
            authListener?.subscription.unsubscribe();
        };
    }, []);

    const signInWithGoogle = async () => {
        try {
            setAuthError(null);
            // Use centralized configuration for redirect URL
            const redirectUrl = getAuthRedirectUrl();
            
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                 options: {
                    redirectTo: redirectUrl, // Redirect back to the correct domain
                }
            });
            if (error) {
                setAuthError(error.message);
                throw error;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro no login com Google';
            setAuthError(errorMessage);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        try {
            setAuthError(null);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setAuthError(error.message);
                throw error;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro no login com email';
            setAuthError(errorMessage);
            throw error;
        }
    };

    const signUpWithEmail = async (email: string, password: string, displayName: string) => {
        try {
            setAuthError(null);
            setLoading(true);
            
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: displayName, // This goes to raw_user_meta_data
                    },
                    emailRedirectTo: window.location.origin
                }
            });
            
            if (error) {
                // Tratar erros específicos do Supabase
                let errorMessage = error.message;
                
                if (error.message.includes('Email rate limit exceeded')) {
                    errorMessage = 'Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.';
                } else if (error.message.includes('User already registered')) {
                    errorMessage = 'Este email já está cadastrado. Tente fazer login ou use outro email.';
                } else if (error.message.includes('Invalid email')) {
                    errorMessage = 'Email inválido. Verifique o formato do email.';
                } else if (error.message.includes('Password should be at least')) {
                    errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
                } else if (error.message.includes('Signup is disabled')) {
                    errorMessage = 'Cadastro temporariamente desabilitado. Tente novamente mais tarde.';
                }
                
                setAuthError(errorMessage);
                throw error;
            }
            
            // Check if email confirmation is required
            if (data.user && !data.session) {
                // Email confirmation required - this is normal for production
                setAuthError('Conta criada com sucesso! Um email de confirmação foi enviado para ' + email + '. Verifique sua caixa de entrada e pasta de spam. Clique no link do email para ativar sua conta.');
            } else if (data.session) {
                // User logged in immediately (email confirmation disabled)
                setAuthError('Conta criada e login realizado com sucesso!');
            }
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro no cadastro';
            
            // Se não foi tratado acima, usar mensagem genérica
            if (!authError) {
                setAuthError('Erro ao criar conta. Verifique suas informações e tente novamente.');
            }
            
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            setAuthError(null);
            const { error } = await supabase.auth.signOut();
            if (error) {
                setAuthError(error.message);
                throw error;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer logout';
            setAuthError(errorMessage);
            throw error;
        }
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
             setUser((prev: User | null) => prev ? { ...prev, displayName: data.display_name, photoURL: data.photo_url } : null);
        }
    };

    const value = {
        user,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        loading,
        updateUser,
        authError
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