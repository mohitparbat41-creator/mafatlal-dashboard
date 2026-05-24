import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hywxnyndjefrjihklnxm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5d3hueW5kamVmcmppaGtsbnhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MjAwMjIsImV4cCI6MjA5NTA5NjAyMn0.hKRzB2OcZ2TUaH641_VKmlu41moqskS9FbNs2Nret9A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.rpc('get_view_definition', { view_name: 'v_executive_summary' });
  if (error) {
    console.log("RPC failed, trying raw query...", error.message);
  } else {
    console.log("View definition via RPC:", data);
  }
}

test();
