import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getKey(): Promise<CryptoKey> {
  const keyHex = Deno.env.get("DM_ENCRYPTION_KEY") || "";
  // Derive a 256-bit key from the secret using SHA-256
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest("SHA-256", encoder.encode(keyHex));
  return crypto.subtle.importKey("raw", keyMaterial, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );
  // Combine IV + ciphertext and encode as base64
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(ciphertext: string): Promise<string> {
  const key = await getKey();
  const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  return new TextDecoder().decode(decrypted);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, text, messages } = await req.json();

    if (action === "encrypt" && text) {
      const encrypted = await encrypt(text);
      return new Response(JSON.stringify({ encrypted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "decrypt" && text) {
      try {
        const decrypted = await decrypt(text);
        return new Response(JSON.stringify({ decrypted }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        // If decryption fails, return original text (likely unencrypted legacy message)
        return new Response(JSON.stringify({ decrypted: text }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "decrypt_batch" && Array.isArray(messages)) {
      const decrypted = await Promise.all(
        messages.map(async (msg: { id: string; message: string }) => {
          try {
            const dec = await decrypt(msg.message);
            return { id: msg.id, message: dec };
          } catch {
            return { id: msg.id, message: msg.message };
          }
        })
      );
      return new Response(JSON.stringify({ messages: decrypted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
