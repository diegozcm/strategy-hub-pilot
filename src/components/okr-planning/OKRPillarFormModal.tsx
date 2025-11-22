import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OKRPillar } from "@/types/okr";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OKRPillarFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<OKRPillar>) => Promise<void>;
  pillar?: OKRPillar | null;
  yearId: string;
  companyId: string;
}

interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const PREDEFINED_COLORS = [
  "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", 
  "#10B981", "#06B6D4", "#6366F1", "#F97316"
];

const ICONS = ["🎯", "🚀", "💡", "⚡", "🌟", "🔥", "💪", "🏆"];

export function OKRPillarFormModal({ 
  open, 
  onClose, 
  onSave, 
  pillar,
  yearId,
  companyId 
}: OKRPillarFormModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sponsor_id: "",
    color: PREDEFINED_COLORS[0],
    icon: ICONS[0],
  });

  useEffect(() => {
    if (pillar) {
      setFormData({
        name: pillar.name,
        description: pillar.description || "",
        sponsor_id: pillar.sponsor_id,
        color: pillar.color || PREDEFINED_COLORS[0],
        icon: pillar.icon || ICONS[0],
      });
    } else {
      setFormData({
        name: "",
        description: "",
        sponsor_id: "",
        color: PREDEFINED_COLORS[0],
        icon: ICONS[0],
      });
    }
  }, [pillar]);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, companyId]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_company_relations")
        .select(`
          user_id,
          profiles!inner(
            user_id,
            first_name,
            last_name,
            email
          )
        `)
        .eq("company_id", companyId);

      if (error) throw error;

      const usersList = data.map((rel: any) => ({
        user_id: rel.profiles.user_id,
        first_name: rel.profiles.first_name,
        last_name: rel.profiles.last_name,
        email: rel.profiles.email,
      }));

      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erro ao carregar usuários",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, informe o nome do pilar",
        variant: "destructive",
      });
      return;
    }

    if (!formData.sponsor_id) {
      toast({
        title: "Sponsor obrigatório",
        description: "Por favor, selecione um sponsor geral",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        okr_year_id: yearId,
        company_id: companyId,
      });
      handleClose();
    } catch (error) {
      console.error("Error saving pillar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      sponsor_id: "",
      color: PREDEFINED_COLORS[0],
      icon: ICONS[0],
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {pillar ? "Editar Pilar" : "Criar Novo Pilar"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Pilar *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Crescimento, Eficiência Operacional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o propósito deste pilar"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sponsor">Sponsor Geral *</Label>
            <Select
              value={formData.sponsor_id}
              onValueChange={(value) => setFormData({ ...formData, sponsor_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o sponsor geral" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.first_name} {user.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex gap-2 flex-wrap">
                {ICONS.map((icon) => (
                  <Button
                    key={icon}
                    type="button"
                    variant={formData.icon === icon ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData({ ...formData, icon })}
                  >
                    {icon}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {PREDEFINED_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                    style={{ 
                      backgroundColor: color,
                      borderColor: formData.color === color ? "#000" : "transparent"
                    }}
                    onClick={() => setFormData({ ...formData, color })}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : pillar ? "Atualizar" : "Criar Pilar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
