

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChevronDown, PlusCircle, Trash2, Edit, Save, X, Menu, FileDown, Settings, Sparkles, Loader as LoaderIcon, Copy as CopyIcon, Check, Upload, Link2, LayoutDashboard, List, PencilRuler, FileText, Sheet, Sun, Moon, LogOut, Wand2, FilePlus2, ArrowLeft, MoreVertical, User as UserIcon, LucideProps, AlertTriangle, KeyRound, ImageIcon, Download } from 'lucide-react';
import { marked } from 'marked';
import { useLanguage, useTheme, useAuth } from './contexts';
import { callGeminiAPI, formatCurrency, formatPercentage, formatNumber, recalculateCampaignMetrics, calculateKPIs, getPlanById, supabase, savePlan, sortMonthKeys, generateAIKeywords, generateAIImages, exportCreativesAsCSV, exportCreativesAsTXT, exportUTMLinksAsCSV, exportUTMLinksAsTXT, exportGroupedKeywordsAsCSV, exportGroupedKeywordsAsTXT, calculatePlanSummary } from './services';
import { TRANSLATIONS, OPTIONS, COLORS, MONTHS_LIST, CHANNEL_FORMATS, DEFAULT_METRICS_BY_OBJECTIVE } from './constants';
import {
    PlanData, Campaign, CreativeTextData, UTMLink, MonthlySummary, SummaryData, KeywordSuggestion, AdGroup,
    CardProps, CharacterCountInputProps, AIResponseModalProps, CampaignModalProps, PlanDetailsModalProps,
    DashboardPageProps, MonthlyPlanPageProps, CreativeGroupProps, CopyBuilderPageProps, UTMBuilderPageProps, KeywordBuilderPageProps, CreativeBuilderPageProps,
    AddMonthModalProps, OnboardingPageProps, PlanSelectorPageProps, AISuggestionsModalProps,
    ChartCardProps, ChartsSectionProps, DashboardHeaderProps, RenamePlanModalProps, PlanCreationChoiceModalProps, AIPlanCreationModalProps,
    GeneratedImage,
    AspectRatio
} from './types';

// MasterPlan Logo URLs
export const LOGO_LIGHT = "https://drive.google.com/thumbnail?id=12zbca1bSq5F3bN52DzwoTQhcfVmdruWy";
export const LOGO_DARK = "https://drive.google.com/thumbnail?id=130_QHuGV1iT2c3BCgjNepuzNMi9rmxz3";
export const ICON_LOGO = "https://drive.google.com/thumbnail?id=132HE4ri3Ghz1xKFbfBSGRZ2E6P6wUDW3";

// --- Custom Icon Components (defined before usage) ---
const EyeIcon = (props: LucideProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const MousePointerClick = (props: LucideProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m9 9 5 12 1.8-5.2L21 14Z"/><path d="M7.2 2.2 8 5.1"/><path d="m5.1 8-2.9-.8"/><path d="M14 4.1 12 6"/><path d="m6 12-1.9 2"/></svg>;
const CheckSquare = (props: LucideProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
const TrendingUp = (props: LucideProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const DollarSign = (props: LucideProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const Target = (props: LucideProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
const VisitsIcon = (props: LucideProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;


// --- Reusable UI Components ---
export const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
    const baseClasses = "bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6";
    const clickableClasses = onClick ? "cursor-pointer hover:shadow-md transition-shadow" : "";
    return (
        <div className={`${baseClasses} ${clickableClasses} ${className}`} onClick={onClick}>
            {children}
        </div>
    );
};

export const CharacterCountInput: React.FC<CharacterCountInputProps> = ({ value, onChange, maxLength, placeholder, rows, onBlur }) => {
    const remaining = maxLength - value.length;
    const isError = remaining < 0;

    const commonProps = {
        value,
        onChange,
        maxLength,
        placeholder,
        onBlur,
        className: `w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 ${isError ? 'ring-red-500 border-red-500' : 'focus:ring-blue-500 focus:border-transparent'}`
    };

    return (
        <div className="w-full">
            {rows ? (
                <textarea {...commonProps} rows={rows}></textarea>
            ) : (
                <input type="text" {...commonProps} />
            )}
            <p className={`text-xs mt-1 text-right ${isError ? 'text-red-500 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                {remaining}
            </p>
        </div>
    );
};

export const AIResponseModal: React.FC<AIResponseModalProps> = ({ isOpen, onClose, title, content, isLoading }) => {
    const { t } = useLanguage();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl animate-modalFadeIn">
                <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2"><Sparkles className="text-blue-500"/> {title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <LoaderIcon className="animate-spin text-blue-500" size={40}/>
                        </div>
                    ) : (
                        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(content) as string }}/>
                    )}
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">{t('close')}</button>
                </div>
            </div>
        </div>
    );
};

export const CampaignModal: React.FC<CampaignModalProps> = ({ isOpen, onClose, onSave, campaignData, month, planObjective, customFormats, onAddFormat }) => {
    const { t } = useLanguage();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [newFormat, setNewFormat] = useState('');
    const [isAddingFormat, setIsAddingFormat] = useState(false);
    const [isAISuggestionLoading, setIsAISuggestionLoading] = useState(false);
    const [aiSuggestion, setAISuggestion] = useState<string>('');

    useEffect(() => {
        if (isOpen && campaignData) {
            setCampaign(campaignData);
        } else if (isOpen) {
            const defaultMetrics = DEFAULT_METRICS_BY_OBJECTIVE['Tráfego']; // Default to Tráfego
            const newCampaign = calculateKPIs({
                id: `c_${new Date().getTime()}`,
                ...defaultMetrics
            });
            setCampaign(newCampaign);
        } else {
            setCampaign(null);
            setAISuggestion('');
        }
    }, [isOpen, campaignData]);

    const handleChange = (field: keyof Campaign, value: any) => {
        if (!campaign) return;

        let tempCampaign: Campaign = { ...campaign, [field]: value };

        if (field === 'tipoCampanha') {
            const defaults = DEFAULT_METRICS_BY_OBJECTIVE[value as string] || {};
            tempCampaign = { ...tempCampaign, ...defaults };
        }
        
        const recalculated = recalculateCampaignMetrics(tempCampaign);
        setCampaign(recalculated);
    };

    const handleSave = () => {
        if (campaign) {
            onSave(month, campaign);
            onClose();
        }
    };
    
    const handleAddFormat = () => {
        if (newFormat.trim() && !isAddingFormat) {
            onAddFormat(newFormat.trim());
            setCampaign(prev => prev ? { ...prev, formato: newFormat.trim() } : null);
            setNewFormat('');
            setIsAddingFormat(false);
        }
    };

    const handleSuggestAudience = async () => {
        if (!campaign?.tipoCampanha || !campaign.canal || !campaign.objetivo) {
            alert(t('aiSuggestionPrereqAlert'));
            return;
        }
        setIsAISuggestionLoading(true);
        setAISuggestion('');
        try {
            const prompt = `Based on a media plan with the general objective "${planObjective}", generate a concise target audience suggestion (max 200 characters) for a specific campaign.
            Campaign Type: ${campaign.tipoCampanha}
            Channel: ${campaign.canal}
            Specific Objective: ${campaign.objetivo}
            
            Provide only the audience description text, with no preamble. For example: "Young professionals aged 25-35 interested in productivity software and tech news."`;
            
            const suggestion = await callGeminiAPI(prompt);
            setAISuggestion(suggestion);
        } catch (error) {
            console.error(error);
            setAISuggestion(t('Não foi possível gerar la sugestão. Tente novamente.'));
        } finally {
            setIsAISuggestionLoading(false);
        }
    };
    
    if (!isOpen || !campaign) return null;

    const availableFormats = [...new Set([...(CHANNEL_FORMATS[campaign?.canal || ''] || []), ...(customFormats || [])])];
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-start z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl my-8 animate-modalFadeIn">
                <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{campaignData ? t('Editar Campanha') : t('Nova Campanha')}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"><X size={24} /></button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
                    {/* Coluna 1: Planejamento */}
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b pb-2 mb-2">Planejamento Estratégico</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Tipo Campanha')}</label>
                                <select value={campaign.tipoCampanha || ''} onChange={(e) => handleChange('tipoCampanha', e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">{t('Selecione')}</option>
                                    {OPTIONS.tipoCampanha.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Etapa Funil')}</label>
                                <select value={campaign.etapaFunil || ''} onChange={(e) => handleChange('etapaFunil', e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">{t('Selecione')}</option>
                                    {OPTIONS.etapaFunil.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                         </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Canal')}</label>
                                <select value={campaign.canal || ''} onChange={(e) => handleChange('canal', e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                     <option value="">{t('Selecione')}</option>
                                     {OPTIONS.canal.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Formato')}</label>
                                {isAddingFormat ? (
                                    <div className="flex gap-2">
                                        <input 
                                            type="text"
                                            value={newFormat}
                                            onChange={(e) => setNewFormat(e.target.value)}
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                                            placeholder="Nome do formato"
                                            autoFocus
                                        />
                                        <button onClick={handleAddFormat} className="mt-1 px-3 py-2 bg-blue-600 text-white rounded-md text-sm">{t('save')}</button>
                                        <button onClick={() => setIsAddingFormat(false)} className="mt-1 px-3 py-2 bg-gray-200 dark:bg-gray-600 rounded-md text-sm"><X size={16}/></button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <select 
                                            value={campaign.formato || ''} 
                                            onChange={(e) => handleChange('formato', e.target.value)} 
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            disabled={!campaign.canal}
                                        >
                                            <option value="">{t(campaign.canal ? 'Selecione' : 'Selecione um canal')}</option>
                                            {availableFormats.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                        <button onClick={() => setIsAddingFormat(true)} className="mt-1 p-2 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"><PlusCircle size={20} /></button>
                                    </div>
                                )}
                             </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Objetivo')}</label>
                            <input type="text" value={campaign.objetivo || ''} onChange={(e) => handleChange('objetivo', e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('KPI')}</label>
                            <input type="text" value={campaign.kpi || ''} onChange={(e) => handleChange('kpi', e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Público-Alvo')}</label>
                           <textarea value={campaign.publicoAlvo || ''} onChange={(e) => handleChange('publicoAlvo', e.target.value)} rows={3} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                           <button onClick={handleSuggestAudience} disabled={isAISuggestionLoading} className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50">
                                {isAISuggestionLoading ? <LoaderIcon size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                {t('Sugerir Público com IA')}
                           </button>
                           {aiSuggestion && (
                               <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md text-sm text-blue-800 dark:text-blue-200">
                                   <p>{aiSuggestion}</p>
                                   <button onClick={() => { handleChange('publicoAlvo', aiSuggestion); setAISuggestion(''); }} className="mt-2 text-xs font-bold hover:underline">{t('Aplicar')}</button>
                               </div>
                           )}
                        </div>
                        
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b pb-2 pt-4 mb-2">Orçamento e Compra</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Budget (R$)')}</label>
                                <input type="number" step="100" value={campaign.budget || ''} onChange={(e) => handleChange('budget', parseFloat(e.target.value))} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Unidade de Compra')}</label>
                                <select value={campaign.unidadeCompra || ''} onChange={(e) => handleChange('unidadeCompra', e.target.value)} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">{t('Selecione')}</option>
                                    {OPTIONS.unidadeCompra.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                        </div>

                    </div>

                    {/* Coluna 2: Métricas */}
                    <div className="md:col-span-1 space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border dark:border-gray-700">
                         <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 border-b pb-2 mb-2">{t('Métricas Estimadas')}</h3>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('Impressões')}</label>
                                <input type="number" value={Math.round(campaign.impressoes || 0)} onChange={(e) => handleChange('impressoes', parseInt(e.target.value, 10))} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-sm"/>
                             </div>
                             <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('Alcance')}</label>
                                <p className="mt-1 block w-full rounded-md py-2 px-3 bg-gray-200 dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 text-sm font-semibold">{formatNumber(campaign.alcance)}</p>
                             </div>
                             <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('Cliques')}</label>
                                <input type="number" value={Math.round(campaign.cliques || 0)} onChange={(e) => handleChange('cliques', parseInt(e.target.value, 10))} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-sm"/>
                             </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('CTR (%)')}</label>
                                <input type="number" step="0.01" value={campaign.ctr || ''} onChange={(e) => handleChange('ctr', parseFloat(e.target.value))} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-sm"/>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('CPC (R$)')}</label>
                                <input type="number" step="0.01" value={Number(campaign.cpc).toFixed(2) || ''} onChange={(e) => handleChange('cpc', parseFloat(e.target.value))} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-sm"/>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('CPM (R$)')}</label>
                                <input type="number" step="0.01" value={Number(campaign.cpm).toFixed(2) || ''} onChange={(e) => handleChange('cpm', parseFloat(e.target.value))} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-sm"/>
                              </div>
                             <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('Taxa de Conversão (%)')}</label>
                                <input type="number" step="0.01" value={campaign.taxaConversao || ''} onChange={(e) => handleChange('taxaConversao', parseFloat(e.target.value))} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-sm"/>
                             </div>
                             <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('Connect Rate (%)')}</label>
                                <input type="number" step="1" value={campaign.connectRate || ''} onChange={(e) => handleChange('connectRate', parseFloat(e.target.value))} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 text-sm"/>
                             </div>
                             <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('Conversões')}</label>
                                <p className="mt-1 block w-full rounded-md py-2 px-3 bg-gray-200 dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 text-sm font-semibold">{formatNumber(campaign.conversoes)}</p>
                             </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('Visitas')}</label>
                                <p className="mt-1 block w-full rounded-md py-2 px-3 bg-gray-200 dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 text-sm font-semibold">{formatNumber(campaign.visitas)}</p>
                             </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{t('CPA (R$)')}</label>
                                <p className="mt-1 block w-full rounded-md py-2 px-3 bg-gray-200 dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 text-sm font-semibold">{formatCurrency(campaign.cpa)}</p>
                             </div>
                         </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">{t('cancel')}</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"><Save size={18}/> {t('Salvar Campanha')}</button>
                </div>
            </div>
        </div>
    );
};

export const PlanDetailsModal: React.FC<PlanDetailsModalProps> = ({ isOpen, onClose, onSave, planData, onRename, onDuplicate }) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const [details, setDetails] = useState<Partial<Omit<PlanData, 'id' | 'months'>>>(planData);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if(isOpen) {
            setDetails(planData)
        }
    }, [isOpen, planData])

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(details);
        onClose();
    };

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setDetails(prev => ({...prev, logoUrl: reader.result as string}))
            };
            reader.readAsDataURL(file);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl animate-modalFadeIn">
                <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('Configurações do Plano')}</h2>
                     <div className="flex items-center gap-2">
                         <button onClick={() => onRename(planData)} className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" title={t('Rename')}><Edit size={18} /></button>
                         <button onClick={() => onDuplicate(planData)} className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white" title={t('Duplicate Plan')}><CopyIcon size={18} /></button>
                         <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"><X size={24} /></button>
                     </div>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                         <div className="sm:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Logotipo')}</label>
                            <img src={details.logoUrl || 'https://placehold.co/400x300/e2e8f0/e2e8f0'} alt="Logo" className="mt-1 w-full aspect-square object-cover rounded-md bg-gray-200 dark:bg-gray-700"/>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            <button onClick={() => fileInputRef.current?.click()} className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <Upload size={16} /> {t('Upload')}
                            </button>
                            <input
                                type="text"
                                value={details.logoUrl || ''}
                                onChange={(e) => setDetails(prev => ({ ...prev, logoUrl: e.target.value }))}
                                placeholder={t('Cole a URL do logotipo aqui')}
                                className="mt-2 w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                            />
                         </div>
                         <div className="sm:col-span-2 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Nome da Campanha')}</label>
                                <input type="text" value={details.campaignName || ''} readOnly className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 cursor-not-allowed"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Objetivo Geral')}</label>
                                <textarea value={details.objective || ''} onChange={(e) => setDetails(prev => ({...prev, objective: e.target.value}))} rows={3} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Público-Alvo Principal')}</label>
                                <textarea value={details.targetAudience || ''} onChange={(e) => setDetails(prev => ({...prev, targetAudience: e.target.value}))} rows={3} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                            </div>
                         </div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Praça')}</label>
                            <input type="text" value={details.location || ''} onChange={(e) => setDetails(prev => ({...prev, location: e.target.value}))} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Período')}</label>
                             <p className="mt-1 block w-full rounded-md py-2 px-3 bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 h-[42px] flex items-center">
                                {Object.keys(planData.months || {}).length} {t('Meses')}
                            </p>
                        </div>
                     </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Investimento Total Planejado (R$)')}</label>
                        <input type="number" value={details.totalInvestment || 0} onChange={(e) => setDetails(prev => ({...prev, totalInvestment: parseFloat(e.target.value) || 0}))} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">{t('cancel')}</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"><Save size={18}/> {t('save')}</button>
                </div>
            </div>
        </div>
    );
};

export const RenamePlanModal: React.FC<RenamePlanModalProps> = ({ isOpen, onClose, plan, onSave }) => {
    const { t } = useLanguage();
    const [newName, setNewName] = useState(plan.campaignName);

    useEffect(() => {
        setNewName(plan.campaignName);
    }, [plan.campaignName]);
    
    if(!isOpen) return null;

    const handleSave = () => {
        if(newName.trim()){
            onSave(plan.id, newName.trim());
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md animate-modalFadeIn">
                <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('Rename Plan')}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-6">
                    <label htmlFor="plan-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Plan Name')}</label>
                    <input 
                        id="plan-name"
                        type="text" 
                        value={newName} 
                        onChange={e => setNewName(e.target.value)}
                        className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">{t('cancel')}</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"><Save size={18}/> {t('save')}</button>
                </div>
            </div>
        </div>
    );
};

export const AISuggestionsModal: React.FC<AISuggestionsModalProps> = ({ isOpen, onClose, isLoading, suggestions, onApplySuggestion, onApplyAllSuggestions, title }) => {
    const { t } = useLanguage();
    const [applied, setApplied] = useState<Record<string, number[]>>({});

    useEffect(() => {
        if (isOpen) {
            setApplied({});
        }
    }, [isOpen]);
    
    if (!isOpen) return null;

    const handleApply = (type: string, text: string, index: number) => {
        onApplySuggestion(type, text);
        setApplied(prev => ({
            ...prev,
            [type]: [...(prev[type] || []), index]
        }));
    };
    
    const handleApplyAll = (type: string, texts: string[]) => {
        if(onApplyAllSuggestions) onApplyAllSuggestions(type, texts);
        // Mark all as applied
        setApplied(prev => ({
            ...prev,
            [type]: texts.map((_, i) => i)
        }));
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl animate-modalFadeIn">
                <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <Sparkles className="text-blue-500"/>
                        {title || t('Sugestões de Criativos (IA)')}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-600 dark:text-gray-400">
                            <LoaderIcon className="animate-spin text-blue-500" size={40}/>
                            <p className="mt-4">{t('Gerando sugestões...')}</p>
                        </div>
                    ) : (
                        suggestions && Object.keys(suggestions).length > 0 ? (
                             <div className="space-y-6">
                                {Object.entries(suggestions).map(([type, texts]) => (
                                    <div key={type}>
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-lg font-semibold capitalize text-gray-900 dark:text-gray-100">{t(type)}</h3>
                                            {onApplyAllSuggestions && (
                                                <button 
                                                    onClick={() => handleApplyAll(type, texts)} 
                                                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    {t('Aplicar Todos')}
                                                </button>
                                            )}
                                        </div>
                                        <ul className="space-y-2">
                                            {texts.map((text, index) => {
                                                const isApplied = applied[type]?.includes(index);
                                                return (
                                                    <li key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                                        <p className="text-gray-800 dark:text-gray-200">{text}</p>
                                                        <button 
                                                            onClick={() => handleApply(type, text, index)}
                                                            disabled={isApplied}
                                                            className="px-3 py-1 text-xs font-semibold rounded-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-1.5"
                                                            style={{
                                                                backgroundColor: isApplied ? '#10B981' : '#3B82F6', // green-500 or blue-500
                                                                color: 'white'
                                                            }}
                                                        >
                                                            {isApplied ? (
                                                                <>
                                                                    <Check size={14}/> {t('Aplicado')}
                                                                </>
                                                            ) : (
                                                                t('Aplicar')
                                                            )}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="flex flex-col items-center justify-center h-64 text-gray-600 dark:text-gray-400">
                                <AlertTriangle size={40} className="mb-4 text-yellow-500"/>
                                <p>{t('Nenhuma sugestão gerada ou erro ao buscar sugestões.')}</p>
                             </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Page-Specific Components ---
export const LoginPage: React.FC = () => {
    const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuth();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const logoSrc = theme === 'dark' ? LOGO_DARK : LOGO_LIGHT;
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isSignUp) {
                if (!displayName) {
                    setError('Display name is required for sign up.');
                    return;
                }
                await signUpWithEmail(email, password, displayName);
            } else {
                await signInWithEmail(email, password);
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred.');
        }
    };

    return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="max-w-md w-full shadow-2xl animate-modalFadeIn">
                <img src={logoSrc} alt="MasterPlan Logo" className="mx-auto h-12 mb-2" />
                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">{isSignUp ? t('create_account') : t('Plano de Mídia com Inteligência')}</h1>
                <p className="mt-2 mb-6 text-center text-gray-600 dark:text-gray-400">{t('A única ferramenta que o profissional de mídia paga precisa.')}</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isSignUp && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Nome')}</label>
                            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Password')}</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                    </div>
                    
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-70">
                        {loading ? <LoaderIcon className="animate-spin" /> : (isSignUp ? t('sign_up') : t('sign_in'))}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">{t('ou')}</span>
                    </div>
                </div>

                <button onClick={signInWithGoogle} disabled={loading} className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-70">
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.089,5.571l6.19,5.238C42.022,36.213,44,30.556,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    </svg>
                    {t('Entrar com Google')}
                </button>

                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    {isSignUp ? t('already_have_account') : t('dont_have_account')}
                    <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 ml-1">
                        {isSignUp ? t('sign_in') : t('sign_up')}
                    </button>
                </p>
            </Card>
        </div>
    );
};

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onRequestAI, onSelectBlank, onSelectTemplate }) => {
    const { t } = useLanguage();

    return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="max-w-4xl w-full text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('welcome_to_masterplan')}</h1>
                <p className="mt-2 mb-8 text-lg text-gray-600 dark:text-gray-400">{t('create_first_plan')}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button onClick={onRequestAI} className="text-left p-6 border-2 border-transparent rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:border-blue-500 hover:shadow-lg transition-all">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100"><Sparkles className="text-blue-500"/> {t('create_with_ai')}</h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{t('ai_description')}</p>
                    </button>
                    <button onClick={onSelectTemplate} className="text-left p-6 border-2 border-transparent rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:border-green-500 hover:shadow-lg transition-all">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100"><FileText className="text-green-500"/> {t('create_from_template')}</h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{t('template_description')}</p>
                    </button>
                    <button onClick={onSelectBlank} className="text-left p-6 border-2 border-transparent rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:border-gray-500 hover:shadow-lg transition-all">
                        <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100"><FilePlus2 className="text-gray-500"/> {t('start_blank')}</h2>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">{t('blank_description')}</p>
                    </button>
                </div>
            </Card>
        </div>
    );
};

export const PlanCreationChoiceModal: React.FC<PlanCreationChoiceModalProps> = ({ isOpen, onClose, onRequestAI, onSelectBlank, onSelectTemplate }) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg text-center animate-modalFadeIn">
                <div className="p-5 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('create_new_plan')}</h2>
                </div>
                <div className="p-6 space-y-4">
                    <button onClick={onRequestAI} className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('create_with_ai')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('ai_description')}</p>
                    </button>
                    <button onClick={onSelectBlank} className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('start_blank')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('blank_description')}</p>
                    </button>
                    <button onClick={onSelectTemplate} className="w-full text-left p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('create_from_template')}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('template_description')}</p>
                    </button>
                </div>
                 <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">{t('cancel')}</button>
                </div>
            </div>
        </div>
    );
};

export const AddMonthModal: React.FC<AddMonthModalProps> = ({ isOpen, onClose, onAddMonth, existingMonths }) => {
    const { t } = useLanguage();
    const [selectedMonth, setSelectedMonth] = useState('');

    const availableMonths = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        const allPossibleMonths = [
            ...MONTHS_LIST.map(m => `${currentYear}-${m}`),
            ...MONTHS_LIST.map(m => `${nextYear}-${m}`)
        ];
        return allPossibleMonths.filter(m => !existingMonths.includes(m));
    }, [existingMonths]);

    useEffect(() => {
        if (isOpen) {
            setSelectedMonth(''); // Reset on open
        }
    }, [isOpen]);

    const handleAdd = () => {
        if (selectedMonth) {
            onAddMonth(selectedMonth);
            onClose();
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md animate-modalFadeIn">
                <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('Adicionar Mês ao Plano')}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Mês')}</label>
                        {availableMonths.length > 0 ? (
                            <select 
                                id="month-select"
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(e.target.value)}
                                className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="" disabled>{t('Selecione um mês')}</option>
                                {availableMonths.map(monthKey => {
                                    const [year, monthName] = monthKey.split('-');
                                    return <option key={monthKey} value={monthKey}>{t(monthName)} {year}</option>;
                                })}
                            </select>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">{t('Todos os meses já foram adicionados.')}</p>
                        )}
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex justify-end">
                    <button onClick={handleAdd} disabled={!selectedMonth || availableMonths.length === 0} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                        <PlusCircle size={18} /> {t('Adicionar Mês')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const AIPlanCreationModal: React.FC<AIPlanCreationModalProps> = ({ isOpen, onClose, onGenerate, isLoading, initialPrompt, title, buttonText, loadingText }) => {
    const { t } = useLanguage();
    const [prompt, setPrompt] = useState(initialPrompt || '');

    useEffect(() => {
        if (initialPrompt) {
            setPrompt(initialPrompt);
        }
    }, [initialPrompt]);

    if (!isOpen) return null;

    const handleGenerate = () => {
        if (prompt.trim()) {
            onGenerate(prompt);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg animate-modalFadeIn">
                <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2"><Sparkles className="text-blue-500" />{title || t('Crie seu Plano com IA')}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">{t('Descreva seu negócio, objetivos e público')}</p>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={5}
                        className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t('Ex: Uma cafeteria em São Paulo focada em jovens profissionais. Objetivo: aumentar o fluxo na loja.')}
                        disabled={isLoading}
                    />
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex justify-end">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt.trim()}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <LoaderIcon size={20} className="animate-spin" />
                                {loadingText || t('Gerando seu plano...')}
                            </>
                        ) : (
                            <>
                                <Wand2 size={18} />
                                {buttonText || t('Gerar Plano')}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ShareLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    link: string;
}
export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({ isOpen, onClose, link }) => {
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);
    const isError = !link.startsWith('http');

    const copyToClipboard = () => {
        if (isError) return;
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    useEffect(() => {
        if (isOpen) {
            setCopied(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg animate-modalFadeIn">
                <div className="p-5 border-b dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2"><Link2 className="text-blue-500" />{t('share_plan_title')}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">{t('share_plan_desc')}</p>
                    <div className="relative">
                        <input
                            type="text"
                            value={link}
                            readOnly
                            className={`w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 pr-24 bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-200 ${isError ? 'text-red-500' : ''}`}
                        />
                         <button onClick={copyToClipboard} disabled={isError || copied} className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1.5 text-sm bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-green-600 disabled:opacity-70">
                             {copied ? <><Check size={16}/> {t('copied')}</> : <><CopyIcon size={16}/> {t('copy_link')}</>}
                         </button>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">{t('close')}</button>
                </div>
            </div>
        </div>
    )
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onProfileClick }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const { theme } = useTheme();
    const logoSrc = theme === 'dark' ? LOGO_DARK : LOGO_LIGHT;

    return (
        <div className="flex justify-between items-center mb-6">
            <img 
                src={logoSrc} 
                alt="MasterPlan Logo" 
                className="h-12"
            />
            <div className="flex items-center gap-4">
                <button onClick={onProfileClick}>
                    <img src={user?.photoURL || 'https://placehold.co/100x100'} alt="User Profile" className="w-10 h-10 rounded-full"/>
                </button>
            </div>
        </div>
    );
};

export const PlanSelectorPage: React.FC<PlanSelectorPageProps> = ({ plans, onSelectPlan, onRequestAI, onSelectBlank, onSelectTemplate, user, onProfileClick, onDeletePlan }) => {
    const { t } = useLanguage();
    const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
    const [planToDelete, setPlanToDelete] = useState<string | null>(null);

    const createPlan = (createFn: () => void) => {
        createFn();
        setIsChoiceModalOpen(false);
    };

    const handleDeleteClick = (e: React.MouseEvent, planId: string) => {
        e.stopPropagation(); // Prevent card click
        setPlanToDelete(planId);
    };

    const confirmDelete = () => {
        if(planToDelete) {
            onDeletePlan(planToDelete);
            setPlanToDelete(null);
        }
    }
    
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <DashboardHeader onProfileClick={onProfileClick} />
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">{t('my_plans')}</h1>
                    <button 
                        onClick={() => setIsChoiceModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
                    >
                        <PlusCircle size={20} />
                        {t('create_new_plan')}
                    </button>
                </div>
                {plans.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {plans.map(plan => (
                            <Card key={plan.id} className="flex flex-col justify-between !p-0 overflow-hidden" onClick={() => onSelectPlan(plan)}>
                                <div className="p-5">
                                    <img 
                                        src={plan.logoUrl || 'https://placehold.co/400x300/e2e8f0/e2e8f0?text=Plan'} 
                                        alt={`${plan.campaignName} logo`}
                                        className="w-full h-32 object-cover rounded-md mb-4 bg-gray-200 dark:bg-gray-700"
                                        onError={(e) => { const target = e.target as HTMLImageElement; target.onerror = null; target.src='https://placehold.co/400x300/e2e8f0/e2e8f0?text=Image+Error'; }}
                                    />
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate" title={plan.campaignName}>{plan.campaignName}</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate" title={plan.objective}>{plan.objective}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800/50 p-3 flex justify-between items-center border-t dark:border-gray-700">
                                     <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{formatCurrency(plan.totalInvestment)}</span>
                                    <button onClick={(e) => handleDeleteClick(e, plan.id)} className="text-gray-400 hover:text-red-500 p-1 rounded-full"><Trash2 size={16} /></button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{t('Nenhum plano encontrado')}</h2>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">{t('Crie seu primeiro plano de mídia para começar.')}</p>
                    </div>
                )}
                 <footer className="text-center mt-12 text-gray-500 dark:text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} MasterPlan. {t('Todos os direitos reservados.')}
                </footer>
            </div>
            <PlanCreationChoiceModal
                isOpen={isChoiceModalOpen}
                onClose={() => setIsChoiceModalOpen(false)}
                onRequestAI={() => createPlan(onRequestAI)}
                onSelectBlank={() => createPlan(onSelectBlank)}
                onSelectTemplate={() => createPlan(onSelectTemplate)}
            />
             {planToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md animate-modalFadeIn">
                        <div className="p-5">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('Delete Plan')}</h2>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">{t('Confirm Delete This Plan')}</p>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t dark:border-gray-700 flex justify-end gap-3">
                            <button onClick={() => setPlanToDelete(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">{t('cancel')}</button>
                            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">{t('delete')}</button>
                        </div>
                    </div>
                </div>
             )}
        </div>
    );
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ planData, onNavigate, onAddMonthClick, onRegeneratePlan, isRegenerating, isReadOnly = false }) => {
    const { t, language } = useLanguage();
    const [isAIAnalysisModalOpen, setAIAnalysisModalOpen] = useState(false);
    const [aiAnalysisContent, setAIAnalysisContent] = useState('');
    const [isAIAnalysisLoading, setIsAIAnalysisLoading] = useState(false);
    const [isAIPlanAdjustModalOpen, setIsAIPlanAdjustModalOpen] = useState(false);

    const allCampaigns: Campaign[] = useMemo(() => 
        Object.values(planData.months || {}).flat()
    , [planData.months]);

    const { summary, monthlySummary } = useMemo(() => calculatePlanSummary(planData), [planData]);

    const handleAnalyzePlan = async () => {
        setAIAnalysisModalOpen(true);
        setIsAIAnalysisLoading(true);
        try {
            const langInstruction = language === 'pt-BR' ? 'Responda em Português.' : 'Respond in English.';
            const prompt = `
                Analyze the following media plan summary. Provide a concise, strategic analysis in markdown format. 
                Focus on:
                1.  **Alignment**: Is the budget distribution aligned with the plan's main objective?
                2.  **Opportunities**: Identify potential optimizations, channels to explore, or funnel stages to reinforce.
                3.  **Risks**: Point out any potential risks like over-reliance on one channel or unrealistic KPIs.
                4.  **Actionable Recommendations**: Give 2-3 clear, actionable next steps.
                
                ${langInstruction}

                **Plan Data:**
                - Main Objective: ${planData.objective}
                - Target Audience: ${planData.targetAudience}
                - Total Investment: ${formatCurrency(summary.budget)}
                - Period: ${Object.keys(planData.months).join(', ')}
                - Investment distribution by channel: ${JSON.stringify(summary.channelBudgets)}
                - Key Metrics: Clicks: ${summary.cliques}, Conversions: ${summary.conversoes}, CTR: ${formatPercentage(summary.ctr)}, CPA: ${formatCurrency(summary.cpa)}
            `;
            const analysis = await callGeminiAPI(prompt);
            setAIAnalysisContent(analysis);
        } catch (error) {
            console.error(error);
            setAIAnalysisContent(`<p style="color: red;">${t('Erro ao analisar plano com IA.')}</p>`);
        } finally {
            setIsAIAnalysisLoading(false);
        }
    };

    const handleRegenerate = (prompt: string) => {
        onRegeneratePlan(prompt);
        setIsAIPlanAdjustModalOpen(false);
    }
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                    <Card className="h-full">
                        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t('Resumo do Plano')}</h2>
                                <dl className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="flex flex-col">
                                        <dt className="font-semibold text-gray-800 dark:text-gray-200">{t('Objetivo')}:</dt>
                                        <dd className="pl-2">{planData.objective}</dd>
                                    </div>
                                     <div className="flex flex-col">
                                        <dt className="font-semibold text-gray-800 dark:text-gray-200">{t('Público-Alvo')}:</dt>
                                        <dd className="pl-2">{planData.targetAudience}</dd>
                                    </div>
                                     <div className="flex flex-col">
                                        <dt className="font-semibold text-gray-800 dark:text-gray-200">{t('Investimento Planejado')}:</dt>
                                        <dd className="font-bold text-gray-800 dark:text-gray-200 pl-2">{formatCurrency(planData.totalInvestment)}</dd>
                                    </div>
                                     <div className="flex flex-col">
                                        <dt className="font-semibold text-gray-800 dark:text-gray-200">{t('Investimento Previsto')}:</dt>
                                        <dd className="font-bold text-gray-800 dark:text-gray-200 pl-2">{formatCurrency(summary.budget)}</dd>
                                    </div>
                                     <div className="flex flex-col">
                                        <dt className="font-semibold text-gray-800 dark:text-gray-200">{t('Período')}:</dt>
                                        <dd className="pl-2">{Object.keys(planData.months || {}).length} {t('Meses')}</dd>
                                    </div>
                                </dl>
                            </div>
                            {!isReadOnly && (
                                <div className="flex-shrink-0 flex flex-col sm:flex-row lg:flex-col gap-2 w-full sm:w-auto lg:w-auto">
                                    <button onClick={handleAnalyzePlan} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 justify-center">
                                        <Sparkles size={16}/> {t('Analisar Plano com IA')}
                                    </button>
                                    {planData.aiPrompt && (
                                         <button onClick={() => setIsAIPlanAdjustModalOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 flex items-center gap-2 justify-center">
                                            <Wand2 size={16}/> {t('Ajustar Plano com IA')}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
                    <MetricCard title={t('Investimento Total')} value={formatCurrency(summary.budget)} icon={DollarSign} />
                    <MetricCard title={t('Impressões')} value={formatNumber(summary.impressoes)} icon={EyeIcon} />
                    <MetricCard title={t('Cliques')} value={formatNumber(summary.cliques)} icon={MousePointerClick} />
                    <MetricCard title={t('Conversões')} value={formatNumber(summary.conversoes)} icon={CheckSquare} />
                    <MetricCard title={t('CTR (%)')} value={formatPercentage(summary.ctr)} icon={TrendingUp} />
                    <MetricCard title={t('CPA (R$)')} value={formatCurrency(summary.cpa)} icon={Target} />
                </div>
            </div>
            
            <Card>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{t('Performance por Mês')}</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">{t('Mês')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('Invest. Total')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('% Share')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('Impressões')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('Cliques')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('Conversões')}</th>
                                <th scope="col" className="px-6 py-3 text-right">{t('Tx. Conversão')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(monthlySummary).sort(sortMonthKeys).map(month => {
                                const share = planData.totalInvestment > 0 ? (monthlySummary[month].budget / planData.totalInvestment) * 100 : 0;
                                return (
                                    <tr key={month} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/20">
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate(month); }} className="font-medium text-blue-600 dark:text-blue-500 hover:underline">
                                                {month.split('-').reverse().map(p => t(p)).join(' ')}
                                            </a>
                                        </th>
                                        <td className="px-6 py-4 text-right">{formatCurrency(monthlySummary[month].budget)}</td>
                                        <td className="px-6 py-4 text-right">{formatPercentage(share)}</td>
                                        <td className="px-6 py-4 text-right">{formatNumber(monthlySummary[month].impressoes)}</td>
                                        <td className="px-6 py-4 text-right">{formatNumber(monthlySummary[month].cliques)}</td>
                                        <td className="px-6 py-4 text-right">{formatNumber(monthlySummary[month].conversoes)}</td>
                                        <td className="px-6 py-4 text-right">{formatPercentage(monthlySummary[month].taxaConversao)}</td>
                                    </tr>
                                );
                            })}
                            <tr className="bg-gray-100 dark:bg-gray-700/50 font-bold text-gray-900 dark:text-white">
                                <td className="px-6 py-3">{t('Totais')}</td>
                                <td className="px-6 py-3 text-right">{formatCurrency(summary.budget)}</td>
                                <td className="px-6 py-3 text-right">{formatPercentage(planData.totalInvestment > 0 ? (summary.budget / planData.totalInvestment) * 100 : 0)}</td>
                                <td className="px-6 py-3 text-right">{formatNumber(summary.impressoes)}</td>
                                <td className="px-6 py-3 text-right">{formatNumber(summary.cliques)}</td>
                                <td className="px-6 py-3 text-right">{formatNumber(summary.conversoes)}</td>
                                <td className="px-6 py-3 text-right">{formatPercentage(summary.taxaConversao)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                {!isReadOnly && Object.keys(planData.months || {}).length < 12 && (
                     <button onClick={onAddMonthClick} className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50">
                        <PlusCircle size={16} /> {t('Adicionar Mês')}
                    </button>
                )}
            </Card>

            <ChartsSection campaigns={allCampaigns} title={t('Distribuição de Investimento (Geral)')}/>

            <AIResponseModal 
                isOpen={isAIAnalysisModalOpen}
                onClose={() => setAIAnalysisModalOpen(false)}
                title={t('Análise Estratégica do Plano')}
                content={aiAnalysisContent}
                isLoading={isAIAnalysisLoading}
            />

            {!isReadOnly && planData.aiPrompt && (
                 <AIPlanCreationModal
                    isOpen={isAIPlanAdjustModalOpen}
                    onClose={() => setIsAIPlanAdjustModalOpen(false)}
                    onGenerate={handleRegenerate}
                    isLoading={isRegenerating}
                    initialPrompt={planData.aiPrompt}
                    title={t('Ajustar Prompt do Plano IA')}
                    buttonText={t('Regerar Plano')}
                    loadingText={t('Regerando plano...')}
                />
            )}
        </div>
    );
};

const MetricCard: React.FC<{title:string; value:string|number; icon: React.FC<LucideProps>}> = ({title, value, icon:Icon}) => (
    <Card className="!p-4 h-full">
        <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            </div>
        </div>
    </Card>
);

const CustomPieLegend: React.FC<any> = (props) => {
  const { payload } = props;
  const { t } = useLanguage();
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 text-xs text-gray-600 dark:text-gray-300">
      {payload.map((entry: any, index: number) => (
        <li key={`item-${index}`} className="flex items-center gap-2">
           <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
           <span>{t(entry.value)}</span>
           <span>{`${(entry.payload.percent * 100).toFixed(0)}%`}</span>
        </li>
      ))}
    </ul>
  );
};

export const ChartCard: React.FC<ChartCardProps> = ({ title, data, dataKey, nameKey, className, customLegend }) => {
    const { theme } = useTheme();

    // Dynamically set colors based on the current theme
    const labelColor = theme === 'dark' ? '#e5e7eb' : '#374151'; // gray-200 for dark, gray-700 for light
    const lineColor = theme === 'dark' ? '#4B5563' : '#D1D5DB';  // gray-600 for dark, gray-300 for light
    const tooltipBg = theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.95)';
    const tooltipBorder = theme === 'dark' ? '#4b5563' : '#e5e7eb';
    const tooltipColor = theme === 'dark' ? '#ffffff' : '#1f2937';

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const radius = outerRadius + 15; // Position label outside the pie
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) { // Hide labels for very small slices to prevent clutter
            return null;
        }

        return (
            <text x={x} y={y} fill={labelColor} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };
    
    return (
        <Card className={className}>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">{title}</h3>
            <div style={{ width: '100%', height: 250 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={{ stroke: lineColor }}
                            label={renderCustomizedLabel}
                            outerRadius={70}
                            fill="#8884d8"
                            dataKey={dataKey}
                            nameKey={nameKey}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                          formatter={(value, name) => [formatCurrency(value as number), name]}
                          contentStyle={{
                            backgroundColor: tooltipBg,
                            border: `1px solid ${tooltipBorder}`,
                            borderRadius: '0.5rem',
                          }}
                          itemStyle={{ color: tooltipColor }}
                          labelStyle={{ color: tooltipColor, fontWeight: 'bold' }}
                          cursor={{ fill: 'rgba(75, 85, 99, 0.2)' }}
                        />
                        <Legend content={customLegend || <CustomPieLegend />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

export const ChartsSection: React.FC<ChartsSectionProps> = ({ campaigns, title }) => {
    const { t } = useLanguage();

    const processData = (key: keyof Campaign) => {
        return campaigns.reduce((acc, campaign) => {
            const group = (campaign[key] as string) || 'N/A';
            const budget = Number(campaign.budget) || 0;
            const existing = acc.find(item => item.name === group);
            if (existing) {
                existing.value += budget;
            } else {
                acc.push({ name: group, value: budget });
            }
            return acc;
        }, [] as { name: string, value: number }[]).sort((a,b) => b.value - a.value);
    };

    const channelData = processData('canal');
    const typeData = processData('tipoCampanha');
    const funnelData = processData('etapaFunil');
    const formatData = processData('formato');

    const charts = [
        { titleKey: "Investimento por Canal", data: channelData, customLegend: <CustomPieLegend /> },
        { titleKey: "Investimento por Tipo de Campanha", data: typeData },
        { titleKey: "Investimento por Formato", data: formatData },
        { titleKey: "Investimento por Etapa Funil", data: funnelData }
    ].filter(c => c.data.length > 0);

    if (charts.length === 0) {
        return (
            <Card>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
                <p className="text-center text-sm text-gray-500 py-8">{t('Nenhuma campanha para este mês.')}</p>
            </Card>
        );
    }
    
    return (
        <div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{title}</h3>
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6`}>
                 {charts.map((chartInfo) => (
                    <ChartCard
                        key={chartInfo.titleKey}
                        title={t(chartInfo.titleKey)}
                        data={chartInfo.data}
                        dataKey="value"
                        nameKey="name"
                        customLegend={chartInfo.customLegend}
                    />
                 ))}
            </div>
        </div>
    );
};

export const MonthlyPlanPage: React.FC<MonthlyPlanPageProps> = ({ month, campaigns, onSave, onDelete, planObjective, customFormats, onAddFormat, totalInvestment, isReadOnly = false }) => {
    const { t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

    const handleOpenModal = (campaign: Campaign | null = null) => {
        setEditingCampaign(campaign);
        setIsModalOpen(true);
    };

    const monthlySummary = useMemo(() => {
        return campaigns.reduce((acc, campaign) => {
            acc.budget += Number(campaign.budget) || 0;
            acc.orcamentoDiario += Number(campaign.orcamentoDiario) || 0;
            acc.impressoes += Number(campaign.impressoes) || 0;
            acc.cliques += Number(campaign.cliques) || 0;
            acc.conversoes += Number(campaign.conversoes) || 0;
            acc.visitas += Number(campaign.visitas) || 0;
            acc.alcance += Number(campaign.alcance) || 0;
            return acc;
        }, { budget: 0, orcamentoDiario: 0, impressoes: 0, cliques: 0, conversoes: 0, visitas:0, alcance: 0 });
    }, [campaigns]);

    const totalBudget = monthlySummary.budget;
    const totalOrcamentoDiario = monthlySummary.orcamentoDiario;
    const totalImpressions = monthlySummary.impressoes;
    const totalAlcance = monthlySummary.alcance;
    const totalCliques = monthlySummary.cliques;
    const totalConversoes = monthlySummary.conversoes;
    const totalVisitas = monthlySummary.visitas;
    
    const aggregateShare = totalInvestment > 0 ? (totalBudget / totalInvestment) * 100 : 0;
    const aggregateCTR = totalImpressions > 0 ? (totalCliques / totalImpressions) * 100 : 0;
    const aggregateConnectRate = totalCliques > 0 ? (totalVisitas / totalCliques) * 100 : 0;
    const aggregateConvRate = totalCliques > 0 ? (totalConversoes / totalCliques) * 100 : 0;
    const aggregateCPA = totalConversoes > 0 ? (totalBudget / totalConversoes) : 0;

    const getUnitValue = (campaign: Campaign) => {
        switch (campaign.unidadeCompra) {
            case 'CPC': return formatCurrency(campaign.cpc);
            case 'CPM': return formatCurrency(campaign.cpm);
            default: return 'N/A';
        }
    };
    
    const headers = [
        'Tipo Campanha', 'Etapa Funil', 'Canal', 'Formato', 'Objetivo', 'Público-Alvo',
        'KPI', 'Budget', 'Orçamento Diário', '% Share', 'Unidade de Compra', 'Valor da Unidade (R$)',
        'Impressões', 'Alcance', 'CTR (%)', 'Cliques', 'Connect Rate (%)', 'Visitas',
        'Conversões', 'Taxa de Conversão (%)', 'CPA (R$)', 'actions'
    ];
    
    if (isReadOnly) {
        headers.pop(); // Remove 'actions' column
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{t('Plano de Mídia - {month}', { month: month.split('-').reverse().map(p => t(p)).join(' ') })}</h1>
                {!isReadOnly && (
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">
                        <PlusCircle size={20}/>
                        {campaigns.length > 0 ? t('Nova Campanha') : t('Adicionar Primeira Campanha')}
                    </button>
                )}
            </div>
            
            {campaigns.length > 0 ? (
                <>
                <Card className="!p-0">
                    <div className="overflow-x-auto relative">
                        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    {headers.map((header) => (
                                        <th key={header} scope="col" className={`px-4 py-3 whitespace-nowrap ${header === 'actions' ? 'sticky right-0 bg-gray-50 dark:bg-gray-700 z-10' : ''}`}>
                                            {t(header)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map(campaign => {
                                    const share = totalInvestment > 0 ? (Number(campaign.budget || 0) / totalInvestment) * 100 : 0;
                                    return (
                                        <tr key={campaign.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/20">
                                            <td className="px-4 py-4 whitespace-nowrap">{campaign.tipoCampanha}</td>
                                            <td className="px-4 py-4 whitespace-nowrap">{campaign.etapaFunil}</td>
                                            <td className="px-4 py-4 whitespace-nowrap">{campaign.canal}</td>
                                            <td className="px-4 py-4 whitespace-nowrap">{campaign.formato}</td>
                                            <td className="px-4 py-4 whitespace-nowrap max-w-xs truncate" title={campaign.objetivo}>{campaign.objetivo}</td>
                                            <td className="px-4 py-4 whitespace-nowrap max-w-xs truncate" title={campaign.publicoAlvo}>{campaign.publicoAlvo}</td>
                                            <td className="px-4 py-4 whitespace-nowrap max-w-xs truncate" title={campaign.kpi}>{campaign.kpi}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right">{formatCurrency(campaign.budget)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right">{formatCurrency(campaign.orcamentoDiario)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right">{formatPercentage(share)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap">{campaign.unidadeCompra}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right">{getUnitValue(campaign)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right">{formatNumber(campaign.impressoes)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right">{formatNumber(campaign.alcance)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right">{formatPercentage(campaign.ctr)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right">{formatNumber(campaign.cliques)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right">{formatPercentage(campaign.connectRate)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right">{formatNumber(campaign.visitas)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right">{formatNumber(campaign.conversoes)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right">{formatPercentage(campaign.taxaConversao)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right">{formatCurrency(campaign.cpa)}</td>
                                            {!isReadOnly && (
                                                <td className="px-4 py-4 sticky right-0 bg-white dark:bg-gray-800 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
                                                    <button onClick={() => handleOpenModal(campaign)} className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><Edit size={16} /></button>
                                                    <button onClick={() => onDelete(month, campaign.id)} className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"><Trash2 size={16} /></button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-100 dark:bg-gray-700/50 font-bold text-gray-900 dark:text-white">
                                    <td colSpan={7} className="px-4 py-3 font-bold">{t('Totais do Mês')}</td>
                                    <td className="px-4 py-3 font-bold text-right">{formatCurrency(totalBudget)}</td>
                                    <td className="px-4 py-3 font-bold text-right">{formatCurrency(totalOrcamentoDiario)}</td>
                                    <td className="px-4 py-3 font-bold text-right">{formatPercentage(aggregateShare)}</td>
                                    <td colSpan={2}></td>
                                    <td className="px-4 py-3 font-bold text-right">{formatNumber(totalImpressions)}</td>
                                    <td className="px-4 py-3 font-bold text-right">{formatNumber(totalAlcance)}</td>
                                    <td className="px-4 py-3 font-bold text-right">{formatPercentage(aggregateCTR)}</td>
                                    <td className="px-4 py-3 font-bold text-right">{formatNumber(totalCliques)}</td>
                                    <td className="px-4 py-3 font-bold text-right">{formatPercentage(aggregateConnectRate)}</td>
                                    <td className="px-4 py-3 font-bold text-right">{formatNumber(totalVisitas)}</td>
                                    <td className="px-4 py-3 font-bold text-right">{formatNumber(totalConversoes)}</td>
                                    <td className="px-4 py-3 font-bold text-right">{formatPercentage(aggregateConvRate)}</td>
                                    <td className="px-4 py-3 font-bold text-right">{formatCurrency(aggregateCPA)}</td>
                                    {!isReadOnly && <td className="px-4 py-3 sticky right-0 bg-gray-100 dark:bg-gray-700/50"></td>}
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </Card>
                <ChartsSection campaigns={campaigns} title={t('Distribuição de Investimento ({month})', { month: month.split('-').reverse().map(p => t(p)).join(' ') })} />
                </>
            ) : (
                <Card className="text-center py-16">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{t('Nenhuma campanha adicionada para {month}.', { month: month.split('-').reverse().map(p => t(p)).join(' ') })}</h2>
                    {!isReadOnly && (
                         <button onClick={() => handleOpenModal()} className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 mx-auto">
                            <PlusCircle size={20}/>
                            {t('Adicionar Primeira Campanha')}
                        </button>
                    )}
                </Card>
            )}

            {!isReadOnly && (
                 <CampaignModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={onSave}
                    campaignData={editingCampaign}
                    month={month}
                    planObjective={planObjective}
                    onAddFormat={onAddFormat}
                    customFormats={customFormats}
                />
            )}
        </div>
    );
};

const CreativeGroup: React.FC<CreativeGroupProps> = ({ group, channel, onUpdate, onDelete, planData }) => {
    const { t, language } = useLanguage();
    const [localGroup, setLocalGroup] = useState(group);
    const [isAISuggestionsModalOpen, setIsAISuggestionsModalOpen] = useState(false);
    const [aiSuggestions, setAISuggestions] = useState<Record<string, string[]> | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        setLocalGroup(group);
    }, [group]);

    const handleUpdate = () => {
        onUpdate(localGroup);
    };

    const handleFieldChange = (field: keyof CreativeTextData, value: any) => {
        setLocalGroup(prev => ({...prev, [field]: value}));
    };
    
    const handleArrayChange = (field: 'headlines' | 'longHeadlines' | 'descriptions', index: number, value: string) => {
        const newArray = [...(localGroup[field] || [])];
        newArray[index] = value;
        setLocalGroup(prev => ({...prev, [field]: newArray}));
    };
    
    const addArrayItem = (field: 'headlines' | 'longHeadlines' | 'descriptions') => {
        const newArray = [...(localGroup[field] || []), ''];
        setLocalGroup(prev => ({...prev, [field]: newArray}));
    }
    
    const removeArrayItem = (field: 'headlines' | 'longHeadlines' | 'descriptions', index: number) => {
        const newArray = [...(localGroup[field] || [])];
        newArray.splice(index, 1);
        setLocalGroup(prev => ({...prev, [field]: newArray}));
    }

    const generateSuggestions = async () => {
        setIsGenerating(true);
        setIsAISuggestionsModalOpen(true);
        setAISuggestions(null);
        try {
            const langInstruction = language === 'pt-BR' ? 'Responda em Português do Brasil.' : 'Respond in English.';
            const prompt = `
                You are a creative copywriter for digital ads. Based on the provided context, generate ad copy.
                Context:
                - General Plan Objective: ${planData.objective}
                - Main Target Audience: ${planData.targetAudience}
                - Ad Channel: ${channel}
                - Specific Creative Context: ${localGroup.context}

                The output MUST be a valid JSON object. Do not include any text, explanation, or markdown fences like \`\`\`json.
                The JSON object should have the following structure:
                {
                    "headlines": ["A short, punchy headline (max 30 chars).", "Another headline.", "A third one."],
                    "longHeadlines": ["A longer headline for placements that allow it (max 90 chars).", "Another long headline."],
                    "descriptions": ["A compelling description of the offer (max 90 chars).", "Another persuasive description."]
                }

                Generate 3 headlines, 2 long headlines, and 2 descriptions. Tailor the tone and style to the specified ad channel.
                ${langInstruction}
            `;
            const result = await callGeminiAPI(prompt, true);
            setAISuggestions(result);
        } catch (error) {
            console.error(error);
            alert(t('Falha ao gerar sugestões.'));
            setIsAISuggestionsModalOpen(false);
        } finally {
            setIsGenerating(false);
        }
    };

    const applySuggestion = (type: string, text: string) => {
        const fieldMap: Record<string, 'headlines' | 'longHeadlines' | 'descriptions'> = {
            'Títulos (Headlines)': 'headlines',
            'Headlines': 'headlines',
            'Títulos Longos (Long Headlines)': 'longHeadlines',
            'Long Headlines': 'longHeadlines',
            'Descrições (Descriptions)': 'descriptions',
            'Descriptions': 'descriptions',
        };
        const fieldKey = Object.keys(fieldMap).find(k => t(k.toLowerCase().replace(/ /g, '_')) === t(type.toLowerCase().replace(/ /g, '_')) || k === type);
        const field = fieldKey ? fieldMap[fieldKey] : null;

        if (field) {
            const newArray = [...(localGroup[field] || []), text];
             setLocalGroup(prev => ({...prev, [field]: newArray}));
        }
    }
    
    return (
        <Card className="mb-6">
            <div className="flex justify-between items-start">
                <div className="flex-grow">
                    <input 
                        type="text"
                        value={localGroup.name}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        onBlur={handleUpdate}
                        placeholder={t('Nome do Grupo de Criativos')}
                        className="text-lg font-semibold bg-transparent border-none p-0 focus:ring-0 w-full text-gray-900 dark:text-gray-100"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={generateSuggestions} className="p-2 text-gray-500 hover:text-blue-500 dark:hover:text-blue-400" title={t('Gerar Sugestões com IA')}><Sparkles size={18}/></button>
                    <button onClick={() => onDelete(group.id)} className="p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400" title={t('delete')}><Trash2 size={18}/></button>
                </div>
            </div>
            
            <div className="mt-4 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Contexto para a IA')}</label>
                    <textarea 
                        value={localGroup.context}
                        onChange={(e) => handleFieldChange('context', e.target.value)}
                        onBlur={handleUpdate}
                        rows={3}
                        className="mt-1 w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('Descreva o produto, público, oferta e palavras-chave para guiar a IA...')}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Headlines & Long Headlines */}
                    <div className="space-y-6">
                         <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200">{t('Títulos (Headlines)')}</h4>
                            <div className="space-y-2 mt-2">
                                {localGroup.headlines.map((h, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <CharacterCountInput value={h} onChange={(e) => handleArrayChange('headlines', i, e.target.value)} onBlur={handleUpdate} maxLength={30} placeholder="Headline"/>
                                        <button onClick={() => removeArrayItem('headlines', i)}><Trash2 size={16} className="text-gray-400 hover:text-red-500"/></button>
                                    </div>
                                ))}
                                <button onClick={() => addArrayItem('headlines')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{t('Novo')}</button>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200">{t('Títulos Longos (Long Headlines)')}</h4>
                            <div className="space-y-2 mt-2">
                                {(localGroup.longHeadlines || []).map((h, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <CharacterCountInput value={h} onChange={(e) => handleArrayChange('longHeadlines', i, e.target.value)} onBlur={handleUpdate} maxLength={90} placeholder="Long Headline"/>
                                        <button onClick={() => removeArrayItem('longHeadlines', i)}><Trash2 size={16} className="text-gray-400 hover:text-red-500"/></button>
                                    </div>
                                ))}
                                <button onClick={() => addArrayItem('longHeadlines')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{t('Novo')}</button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Descriptions */}
                    <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">{t('Descrições (Descriptions)')}</h4>
                        <div className="space-y-2 mt-2">
                            {localGroup.descriptions.map((d, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <CharacterCountInput value={d} onChange={(e) => handleArrayChange('descriptions', i, e.target.value)} onBlur={handleUpdate} maxLength={90} placeholder="Description" rows={2}/>
                                    <button onClick={() => removeArrayItem('descriptions', i)}><Trash2 size={16} className="text-gray-400 hover:text-red-500"/></button>
                                </div>
                            ))}
                            <button onClick={() => addArrayItem('descriptions')} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{t('Novo')}</button>
                        </div>
                    </div>
                </div>
            </div>
             <AISuggestionsModal 
                isOpen={isAISuggestionsModalOpen}
                onClose={() => setIsAISuggestionsModalOpen(false)}
                isLoading={isGenerating}
                suggestions={aiSuggestions}
                onApplySuggestion={(type, text) => applySuggestion(type, text)}
                title={t('Sugestões de Criativos (IA)')}
             />
        </Card>
    );
};


export const CopyBuilderPage: React.FC<CopyBuilderPageProps> = ({ planData, onPlanUpdate }) => {
    const { t } = useLanguage();
    const [selectedChannel, setSelectedChannel] = useState('');
    const [exportType, setExportType] = useState<'csv' | 'txt' | null>(null);

    const activeChannels = useMemo(() => {
        const channels = new Set<string>();
        Object.values(planData.months || {}).flat().forEach(campaign => {
            if (campaign.canal) channels.add(campaign.canal);
        });
        return Array.from(channels);
    }, [planData.months]);

    useEffect(() => {
        if (activeChannels.length > 0 && (!selectedChannel || !activeChannels.includes(selectedChannel))) {
            setSelectedChannel(activeChannels[0]);
        } else if (activeChannels.length === 0) {
            setSelectedChannel('');
        }
    }, [activeChannels, selectedChannel]);

    const handleUpdateGroup = (updatedGroup: CreativeTextData) => {
        if (!selectedChannel) return;
        const newPlan = JSON.parse(JSON.stringify(planData));
        const groups = (newPlan.creatives?.[selectedChannel] || []).map((g: CreativeTextData) => g.id === updatedGroup.id ? updatedGroup : g);
        if (!newPlan.creatives) newPlan.creatives = {};
        newPlan.creatives[selectedChannel] = groups;
        onPlanUpdate(newPlan);
    };

    const handleDeleteGroup = (groupId: number) => {
         if (!selectedChannel) return;
         const newPlan = JSON.parse(JSON.stringify(planData));
         let groups = (newPlan.creatives?.[selectedChannel] || []);
         groups = groups.filter((g: CreativeTextData) => g.id !== groupId);
         if (!newPlan.creatives) newPlan.creatives = {};
         newPlan.creatives[selectedChannel] = groups;
         onPlanUpdate(newPlan);
    };
    
    const handleAddGroup = () => {
        if (!selectedChannel) return;
        const newGroup: CreativeTextData = {
            id: Date.now(),
            name: t('Novo Grupo'),
            context: '',
            headlines: [''],
            longHeadlines: [''],
            descriptions: [''],
        };
        const newPlan = JSON.parse(JSON.stringify(planData));
        if (!newPlan.creatives) newPlan.creatives = {};
        if (!newPlan.creatives[selectedChannel]) newPlan.creatives[selectedChannel] = [];
        newPlan.creatives[selectedChannel].push(newGroup);
        onPlanUpdate(newPlan);
    };

    const handleExport = (type: 'csv' | 'txt') => {
        if (type === 'csv') {
            exportCreativesAsCSV(planData, t);
        } else {
            exportCreativesAsTXT(planData, t);
        }
        setExportType(null);
    }

    const creativeGroups = planData.creatives?.[selectedChannel] || [];

    if (activeChannels.length === 0) {
        return (
            <Card className="text-center py-16">
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{t('Nenhum canal ativo')}</h2>
                <p className="mt-2 text-gray-500 dark:text-gray-400">{t('Para começar, adicione campanhas com canais definidos no seu plano de mídia.')}</p>
            </Card>
        );
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <label htmlFor="channel-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Canal')}</label>
                        <select
                            id="channel-select"
                            value={selectedChannel}
                            onChange={(e) => setSelectedChannel(e.target.value)}
                            className="mt-1 block w-full sm:w-64 border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {activeChannels.map(channel => <option key={channel} value={channel}>{channel}</option>)}
                        </select>
                    </div>
                     <div className="flex items-center gap-2">
                        <button onClick={handleAddGroup} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors">
                            <PlusCircle size={20} />
                            {t('Novo Grupo de Criativos')}
                        </button>
                        <div className="relative">
                            <button onClick={() => setExportType(prev => prev ? null : 'csv')} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold rounded-lg shadow-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">
                                <FileDown size={20} />
                                {t('export')}
                            </button>
                            {exportType && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-10 py-1 ring-1 ring-black ring-opacity-5">
                                    <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">{t('export_as_csv')}</button>
                                    <button onClick={() => handleExport('txt')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600">{t('export_as_txt')}</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {creativeGroups.length > 0 ? (
                creativeGroups.map(group => (
                    <CreativeGroup 
                        key={group.id}
                        group={group}
                        channel={selectedChannel}
                        onUpdate={handleUpdateGroup}
                        onDelete={handleDeleteGroup}
                        planData={planData}
                    />
                ))
            ) : (
                <Card className="text-center py-16">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">{t('Nenhum grupo de criativos para {channel}', { channel: selectedChannel })}</h2>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">{t('Comece adicionando um novo grupo.')}</p>
                </Card>
            )}
        </div>
    );
};

const InputField: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean; }> = ({ label, name, value, onChange, required }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <input type="text" name={name} value={value} onChange={onChange} required={required} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
);

export const UTMBuilderPage: React.FC<UTMBuilderPageProps> = ({ planData, onPlanUpdate }) => {
    const { t } = useLanguage();
    const [utm, setUtm] = useState({
        url: '',
        source: '',
        medium: '',
        campaign: planData.campaignName || '',
        term: '',
        content: '',
    });
    const [generatedUrl, setGeneratedUrl] = useState('');
    const [copied, setCopied] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUtm({ ...utm, [e.target.name]: e.target.value });
    };

    const generateUrl = useCallback(() => {
        const { url, source, medium, campaign, term, content } = utm;
        if (!url || !source || !medium || !campaign) {
            setGeneratedUrl('');
            return;
        }
        try {
            const baseUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
            baseUrl.searchParams.set('utm_source', source);
            baseUrl.searchParams.set('utm_medium', medium);
            baseUrl.searchParams.set('utm_campaign', campaign);
            if (term) baseUrl.searchParams.set('utm_term', term);
            if (content) baseUrl.searchParams.set('utm_content', content);
            setGeneratedUrl(baseUrl.toString());
        } catch(e) {
            setGeneratedUrl(''); // Invalid URL
        }
    }, [utm]);

    useEffect(() => {
        generateUrl();
    }, [generateUrl]);
    
    const saveLink = () => {
        if (!generatedUrl) return;
        const newLink: UTMLink = {
            ...utm,
            id: Date.now(),
            createdAt: new Date().toISOString(),
            fullUrl: generatedUrl,
        };
        const newPlan = { ...planData, utmLinks: [...(planData.utmLinks || []), newLink]};
        onPlanUpdate(newPlan);
        clearForm();
    };

    const clearForm = () => {
        setUtm({ url: '', source: '', medium: '', campaign: planData.campaignName || '', term: '', content: '' });
        setGeneratedUrl('');
    };

    const copyToClipboard = () => {
        if (!generatedUrl) return;
        navigator.clipboard.writeText(generatedUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const deleteLink = (id: number) => {
        const newPlan = { ...planData, utmLinks: (planData.utmLinks || []).filter(link => link.id !== id)};
        onPlanUpdate(newPlan);
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card>
                    <div className="space-y-4">
                        <InputField label={t('URL do Site *')} name="url" value={utm.url} onChange={handleInputChange} required />
                        <InputField label={t('Campaign Source *')} name="source" value={utm.source} onChange={handleInputChange} required />
                        <InputField label={t('Campaign Medium *')} name="medium" value={utm.medium} onChange={handleInputChange} required />
                        <InputField label={t('Campaign Name *')} name="campaign" value={utm.campaign} onChange={handleInputChange} required />
                        <InputField label={t('Campaign Term')} name="term" value={utm.term} onChange={handleInputChange} />
                        <InputField label={t('Campaign Content')} name="content" value={utm.content} onChange={handleInputChange} />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('URL Gerada')}</label>
                            <div className="relative mt-1">
                                <input type="text" readOnly value={generatedUrl} placeholder={t("Preencha os campos para gerar a URL.")} className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 pl-3 pr-12 bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-200" />
                                 <button onClick={copyToClipboard} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" title={t('Copiar URL')}>
                                    {copied ? <Check size={18} className="text-green-500" /> : <CopyIcon size={18} />}
                                 </button>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={saveLink} disabled={!generatedUrl} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">{t('Salvar Link')}</button>
                            <button onClick={clearForm} className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">{t('Limpar')}</button>
                        </div>
                    </div>
                </Card>
            </div>
            <div>
                <Card>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">{t('Links Salvos')}</h3>
                    <div className="max-h-96 overflow-y-auto space-y-3">
                        {(planData.utmLinks || []).length > 0 ? (
                            planData.utmLinks.map(link => (
                                <div key={link.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md text-xs">
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">{link.campaign}</p>
                                        <button onClick={() => deleteLink(link.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400">{link.source} / {link.medium}</p>
                                    <p className="mt-1 break-all text-blue-600 dark:text-blue-400">{link.fullUrl}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-8">{t('Nenhum link salvo ainda.')}</p>
                        )}
                    </div>
                     {(planData.utmLinks || []).length > 0 && (
                        <div className="mt-4 pt-4 border-t dark:border-gray-700">
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('Exportar como:')}</label>
                             <div className="flex gap-2 mt-1">
                                <button onClick={() => exportUTMLinksAsCSV(planData, t)} className="flex-1 text-xs px-2 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700">{t('export_as_csv')}</button>
                                <button onClick={() => exportUTMLinksAsTXT(planData, t)} className="flex-1 text-xs px-2 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700">{t('export_as_txt')}</button>
                             </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

const KeywordTable: React.FC<{ keywords: KeywordSuggestion[], t: (key: string) => string }> = ({ keywords, t }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                    <th scope="col" className="px-6 py-3">{t('keyword')}</th>
                    <th scope="col" className="px-6 py-3 text-right">{t('search_volume')}</th>
                    <th scope="col" className="px-6 py-3 text-right">{t('estimated_clicks')}</th>
                    <th scope="col" className="px-6 py-3 text-right">{t('min_cpc')}</th>
                    <th scope="col" className="px-6 py-3 text-right">{t('max_cpc')}</th>
                </tr>
            </thead>
            <tbody>
                {keywords.map((kw, index) => (
                    <tr key={index} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{kw.keyword}</th>
                        <td className="px-6 py-4 text-right">{formatNumber(kw.volume)}</td>
                        <td className="px-6 py-4 text-right">{formatNumber(kw.clickPotential)}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(kw.minCpc)}</td>
                        <td className="px-6 py-4 text-right">{formatCurrency(kw.maxCpc)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const KeywordBuilderPage: React.FC<KeywordBuilderPageProps> = ({ planData, onPlanUpdate }) => {
    const { t, language } = useLanguage();
    const [generationMode, setGenerationMode] = useState<'seed' | 'prompt'>('seed');
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [keywordsToAssign, setKeywordsToAssign] = useState<KeywordSuggestion[]>([]);
    const [assignTargetGroup, setAssignTargetGroup] = useState<string>('');

    const ensureUnassignedGroup = (plan: PlanData): PlanData => {
        const adGroups = plan.adGroups || [];
        if (!adGroups.find(g => g.id === 'unassigned')) {
            return {
                ...plan,
                adGroups: [{ id: 'unassigned', name: t('unassigned_keywords'), keywords: [] }, ...adGroups]
            };
        }
        return plan;
    };
    
    const localPlan = useMemo(() => ensureUnassignedGroup(planData), [planData, t]);
    const { adGroups = [] } = localPlan;

    const unassignedKeywords = useMemo(() => {
        return adGroups.find(g => g.id === 'unassigned')?.keywords || [];
    }, [adGroups]);

    const handleGenerateKeywords = async () => {
        if (!inputValue.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const newKeywords = await generateAIKeywords(planData, generationMode, inputValue, language);
            const currentUnassigned = adGroups.find(g => g.id === 'unassigned')?.keywords || [];
            
            // Filter out duplicates
            const existingKeywordsSet = new Set(currentUnassigned.map(kw => kw.keyword));
            const uniqueNewKeywords = newKeywords.filter(kw => !existingKeywordsSet.has(kw.keyword));

            const updatedAdGroups = adGroups.map(group => {
                if (group.id === 'unassigned') {
                    return { ...group, keywords: [...group.keywords, ...uniqueNewKeywords] };
                }
                return group;
            });
            await onPlanUpdate({ ...localPlan, adGroups: updatedAdGroups });
            setInputValue('');

        } catch (e) {
            console.error(e);
            setError(t('error_generating_keywords'));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        const newGroup: AdGroup = {
            id: `group_${Date.now()}`,
            name: newGroupName.trim(),
            keywords: [],
        };
        const updatedAdGroups = [...adGroups, newGroup];
        await onPlanUpdate({ ...localPlan, adGroups: updatedAdGroups });
        setNewGroupName('');
    };
    
    const handleDeleteGroup = async (groupId: string) => {
        if (groupId === 'unassigned') return;
        if (!window.confirm(t('confirm_delete_group'))) return;
        
        const groupToDelete = adGroups.find(g => g.id === groupId);
        const keywordsToMove = groupToDelete?.keywords || [];
        
        let updatedAdGroups = adGroups.filter(g => g.id !== groupId);
        updatedAdGroups = updatedAdGroups.map(g => {
            if (g.id === 'unassigned') {
                return { ...g, keywords: [...g.keywords, ...keywordsToMove] };
            }
            return g;
        });
        
        await onPlanUpdate({ ...localPlan, adGroups: updatedAdGroups });
    };

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('generate_keywords')}</h2>
                 <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
                    <button onClick={() => setGenerationMode('seed')} className={`px-4 py-2 text-sm font-medium ${generationMode === 'seed' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>{t('seed_keywords_label')}</button>
                    <button onClick={() => setGenerationMode('prompt')} className={`px-4 py-2 text-sm font-medium ${generationMode === 'prompt' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}>{t('ai_prompt_label')}</button>
                </div>
                {generationMode === 'seed' ? (
                     <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder={t('seed_keywords_placeholder')} className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"/>
                ) : (
                    <textarea rows={3} value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder={t('ai_prompt_placeholder')} className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"/>
                )}
                <button onClick={handleGenerateKeywords} disabled={isLoading} className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-70">
                    {isLoading ? <><LoaderIcon className="animate-spin"/> {t('generating_keywords')}</> : <><Sparkles size={18}/> {t('generate_keywords')}</>}
                </button>
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{t('unassigned_keywords')} ({unassignedKeywords.length})</h3>
                        {unassignedKeywords.length > 0 ? (
                           <KeywordTable keywords={unassignedKeywords} t={t} />
                        ) : (
                           <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('no_keywords_generated')}</p>
                        )}
                    </Card>
                </div>
                <div>
                    <Card>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{t('ad_groups')}</h3>
                        <div className="flex gap-2 mb-4">
                            <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder={t('ad_group_name_placeholder')} className="flex-grow border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"/>
                            <button onClick={handleCreateGroup} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"><PlusCircle size={18}/></button>
                        </div>
                        <div className="space-y-4">
                            {adGroups.filter(g => g.id !== 'unassigned').map(group => (
                                <div key={group.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{group.name}</h4>
                                        <button onClick={() => handleDeleteGroup(group.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{group.keywords.length} keywords</p>
                                </div>
                            ))}
                            {adGroups.length <= 1 && (
                                 <p className="text-gray-500 dark:text-gray-400 text-center text-sm py-4">{t('no_ad_groups')}</p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
            
            {adGroups.filter(g => g.id !== 'unassigned').map(group => (
                 <Card key={`group-details-${group.id}`}>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">{group.name}</h3>
                    {group.keywords.length > 0 ? (
                        <KeywordTable keywords={group.keywords} t={t} />
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('no_keywords_in_group')}</p>
                    )}
                </Card>
            ))}
        </div>
    );
};

export const CreativeBuilderPage: React.FC<CreativeBuilderPageProps> = ({ planData, onPlanUpdate }) => {
    const { t } = useLanguage();
    const [prompt, setPrompt] = useState(planData.aiImagePrompt || '');
    const [images, setImages] = useState<GeneratedImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateImages = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        setImages([]);
        try {
            const generated = await generateAIImages(prompt);
            setImages(generated);
            // Also save the prompt used for generation
            onPlanUpdate({ ...planData, aiImagePrompt: prompt });
        } catch (e) {
            console.error(e);
            setError(t('error_generating_images'));
        } finally {
            setIsLoading(false);
        }
    };
    
    const downloadImage = (base64: string, filename: string) => {
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64}`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('Prompt para Geração de Imagem')}</h2>
                <textarea
                    rows={4}
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder={t('creative_prompt_placeholder')}
                    className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                />
                <button
                    onClick={handleGenerateImages}
                    disabled={isLoading || !prompt.trim()}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:opacity-70"
                >
                    {isLoading ? <><LoaderIcon className="animate-spin" /> {t('generating_images')}</> : <><ImageIcon size={18} /> {t('generate_images')}</>}
                </button>
                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            </Card>

            {isLoading && (
                 <Card className="flex justify-center items-center py-16">
                    <LoaderIcon size={40} className="animate-spin text-blue-500" />
                 </Card>
            )}

            {images.length > 0 && (
                <Card>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('Results')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {images.map((image, index) => (
                            <div key={index} className="group relative">
                                <img
                                    src={`data:image/png;base64,${image.base64}`}
                                    alt={`Generated image ${index + 1} with aspect ratio ${image.aspectRatio}`}
                                    className="rounded-lg object-cover w-full h-full"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex flex-col justify-between p-2">
                                     <span className="bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full self-start">{image.aspectRatio}</span>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 self-end">
                                        <button 
                                            onClick={() => downloadImage(image.base64, `${planData.campaignName}_${image.aspectRatio.replace(':','-')}.png`)}
                                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
                                            title={t('download')}
                                        >
                                            <Download size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

             {!isLoading && images.length === 0 && (
                <Card className="text-center py-16">
                    <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">{t('creative_builder_initial_prompt')}</p>
                </Card>
             )}
        </div>
    );
};

export const ShareablePlanViewer: React.FC<{ planId: string }> = ({ planId }) => {
    const { t } = useLanguage();
    const [plan, setPlan] = useState<PlanData | null>(null);
    const [creator, setCreator] = useState<{ displayName: string | null; photoURL: string | null } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState('Overview');

    useEffect(() => {
        const fetchPlan = async () => {
            if (!planId) {
                setError(t('plan_not_found'));
                setLoading(false);
                return;
            }
            try {
                const fetchedPlan = await getPlanById(planId);
                if (fetchedPlan) {
                    setPlan(fetchedPlan);
                    if (fetchedPlan.user_id) {
                         const { data: profile } = await supabase
                            .from('profiles')
                            .select('display_name, photo_url')
                            .eq('id', fetchedPlan.user_id)
                            .single();
                        if (profile) {
                            setCreator({ displayName: profile.display_name, photoURL: profile.photo_url });
                        }
                    }
                } else {
                    setError(t('plan_not_found'));
                }
            } catch (err) {
                console.error(err);
                setError(t('plan_not_found'));
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, [planId, t]);
    
    if (loading) {
        return <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 text-white"><LoaderIcon className="animate-spin text-blue-500" size={48}/><p className="mt-4">{t('loading_plan')}</p></div>;
    }

    if (error || !plan) {
        return <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-900 text-white"><AlertTriangle className="text-red-500" size={48}/><p className="mt-4">{error}</p></div>;
    }

    const navButtonClass = (isActive: boolean) => 
        `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${isActive 
            ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'}`;

    return (
        <div className="bg-gray-100 dark:bg-gray-900/90 min-h-screen">
             <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <img src={ICON_LOGO} alt="MasterPlan Logo" className="h-10 w-10" />
                            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{plan.campaignName}</h1>
                        </div>
                        {creator && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{t('shared_by')}</span>
                                 <img src={creator.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.displayName || 'U')}`} alt="Creator" className="w-8 h-8 rounded-full" />
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{creator.displayName}</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>
             <main className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button onClick={() => setActiveView('Overview')} className={navButtonClass(activeView === 'Overview')}>
                            {t('overview')}
                        </button>
                        {Object.keys(plan.months || {}).sort(sortMonthKeys).map(monthKey => {
                             const [year, monthName] = monthKey.split('-');
                             const monthDisplay = `${t(monthName)} ${year}`;
                             return (
                                <button key={monthKey} onClick={() => setActiveView(monthKey)} className={navButtonClass(activeView === monthKey)}>
                                    {monthDisplay}
                                </button>
                             )
                        })}
                    </nav>
                </div>

                {activeView === 'Overview' ? (
                    <DashboardPage planData={plan} onNavigate={() => {}} onAddMonthClick={() => {}} onRegeneratePlan={async () => {}} isRegenerating={false} isReadOnly={true} />
                ) : (
                    plan.months[activeView] && <MonthlyPlanPage month={activeView} campaigns={plan.months[activeView]} onSave={()=>{}} onDelete={()=>{}} planObjective={plan.objective} customFormats={plan.customFormats || []} onAddFormat={()=>{}} totalInvestment={plan.totalInvestment} isReadOnly={true} />
                )}

            </main>
        </div>
    );
};
