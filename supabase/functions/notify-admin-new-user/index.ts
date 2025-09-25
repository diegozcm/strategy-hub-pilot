import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = Deno.env.get("RESEND_API_KEY");

const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);
const resend = new Resend(resendApiKey);

interface NewUserNotificationRequest {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("notify-admin-new-user function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body with better error handling
    let requestData: NewUserNotificationRequest;
    
    try {
      const body = await req.text();
      console.log("Raw request body:", body);
      
      requestData = JSON.parse(body);
      console.log("Parsed request data:", requestData);
      
      // Validate required fields
      if (!requestData.userId || !requestData.email || !requestData.firstName || !requestData.lastName) {
        throw new Error("Missing required fields: userId, email, firstName, lastName");
      }
    } catch (parseError: any) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body", details: parseError?.message || "Unknown error" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { userId, email, firstName, lastName } = requestData;
    console.log("Processing new user notification:", { userId, email, firstName, lastName });

    // Buscar configuração do email de notificação do admin
    const { data: adminEmailSetting, error: settingError } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'admin_notification_email')
      .maybeSingle();

    if (settingError) {
      console.error("Error fetching admin notification email setting:", settingError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch admin email configuration", details: settingError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Handle JSON parsing more safely
    let adminEmail = "";
    try {
      if (adminEmailSetting?.value) {
        // Try to parse as JSON first, fallback to direct string
        if (typeof adminEmailSetting.value === 'string') {
          try {
            adminEmail = JSON.parse(adminEmailSetting.value);
          } catch {
            // If JSON parsing fails, use as direct string
            adminEmail = adminEmailSetting.value;
          }
        } else {
          adminEmail = adminEmailSetting.value;
        }
      }
    } catch (jsonError) {
      console.error("Error parsing admin email from settings:", jsonError);
      adminEmail = "";
    }
    
    if (!adminEmail || adminEmail.trim() === "") {
      console.log("No admin notification email configured, skipping notification");
      return new Response(
        JSON.stringify({ message: "No admin email configured for notifications" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Sending notification to admin email:", adminEmail);

    // Enviar email de notificação
    const emailResponse = await resend.emails.send({
      from: "StartTogether <onboarding@resend.dev>",
      to: [adminEmail],
      subject: "Novo usuário aguardando aprovação - StartTogether",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Novo usuário aguardando aprovação</h2>
          
          <p>Um novo usuário se cadastrou na plataforma StartTogether e está aguardando aprovação para acessar o sistema.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Informações do usuário:</h3>
            <p><strong>Nome:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Data do cadastro:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          
          <p>Para aprovar este usuário, acesse o painel administrativo em:</p>
          <p><a href="${supabaseUrl}" style="color: #2563eb; text-decoration: none;">Painel Administrativo</a></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            Esta é uma notificação automática do sistema StartTogether.<br>
            Se você não deve receber estes emails, entre em contato com o administrador do sistema.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Admin notification sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in notify-admin-new-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);