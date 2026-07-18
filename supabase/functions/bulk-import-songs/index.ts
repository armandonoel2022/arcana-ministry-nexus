import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { songs, secret } = await req.json();
    if (secret !== Deno.env.get('BULK_IMPORT_SECRET')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const BATCH = 100;
    let inserted = 0;
    for (let i = 0; i < songs.length; i += BATCH) {
      const chunk = songs.slice(i, i + BATCH);
      const { error } = await supabase.from('songs').insert(chunk);
      if (error) {
        return new Response(JSON.stringify({ error: error.message, at: i, inserted }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      inserted += chunk.length;
    }
    return new Response(JSON.stringify({ inserted }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
