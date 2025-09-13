-- Finance Tracker Database Schema for Supabase
-- Copy this SQL to Supabase SQL Editor to create the schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- =============================================
-- USERS TABLE (extends Supabase auth.users)
-- =============================================
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    language_code TEXT DEFAULT 'ru',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- =============================================
-- ACCOUNTS TABLE (банковские счета, карты, наличные)
-- =============================================
CREATE TYPE account_type AS ENUM ('cash', 'card', 'bank', 'crypto', 'investment');
CREATE TYPE currency_type AS ENUM ('RUB', 'USD', 'EUR', 'BTC', 'ETH');

CREATE TABLE public.accounts (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 50),
    balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency currency_type NOT NULL DEFAULT 'RUB',
    type account_type NOT NULL DEFAULT 'cash',
    icon TEXT DEFAULT '💳',
    color TEXT DEFAULT '#3b82f6',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- =============================================
-- CATEGORIES TABLE (категории доходов и расходов)
-- =============================================
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

CREATE TABLE public.categories (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- NULL для дефолтных категорий
    name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 50),
    type transaction_type NOT NULL,
    icon TEXT NOT NULL DEFAULT '📋',
    color TEXT NOT NULL DEFAULT '#6b7280',
    is_default BOOLEAN NOT NULL DEFAULT FALSE, -- дефолтные категории для всех пользователей
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- =============================================
-- TRANSACTIONS TABLE (все финансовые операции)
-- =============================================
CREATE TABLE public.transactions (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    type transaction_type NOT NULL,
    description TEXT CHECK (length(description) <= 500),
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id)
);

-- =============================================
-- TRANSFERS TABLE (переводы между счетами)
-- =============================================
CREATE TABLE public.transfers (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    from_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    to_account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    description TEXT CHECK (length(description) <= 500),
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id),
    CONSTRAINT different_accounts CHECK (from_account_id != to_account_id)
);

-- =============================================
-- INDEXES для производительности
-- =============================================
CREATE INDEX idx_users_telegram_id ON public.users(telegram_id);
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);
CREATE INDEX idx_accounts_active ON public.accounts(user_id, is_active);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_categories_type ON public.categories(type, is_active);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_transactions_account ON public.transactions(account_id);
CREATE INDEX idx_transactions_category ON public.transactions(category_id);
CREATE INDEX idx_transfers_user_id ON public.transfers(user_id);
CREATE INDEX idx_transfers_date ON public.transfers(user_id, date DESC);

-- =============================================
-- TRIGGERS для updated_at автоматическое обновление
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Применяем triggers ко всем таблицам
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS (Row Level Security) ПОЛИТИКИ
-- =============================================

-- Включаем RLS для всех таблиц
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- USERS: пользователи видят только свою запись
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- ACCOUNTS: пользователи видят только свои счета
CREATE POLICY "Users can view own accounts" ON public.accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts" ON public.accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" ON public.accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts" ON public.accounts
    FOR DELETE USING (auth.uid() = user_id);

-- CATEGORIES: пользователи видят свои + дефолтные категории
CREATE POLICY "Users can view own and default categories" ON public.categories
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND is_default = TRUE)
    );

CREATE POLICY "Users can insert own categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id AND is_default = FALSE);

CREATE POLICY "Users can update own categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id AND is_default = FALSE);

CREATE POLICY "Users can delete own categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id AND is_default = FALSE);

-- TRANSACTIONS: пользователи видят только свои транзакции
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
    FOR DELETE USING (auth.uid() = user_id);

-- TRANSFERS: пользователи видят только свои переводы
CREATE POLICY "Users can view own transfers" ON public.transfers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transfers" ON public.transfers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transfers" ON public.transfers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transfers" ON public.transfers
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- SEED DATA: Дефолтные категории
-- =============================================
INSERT INTO public.categories (name, type, icon, color, is_default) VALUES
-- Расходы
('Продукты', 'expense', '🛒', '#ef4444', TRUE),
('Транспорт', 'expense', '🚗', '#f97316', TRUE),
('Развлечения', 'expense', '🎬', '#8b5cf6', TRUE),
('Кафе и рестораны', 'expense', '🍕', '#06b6d4', TRUE),
('Здоровье', 'expense', '💊', '#10b981', TRUE),
('Одежда', 'expense', '👕', '#f59e0b', TRUE),
('Дом и ремонт', 'expense', '🏠', '#84cc16', TRUE),
('Образование', 'expense', '📚', '#3b82f6', TRUE),
('Подарки', 'expense', '🎁', '#ec4899', TRUE),
('Спорт', 'expense', '⚽', '#14b8a6', TRUE),
('Интернет и связь', 'expense', '📱', '#6366f1', TRUE),
('Коммунальные', 'expense', '⚡', '#eab308', TRUE),
('Другое', 'expense', '📋', '#6b7280', TRUE),

-- Доходы  
('Зарплата', 'income', '💰', '#10b981', TRUE),
('Фриланс', 'income', '💻', '#3b82f6', TRUE),
('Инвестиции', 'income', '📈', '#8b5cf6', TRUE),
('Подарки', 'income', '🎁', '#ec4899', TRUE),
('Продажи', 'income', '💸', '#f59e0b', TRUE),
('Другое', 'income', '📋', '#6b7280', TRUE);

-- =============================================
-- FUNCTIONS для бизнес-логики
-- =============================================

-- Функция для создания пользователя после регистрации через Telegram
CREATE OR REPLACE FUNCTION create_user_profile(
    telegram_id_param BIGINT,
    username_param TEXT DEFAULT NULL,
    first_name_param TEXT DEFAULT NULL,
    last_name_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Создаем пользователя
    INSERT INTO public.users (id, telegram_id, username, first_name, last_name)
    VALUES (auth.uid(), telegram_id_param, username_param, first_name_param, last_name_param)
    RETURNING id INTO new_user_id;
    
    -- Создаем дефолтный счет "Наличные"
    INSERT INTO public.accounts (user_id, name, type, icon, color)
    VALUES (new_user_id, 'Наличные', 'cash', '💵', '#10b981');
    
    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения баланса по всем счетам
CREATE OR REPLACE FUNCTION get_total_balance(user_uuid UUID)
RETURNS DECIMAL AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(balance) FROM public.accounts 
         WHERE user_id = user_uuid AND is_active = TRUE), 
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для обновления баланса счета после транзакции
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- При INSERT транзакции
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'income' THEN
            UPDATE public.accounts 
            SET balance = balance + NEW.amount 
            WHERE id = NEW.account_id;
        ELSE
            UPDATE public.accounts 
            SET balance = balance - NEW.amount 
            WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- При UPDATE транзакции  
    IF TG_OP = 'UPDATE' THEN
        -- Откатываем старую транзакцию
        IF OLD.type = 'income' THEN
            UPDATE public.accounts 
            SET balance = balance - OLD.amount 
            WHERE id = OLD.account_id;
        ELSE
            UPDATE public.accounts 
            SET balance = balance + OLD.amount 
            WHERE id = OLD.account_id;
        END IF;
        
        -- Применяем новую транзакцию
        IF NEW.type = 'income' THEN
            UPDATE public.accounts 
            SET balance = balance + NEW.amount 
            WHERE id = NEW.account_id;
        ELSE
            UPDATE public.accounts 
            SET balance = balance - NEW.amount 
            WHERE id = NEW.account_id;
        END IF;
        RETURN NEW;
    END IF;
    
    -- При DELETE транзакции
    IF TG_OP = 'DELETE' THEN
        IF OLD.type = 'income' THEN
            UPDATE public.accounts 
            SET balance = balance - OLD.amount 
            WHERE id = OLD.account_id;
        ELSE
            UPDATE public.accounts 
            SET balance = balance + OLD.amount 
            WHERE id = OLD.account_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Применяем trigger для автоматического обновления балансов
CREATE TRIGGER update_balance_after_transaction
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION update_account_balance();

-- Функция для переводов между счетами
CREATE OR REPLACE FUNCTION process_transfer()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Списываем с исходящего счета
        UPDATE public.accounts 
        SET balance = balance - NEW.amount 
        WHERE id = NEW.from_account_id;
        
        -- Зачисляем на целевой счет
        UPDATE public.accounts 
        SET balance = balance + NEW.amount 
        WHERE id = NEW.to_account_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Применяем trigger для переводов
CREATE TRIGGER process_transfer_after_insert
    AFTER INSERT ON public.transfers
    FOR EACH ROW EXECUTE FUNCTION process_transfer();

-- =============================================
-- GRANTS для безопасности
-- =============================================

-- Разрешаем authenticated пользователям работать с таблицами
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transfers TO authenticated;

-- Разрешаем использовать sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Разрешаем выполнение функций
GRANT EXECUTE ON FUNCTION create_user_profile(BIGINT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_total_balance(UUID) TO authenticated;

-- =============================================
-- ЗАВЕРШЕНО! 
-- =============================================
-- Теперь ваша Supabase база готова для Finance Tracker
-- Не забудьте:
-- 1. Скопировать Environment Variables в .env файлы
-- 2. Настроить Supabase Auth providers (если нужно)
-- 3. Протестировать схему через Supabase Dashboard