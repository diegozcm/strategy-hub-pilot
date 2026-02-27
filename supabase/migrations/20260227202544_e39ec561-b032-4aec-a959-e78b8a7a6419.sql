
INSERT INTO public.release_notes (version, title, date, summary, content, published, tags)
VALUES (
  '2.4.0',
  'Tratamento Inteligente de Dados Nulos (N/A)',
  '2026-02-27',
  'Novo tratamento visual e lógico para Resultados-Chave sem dados registrados — valores nulos agora exibem "N/A" e são excluídos automaticamente das médias ponderadas.',
  '<h2>🎯 O que mudou?</h2>
<p>Antes desta atualização, Resultados-Chave (KRs) que ainda não possuíam dados reais registrados apareciam com <strong>0,0% em vermelho</strong> na plataforma, passando a falsa impressão de que o resultado estava zerado — quando na verdade simplesmente não havia dados.</p>
<p>Agora, esses KRs são exibidos com a indicação <strong>"N/A"</strong> (Não Aplicável) em cinza neutro, deixando claro que <strong>ainda não há dados</strong> para aquele período.</p>

<p>[print-do-card-de-kr-mostrando-na-no-mapa-estrategico]</p>

<h2>📊 Impacto nos Cálculos da Dashboard</h2>
<p>Esta mudança vai além do visual. O sistema agora <strong>distingue rigorosamente</strong> entre:</p>
<ul>
  <li><strong>Nulo (N/A)</strong> — ausência total de dados. O KR é <strong>excluído</strong> dos cálculos de média ponderada.</li>
  <li><strong>Zero (0%)</strong> — valor real registrado. O KR é <strong>incluído normalmente</strong> nos cálculos.</li>
</ul>

<h3>Como funciona na prática?</h3>
<p>Imagine um Objetivo com 3 KRs:</p>
<table>
  <thead><tr><th>KR</th><th>Peso</th><th>% Atingimento</th></tr></thead>
  <tbody>
    <tr><td>KR 1</td><td>40%</td><td>85%</td></tr>
    <tr><td>KR 2</td><td>30%</td><td>N/A</td></tr>
    <tr><td>KR 3</td><td>30%</td><td>60%</td></tr>
  </tbody>
</table>
<p><strong>Antes:</strong> A média considerava KR 2 como 0%, resultando em (40%×85% + 30%×0% + 30%×60%) = 52%.</p>
<p><strong>Agora:</strong> KR 2 é excluído. A média é recalculada apenas sobre KR 1 e KR 3, redistribuindo os pesos: (40/70×85% + 30/70×60%) = <strong>74,3%</strong> — um resultado muito mais fiel à realidade.</p>

<p>[print-da-dashboard-rumo-mostrando-objetivo-com-krs-na-excluidos-do-calculo]</p>

<h2>🗺️ Onde você verá o "N/A"</h2>
<p>A indicação aparece em todos os locais onde percentuais de KRs são exibidos:</p>
<ul>
  <li><strong>Mapa Estratégico</strong> — nos cards de KR dentro dos objetivos</li>
  <li><strong>Dashboard Rumo</strong> — nos blocos de Pilar, Objetivo e Score geral</li>
  <li><strong>Página de Objetivos</strong> — na listagem e no modal de detalhes</li>
  <li><strong>Modal do KR</strong> — nos campos "Realizado" e "% Atingimento"</li>
</ul>

<p>[print-do-modal-de-kr-mostrando-campo-realizado-com-na]</p>

<h2>💡 Dicas de Uso</h2>
<ul>
  <li>Se um KR mostra "N/A", basta registrar o primeiro valor real para que ele passe a ser contabilizado automaticamente.</li>
  <li>KRs com valor <strong>zero explícito</strong> (ex: 0 vendas no mês) continuam sendo tratados normalmente — o zero é um dado válido.</li>
  <li>Ao analisar a Dashboard, os percentuais dos Objetivos e Pilares agora refletem apenas os KRs que realmente possuem dados, dando uma visão mais precisa do progresso real.</li>
</ul>

<p>[print-da-pagina-de-objetivos-mostrando-krs-com-na-e-com-dados]</p>

<h2>🔧 Resumo Técnico</h2>
<p>O banco de dados armazena <code>0</code> como valor padrão em campos pré-calculados, mesmo quando não há dados reais. O sistema agora verifica diretamente os registros mensais (<code>monthly_actual</code>) para determinar se existem dados reais, garantindo que zeros do banco não sejam confundidos com valores reais.</p>',
  false,
  ARRAY['Melhoria', 'Nova Funcionalidade']
);
