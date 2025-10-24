import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://npwrocqwymfyxkvezmwl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wd3JvY3F3eW1meXhrdmV6bXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjg1NDEsImV4cCI6MjA3Njg0NDU0MX0.t0apLxNc_tSX-fGFc8K-97_HG9HZU9-8NY4ris4EC9g';

export const supabase = createClient(supabaseUrl, supabaseKey);
