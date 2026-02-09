import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendCredentialsRequest {
  to: string;
  userName: string;
  email: string;
  temporaryPassword: string;
  companyName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('=== Send User Credentials Function Started ===');
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  // Always return status 200 to prevent frontend errors
  try {
    console.log('Step 1: Parsing request body...');
    
    // Input validation and parsing
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body parsed successfully:', { ...requestBody, temporaryPassword: '[HIDDEN]' });
    } catch (parseError: any) {
      console.error('JSON parsing error:', parseError);
      return new Response(JSON.stringify({
        success: true,
        emailSent: false,
        emailError: 'Erro ao processar dados de entrada: ' + parseError.message,
        message: 'Usuário criado, mas falha no processamento do e-mail.'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { to, userName, email, temporaryPassword, companyName }: SendCredentialsRequest = requestBody;

    // Validate required fields
    console.log('Step 2: Validating required fields...');
    if (!to || !userName || !email || !temporaryPassword) {
      console.error('Missing required fields:', { to: !!to, userName: !!userName, email: !!email, temporaryPassword: !!temporaryPassword });
      return new Response(JSON.stringify({
        success: true,
        emailSent: false,
        emailError: 'Campos obrigatórios não fornecidos',
        message: 'Usuário criado, mas falha na validação dos dados do e-mail.'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if RESEND_API_KEY is available
    console.log('Step 3: Checking Resend API key...');
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not found in environment variables');
      return new Response(JSON.stringify({
        success: true,
        emailSent: false,
        emailError: 'Chave da API Resend não configurada',
        message: 'Usuário criado, mas serviço de e-mail não está configurado.'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    console.log('Resend API key found');

    console.log('Step 4: Fetching email template from database...');
    
    // Fetch email template from database
    let emailSubject = "Bem-vindo(a) ao Strategy HUB - Suas credenciais de acesso";
    let emailBody = "";
    
    try {
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('subject, body_html')
        .eq('template_key', 'welcome_credentials')
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
                <h1 style="color: #2563eb; margin: 0;">🔷 Strategy HUB</h1>
                <p style="color: #64748b; margin: 5px 0;">Gestão Estratégica</p>
              </div>
              
              <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #1e293b; margin-top: 0;">Olá, {{userName}}!</h2>
                <p style="color: #475569; line-height: 1.6;">
                  Você foi convidado(a) para acessar o sistema Strategy HUB. 
                  Suas credenciais de acesso são:
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 20px 0;">
                  <p style="margin: 0; color: #1e293b;"><strong>E-mail:</strong> {{email}}</p>
                  <p style="margin: 10px 0 0; color: #1e293b;"><strong>Senha temporária:</strong> <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px;">{{temporaryPassword}}</code></p>
                </div>
                
                <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>⚠️ Importante:</strong> Esta é uma senha temporária. Você será solicitado(a) a alterá-la no seu primeiro acesso.
                  </p>
                </div>
              </div>
              
              <div style="text-align: center; margin-bottom: 25px;">
                <a href="{{loginUrl}}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px;">
                  Acessar o Sistema
                </a>
              </div>
            </div>
          `;
    }
    
    console.log('Step 5: Fetching password policy for expiration...');
    
    // Fetch password policy for temp password validity
    let validityHours = 168; // default 7 days
    try {
      const { data: policyData } = await supabase
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

    console.log('Step 6: Replacing template variables...');
    
    // Replace template variables
    const loginUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://seu-app.lovable.app'}`;
    
    emailSubject = emailSubject
      .replace(/\{\{userName\}\}/g, userName)
      .replace(/\{\{email\}\}/g, email);
    
    emailBody = emailBody
      .replace(/\{\{userName\}\}/g, userName)
      .replace(/\{\{email\}\}/g, email)
      .replace(/\{\{temporaryPassword\}\}/g, temporaryPassword)
      .replace(/\{\{companyName\}\}/g, companyName || 'Start Together')
      .replace(/\{\{loginUrl\}\}/g, loginUrl);

    console.log('Step 6: Attempting to send email to:', to);

    // Attempt to send email with retry logic
    let emailResponse;
    let lastError;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`Email send attempt ${attempt}/3`);
      
      try {
        emailResponse = await resend.emails.send({
          from: "Strategy HUB <noreply@cofound.com.br>",
          to: [to],
          subject: emailSubject,
          html: emailBody,
        });
        
        console.log(`Attempt ${attempt} - Resend response:`, emailResponse);
        break; // Success, exit retry loop
        
      } catch (resendError: any) {
        console.error(`Attempt ${attempt} - Resend error:`, resendError);
        lastError = resendError;
        
        // If this is not the last attempt, wait before retrying
        if (attempt < 3) {
          console.log(`Waiting 1 second before retry ${attempt + 1}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // Check if we have a successful response or an error from Resend
    if (emailResponse) {
      if (emailResponse.error) {
        console.error('Resend returned error:', emailResponse.error);
        
        let errorMessage = 'Falha no envio do e-mail';
        if (emailResponse.error.message?.includes('domain')) {
          errorMessage = 'Domínio não verificado no Resend. Configure um domínio personalizado.';
        } else if (emailResponse.error.message?.includes('api_key')) {
          errorMessage = 'Chave da API Resend inválida. Verifique a configuração.';
        }
        
        return new Response(JSON.stringify({
          success: true,
          emailSent: false,
          emailError: emailResponse.error.message || errorMessage,
          message: 'Usuário criado, mas falha no envio do e-mail. ' + errorMessage
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      console.log("Email sent successfully. Response ID:", emailResponse.data?.id);
      return new Response(JSON.stringify({
        success: true,
        emailSent: true,
        messageId: emailResponse.data?.id,
        message: 'E-mail com credenciais enviado com sucesso'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // If we get here, all retries failed
    console.error('All email send attempts failed. Last error:', lastError);
    return new Response(JSON.stringify({
      success: true,
      emailSent: false,
      emailError: lastError?.message || 'Falha após múltiplas tentativas',
      message: 'Usuário criado, mas falha no envio do e-mail após 3 tentativas.'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    // This is the final catch-all - should never return 500
    console.error("=== CRITICAL ERROR in send-user-credentials function ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Always return 200 to prevent frontend errors
    return new Response(JSON.stringify({
      success: true,
      emailSent: false,
      emailError: 'Erro interno do servidor: ' + error.message,
      message: 'Usuário criado, mas ocorreu um erro inesperado no envio do e-mail.'
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);