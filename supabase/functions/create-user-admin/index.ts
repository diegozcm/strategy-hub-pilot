import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  position?: string;
  department?: string;
  role?: string;
  companyId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    // Verify JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ No authorization header provided');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Autenticação necessária' 
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create client with user token to verify identity
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: `Bearer ${token}` }
      }
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ Invalid token or user not found:', userError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token inválido ou usuário não encontrado' 
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`🔐 Authenticated user: ${user.id} (${user.email})`);

    // Verify user is a system admin using the is_system_admin function
    const { data: isAdmin, error: adminCheckError } = await supabaseAdmin
      .rpc('is_system_admin', { _user_id: user.id });

    if (adminCheckError) {
      console.error('❌ Error checking admin status:', adminCheckError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao verificar permissões' 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!isAdmin) {
      console.error(`❌ User ${user.email} is not a system admin`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Permissão negada. Somente administradores do sistema podem criar usuários.' 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`✅ User ${user.email} authorized as system admin`);

    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      position,
      department,
      role = 'member',
      companyId
    }: CreateUserRequest = await req.json();

    console.log('Creating user with email:', email);

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(u => u.email === email);
    
    if (userExists) {
      console.log('User already exists:', email);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Usuário com este email já existe' 
        }),
        {
          status: 422,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create user using admin API
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      }
    });

    if (authError || !authUser?.user) {
      console.error('Error creating auth user:', authError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authError?.message || 'Erro ao criar usuário' 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Auth user created successfully:', authUser.user.id);

    // Log the admin action for audit
    try {
      await supabaseAdmin.from('database_cleanup_logs').insert({
        admin_user_id: user.id,
        cleanup_category: 'user_creation',
        records_deleted: 0,
        success: true,
        notes: `Created user ${email} (${authUser.user.id}) by admin ${user.email}`
      });
    } catch (err) {
      console.warn('Failed to log admin action:', err);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authUser.user.id,
        email: authUser.user.email,
        message: 'Usuário criado com sucesso'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in create-user-admin function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
