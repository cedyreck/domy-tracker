-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create invite_tokens table
CREATE TABLE public.invite_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create domy_relationships table
CREATE TABLE public.domy_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    opponent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (player_id, opponent_id),
    CHECK (player_id != opponent_id)
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    opponent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    old_value INTEGER NOT NULL,
    new_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domy_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to check if this is the first user
CREATE OR REPLACE FUNCTION public.is_first_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1)
$$;

-- Function to validate and use invite token
CREATE OR REPLACE FUNCTION public.validate_invite_token(token_value TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    token_record invite_tokens%ROWTYPE;
BEGIN
    SELECT * INTO token_record
    FROM invite_tokens
    WHERE token = token_value
      AND used_by IS NULL
      AND (expires_at IS NULL OR expires_at > now());
    
    RETURN FOUND;
END;
$$;

-- Function to mark token as used
CREATE OR REPLACE FUNCTION public.use_invite_token(token_value TEXT, user_id_value UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE invite_tokens
    SET used_by = user_id_value,
        used_at = now()
    WHERE token = token_value
      AND used_by IS NULL
      AND (expires_at IS NULL OR expires_at > now());
    
    RETURN FOUND;
END;
$$;

-- Function to update domy balance (transactional, updates both sides)
CREATE OR REPLACE FUNCTION public.update_domy_balance(
    p_player_id UUID,
    p_opponent_id UUID,
    p_new_balance INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_balance INTEGER;
BEGIN
    -- Get or create the player's relationship
    SELECT balance INTO v_old_balance
    FROM domy_relationships
    WHERE player_id = p_player_id AND opponent_id = p_opponent_id;
    
    IF NOT FOUND THEN
        v_old_balance := 0;
        -- Insert both relationships
        INSERT INTO domy_relationships (player_id, opponent_id, balance)
        VALUES (p_player_id, p_opponent_id, p_new_balance);
        
        INSERT INTO domy_relationships (player_id, opponent_id, balance)
        VALUES (p_opponent_id, p_player_id, -p_new_balance)
        ON CONFLICT (player_id, opponent_id) DO UPDATE
        SET balance = -p_new_balance, updated_at = now();
    ELSE
        -- Update both relationships
        UPDATE domy_relationships
        SET balance = p_new_balance, updated_at = now()
        WHERE player_id = p_player_id AND opponent_id = p_opponent_id;
        
        UPDATE domy_relationships
        SET balance = -p_new_balance, updated_at = now()
        WHERE player_id = p_opponent_id AND opponent_id = p_player_id;
    END IF;
    
    -- Log the activity
    INSERT INTO activity_logs (player_id, opponent_id, old_value, new_value)
    VALUES (p_player_id, p_opponent_id, v_old_balance, p_new_balance);
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_domy_relationships_updated_at
    BEFORE UPDATE ON public.domy_relationships
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Anyone can view profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert roles"
    ON public.user_roles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for invite_tokens
CREATE POLICY "Admins can view all tokens"
    ON public.invite_tokens FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create tokens"
    ON public.invite_tokens FOR INSERT
    TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tokens"
    ON public.invite_tokens FOR UPDATE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete tokens"
    ON public.invite_tokens FOR DELETE
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for domy_relationships
CREATE POLICY "Anyone can view relationships"
    ON public.domy_relationships FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own relationships"
    ON public.domy_relationships FOR UPDATE
    TO authenticated
    USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own relationships"
    ON public.domy_relationships FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = player_id);

-- RLS Policies for activity_logs
CREATE POLICY "Anyone can view activity logs"
    ON public.activity_logs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "System can insert activity logs"
    ON public.activity_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = player_id);

-- Create indexes for performance
CREATE INDEX idx_domy_relationships_player ON public.domy_relationships(player_id);
CREATE INDEX idx_domy_relationships_opponent ON public.domy_relationships(opponent_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_invite_tokens_token ON public.invite_tokens(token);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);