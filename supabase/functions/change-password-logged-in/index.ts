import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChangePasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Change Password Logged In Function Started ===');

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header to identify the logged-in user
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      console.log('❌ Authorization header missing');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Authorization header missing - user must be logged in'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Extract JWT token from Authorization header (remove "Bearer " prefix)
    const jwtToken = authorization.replace('Bearer ', '').trim();
    if (!jwtToken) {
      console.log('❌ No JWT token found in Authorization header');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Token inválido no cabeçalho de autorização'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log('🔍 Extracted JWT token length:', jwtToken.length);
    console.log('🔍 JWT token starts with:', jwtToken.substring(0, 20) + '...');

    // Verify user session using service role client with extracted token
    console.log('🔐 Verifying user session with service role client...');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwtToken);
    
    if (userError) {
      console.error('❌ User session validation error:', userError);
      console.error('❌ Error code:', userError.name);
      console.error('❌ Error message:', userError.message);
      return new Response(
        JSON.stringify({
          success: false,
          message: `Erro na validação da sessão: ${userError.message}`
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    
    if (!user) {
      console.log('❌ No user found in session after token validation');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Sessão inválida - usuário não encontrado'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    
    console.log('✅ User session verified for:', user.email);
    console.log('✅ User ID:', user.id);

    // Parse request body
    const { token, newPassword, confirmPassword }: ChangePasswordRequest = await req.json();

    // Validate input
    if (!token || !newPassword || !confirmPassword) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Token, nova senha e confirmação são obrigatórios'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (newPassword !== confirmPassword) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Nova senha e confirmação não coincidem'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'A senha deve ter pelo menos 8 caracteres'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Get user profile and validate token
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('temp_reset_token, temp_reset_expires')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Erro ao verificar token - usuário não encontrado'
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Check if token matches
    if (!profile.temp_reset_token || profile.temp_reset_token !== token.trim()) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Token inválido ou expirado'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Check if token has expired (15 minutes validity)
    if (!profile.temp_reset_expires || new Date(profile.temp_reset_expires) < new Date()) {
      // Clear expired token
      await supabaseAdmin
        .from('profiles')
        .update({
          temp_reset_token: null,
          temp_reset_expires: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Token expirado. Solicite um novo token.'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Erro ao atualizar senha. Tente novamente.'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Clear the reset token after successful password change
    await supabaseAdmin
      .from('profiles')
      .update({
        temp_reset_token: null,
        temp_reset_expires: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    console.log('Password changed successfully for user:', user.email);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Senha alterada com sucesso!'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Unexpected error in change-password-logged-in:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Erro interno do servidor'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);