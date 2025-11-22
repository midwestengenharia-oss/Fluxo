
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://escqdfuczcsqoshqnkhi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzY3FkZnVjemNzcW9zaHFua2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjQ5MTksImV4cCI6MjA3OTM0MDkxOX0.XyLO0cOjOxDxeF9MkMjz_8JQvj-nA3LlBzMoxXcMlPQ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
