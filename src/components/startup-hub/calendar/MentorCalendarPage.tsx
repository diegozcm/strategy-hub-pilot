import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, List, StickyNote } from 'lucide-react';
import { useMentorSessions, MentoringSession } from '@/hooks/useMentorSessions';
import { useMentorStartupDetails } from '@/hooks/useMentorStartupDetails';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CalendarGrid } from './CalendarGrid';
import { SessionsStatsCard } from './SessionsStatsCard';
import { MentorSessionsPage } from '../mentor/MentorSessionsPage';
import { MentorTodosList } from './MentorTodosList';
import { MentorTodoModal } from './MentorTodoModal';
import { useMentorTodos, type MentorTodo } from '@/hooks/useMentorTodos';
import { format } from 'date-fns';

const sessionTypes = [
  { value: 'general', label: 'Geral' },
  { value: 'strategy', label: 'Estratégia' },
  { value: 'product', label: 'Produto' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'finance', label: 'Financeiro' },
  { value: 'team', label: 'Equipe' },
  { value: 'pitch', label: 'Pitch' }
];

export const MentorCalendarPage: React.FC = () => {
  const { sessions, loading, createSession, updateSession } = useMentorSessions();
  const { data: startups } = useMentorStartupDetails();
  const mentorTodosHook = useMentorTodos();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('list');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<MentoringSession | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<MentorTodo | null>(null);

  const [formData, setFormData] = useState({
    startup_company_id: '',
    session_date: '',
    duration: 60,
    session_type: 'general',
    notes: '',
    follow_up_date: '',
    status: 'completed'
  });

  // Handle create session from calendar
  const handleCreateSession = (date: Date) => {
    setSelectedDate(date);
    setEditingSession(null);
    setFormData({
      startup_company_id: '',
      session_date: format(date, 'yyyy-MM-dd'),
      duration: 60,
      session_type: 'general',
      notes: '',
      follow_up_date: '',
      status: 'completed'
    });
    setIsCreateModalOpen(true);
  };

  // Handle edit session from calendar
  const handleEditSession = (session: MentoringSession) => {
    setEditingSession(session);
    setFormData({
      startup_company_id: session.startup_company_id,
      session_date: format(new Date(session.session_date), 'yyyy-MM-dd'),
      duration: session.duration || 60,
      session_type: session.session_type,
      notes: session.notes || '',
      follow_up_date: session.follow_up_date ? format(new Date(session.follow_up_date), 'yyyy-MM-dd') : '',
      status: session.status || 'completed'
    });
    setIsCreateModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare the data for submission, ensuring proper field mapping
    const submissionData = {
      startup_company_id: formData.startup_company_id,
      session_date: formData.session_date,
      duration: formData.duration,
      session_type: formData.session_type,
      notes: formData.notes,
      follow_up_date: formData.follow_up_date || null,
      status: formData.status
    };
    
    const result = editingSession 
      ? await updateSession(editingSession.id, submissionData)
      : await createSession(submissionData);

    if (!result.error) {
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingSession(null);
    setSelectedDate(null);
    setFormData({
      startup_company_id: '',
      session_date: '',
      duration: 60,
      session_type: 'general',
      notes: '',
      follow_up_date: '',
      status: 'completed'
    });
  };

  const handleTodoSubmit = async (data: any) => {
    if (editingTodo) {
      await mentorTodosHook.updateTodo(editingTodo.id, data);
    } else {
      await mentorTodosHook.createTodo(data);
    }
    setIsTodoModalOpen(false);
    setEditingTodo(null);
  };

  const handleEditTodo = (todo: MentorTodo) => {
    setEditingTodo(todo);
    setIsTodoModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Calendário de Mentorias</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie suas sessões de mentoria no calendário
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendário
          </TabsTrigger>
          <TabsTrigger value="todos" className="flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            TO DO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <SessionsStatsCard sessions={sessions || []} selectedMonth={selectedMonth} />
          <CalendarGrid
            sessions={sessions || []}
            isMentor={true}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            onCreateSession={handleCreateSession}
            onEditSession={handleEditSession}
          />
        </TabsContent>

        <TabsContent value="list">
          <MentorSessionsPage />
        </TabsContent>

        <TabsContent value="todos">
          <MentorTodosList
            mentorTodosHook={mentorTodosHook}
            onCreateClick={() => {
              setEditingTodo(null);
              setIsTodoModalOpen(true);
            }}
            onEditClick={handleEditTodo}
          />
        </TabsContent>
      </Tabs>

      {/* Create/Edit Session Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSession ? 'Editar Sessão' : 'Nova Sessão de Mentoria'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Startup</label>
                <Select
                  value={formData.startup_company_id}
                  onValueChange={(value) => setFormData(prev => ({...prev, startup_company_id: value}))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar startup" />
                  </SelectTrigger>
                  <SelectContent>
                    {startups?.map(startup => (
                      <SelectItem key={startup.id} value={startup.id}>
                        {startup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Sessão</label>
                <Select
                  value={formData.session_type}
                  onValueChange={(value) => setFormData(prev => ({...prev, session_type: value}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sessionTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data da Sessão</label>
                <Input
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => setFormData(prev => ({...prev, session_date: e.target.value}))}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duração (minutos)</label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({...prev, duration: parseInt(e.target.value)}))}
                  min="15"
                  step="15"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notas da Sessão</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                placeholder="Descreva os principais pontos discutidos..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Follow-up (opcional)</label>
              <Input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData(prev => ({...prev, follow_up_date: e.target.value}))}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingSession ? 'Atualizar' : 'Criar Sessão'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* TODO Modal */}
      <MentorTodoModal
        open={isTodoModalOpen}
        onClose={() => {
          setIsTodoModalOpen(false);
          setEditingTodo(null);
        }}
        onSubmit={handleTodoSubmit}
        editingTodo={editingTodo}
        startups={startups?.map(s => ({ id: s.id, name: s.name })) || []}
      />
    </div>
  );
};
