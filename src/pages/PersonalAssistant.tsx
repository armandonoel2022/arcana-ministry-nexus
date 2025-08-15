import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Plus, Trash2, PiggyBank, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Expense {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
}

interface VoiceAssistantProps {
  onStartListening: () => void;
  onStopListening: () => void;
  isListening: boolean;
}

const VoiceAssistant = ({ onStartListening, onStopListening, isListening }: VoiceAssistantProps) => {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Button
          onClick={isListening ? onStopListening : onStartListening}
          size="lg"
          className={`w-20 h-20 rounded-full ${isListening ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`}
        >
          {isListening ? (
            <MicOff className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>
        {isListening && (
          <div className="absolute inset-0 rounded-full border-4 border-primary animate-pulse" />
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        {isListening ? "Escuchando..." : "Presiona para hablar"}
      </p>
    </div>
  );
};

const PersonalAssistant = () => {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    type: "expense" as 'income' | 'expense',
    category: "general"
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('personal_expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const addExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('personal_expenses')
        .insert({
          user_id: user.id,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          type: newExpense.type,
          category: newExpense.category
        });

      if (error) throw error;

      setNewExpense({
        description: "",
        amount: "",
        type: "expense",
        category: "general"
      });

      loadExpenses();
      toast({
        title: "Registro agregado",
        description: `${newExpense.type === 'income' ? 'Ingreso' : 'Gasto'} registrado correctamente`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo registrar el gasto",
        variant: "destructive"
      });
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('personal_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      loadExpenses();
      toast({
        title: "Eliminado",
        description: "Registro eliminado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro",
        variant: "destructive"
      });
    }
  };

  const handleVoiceCommand = async () => {
    if (isListening) {
      setIsListening(false);
      // Aquí se procesaría el comando de voz
      toast({
        title: "Comando procesado",
        description: "Función de voz en desarrollo",
      });
    } else {
      setIsListening(true);
      // Aquí se iniciaría la grabación
      setTimeout(() => setIsListening(false), 5000); // Auto-stop después de 5 segundos
    }
  };

  const totalIncome = expenses
    .filter(e => e.type === 'income')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = expenses
    .filter(e => e.type === 'expense')
    .reduce((sum, e) => sum + e.amount, 0);

  const balance = totalIncome - totalExpenses;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Mic className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Asistente Personal</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${balance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Disponible</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="expenses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="expenses">Control de Gastos</TabsTrigger>
          <TabsTrigger value="voice">Comandos de Voz</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agregar Registro</CardTitle>
                <CardDescription>
                  Registra tus ingresos y gastos personales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    placeholder="Descripción"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Monto"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    variant={newExpense.type === 'income' ? 'default' : 'outline'}
                    onClick={() => setNewExpense(prev => ({ ...prev, type: 'income' }))}
                    className="flex-1"
                  >
                    Ingreso
                  </Button>
                  <Button
                    variant={newExpense.type === 'expense' ? 'default' : 'outline'}
                    onClick={() => setNewExpense(prev => ({ ...prev, type: 'expense' }))}
                    className="flex-1"
                  >
                    Gasto
                  </Button>
                </div>
                <Button onClick={addExpense} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Registro
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historial de Movimientos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={expense.type === 'income' ? 'default' : 'destructive'}>
                          {expense.type === 'income' ? 'Ingreso' : 'Gasto'}
                        </Badge>
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(expense.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${expense.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {expense.type === 'income' ? '+' : '-'}${expense.amount.toLocaleString()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {expenses.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No hay registros aún
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="voice">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Asistente de Voz</CardTitle>
                <CardDescription>
                  Usa comandos de voz para controlar tu agenda y gastos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <VoiceAssistant
                    onStartListening={handleVoiceCommand}
                    onStopListening={handleVoiceCommand}
                    isListening={isListening}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Comandos disponibles:</h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">"Agregar gasto"</p>
                      <p className="text-sm text-muted-foreground">Registra un nuevo gasto</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">"Ver balance"</p>
                      <p className="text-sm text-muted-foreground">Muestra tu balance actual</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">"Próximo ensayo"</p>
                      <p className="text-sm text-muted-foreground">Información del próximo ensayo</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">"Mi agenda"</p>
                      <p className="text-sm text-muted-foreground">Eventos de esta semana</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonalAssistant;