UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'admin@ysa.com';
UPDATE public.profiles SET role = 'admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@ysa.com');
