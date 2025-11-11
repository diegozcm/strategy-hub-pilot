import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ForgotPasswordRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('=== Login with Reset Function Started ===');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: ForgotPasswordRequest = await req.json();

    if (!email?.trim()) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Email é obrigatório'
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Initialize regular Supabase client for fetching templates
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Check if user exists
    const { data: users, error: getUserError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (getUserError) {
      console.error('Error getting users:', getUserError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Erro interno do servidor'
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const targetUser = users.users.find(u => u.email === email.trim());
    
    if (!targetUser) {
      // Don't reveal if user exists or not for security
      return new Response(JSON.stringify({
        success: true,
        message: 'Se o email existir no sistema, você receberá as instruções de acesso'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get user profile for name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', targetUser.id)
      .single();

    // Generate temporary password
    const { data: tempPassword, error: genError } = await supabaseAdmin
      .rpc('generate_temporary_password');

    if (genError || !tempPassword) {
      console.error('Error generating temporary password:', genError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Erro ao processar solicitação'
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Update user password and set must_change_password flag
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { password: tempPassword }
    );

    if (updateAuthError) {
      console.error('Error updating auth password:', updateAuthError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Erro ao processar solicitação'
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Update profile to require password change
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update({ must_change_password: true })
      .eq('user_id', targetUser.id);

    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError);
    }

    // Get user name for email
    const userName = profile ? `${profile.first_name} ${profile.last_name}` : email.split('@')[0];

    // Fetch email template from database
    const { data: templateData } = await supabase
      .from('email_templates' as any)
      .select('subject, body_html')
      .eq('template_key', 'password_reset')
      .eq('is_active', true)
      .single();

    let emailSubject = "Esqueci minha senha - Start Together";
    let emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">🔷 Start Together</h1>
          <p style="color: #64748b; margin: 5px 0;">Gestão Estratégica</p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #1e293b; margin-top: 0;">Olá, ${userName}!</h2>
          <p style="color: #475569; line-height: 1.6;">
            Você solicitou ajuda para acessar sua conta no Start Together. 
            Use as credenciais temporárias abaixo para fazer login:
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <p style="margin: 0; color: #1e293b;"><strong>E-mail:</strong> ${email}</p>
            <p style="margin: 10px 0 0; color: #1e293b;"><strong>Senha temporária:</strong> <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${tempPassword}</code></p>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⚠️ Importante:</strong> Esta é uma senha temporária. Você será obrigatoriamente solicitado(a) a alterá-la no login. 
              Não será possível navegar no sistema até que a senha seja alterada.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 25px;">
          <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://seu-app.lovable.app'}" 
             style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
            Acessar o Sistema
          </a>
        </div>
        
        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            Este e-mail foi enviado automaticamente pelo sistema Start Together.<br>
            Se você não solicitou este acesso, pode ignorar este e-mail com segurança.
          </p>
        </div>
      </div>
    `;

    // Use template from database if available
    if (templateData) {
      console.log('Using password_reset template from database');
      emailSubject = templateData.subject;
      emailBody = templateData.body_html;
      
      // Replace template variables
      const loginUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://seu-app.lovable.app';
      
      emailSubject = emailSubject
        .replace(/\{\{userName\}\}/g, userName)
        .replace(/\{\{email\}\}/g, email);
      
      emailBody = emailBody
        .replace(/\{\{userName\}\}/g, userName)
        .replace(/\{\{email\}\}/g, email)
        .replace(/\{\{temporaryPassword\}\}/g, tempPassword)
        .replace(/\{\{loginUrl\}\}/g, loginUrl);
    } else {
      console.log('Template password_reset not found, using hardcoded fallback');
    }

    // Send email using Resend with retry logic
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    let emailResponse;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      emailResponse = await resend.emails.send({
        from: "Start Together <noreply@cofound.com.br>",
        to: [email],
        subject: emailSubject,
        html: emailBody,
      });

      if (!emailResponse.error) {
        console.log('Email sent successfully to:', email);
        break;
      }

      retryCount++;
      if (retryCount <= maxRetries) {
        console.log(`Email send failed, retry ${retryCount}/${maxRetries}:`, emailResponse.error);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (emailResponse?.error) {
      console.error('Error sending email after retries:', emailResponse.error);
      return new Response(JSON.stringify({
        success: false,
        message: 'Erro ao enviar email. Por favor, tente novamente mais tarde.'
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('Password reset email sent successfully to:', email);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Se o email existir no sistema, você receberá as instruções de acesso em breve'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in login-with-reset function:", error);
    return new Response(JSON.stringify({
      success: false,
      message: 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);