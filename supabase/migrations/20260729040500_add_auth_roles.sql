-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user'
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user signup
CREATE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (new.id, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- DROP old permissive policies
DROP POLICY IF EXISTS "Allow public all access on players" ON players;
DROP POLICY IF EXISTS "Allow public all access on games" ON games;
DROP POLICY IF EXISTS "Allow public all access on game_attendance" ON game_attendance;
DROP POLICY IF EXISTS "Allow public all access on lineups" ON lineups;

-- NEW POLICIES: 
-- players: Admin can ALL, authenticated can SELECT
CREATE POLICY "Allow authenticated read on players" ON players FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin all on players" ON players FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- games, attendance, lineups: Authenticated can ALL
CREATE POLICY "Allow authenticated all on games" ON games FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated all on game_attendance" ON game_attendance FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated all on lineups" ON lineups FOR ALL TO authenticated USING (true);
