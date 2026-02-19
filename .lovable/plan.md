

# Pagina Publica de Release Notes

## Visao Geral
Criar uma pagina publica `/releases` acessivel a partir da Landing Page onde usuarios podem acompanhar todas as novidades e atualizacoes da plataforma. O conteudo sera armazenado no banco de dados Supabase para permitir gerenciamento futuro via painel admin.

## Estrutura da Solucao

### 1. Banco de Dados - Nova Tabela `release_notes`

Campos:
- `id` (UUID, PK)
- `version` (text) - ex: "1.0.0"
- `title` (text) - titulo do release
- `date` (date) - data de publicacao
- `summary` (text) - resumo curto
- `content` (text) - conteudo completo em Markdown
- `tags` (text[]) - categorias como "Nova Funcionalidade", "Melhoria", "Correcao"
- `published` (boolean, default false) - controle de visibilidade
- `created_at`, `updated_at` (timestamps)
- `created_by` (UUID, nullable) - quem criou

RLS: Leitura publica (anon) para releases com `published = true`. Escrita restrita a system admins.

### 2. Pagina Publica `/releases`

Nova pagina `src/pages/ReleasesPage.tsx` com:
- Header reutilizando o estilo da Landing Page (cores Cofound)
- Timeline vertical com cards para cada release
- Tags coloridas por categoria (verde = nova funcionalidade, azul = melhoria, amarelo = correcao)
- Conteudo renderizado em Markdown (usando `react-markdown` ja instalado)
- Design responsivo mobile/desktop
- Botao de voltar para a Landing Page

### 3. Link na Landing Page

Adicionar link "Novidades" no menu de navegacao do header da Landing Page, apontando para `/releases`.

### 4. Primeiro Release Pre-Populado

Inserir no banco o release v1.0.0 com o conteudo completo que foi gerado anteriormente, cobrindo:
- Nova identidade visual Cofound
- Taxa de Variacao do KR
- Filtros avancados (YTD, Ano, Periodo)
- Ferramenta Governanca RMRE

### 5. Rota no App.tsx

Adicionar `<Route path="/releases" element={<ReleasesPage />} />` nas rotas publicas.

---

## Detalhes Tecnicos

### Tabela SQL
```sql
CREATE TABLE public.release_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: leitura publica para publicados
ALTER TABLE release_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published releases"
  ON release_notes FOR SELECT USING (published = true);
CREATE POLICY "Admins manage releases"
  ON release_notes FOR ALL
  USING (is_system_admin(auth.uid()))
  WITH CHECK (is_system_admin(auth.uid()));
```

### Arquivos a Criar/Modificar
1. **`src/pages/ReleasesPage.tsx`** - Pagina principal com timeline de releases
2. **`src/hooks/useReleaseNotes.ts`** - Hook para buscar releases do Supabase
3. **`src/App.tsx`** - Adicionar rota `/releases`
4. **`src/pages/landing/LandingPageBase.tsx`** - Adicionar link "Novidades" no nav

### Componentes da Pagina
- Header fixo com logo + navegacao (estilo Cofound)
- Lista de releases em formato timeline
- Cada card mostra: versao, data, titulo, tags, resumo
- Ao expandir: conteudo completo renderizado via `react-markdown`
- Footer simplificado com link de volta

