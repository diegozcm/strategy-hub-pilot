import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  email: string;
  source?: string; // "settings" for logged-in users, "login" for non-logged users, "admin" for admin panel
  customPassword?: string; // If provided, use this password instead of generating one
  sendEmail?: boolean; // If false, don't send email (admin defines and communicates directly)
  forcePasswordChange?: boolean; // If true, force password change on next login
}

const handler = async (req: Request): Promise<Response> => {
  console.log('=== Reset User Password Function Started ===');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, source = "login", customPassword, sendEmail = true, forcePasswordChange = true }: ResetPasswordRequest = await req.json();

    if (!email?.trim()) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Email é obrigatório'
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Initialize regular Supabase client for templates
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Check if user exists in auth.users
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
        message: 'Se o email existir no sistema, um token temporário foi enviado'
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

    // Use custom password if provided, otherwise generate temporary password
    let passwordToSet: string;
    
    if (customPassword) {
      // Validate custom password (min 8 chars, at least 1 letter and 1 number)
      if (customPassword.length < 8) {
        return new Response(JSON.stringify({
          success: false,
          message: 'A senha deve ter pelo menos 8 caracteres'
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      if (!/[a-zA-Z]/.test(customPassword) || !/[0-9]/.test(customPassword)) {
        return new Response(JSON.stringify({
          success: false,
          message: 'A senha deve conter pelo menos 1 letra e 1 número'
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      passwordToSet = customPassword;
      console.log('Using custom password provided by admin');
    } else {
      // Generate temporary password using the same DB function as admin
      const { data: tempPassword, error: genError } = await supabaseAdmin
        .rpc('generate_temporary_password');

      if (genError || !tempPassword) {
        console.error('Error generating temporary password:', genError);
        return new Response(JSON.stringify({
          success: false,
          message: 'Erro ao gerar senha temporária'
        }), {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      passwordToSet = tempPassword;
      console.log('Generated temporary password');
    }

    // Update user password and set must_change_password flag
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { password: passwordToSet }
    );

    if (updateAuthError) {
      console.error('Error updating auth password:', updateAuthError);
      return new Response(JSON.stringify({
        success: false,
        message: 'Erro ao atualizar senha'
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch password policy for expiration time
    let validityHours = 168; // default 7 days
    try {
      const { data: policyData } = await supabaseAdmin
        .from('password_policies')
        .select('temp_password_validity_hours')
        .is('company_id', null)
        .maybeSingle();

      if (policyData) {
        validityHours = policyData.temp_password_validity_hours;
      }
    } catch (e) {
      console.warn('Could not fetch password policy, using default:', e);
    }

    let tempResetExpires: string | null;
    if (validityHours === 0) {
      tempResetExpires = null; // No expiration
    } else {
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + validityHours);
      tempResetExpires = expirationTime.toISOString();
    }

    // Only set must_change_password based on forcePasswordChange flag or source
    const profileUpdate: any = {
      temp_reset_token: passwordToSet,
      temp_reset_expires: tempResetExpires,
      updated_at: new Date().toISOString()
    };

    // Force password change based on the forcePasswordChange parameter
    // For admin source, respect the forcePasswordChange flag
    // For login flow (non-logged users), always force password change
    if (source === "admin") {
      profileUpdate.must_change_password = forcePasswordChange;
    } else if (source !== "settings") {
      profileUpdate.must_change_password = true;
    }

    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdate)
      .eq('user_id', targetUser.id);

    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError);
    }

    // Skip email sending if sendEmail is false
    if (!sendEmail) {
      console.log('Skipping email - admin will communicate password directly');
      return new Response(JSON.stringify({
        success: true,
        message: 'Senha atualizada com sucesso. O administrador irá comunicar a nova senha ao usuário.'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Send email using Resend (same as send-user-credentials)
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const userName = profile ? `${profile.first_name} ${profile.last_name}` : email.split('@')[0];

    // Fetch email template from database
    console.log('Fetching password_reset template from database...');
    let emailSubject = "Reset de Senha - Start Together";
    let emailBody = "";

    try {
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('subject, body_html')
        .eq('template_key', 'password_reset')
        .eq('is_active', true)
        .single();
      
      if (templateError) {
        console.error('Error fetching email template:', templateError);
      } else if (template) {
        emailSubject = template.subject;
        emailBody = template.body_html;
        console.log('Email template loaded from database');
      }
    } catch (error) {
      console.error('Error loading email template:', error);
    }

    // Fallback to hardcoded template if not found in database
    if (!emailBody) {
      console.log('Using fallback hardcoded template');
      emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">🔷 Start Together</h1>
            <p style="color: #64748b; margin: 5px 0;">Gestão Estratégica</p>
          </div>
          
          <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #1e293b; margin-top: 0;">Olá, {{userName}}!</h2>
            <p style="color: #475569; line-height: 1.6;">
              Você solicitou a redefinição da sua senha no sistema Start Together. 
              Use as credenciais temporárias abaixo para fazer login:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 20px 0;">
              <p style="margin: 0; color: #1e293b;"><strong>E-mail:</strong> {{email}}</p>
              <p style="margin: 10px 0 0; color: #1e293b;"><strong>Senha temporária:</strong> <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 14px;">{{temporaryPassword}}</code></p>
            </div>
            
            <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>⚠️ Importante:</strong> Esta é uma senha temporária. Você será obrigatoriamente solicitado(a) a alterá-la no próximo login.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="{{loginUrl}}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
              Acessar o Sistema
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Este e-mail foi enviado automaticamente pelo sistema Start Together.<br>
              Se você não solicitou este reset, pode ignorar este e-mail com segurança.
            </p>
          </div>
        </div>
      `;
    }

    // Replace template variables
    const loginUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://seu-app.lovable.app'}`;

    emailSubject = emailSubject
      .replace(/\{\{userName\}\}/g, userName)
      .replace(/\{\{email\}\}/g, email);

    emailBody = emailBody
      .replace(/\{\{userName\}\}/g, userName)
      .replace(/\{\{email\}\}/g, email)
      .replace(/\{\{temporaryPassword\}\}/g, passwordToSet)
      .replace(/\{\{loginUrl\}\}/g, loginUrl);

    console.log('Sending password reset email to:', email);

    const emailResponse = await resend.emails.send({
      from: "Start Together <noreply@cofound.com.br>",
      to: [email],
      subject: emailSubject,
      html: emailBody,
    });

    if (emailResponse.error) {
      console.error('Error sending email:', emailResponse.error);
      return new Response(JSON.stringify({
        success: true, // Still return success to not reveal if user exists
        message: 'Se o email existir no sistema, um token temporário foi enviado'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log('Password reset email sent successfully to:', email);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Token temporário enviado com sucesso. Verifique seu email.'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in reset-user-password function:", error);
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