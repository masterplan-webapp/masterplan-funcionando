import { GoogleGenAI } from '@google/genai';

// --- Database Schema Definition ---
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      plans: {
        Row: {
            id: string;
            created_at?: string;
            user_id?: string;
            campaignName: string;
            objective: string;
            targetAudience: string;
            location: string;
            totalInvestment: number;
            logoUrl: string;
            customFormats: Json;
            utmLinks: Json;
            months: Json;
            creatives: Json;
            adGroups: Json;
            aiPrompt?: string | null;
            aiImagePrompt?: string | null;
        },
        Insert: {
            id: string;
            created_at?: string;
            user_id?: string;
            campaignName: string;
            objective: string;
            targetAudience: string;
            location: string;
            totalInvestment: number;
            logoUrl: string;
            customFormats: Json;
            utmLinks: Json;
            months: Json;
            creatives: Json;
            adGroups: Json;
            aiPrompt?: string | null;
            aiImagePrompt?: string | null;
        },
        Update: {
            id?: string;
            created_at?: string;
            user_id?: string;
            campaignName?: string;
            objective?: string;
            targetAudience?: string;
            location?: string;
            totalInvestment?: number;
            logoUrl?: string;
            customFormats?: Json;
            utmLinks?: Json;
            months?: Json;
            creatives?: Json;
            adGroups?: Json;
            aiPrompt?: string | null;
            aiImagePrompt?: string | null;
        }
      },
      profiles: {
         Row: {
            id: string,
            display_name: string | null,
            photo_url: string | null
        },
        Insert: {
            id: string,
            display_name?: string | null,
            photo_url?: string | null
        },
        Update: {
            display_name?: string | null,
            photo_url?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}


// DATA MODELS
export interface Campaign {
    id: string;
    tipoCampanha?: string;
    etapaFunil?: string;
    canal?: string;
    formato?: string;
    objetivo?: string;
    kpi?: string;
    publicoAlvo?: string;
    budget?: number;
    unidadeCompra?: string;
    valorUnidade?: number;
    conversoes?: number;
    ctr?: number;
    cpc?: number;
    cpm?: number;
    taxaConversao?: number;
    impressoes?: number;
    alcance?: number;
    cliques?: number;
    cpa?: number;
    orcamentoDiario?: number;
    visitas?: number;
    connectRate?: number;
}

export interface CreativeTextData {
    id: number;
    name: string;
    context: string;
    headlines: string[];
    longHeadlines?: string[];
    descriptions: string[];
}

export interface KeywordSuggestion {
    keyword: string;
    volume: number;
    /** Estimated monthly clicks based on volume and competitiveness. */
    clickPotential: number;
    minCpc: number;
    maxCpc: number;
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '3:4';

export interface GeneratedImage {
    base64: string;
    aspectRatio: AspectRatio;
}

export interface AdGroup {
    id: string;
    name: string;
    keywords: KeywordSuggestion[];
}

type PlanRow = Database['public']['Tables']['plans']['Row'];

export interface PlanData {
    id: string;
    created_at?: string;
    user_id?: string;
    campaignName: string;
    objective: string;
    targetAudience: string;
    location: string;
    totalInvestment: number;
    logoUrl: string;
    customFormats: string[];
    utmLinks: UTMLink[];
    months: Record<string, Campaign[]>;
    creatives: Record<string, CreativeTextData[]>;
    adGroups: AdGroup[];
    aiPrompt?: string | null;
    aiImagePrompt?: string | null;
}

export interface UTMLink {
    id: number;
    createdAt: string; // Changed from Date for easier JSON serialization
    fullUrl: string;
    url: string;
    source: string;
    medium: string;
    campaign: string;
    term?: string;
    content?: string;
}

export interface User {
    id: string; // Changed from 'uid' to match Supabase
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

export interface SummaryData {
    budget: number;
    impressoes: number;
    alcance: number;
    cliques: number;
    conversoes: number;
    channelBudgets: Record<string, number>;
    ctr: number;
    cpc: number;
    cpm: number;
    cpa: number;
    taxaConversao: number;
    orcamentoDiario?: number;
}

export type MonthlySummary = Record<string, SummaryData>;

// CONTEXT & PROVIDER TYPES
export type LanguageCode = 'pt-BR' | 'en-US';

export interface Translations {
    [key: string]: { [key: string]: string };
}

export interface LanguageContextType {
    language: LanguageCode;
    setLang: (lang: LanguageCode) => void;
    t: (key: string, substitutions?: Record<string, string>) => string;
}

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

export interface AuthContextType {
    user: User | null;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
    signOut: () => Promise<void>;
    loading: boolean;
    updateUser: (newDetails: Partial<User>) => Promise<void>; // Now async
}

// COMPONENT PROPS
export interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export interface CharacterCountInputProps {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    maxLength: number;
    placeholder: string;
    rows?: number;
    onBlur?: () => void;
}

export interface AIResponseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
    isLoading: boolean;
}

export interface CampaignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (month: string, campaign: Campaign) => void;
    campaignData: Campaign | null;
    month: string;
    planObjective: string;
    customFormats: string[];
    onAddFormat: (format: string) => void;
}

export interface PlanDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (details: Partial<Omit<PlanData, 'id' | 'months' | 'creatives' | 'customFormats' | 'utmLinks' | 'adGroups'>>) => void;
    planData: PlanData;
    onRename: (plan: PlanData) => void;
    onDuplicate: (plan: PlanData) => void;
}

export interface AddMonthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddMonth: (month: string) => void;
    existingMonths: string[];
}

export interface RenamePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: PlanData;
    onSave: (planId: string, newName: string) => void;
}

export interface AIPlanCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (prompt: string) => Promise<void>;
    isLoading: boolean;
    initialPrompt?: string;
    title?: string;
    buttonText?: string;
    loadingText?: string;
}

export interface AISuggestionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    suggestions: Record<string, string[]> | null;
    onApplySuggestion: (type: string, text: string) => void;
    onApplyAllSuggestions?: (type: string, texts: string[]) => void;
    title?: string;
}

// LAYOUT PROPS
export interface SidebarProps {
    isSidebarOpen: boolean;
    activePlan: PlanData;
    activeView: string;
    handleNavigate: (view: string) => void;
    handleBackToDashboard: () => void;
    setAddMonthModalOpen: (isOpen: boolean) => void;
    setIsProfileModalOpen: (isOpen: boolean) => void;
    user: User;
    signOut: () => void;
}

export interface HeaderProps {
    activeView: string;
    setSidebarOpen: (isOpen: boolean) => void;
    setPlanModalOpen: (isOpen: boolean) => void;
}

export interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export interface DashboardHeaderProps {
    onProfileClick: () => void;
}

// PAGE PROPS
export interface DashboardPageProps {
    planData: PlanData;
    onNavigate: (view: string) => void;
    onAddMonthClick: () => void;
    onRegeneratePlan: (prompt: string) => Promise<void>;
    isRegenerating: boolean;
    isReadOnly?: boolean;
}

export interface MonthlyPlanPageProps {
    month: string;
    campaigns: Campaign[];
    onSave: (month: string, campaign: Campaign) => void;
    onDelete: (month: string, id: string) => void;
    planObjective: string;
    customFormats: string[];
    onAddFormat: (format: string) => void;
    totalInvestment: number;
    isReadOnly?: boolean;
}

export interface CopyBuilderPageProps {
    planData: PlanData;
    onPlanUpdate: (updatedPlan: PlanData) => Promise<void>;
}

export interface CreativeGroupProps {
    group: CreativeTextData;
    channel: string;
    onUpdate: (group: CreativeTextData) => void;
    onDelete: (id: number) => void;
    planData: PlanData;
}

export interface UTMBuilderPageProps {
    planData: PlanData;
    onPlanUpdate: (updatedPlan: PlanData) => Promise<void>;
}

export interface KeywordBuilderPageProps {
    planData: PlanData;
    onPlanUpdate: (updatedPlan: PlanData) => Promise<void>;
}

export interface CreativeBuilderPageProps {
    planData: PlanData;
    onPlanUpdate: (updatedPlan: PlanData) => Promise<void>;
}

export interface OnboardingPageProps {
    onRequestAI: () => void;
    onSelectBlank: () => void;
    onSelectTemplate: () => void;
}

export interface PlanSelectorPageProps {
    plans: PlanData[];
    onSelectPlan: (plan: PlanData) => void;
    onRequestAI: () => void;
    onSelectBlank: () => void;
    onSelectTemplate: () => void;
    user: User;
    onProfileClick: () => void;
    onDeletePlan: (planId: string) => Promise<void>;
}

export interface PlanCreationChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRequestAI: () => void;
    onSelectBlank: () => void;
    onSelectTemplate: () => void;
}

// CHART PROPS
export interface ChartCardProps {
    title: string;
    data: any[];
    dataKey: string;
    nameKey: string;
    className?: string;
    customLegend?: React.ReactElement;
}

export interface ChartsSectionProps {
    campaigns: Campaign[];
    title: string;
}
