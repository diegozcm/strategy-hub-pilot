-- Create email_templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key VARCHAR(100) UNIQUE NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  available_variables TEXT[] DEFAULT ARRAY[]::TEXT[],
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage email templates"
  ON public.email_templates
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_landing_page_content_updated_at();

-- Insert default welcome credentials template
INSERT INTO public.email_templates (
  template_key,
  template_name,
  subject,
  body_html,
  available_variables,
  description
) VALUES (
  'welcome_credentials',
  'Credenciais de Boas-vindas',
  'Bem-vindo(a) ao Start Together - Suas credenciais de acesso',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Bem-vindo(a) ao Start Together</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Olá <strong>{{userName}}</strong>,</p>
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Sua conta foi criada com sucesso! Abaixo estão suas credenciais de acesso:</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="color: #666666; font-size: 14px; margin: 0 0 8px 0;"><strong>Email:</strong></p>
                    <p style="color: #333333; font-size: 16px; margin: 0 0 16px 0;">{{email}}</p>
                    <p style="color: #666666; font-size: 14px; margin: 0 0 8px 0;"><strong>Senha Temporária:</strong></p>
                    <p style="color: #667eea; font-size: 20px; font-weight: bold; margin: 0; letter-spacing: 2px;">{{temporaryPassword}}</p>
                  </td>
                </tr>
              </table>
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="color: #856404; font-size: 14px; margin: 0;">⚠️ <strong>Importante:</strong> Por motivos de segurança, você será solicitado a alterar sua senha no primeiro login.</p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{loginUrl}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: bold;">Fazer Login</a>
                  </td>
                </tr>
              </table>
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">Se você tiver alguma dúvida, não hesite em entrar em contato conosco.</p>
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">Atenciosamente,<br><strong>Equipe Start Together</strong></p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #999999; font-size: 12px; margin: 0;">Este é um email automático. Por favor, não responda.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  ARRAY['userName', 'email', 'temporaryPassword', 'companyName', 'loginUrl'],
  'Template de email enviado para novos usuários com suas credenciais de acesso'
);