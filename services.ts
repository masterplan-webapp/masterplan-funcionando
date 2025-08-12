






import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@supabase/supabase-js';
import { Database, PlanData, Campaign, User, LanguageCode, KeywordSuggestion, CreativeTextData, AdGroup, UTMLink, GeneratedImage, AspectRatio, SummaryData, MonthlySummary } from './types';
import { MONTHS_LIST, OPTIONS, CHANNEL_FORMATS, DEFAULT_METRICS_BY_OBJECTIVE } from "./constants";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Supabase Client ---
// NOVO PROJETO SUPABASE - Credenciais atualizadas
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://ddafoalanoouvtbiluyy.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYWZvYWxhbm9vdXZ0YmlsdXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5Mjg0ODQsImV4cCI6MjA3MDUwNDQ4NH0._P7ONuqxV-p6MnWIGtH9Xy713coN3jBZ0Hl1mghUFJg';

// INSTRUÇÕES PARA CONFIGURAR NOVO PROJETO SUPABASE:
// 1. Acesse https://supabase.com e crie um novo projeto
// 2. Em Settings > API, copie a URL e a anon key
// 3. Em Authentication > Settings, habilite:
//    - Enable email confirmations: OFF (para desenvolvimento)
//    - Enable email signup: ON
// 4. Em Authentication > Providers, configure Google OAuth se necessário
// 5. Em Authentication > URL Configuration, adicione:
//    - Site URL: http://localhost:5173
//    - Redirect URLs: http://localhost:5173
// 6. Crie a tabela 'profiles' com as colunas:
//    - id (uuid, primary key, references auth.users)
//    - display_name (text)
//    - photo_url (text)
// 7. Crie a tabela 'plans' conforme necessário

if (supabaseUrl.includes('YOUR_SUPABASE_URL_HERE')) {
    console.error("******************************************************************************");
    console.error("ATENÇÃO: As credenciais do Supabase precisam ser configuradas no arquivo `services.ts`.");
    console.error("Substitua 'YOUR_SUPABASE_URL_HERE' e 'YOUR_SUPABASE_ANON_KEY_HERE' pelas suas chaves reais.");
    console.error("O aplicativo não funcionará corretamente até que isso seja feito.");
    console.error("******************************************************************************");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// --- Gemini API Helper ---
let ai: GoogleGenerativeAI | null = null;
const getAiClient = (): GoogleGenerativeAI => {
    if (!ai) {
        const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.warn('VITE_GEMINI_API_KEY not found in environment variables');
            throw new Error('Gemini API key is not configured');
        }
        try {
            ai = new GoogleGenerativeAI(apiKey);
        } catch (error) {
            console.error('Error initializing GoogleGenerativeAI:', error);
            throw new Error('Failed to initialize AI client');
        }
    }
    return ai;
};

export const callGeminiAPI = async (prompt: string): Promise<string> => {
    try {
        const client = getAiClient();
        const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text) {
            throw new Error("Empty response from AI");
        }
        
        return text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get response from AI. Please try again.");
    }
};

export const formatCurrency = (value?: number | string): string => {
    const numberValue = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue);
};

export const formatPercentage = (value?: number | string): string => {
    const numberValue = Number(value) || 0;
    return `${numberValue.toFixed(2)}%`;
};

export const formatNumber = (value?: number | string): string => {
    const numberValue = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR').format(Math.round(numberValue));
};

export const sortMonthKeys = (a: string, b: string): number => {
    const [yearA, monthNameA] = a.split('-');
    const [yearB, monthNameB] = b.split('-');
    
    const monthIndexA = MONTHS_LIST.indexOf(monthNameA);
    const monthIndexB = MONTHS_LIST.indexOf(monthNameB);

    if (yearA !== yearB) {
        return parseInt(yearA) - parseInt(yearB);
    }
    return monthIndexA - monthIndexB;
};

const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

const planFromDb = (dbPlan: any): PlanData => {
  const { customFormats, utmLinks, months, creatives, adGroups, ...rest } = dbPlan;
  return {
    ...rest,
    customFormats: customFormats ?? [],
    utmLinks: utmLinks ?? [],
    months: months ?? {},
    creatives: creatives ?? {},
    adGroups: adGroups ?? [],
  };
};

export const getPlans = async (userId: string): Promise<PlanData[]> => {
    const plansTable: any = supabase.from('plans');
    const { data, error } = await plansTable
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching plans:", error);
        return [];
    }
    return data ? data.map(planFromDb) : [];
};

export const savePlan = async (plan: PlanData): Promise<PlanData | null> => {
    const plansTable: any = supabase.from('plans');
    
    try {
        console.log('Tentando salvar plano:', {
            id: plan.id,
            user_id: plan.user_id,
            campaignName: plan.campaignName
        });
        
        const { data, error } = await plansTable
            .upsert(plan)
            .select()
            .single();
        
        if (error) {
            console.error("Erro detalhado ao salvar plano:", {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            
            // Verificar se é um erro de tabela não encontrada
            if (error.code === '42P01') {
                throw new Error('Tabela "plans" não encontrada no Supabase. Execute o script SQL fornecido para criar as tabelas.');
            }
            
            // Verificar se é um erro de coluna não encontrada
            if (error.code === '42703') {
                throw new Error('Estrutura da tabela "plans" está incorreta. Verifique se todas as colunas foram criadas corretamente.');
            }
            
            throw new Error(`Erro ao salvar plano: ${error.message}`);
        }
        
        console.log('Plano salvo com sucesso:', data?.id);
        return data ? planFromDb(data as any) : null;
        
    } catch (error) {
        console.error("Erro ao salvar plano:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Erro desconhecido ao salvar plano');
    }
};

export const deletePlan = async (planId: string): Promise<void> => {
    const plansTable: any = supabase.from('plans');
    const { error } = await plansTable
        .delete()
        .eq('id', planId);

    if (error) {
        console.error("Error deleting plan:", error);
    }
};

export const getPlanById = async (planId: string): Promise<PlanData | null> => {
    const plansTable: any = supabase.from('plans');

    const { data, error } = await plansTable
        .select('*')
        .eq('id', planId)
        .single();

    if (error) {
        if (error.code !== 'PGRST116') {
             console.error("Error fetching plan by ID:", error);
        }
        return null;
    }
    return data ? planFromDb(data as any) : null;
};

export const getPublicPlanById = async (planId: string): Promise<PlanData | null> => {
    const { data, error } = await supabase
        .rpc('get_public_plan', { plan_id: planId })
        .single();

    if (error) {
        if (error.code !== 'PGRST116') {
             console.error("Error fetching public plan via RPC:", error);
        }
        return null;
    }
    return data ? planFromDb(data as any) : null;
};

export const getPublicProfileByUserId = async (userId: string): Promise<{ display_name: string | null, photo_url: string | null } | null> => {
    const { data, error } = await supabase
        .rpc('get_public_profile', { user_id_in: userId })
        .single();

    if (error) {
         if (error.code !== 'PGRST116') {
            console.error("Error fetching public profile via RPC:", error);
        }
        return null;
    }
    return data as { display_name: string | null, photo_url: string | null } | null;
};

export const exportPlanAsPDF = async (planData: PlanData, elementId: string): Promise<void> => {
    try {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error('Element not found for PDF export');
            return;
        }

        const clone = element.cloneNode(true) as HTMLElement;
        clone.style.width = '1200px';
        clone.style.padding = '20px';
        clone.style.backgroundColor = '#ffffff';
        document.body.appendChild(clone);

        const canvas = await html2canvas(clone, {
            scale: 1,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        document.body.removeChild(clone);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 277;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        
        if (imgHeight > 190) {
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, -(190 - 10), imgWidth, imgHeight);
        }

        pdf.save(`${planData.campaignName || 'media-plan'}.pdf`);
    } catch (error) {
        console.error('Error exporting PDF:', error);
    }
};

export const calculateKPIs = (campaign: Partial<Campaign>): Campaign => {
    return recalculateCampaignMetrics(campaign);
};

export const recalculateCampaignMetrics = (campaign: Partial<Campaign>): Campaign => {
    const newCampaign: Partial<Campaign> = { ...campaign };
    
    let budget = Number(newCampaign.budget) || 0;
    let ctr = (Number(newCampaign.ctr) || 0) / 100;
    let taxaConversao = (Number(newCampaign.taxaConversao) || 0) / 100;
    let connectRate = (Number(newCampaign.connectRate) || 0) / 100;
    let cpc = Number(newCampaign.cpc) || 0;
    let cpm = Number(newCampaign.cpm) || 0;
    let impressoes = Number(newCampaign.impressoes) || 0;
    let cliques = Number(newCampaign.cliques) || 0;

    if (cpc > 0 && ctr > 0 && cpm === 0) {
        cpm = cpc * ctr * 1000;
    } else if (cpm > 0 && ctr > 0 && cpc === 0) {
        cpc = cpm / (ctr * 1000);
    }

    if (budget > 0 && cpc > 0 && cliques === 0) {
        cliques = budget / cpc;
    } else if (cliques > 0 && cpc > 0 && budget === 0) {
        budget = cliques * cpc;
    }

    if (cliques > 0 && ctr > 0 && impressoes === 0) {
        impressoes = cliques / ctr;
    } else if (impressoes > 0 && ctr > 0 && cliques === 0) {
        cliques = impressoes * ctr;
    }

    const conversoes = cliques * taxaConversao;
    const leads = conversoes * connectRate;
    const cpl = leads > 0 ? budget / leads : 0;
    const cpa = conversoes > 0 ? budget / conversoes : 0;

    return {
        ...newCampaign,
        budget,
        ctr: ctr * 100,
        taxaConversao: taxaConversao * 100,
        connectRate: connectRate * 100,
        cpc,
        cpm,
        impressoes: Math.round(impressoes),
        cliques: Math.round(cliques),
        conversoes: Math.round(conversoes),
        leads: Math.round(leads),
        cpl,
        cpa
    } as Campaign;
};

export const createNewEmptyPlan = async (userId: string): Promise<PlanData> => {
    const newPlan: PlanData = {
        id: crypto.randomUUID(),
        user_id: userId,
        campaignName: '',
        objective: '',
        targetAudience: '',
        location: '',
        totalInvestment: 0,
        logoUrl: '',
        months: {},
        creatives: {},
        adGroups: [],
        utmLinks: [],
        customFormats: [],
        is_public: false,
        created_at: new Date().toISOString()
    };
    return newPlan;
};

export const createNewPlanFromTemplate = async (userId: string): Promise<PlanData> => {
    // For now, this is the same as createNewEmptyPlan
    // In the future, this could load from a template
    return createNewEmptyPlan(userId);
};

export const generateAIPlan = async (prompt: string, language: string = 'pt-BR'): Promise<any> => {
    try {
        const client = getAiClient();
        const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const langInstruction = language === 'pt-BR' ? 'Responda em Português.' : 'Respond in English.';
        
        const structuredPrompt = `
            ${langInstruction}
            
            Crie um plano de mídia detalhado baseado na seguinte solicitação: "${prompt}"
            
            Retorne APENAS um JSON válido com a seguinte estrutura:
            {
                "campaignName": "Nome da campanha",
                "objective": "Objetivo principal",
                "targetAudience": "Público-alvo",
                "location": "Localização geográfica",
                "totalInvestment": 20000,
                "aiImagePrompt": "Prompt para geração de imagens",
                "months": {
                    "2024-Janeiro": [
                        {
                            "nome": "Nome da campanha",
                            "tipoCampanha": "Awareness",
                            "canal": "Google Ads",
                            "formato": "Search",
                            "budget": 5000,
                            "impressoes": 100000,
                            "cliques": 2000,
                            "conversoes": 100,
                            "alcance": 50000
                        }
                    ]
                }
            }
            
            IMPORTANTE: Retorne APENAS o JSON, sem texto adicional antes ou depois.
        `;
        
        const result = await model.generateContent(structuredPrompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text) {
            throw new Error("Empty response from AI");
        }
        
        // Limpar o texto para extrair apenas o JSON
        const cleanedText = text.replace(/```json\n?|```\n?/g, '').trim();
        
        try {
            const parsedData = JSON.parse(cleanedText);
            return parsedData;
        } catch (parseError) {
            console.error("Error parsing AI response:", parseError);
            console.error("Raw response:", text);
            throw new Error("Failed to parse AI response. Please try again.");
        }
        
    } catch (error) {
        console.error("Error generating AI plan:", error);
        throw new Error("Failed to generate plan from AI. Please try again.");
    }
};

export const generateAIKeywords = async (prompt: string): Promise<KeywordSuggestion[]> => {
    try {
        const client = getAiClient();
        const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text) {
            throw new Error("Empty response from AI");
        }
        
        const lines = text.split('\n').filter((line: string) => line.trim());
        const keywords: KeywordSuggestion[] = [];
        
        lines.forEach((line: string) => {
            const match = line.match(/^\d+\.\s*(.+)/);
            if (match) {
                keywords.push({
                    keyword: match[1].trim(),
                    volume: Math.floor(Math.random() * 10000) + 1000,
                    clickPotential: Math.floor(Math.random() * 1000) + 100,
                    minCpc: Math.random() * 2 + 0.5,
                    maxCpc: Math.random() * 3 + 2
                });
            }
        });
        
        return keywords;
    } catch (error) {
        console.error("Error generating AI keywords:", error);
        throw new Error("Failed to generate keywords from AI. Please try again.");
    }
};

export const generateAIImages = async (prompt: string, aspectRatio: AspectRatio = '1:1'): Promise<GeneratedImage[]> => {
    try {
        const client = getAiClient();
        const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const imagePrompt = `Generate creative image descriptions for: ${prompt}. Aspect ratio: ${aspectRatio}. Provide 3 different creative concepts.`;
        
        const result = await model.generateContent(imagePrompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text) {
            throw new Error("Empty response from AI");
        }
        
        const lines = text.split('\n').filter((line: string) => line.trim());
        const images: GeneratedImage[] = [];
        
        lines.slice(0, 3).forEach((line: string, index: number) => {
            if (line.trim()) {
                images.push({
                    base64: `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em">${line.trim()}</text></svg>`)}`,
                    aspectRatio
                });
            }
        });
        
        return images;
    } catch (error) {
        console.error("Error generating AI images:", error);
        throw new Error("Failed to generate images from AI. Please try again.");
    }
};

export const exportCreativesAsCSV = (creatives: Record<string, CreativeTextData[]>, campaignName: string) => {
    const csvContent = 'Campaign,Creative Type,Name,Context,Headlines,Descriptions\n' +
        Object.entries(creatives).map(([type, items]) =>
            items.map(item => 
                `"${campaignName}","${type}","${item.name}","${item.context}","${item.headlines.join('; ')}","${item.descriptions.join('; ')}"`
            ).join('\n')
        ).join('\n');
    
    downloadFile(`${campaignName}-creatives.csv`, csvContent, 'text/csv');
};

export const exportCreativesAsTXT = (creatives: Record<string, CreativeTextData[]>, campaignName: string) => {
    const txtContent = Object.entries(creatives).map(([type, items]) => {
        const header = `=== ${type.toUpperCase()} ===\n`;
        const content = items.map(item => 
            `Name: ${item.name}\nContext: ${item.context}\nHeadlines: ${item.headlines.join(', ')}\nDescriptions: ${item.descriptions.join(', ')}\n`
        ).join('\n');
        return header + content;
    }).join('\n\n');
    
    downloadFile(`${campaignName}-creatives.txt`, txtContent, 'text/plain');
};

export const exportUTMLinksAsCSV = (utmLinks: UTMLink[], campaignName: string) => {
    const csvContent = 'Campaign,Source,Medium,Content,Term,URL\n' +
        utmLinks.map(link => 
            `"${campaignName}","${link.source}","${link.medium}","${link.content || ''}","${link.term || ''}","${link.url}"`
        ).join('\n');
    
    downloadFile(`${campaignName}-utm-links.csv`, csvContent, 'text/csv');
};

export const exportUTMLinksAsTXT = (utmLinks: UTMLink[], campaignName: string) => {
    const txtContent = utmLinks.map(link => 
        `Source: ${link.source}\nMedium: ${link.medium}\nContent: ${link.content || 'N/A'}\nTerm: ${link.term || 'N/A'}\nURL: ${link.url}\n`
    ).join('\n');
    
    downloadFile(`${campaignName}-utm-links.txt`, txtContent, 'text/plain');
};

export const exportGroupedKeywordsAsCSV = (groupedKeywords: Record<string, KeywordSuggestion[]>, campaignName: string) => {
    const csvContent = 'Campaign,Group,Keyword,Volume,Click Potential,Min CPC,Max CPC\n' +
        Object.entries(groupedKeywords).map(([group, keywords]) =>
            keywords.map(keyword => 
                `"${campaignName}","${group}","${keyword.keyword}","${keyword.volume}","${keyword.clickPotential}","${keyword.minCpc.toFixed(2)}","${keyword.maxCpc.toFixed(2)}"`
            ).join('\n')
        ).join('\n');
    
    downloadFile(`${campaignName}-keywords.csv`, csvContent, 'text/csv');
};

export const exportGroupedKeywordsAsTXT = (groupedKeywords: Record<string, KeywordSuggestion[]>, campaignName: string) => {
    const txtContent = Object.entries(groupedKeywords).map(([group, keywords]) => {
        const header = `=== ${group.toUpperCase()} ===\n`;
        const content = keywords.map(keyword => 
            `Keyword: ${keyword.keyword}\nVolume: ${keyword.volume}\nClick Potential: ${keyword.clickPotential}\nMin CPC: $${keyword.minCpc.toFixed(2)}\nMax CPC: $${keyword.maxCpc.toFixed(2)}\n`
        ).join('\n');
        return header + content;
    }).join('\n\n');
    
    downloadFile(`${campaignName}-keywords.txt`, txtContent, 'text/plain');
};

export const exportAdGroupsAsCSV = (adGroups: AdGroup[], campaignName: string) => {
    const csvContent = 'Campaign,Ad Group,Keywords,Volume,Click Potential\n' +
        adGroups.map(group => 
            group.keywords.map(keyword => 
                `"${campaignName}","${group.name}","${keyword.keyword}","${keyword.volume}","${keyword.clickPotential}"`
            ).join('\n')
        ).join('\n');
    
    downloadFile(`${campaignName}-ad-groups.csv`, csvContent, 'text/csv');
};

export const exportAdGroupsAsTXT = (adGroups: AdGroup[], campaignName: string) => {
    const txtContent = adGroups.map(group => {
        const header = `=== ${group.name.toUpperCase()} ===\n`;
        const content = group.keywords.map(keyword => 
            `Keyword: ${keyword.keyword}\nVolume: ${keyword.volume}\nClick Potential: ${keyword.clickPotential}\n`
        ).join('\n');
        return header + content;
    }).join('\n\n');
    
    downloadFile(`${campaignName}-ad-groups.txt`, txtContent, 'text/plain');
};

export const calculateMonthlySummary = (campaigns: Campaign[]): SummaryData => {
    const totalBudget = campaigns.reduce((sum, campaign) => sum + (Number(campaign.budget) || 0), 0);
    const totalImpressions = campaigns.reduce((sum, campaign) => sum + (Number(campaign.impressoes) || 0), 0);
    const totalClicks = campaigns.reduce((sum, campaign) => sum + (Number(campaign.cliques) || 0), 0);
    const totalConversions = campaigns.reduce((sum, campaign) => sum + (Number(campaign.conversoes) || 0), 0);
    const totalAlcance = campaigns.reduce((sum, campaign) => sum + (Number(campaign.alcance) || 0), 0);
    
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCPC = totalClicks > 0 ? totalBudget / totalClicks : 0;
    const avgCPM = totalImpressions > 0 ? (totalBudget / totalImpressions) * 1000 : 0;
    const avgCPA = totalConversions > 0 ? totalBudget / totalConversions : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    
    // Calculate channel budgets
    const channelBudgets: Record<string, number> = {};
    campaigns.forEach(campaign => {
        const channel = campaign.canal || 'Outros';
        channelBudgets[channel] = (channelBudgets[channel] || 0) + (Number(campaign.budget) || 0);
    });
    
    return {
        budget: totalBudget,
        impressoes: totalImpressions,
        alcance: totalAlcance,
        cliques: totalClicks,
        conversoes: totalConversions,
        channelBudgets,
        ctr: avgCTR,
        cpc: avgCPC,
        cpm: avgCPM,
        cpa: avgCPA,
        taxaConversao: conversionRate
    };
};

export const calculatePlanSummary = (planData: PlanData): { summary: SummaryData; monthlySummary: Record<string, SummaryData> } => {
    return calculateSummaryData(planData);
};

export const calculateSummaryData = (planData: PlanData): { summary: SummaryData; monthlySummary: Record<string, SummaryData> } => {
    const allCampaigns: Campaign[] = [];
    
    Object.values(planData.months || {}).forEach(monthData => {
        if (monthData && Array.isArray(monthData)) {
            allCampaigns.push(...monthData);
        }
    });
    
    const monthlySummary: Record<string, SummaryData> = {};
    
    Object.entries(planData.months || {}).forEach(([monthKey, monthData]) => {
        if (monthData && Array.isArray(monthData)) {
            monthlySummary[monthKey] = calculateMonthlySummary(monthData);
        }
    });
    
    const summary = calculateMonthlySummary(allCampaigns);
    
    return {
        summary,
        monthlySummary
    };
};
