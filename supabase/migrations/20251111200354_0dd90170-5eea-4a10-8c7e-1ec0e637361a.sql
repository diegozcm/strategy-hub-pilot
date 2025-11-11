-- Add password reset email template
INSERT INTO email_templates (
  template_key,
  template_name,
  subject,
  body_html,
  available_variables,
  description,
  is_active
) VALUES (
  'password_reset',
  'Reset de Senha',
  'Reset de Senha - Start Together',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
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
          Não será possível navegar no sistema até que a senha seja alterada.
        </p>
      </div>
    </div>
    
    <div style="text-align: center; margin-bottom: 25px;">
      <a href="{{loginUrl}}" 
         style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
        Acessar o Sistema
      </a>
    </div>
    
    <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        Este e-mail foi enviado automaticamente pelo sistema Start Together.<br>
        Se você não solicitou este reset, pode ignorar este e-mail com segurança.
      </p>
    </div>
  </div>',
  ARRAY['userName', 'email', 'temporaryPassword', 'loginUrl'],
  'Template para email de reset de senha com senha temporária',
  true
) ON CONFLICT (template_key) DO UPDATE SET
  subject = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  available_variables = EXCLUDED.available_variables,
  description = EXCLUDED.description,
  updated_at = now();