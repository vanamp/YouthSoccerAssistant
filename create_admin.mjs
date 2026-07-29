import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local manually
const envPath = path.resolve('.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim().replace(/^"|"$/g, '');
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const email = 'admin@ysa.com';
  const password = 'admin123';

  console.log(`Creating user ${email}...`);
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError.message);
    // Might already exist
  } else {
    console.log('User signed up successfully. UID:', authData.user?.id);
  }

  // Attempt login to get session to update profile
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    console.error('Login error:', loginError.message);
    return;
  }

  console.log('Logged in successfully. Updating profile to admin...');
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', loginData.user.id);

  if (updateError) {
    console.error('Failed to update profile:', updateError.message);
  } else {
    console.log('Profile successfully updated to ADMIN!');
  }
}

createAdmin();
