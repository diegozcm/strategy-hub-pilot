import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    console.log('Step 4: Attempting to send email to:', to);

    // Attempt to send email with retry logic
    let emailResponse;
    let lastError;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`Email send attempt ${attempt}/3`);
      
      try {
        emailResponse = await resend.emails.send({
          from: "Start Together <onboarding@resend.dev>",
          to: [to],
          subject: "Bem-vindo(a) ao Start Together - Suas credenciais de acesso",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin: 0;">🔷 Start Together</h1>
                <p style="color: #64748b; margin: 5px 0;">Gestão Estratégica</p>
              </div>
              
              <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #1e293b; margin-top: 0;">Olá, ${userName}!</h2>
                <p style="color: #475569; line-height: 1.6;">
                  Você foi convidado(a) para acessar o sistema Start Together${companyName ? ` da empresa <strong>${companyName}</strong>` : ''}. 
                  Suas credenciais de acesso são:
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 20px 0;">
                  <p style="margin: 0; color: #1e293b;"><strong>E-mail:</strong> ${email}</p>
                  <p style="margin: 10px 0 0; color: #1e293b;"><strong>Senha temporária:</strong> <code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${temporaryPassword}</code></p>
                </div>
                
                <div style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;">
                    <strong>⚠️ Importante:</strong> Esta é uma senha temporária. Você será solicitado(a) a alterá-la no seu primeiro acesso. 
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
                  Se você não deveria ter recebido este e-mail, pode ignorá-lo com segurança.
                </p>
              </div>
            </div>
          `,
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