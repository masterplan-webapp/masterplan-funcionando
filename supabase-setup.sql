-- Script SQL para criar as tabelas necessárias no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Criar tabela profiles (se não existir)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela plans (se não existir)
CREATE TABLE IF NOT EXISTS public.plans (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    "campaignName" TEXT NOT NULL DEFAULT '',
    objective TEXT NOT NULL DEFAULT '',
    "targetAudience" TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    "totalInvestment" NUMERIC NOT NULL DEFAULT 0,
    "logoUrl" TEXT NOT NULL DEFAULT '',
    "customFormats" JSONB DEFAULT '[]'::jsonb,
    "utmLinks" JSONB DEFAULT '[]'::jsonb,
    months JSONB DEFAULT '{}'::jsonb,
    creatives JSONB DEFAULT '{}'::jsonb,
    "adGroups" JSONB DEFAULT '[]'::jsonb,
    "aiPrompt" TEXT,
    "aiImagePrompt" TEXT,
    is_public BOOLEAN DEFAULT FALSE
);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. Criar políticas RLS para plans
CREATE POLICY "Users can view own plans" ON public.plans
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own plans" ON public.plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON public.plans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans" ON public.plans
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Criar função para buscar planos públicos
CREATE OR REPLACE FUNCTION get_public_plan(plan_id TEXT)
RETURNS TABLE(
    id TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    user_id UUID,
    "campaignName" TEXT,
    objective TEXT,
    "targetAudience" TEXT,
    location TEXT,
    "totalInvestment" NUMERIC,
    "logoUrl" TEXT,
    "customFormats" JSONB,
    "utmLinks" JSONB,
    months JSONB,
    creatives JSONB,
    "adGroups" JSONB,
    "aiPrompt" TEXT,
    "aiImagePrompt" TEXT,
    is_public BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM public.plans WHERE plans.id = plan_id AND plans.is_public = true;
$$;

-- 7. Criar função para buscar perfil público
CREATE OR REPLACE FUNCTION get_public_profile(user_id_in UUID)
RETURNS TABLE(
    display_name TEXT,
    photo_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT display_name, photo_url FROM public.profiles WHERE id = user_id_in;
$$;

-- 8. Criar trigger para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, photo_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Criar trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Inserir perfil para usuários existentes (execute apenas se necessário)
-- Substitua 'SEU_USER_ID_AQUI' pelo ID do usuário atual
-- Você pode encontrar o ID do usuário na tabela auth.users
/*
INSERT INTO public.profiles (id, display_name, photo_url)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'full_name', email) as display_name,
    raw_user_meta_data->>'avatar_url' as photo_url
FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
*/

-- 11. Verificar se as tabelas foram criadas
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'plans')
ORDER BY table_name, ordinal_position;