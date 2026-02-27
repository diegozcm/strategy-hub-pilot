import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lightbulb, AlertTriangle, TrendingUp, Info, Sparkles,
  Check, X, RefreshCw, Filter, ChevronDown } from
'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAIInsights, AIInsight } from '@/hooks/useAIInsights';
import { AtlasOrb } from './AtlasOrb';

interface AtlasInsightsPanelProps {
  onSwitchToChat: (message?: string) => void;
}

const severityConfig = {
  critical: { label: 'Crítico', color: 'border-l-red-500 bg-red-500/5', badge: 'bg-red-500/10 text-red-700 border-red-500/20' },
  high: { label: 'Alto', color: 'border-l-orange-500 bg-orange-500/5', badge: 'bg-orange-500/10 text-orange-700 border-orange-500/20' },
  medium: { label: 'Médio', color: 'border-l-yellow-500 bg-yellow-500/5', badge: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20' },
  low: { label: 'Baixo', color: 'border-l-green-500 bg-green-500/5', badge: 'bg-green-500/10 text-green-700 border-green-500/20' }
};

const typeConfig = {
  risk: { label: 'Risco', icon: AlertTriangle, color: 'text-red-600' },
  opportunity: { label: 'Oportunidade', icon: TrendingUp, color: 'text-emerald-600' },
  info: { label: 'Info', icon: Info, color: 'text-blue-600' }
};

export const AtlasInsightsPanel: React.FC<AtlasInsightsPanelProps> = ({ onSwitchToChat }) => {
  const {
    insights, recommendations, loading, generating,
    generateInsights, loadInsights, updateInsightStatus, confirmInsight,
    getActiveInsights, getInsightsStats
  } = useAIInsights();

  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('active');

  const stats = getInsightsStats();
  const activeInsights = getActiveInsights();

  const filteredInsights = (activeTab === 'active' ? activeInsights : insights.filter((i) => i.status !== 'active')).
  filter((i) => !filterType || i.insight_type === filterType).
  filter((i) => !filterSeverity || i.severity === filterSeverity);

  const avgConfidence = activeInsights.length > 0 ?
  Math.round(activeInsights.reduce((acc, i) => acc + (i.confidence_score || 0), 0) / activeInsights.length * 100) :
  0;

  return (
    <div className="flex flex-col h-full atlas-chat-bg">
      {/* Header with KPIs */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AtlasOrb size={28} />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Insights da Empresa</h2>
              <p className="text-xs text-muted-foreground">Análises e recomendações geradas pelo Atlas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => loadInsights()}
              disabled={loading}>

              <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", loading && "animate-spin")} />
              Atualizar
            </Button>
            <Button
              size="sm"
              onClick={() => generateInsights()}
              disabled={generating}
              className="bg-[hsl(var(--cofound-blue-light))] text-white hover:brightness-110">

              <Sparkles className={cn("h-3.5 w-3.5 mr-1.5", generating && "animate-pulse")} />
              {generating ? 'Gerando...' : 'Gerar Insights'}
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-3">
          <KpiCard label="Insights Ativos" value={stats.active} icon={Lightbulb} accent="blue" />
          <KpiCard label="Alertas Críticos" value={stats.critical + stats.high} icon={AlertTriangle} accent="red" />
          <KpiCard label="Oportunidades" value={stats.opportunities} icon={TrendingUp} accent="green" />
          <KpiCard label="Confiança Média" value={`${avgConfidence}%`} icon={Sparkles} accent="purple" />
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b border-border flex items-center gap-2 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground mr-1">Tipo:</span>
        {Object.entries(typeConfig).map(([key, cfg]) =>
        <button
          key={key}
          onClick={() => setFilterType(filterType === key ? null : key)}
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
            filterType === key ?
            "bg-[hsl(var(--cofound-blue-light))]/10 border-[hsl(var(--cofound-blue-light))]/30 text-[hsl(var(--cofound-blue-light))]" :
            "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
          )}>

            {cfg.label}
          </button>
        )}
        <span className="text-xs text-muted-foreground ml-2 mr-1">Severidade:</span>
        {Object.entries(severityConfig).map(([key, cfg]) =>
        <button
          key={key}
          onClick={() => setFilterSeverity(filterSeverity === key ? null : key)}
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium transition-colors border",
            filterSeverity === key ?
            "bg-[hsl(var(--cofound-blue-light))]/10 border-[hsl(var(--cofound-blue-light))]/30 text-[hsl(var(--cofound-blue-light))]" :
            "bg-muted/50 border-transparent text-muted-foreground hover:bg-muted"
          )}>

            {cfg.label}
          </button>
        )}
      </div>

      {/* Tabs + Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <div className="px-6 pt-3">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="active">
              Ativos
              {stats.active > 0 &&
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">{stats.active}</Badge>
              }
            </TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1 px-6 py-3">
          <AnimatePresence mode="popLayout">
            {loading && filteredInsights.length === 0 ?
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <RefreshCw className="h-8 w-8 animate-spin mb-3 text-[hsl(var(--cofound-blue-light))]" />
                <p className="text-sm">Carregando insights...</p>
              </div> :
            filteredInsights.length === 0 ?
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground">

                <Lightbulb className="h-12 w-12 mb-3 text-muted-foreground/30" />
                <p className="text-sm font-medium">Nenhum insight encontrado</p>
                <p className="text-xs mt-1">Clique em "Gerar Insights" para analisar sua empresa</p>
              </motion.div> :

            <div className="space-y-3 pb-4">
                {filteredInsights.map((insight, idx) =>
              <InsightCard
                key={insight.id}
                insight={insight}
                index={idx}
                onConfirm={() => confirmInsight(insight.id)}
                onDismiss={() => updateInsightStatus(insight.id, 'dismissed')}
                onResolve={() => updateInsightStatus(insight.id, 'resolved')}
                onAskAtlas={() => onSwitchToChat(`Me fale mais sobre o insight: "${insight.title}"`)}
                recommendations={recommendations.filter((r) => r.insight_id === insight.id)} />

              )}
              </div>
            }
          </AnimatePresence>
        </ScrollArea>
      </Tabs>

      {/* Contextual Input */}
      







    </div>);

};

/* --- Sub-components --- */

function KpiCard({ label, value, icon: Icon, accent }: {label: string;value: string | number;icon: React.FC<any>;accent: string;}) {
  const accentMap: Record<string, string> = {
    blue: 'text-[hsl(var(--cofound-blue-light))] bg-[hsl(var(--cofound-blue-light))]/10',
    red: 'text-red-600 bg-red-500/10',
    green: 'text-[hsl(var(--cofound-green))] bg-[hsl(var(--cofound-green))]/10',
    purple: 'text-purple-600 bg-purple-500/10'
  };
  const colors = accentMap[accent] || accentMap.blue;
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={cn("p-1 rounded", colors)}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>);

}

function InsightCard({ insight, index, onConfirm, onDismiss, onResolve, onAskAtlas, recommendations







}: {insight: AIInsight;index: number;onConfirm: () => void;onDismiss: () => void;onResolve: () => void;onAskAtlas: () => void;recommendations: any[];}) {
  const severity = severityConfig[insight.severity] || severityConfig.medium;
  const typeInfo = typeConfig[insight.insight_type as keyof typeof typeConfig] || typeConfig.info;
  const TypeIcon = typeInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "rounded-xl border border-border bg-card p-4 border-l-4 transition-shadow hover:shadow-md",
        severity.color
      )}>

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <TypeIcon className={cn("h-5 w-5 mt-0.5 shrink-0", typeInfo.color)} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground">{insight.title}</h3>
              <Badge variant="outline" className={cn("text-[10px] px-1.5", severity.badge)}>
                {severity.label}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5">
                {insight.category}
              </Badge>
              {insight.confidence_score &&
              <span className="text-[10px] text-muted-foreground">
                  {Math.round(insight.confidence_score * 100)}% confiança
                </span>
              }
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>

            {recommendations.length > 0 &&
            <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-foreground">Recomendações:</p>
                {recommendations.map((rec) =>
              <div key={rec.id} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-[hsl(var(--cofound-green))]">→</span>
                    <span>{rec.title}</span>
                  </div>
              )}
              </div>
            }

            {insight.confirmed_at &&
            <p className="text-[10px] text-[hsl(var(--cofound-green))] mt-2 font-medium">
                ✓ Confirmado em {new Date(insight.confirmed_at).toLocaleDateString('pt-BR')}
              </p>
            }
          </div>
        </div>
      </div>

      {insight.status === 'active' &&
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={onAskAtlas}>
            <AtlasOrb size={14} />
            Perguntar ao Atlas
          </Button>
          {!insight.confirmed_at &&
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-[hsl(var(--cofound-green))]" onClick={onConfirm}>
              <Check className="h-3 w-3" />
              Confirmar
            </Button>
        }
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground" onClick={onResolve}>
            <Check className="h-3 w-3" />
            Resolver
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive" onClick={onDismiss}>
            <X className="h-3 w-3" />
            Descartar
          </Button>
        </div>
      }
    </motion.div>);

}