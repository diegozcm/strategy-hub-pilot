import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, userName, email, temporaryPassword, companyName }: SendCredentialsRequest = await req.json();

    console.log('Sending credentials email to:', to);

    const emailResponse = await resend.emails.send({
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

    if (emailResponse.error) {
      console.error('Error sending email:', emailResponse.error);
      throw emailResponse.error;
    }

    console.log("Credentials email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-user-credentials function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);