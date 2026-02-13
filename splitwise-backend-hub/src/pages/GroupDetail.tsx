import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowLeft, ArrowRight, Plus, UserPlus, Receipt, ArrowRightLeft, Users,
  TrendingUp, TrendingDown, CheckCircle, Check, Clock, Trash2, Pencil, Calendar as CalendarIcon,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { CreateExpenseRequest, RecordSettlementRequest } from '@/types/api';

const CATEGORIES = ['Food', 'Transport', 'Accommodation', 'Utilities', 'Entertainment', 'Groceries', 'Other'];

const currencySymbol: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', LKR: 'Rs', INR: '₹',
};

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#ec4899', '#6366f1'];

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => api.getGroup(groupId!),
    enabled: !!groupId,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', groupId],
    queryFn: () => api.getGroupExpenses(groupId!),
    enabled: !!groupId,
  });

  const { data: balances = [] } = useQuery({
    queryKey: ['balances', groupId],
    queryFn: () => api.getGroupBalances(groupId!),
    enabled: !!groupId,
  });

  const { data: simplified = [] } = useQuery({
    queryKey: ['simplified', groupId],
    queryFn: () => api.getSimplifiedSettlements(groupId!),
    enabled: !!groupId,
  });

  const { data: settlements = [] } = useQuery({
    queryKey: ['settlements', groupId],
    queryFn: () => api.getGroupSettlements(groupId!),
    enabled: !!groupId,
  });

  const sym = currencySymbol[group?.currency || 'USD'] || '$';

  const [view, setView] = useState<'activity' | 'insights'>('activity');
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);

  const totalExpenses = useMemo(() => expenses.reduce((sum, e: any) => sum + e.amount, 0), [expenses]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e: any) => { map[e.category || 'Other'] = (map[e.category || 'Other'] || 0) + e.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const timeseriesData = useMemo(() => {
    const map = new Map<string, number>();
    const sorted = [...expenses].sort((a: any, b: any) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime());
    sorted.forEach((e: any) => {
      const day = format(new Date(e.date || e.createdAt), 'MMM dd');
      map.set(day, (map.get(day) || 0) + e.amount);
    });
    return Array.from(map.entries()).map(([date, amount]) => ({ date, amount }));
  }, [expenses]);

  if (groupLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Group not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-display font-bold text-foreground">{group.name}</h1>
              <p className="text-sm text-muted-foreground">
                {group.currency} · {group.members?.length || 0} members
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Summary Bar */}
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Expenses</p>
                <p className="text-2xl font-display font-bold text-foreground">{sym}{totalExpenses.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {/* Desktop only: Add Expense */}
                <div className="hidden md:block">
                  <AddExpenseDialog groupId={groupId!} members={group.members || []} sym={sym} />
                </div>
                <AddMemberDialog groupId={groupId!} />
                <SettleUpDialog groupId={groupId!} simplified={simplified} sym={sym} userId={user?.id || ''} members={group.members || []} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity / Insights Toggle */}
        <div className="flex gap-1 mb-4 bg-secondary rounded-lg p-1 w-fit">
          <button
            type="button"
            onClick={() => setView('activity')}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              view === 'activity' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Activity
          </button>
          <button
            type="button"
            onClick={() => setView('insights')}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              view === 'insights' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Insights
          </button>
        </div>

        {/* Activity Panel */}
        {view === 'activity' && (
          <Tabs defaultValue="balances" className="space-y-4">
            <TabsList className="bg-secondary">
              <TabsTrigger value="balances">Balances</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="settlements">Settlements</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
            </TabsList>

            {/* Balances Tab */}
            <TabsContent value="balances">
              <div className="grid gap-3">
                {balances.length === 0 ? (
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No balances yet. Add an expense to get started.
                    </CardContent>
                  </Card>
                ) : (
                  balances.map((b, i) => (
                    <motion.div key={b.userId} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <Card className="border-0 shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                              b.balance > 0 ? 'bg-success/10 text-success' : b.balance < 0 ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground'
                            }`}>
                              {b.userName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground">{b.userName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {b.balance > 0 ? (
                              <TrendingUp className="w-4 h-4 text-success" />
                            ) : b.balance < 0 ? (
                              <TrendingDown className="w-4 h-4 text-destructive" />
                            ) : null}
                            <span className={`font-display font-bold ${
                              b.balance > 0 ? 'text-success' : b.balance < 0 ? 'text-destructive' : 'text-muted-foreground'
                            }`}>
                              {b.balance > 0 ? '+' : ''}{sym}{Math.abs(b.balance).toFixed(2)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}

                {simplified.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Suggested Settlements</h3>
                    {simplified.map((s, i) => (
                      <Card key={i} className="border-0 shadow-sm mb-2">
                        <CardContent className="p-4 flex items-center gap-3 text-sm">
                          <span className="font-medium text-foreground">{s.fromName}</span>
                          <ArrowRightLeft className="w-4 h-4 text-primary" />
                          <span className="font-medium text-foreground">{s.toName}</span>
                          <span className="ml-auto font-display font-bold text-primary">{sym}{s.amount.toFixed(2)}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses">
              <div className="space-y-3">
                {expenses.length === 0 ? (
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <Receipt className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
                      No expenses yet
                    </CardContent>
                  </Card>
                ) : (
                  expenses.map((exp, i) => (
                    <motion.div key={exp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <ExpenseCard expense={exp} sym={sym} groupId={groupId!} userId={user?.id || ''} />
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Settlements Tab */}
            <TabsContent value="settlements">
              <div className="space-y-3">
                {settlements.length === 0 ? (
                  <Card className="border-0 shadow-md">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      No settlements recorded yet
                    </CardContent>
                  </Card>
                ) : (
                  settlements.map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                      <SettlementCard settlement={s} sym={sym} userId={user?.id || ''} groupId={groupId!} />
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members">
              <div className="space-y-3">
                {(group.members || []).map((m, i) => (
                  <motion.div key={m.userId} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <MemberCard member={m} groupId={groupId!} isAdmin={group.members?.find(mem => mem.userId === user?.id)?.role === 'admin'} currentUserId={user?.id || ''} />
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Insights Panel */}
        {view === 'insights' && (
          <div className="space-y-6">
            {expenses.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Receipt className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
                  No expenses yet to analyze
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Category Breakdown */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-display">Spending by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {categoryData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${sym}${value.toFixed(2)}`, 'Amount']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 mt-2 justify-center">
                      {categoryData.map((cat, i) => (
                        <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          <span className="text-muted-foreground">{cat.name}</span>
                          <span className="font-medium text-foreground">{sym}{cat.value.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Expense Timeline */}
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-display">Expense Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timeseriesData}>
                          <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                          <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" tickFormatter={(v) => `${sym}${v}`} />
                          <Tooltip formatter={(value: number) => [`${sym}${value.toFixed(2)}`, 'Amount']} />
                          <Area type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorAmount)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </main>

      {/* Mobile FAB for Add Expense */}
      <button
        type="button"
        className="md:hidden fixed bottom-6 right-6 w-14 h-14 rounded-full gradient-primary text-primary-foreground shadow-lg z-50 flex items-center justify-center active:scale-95 transition-transform"
        onClick={() => setExpenseDialogOpen(true)}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Mobile: headless AddExpenseDialog (no trigger, controlled by FAB) */}
      <div className="md:hidden">
        <AddExpenseDialog groupId={groupId!} members={group.members || []} sym={sym} open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen} />
      </div>
    </div>
  );
}

// --- Sub-components ---

type WizardSplitType = 'equal_all' | 'equal_selected' | 'percentage' | 'custom';

const SPLIT_OPTIONS: { value: WizardSplitType; label: string; description: string; icon: any }[] = [
  { value: 'equal_all', label: 'Equal - everyone', description: 'Split equally among all members', icon: Users },
  { value: 'equal_selected', label: 'Equal - selected', description: 'Split among chosen members only', icon: UserPlus },
  { value: 'percentage', label: 'By percentage', description: 'Enter a % for each member', icon: TrendingUp },
  { value: 'custom', label: 'By amount', description: 'Enter exact amounts per member', icon: Receipt },
];

function AddExpenseDialog({ groupId, members, sym, open: controlledOpen, onOpenChange }: { groupId: string; members: any[]; sym: string; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const queryClient = useQueryClient();

  // Step tracking
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date>(new Date());

  // Step 2: Split Type
  const [wizardSplitType, setWizardSplitType] = useState<WizardSplitType>('equal_all');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [percentageSplits, setPercentageSplits] = useState<Record<string, string>>({});
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  // Step 3: Additional Info
  const [paidBy, setPaidBy] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setStep(1);
      setDirection(1);
      setTitle('');
      setAmount('');
      setDate(new Date());
      setWizardSplitType('equal_all');
      setSelectedMembers(new Set());
      setPercentageSplits({});
      setCustomSplits({});
      setPaidBy('');
      setCategory('');
      setNote('');
    }
  };

  const goNext = () => { setDirection(1); setStep((s) => Math.min(s + 1, 3)); };
  const goBack = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 1)); };

  const isStepValid = (s: number): boolean => {
    if (s === 1) return title.trim().length > 0 && parseFloat(amount) > 0;
    if (s === 2) {
      switch (wizardSplitType) {
        case 'equal_all': return true;
        case 'equal_selected': return selectedMembers.size > 0;
        case 'percentage': {
          const total = Object.values(percentageSplits).reduce((sum, p) => sum + (parseFloat(p) || 0), 0);
          return Math.abs(total - 100) < 0.01;
        }
        case 'custom': {
          const amt = parseFloat(amount) || 0;
          const total = Object.values(customSplits).reduce((sum, a) => sum + (parseFloat(a) || 0), 0);
          return amt > 0 && Math.abs(total - amt) < 0.01;
        }
      }
    }
    if (s === 3) return paidBy.length > 0;
    return false;
  };

  const mutation = useMutation({
    mutationFn: (data: CreateExpenseRequest) => api.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['simplified', groupId] });
      handleOpenChange(false);
      toast.success('Expense added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add expense');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    let splits: { userId: string; amount: number; percentage?: number }[] = [];
    let apiSplitMethod: 'equal' | 'percentage' | 'custom';

    switch (wizardSplitType) {
      case 'equal_all': {
        apiSplitMethod = 'equal';
        const perPerson = parseFloat((amt / members.length).toFixed(2));
        splits = members.map((m) => ({ userId: m.userId, amount: perPerson }));
        break;
      }
      case 'equal_selected': {
        apiSplitMethod = 'equal';
        const selected = members.filter((m) => selectedMembers.has(m.userId));
        const perPerson = parseFloat((amt / selected.length).toFixed(2));
        splits = selected.map((m) => ({ userId: m.userId, amount: perPerson }));
        break;
      }
      case 'percentage': {
        apiSplitMethod = 'percentage';
        splits = members
          .map((m) => {
            const pct = parseFloat(percentageSplits[m.userId] || '0');
            return { userId: m.userId, amount: parseFloat(((amt * pct) / 100).toFixed(2)), percentage: pct };
          })
          .filter((s) => s.percentage > 0);
        break;
      }
      case 'custom': {
        apiSplitMethod = 'custom';
        splits = members
          .map((m) => ({ userId: m.userId, amount: parseFloat(customSplits[m.userId] || '0') }))
          .filter((s) => s.amount > 0);
        break;
      }
    }

    mutation.mutate({
      groupId,
      title,
      amount: amt,
      paidBy,
      splitMethod: apiSplitMethod,
      category: category || undefined,
      note: note || undefined,
      date: date.toISOString(),
      splits,
    } as any);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  const pctTotal = Object.values(percentageSplits).reduce((sum, p) => sum + (parseFloat(p) || 0), 0);
  const customTotal = Object.values(customSplits).reduce((sum, a) => sum + (parseFloat(a) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button size="sm" className="gradient-primary text-primary-foreground">
            <Plus className="w-4 h-4 mr-1" /> Add Expense
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Add Expense</DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                s < step ? 'bg-primary text-primary-foreground'
                  : s === step ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
              )}>
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div className={cn(
                  'w-8 h-0.5 rounded-full transition-colors',
                  s < step ? 'bg-primary' : 'bg-secondary'
                )} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="overflow-hidden min-h-[280px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {/* Step 1: Basic Info */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input placeholder="Dinner" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Amount ({sym})</Label>
                      <Input type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(date, 'PPP')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}

                {/* Step 2: Split Type */}
                {step === 2 && (
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold">How do you want to split?</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {SPLIT_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = wizardSplitType === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setWizardSplitType(opt.value)}
                            className={cn(
                              'flex flex-col items-start gap-1.5 p-3 rounded-lg border-2 text-left transition-all',
                              isSelected
                                ? 'border-primary bg-accent shadow-sm'
                                : 'border-border bg-card hover:border-primary/40 hover:bg-accent/50'
                            )}
                          >
                            <Icon className={cn('w-5 h-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                            <span className="text-sm font-medium text-foreground">{opt.label}</span>
                            <span className="text-xs text-muted-foreground leading-tight">{opt.description}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Equal selected: member checkboxes */}
                    {wizardSplitType === 'equal_selected' && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        <div className="flex items-center justify-between">
                          <Label>Select members</Label>
                          <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={() => {
                              if (selectedMembers.size === members.length) {
                                setSelectedMembers(new Set());
                              } else {
                                setSelectedMembers(new Set(members.map((m: any) => m.userId)));
                              }
                            }}
                          >
                            {selectedMembers.size === members.length ? 'Deselect all' : 'Select all'}
                          </button>
                        </div>
                        {members.map((m) => (
                          <label key={m.userId} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 cursor-pointer">
                            <Checkbox
                              checked={selectedMembers.has(m.userId)}
                              onCheckedChange={(checked) => {
                                const next = new Set(selectedMembers);
                                if (checked) next.add(m.userId); else next.delete(m.userId);
                                setSelectedMembers(next);
                              }}
                            />
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-semibold">
                                {m.user.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-foreground">{m.user.name}</span>
                              {m.isGuest && <span className="text-xs text-warning">(Guest)</span>}
                            </div>
                          </label>
                        ))}
                        <p className="text-xs text-muted-foreground">
                          {selectedMembers.size} of {members.length} selected
                          {amount && selectedMembers.size > 0 && ` · ${sym}${(parseFloat(amount) / selectedMembers.size).toFixed(2)} each`}
                        </p>
                      </div>
                    )}

                    {/* Percentage split inputs */}
                    {wizardSplitType === 'percentage' && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        <Label>Percentage for each member</Label>
                        {members.map((m) => (
                          <div key={m.userId} className="flex items-center gap-2">
                            <span className="text-sm flex-1 text-foreground">{m.user.name}{m.isGuest ? <span className="text-warning text-xs ml-1">(Guest)</span> : ''}</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={percentageSplits[m.userId] || ''}
                              onChange={(e) => setPercentageSplits({ ...percentageSplits, [m.userId]: e.target.value })}
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                        ))}
                        <p className={cn('text-xs', Math.abs(pctTotal - 100) < 0.01 ? 'text-muted-foreground' : 'text-destructive')}>
                          Total: {pctTotal.toFixed(2)}%
                        </p>
                      </div>
                    )}

                    {/* Custom amount split inputs */}
                    {wizardSplitType === 'custom' && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        <Label>Amount for each member</Label>
                        {members.map((m) => (
                          <div key={m.userId} className="flex items-center gap-2">
                            <span className="text-sm flex-1 text-foreground">{m.user.name}{m.isGuest ? <span className="text-warning text-xs ml-1">(Guest)</span> : ''}</span>
                            <span className="text-sm text-muted-foreground">{sym}</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={customSplits[m.userId] || ''}
                              onChange={(e) => setCustomSplits({ ...customSplits, [m.userId]: e.target.value })}
                              className="w-28"
                            />
                          </div>
                        ))}
                        <p className={cn('text-xs', amount && Math.abs(customTotal - parseFloat(amount)) < 0.01 ? 'text-muted-foreground' : 'text-destructive')}>
                          Total: {sym}{customTotal.toFixed(2)}
                          {amount && ` / ${sym}${parseFloat(amount).toFixed(2)}`}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Additional Info */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Paid by</Label>
                      <Select value={paidBy} onValueChange={setPaidBy}>
                        <SelectTrigger><SelectValue placeholder="Who paid?" /></SelectTrigger>
                        <SelectContent>
                          {members.map((m) => (
                            <SelectItem key={m.userId} value={m.userId}>{m.user.name}{m.isGuest ? ' (Guest)' : ''}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category (optional)</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Note (optional)</Label>
                      <Input placeholder="Add a note..." value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation footer */}
          <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
            {step > 1 ? (
              <Button type="button" variant="outline" size="sm" onClick={goBack}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <Button type="button" size="sm" className="gradient-primary text-primary-foreground" onClick={goNext} disabled={!isStepValid(step)}>
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button type="submit" size="sm" className="gradient-primary text-primary-foreground" disabled={mutation.isPending || !paidBy}>
                {mutation.isPending ? 'Adding...' : 'Add Expense'}
              </Button>
            )}
          </div>

          {mutation.isError && (
            <p className="text-sm text-destructive mt-2">{(mutation.error as Error).message}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberDialog({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => api.addMember(groupId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      setOpen(false);
      setEmail('');
      toast.success('Member added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add member');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="w-4 h-4 mr-1" /> Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Add Member</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
          className="space-y-4 mt-2"
        >
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="friend@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={mutation.isPending}>
            {mutation.isPending ? 'Adding...' : 'Add Member'}
          </Button>
          {mutation.isError && (
            <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SettleUpDialog({
  groupId,
  simplified,
  sym,
  userId,
  members,
}: {
  groupId: string;
  simplified: any[];
  sym: string;
  userId: string;
  members: any[];
}) {
  const [open, setOpen] = useState(false);
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: RecordSettlementRequest) => api.recordSettlement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['simplified', groupId] });
      setOpen(false);
      setAmount(''); setNote(''); setFromUserId(''); setToUserId('');
      toast.success('Settlement recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to record settlement');
    },
  });

  const handleQuickSettle = (s: any) => {
    setFromUserId(s.from);
    setToUserId(s.to);
    setAmount(s.amount.toFixed(2));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ArrowRightLeft className="w-4 h-4 mr-1" /> Settle Up
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Record Settlement</DialogTitle>
        </DialogHeader>

        {simplified.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Quick settle</p>
            {simplified.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleQuickSettle(s)}
                className="w-full text-left p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors mb-1.5 text-sm"
              >
                <span className="font-medium text-foreground">{s.fromName}</span>
                <span className="text-muted-foreground"> pays </span>
                <span className="font-medium text-foreground">{s.toName}</span>
                <span className="float-right font-display font-bold text-primary">{sym}{s.amount.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate({ groupId, fromUserId, toUserId, amount: parseFloat(amount), note: note || undefined });
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>From (who paid)</Label>
            <Select value={fromUserId} onValueChange={setFromUserId}>
              <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>{m.user.name}{m.isGuest ? ' (Guest)' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>To (who received)</Label>
            <Select value={toUserId} onValueChange={setToUserId}>
              <SelectTrigger><SelectValue placeholder="Select member" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>{m.user.name}{m.isGuest ? ' (Guest)' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Amount ({sym})</Label>
            <Input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Input placeholder="Cash payment" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={mutation.isPending || !fromUserId || !toUserId}>
            {mutation.isPending ? 'Recording...' : 'Record Settlement'}
          </Button>
          {mutation.isError && (
            <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SettlementCard({ settlement: s, sym, userId, groupId }: { settlement: any; sym: string; userId: string; groupId: string }) {
  const queryClient = useQueryClient();

  const confirmMutation = useMutation({
    mutationFn: () => api.confirmSettlement(s.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
      toast.success('Settlement confirmed');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to confirm settlement');
    },
  });

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">
              {s.fromUserName || s.fromUserId} → {s.toUserName || s.toUserId}
            </p>
            {s.note && <p className="text-xs text-muted-foreground mt-0.5">{s.note}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-foreground">{sym}{s.amount.toFixed(2)}</span>
            {s.status === 'confirmed' ? (
              <Badge className="bg-success/10 text-success border-0">
                <CheckCircle className="w-3 h-3 mr-1" /> Confirmed
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="w-3 h-3 mr-1" /> Pending
              </Badge>
            )}
          </div>
        </div>
        {s.status === 'pending' && s.toUserId === userId && (
          <Button
            size="sm"
            className="mt-3 gradient-primary text-primary-foreground"
            onClick={() => confirmMutation.mutate()}
            disabled={confirmMutation.isPending}
          >
            <CheckCircle className="w-4 h-4 mr-1" /> Confirm Payment
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function MemberCard({ member: m, groupId, isAdmin, currentUserId }: { member: any; groupId: string; isAdmin: boolean; currentUserId: string }) {
  const queryClient = useQueryClient();
  const [removeOpen, setRemoveOpen] = useState(false);

  const removeMutation = useMutation({
    mutationFn: () => api.removeMember(groupId, m.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      setRemoveOpen(false);
      toast.success('Member removed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove member');
    },
  });

  const canRemove = isAdmin && m.userId !== currentUserId;

  return (
    <Card className="border-0 shadow-sm group/member">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${m.isGuest ? 'bg-warning/10 text-warning' : 'bg-accent text-accent-foreground'}`}>
            {m.user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-medium text-foreground">{m.user.name}</span>
            <p className="text-xs text-muted-foreground">{m.user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {m.isGuest && <Badge variant="outline" className="text-warning border-warning/30">Guest</Badge>}
          <Badge variant={m.role === 'admin' ? 'default' : 'secondary'}>{m.role}</Badge>
          {canRemove && (
            <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover/member:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Remove Member</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to remove {m.user.name} from this group?
                </p>
                <div className="flex gap-3 justify-end mt-4">
                  <Button variant="outline" onClick={() => setRemoveOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => removeMutation.mutate()}
                    disabled={removeMutation.isPending}
                  >
                    {removeMutation.isPending ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
                {removeMutation.isError && (
                  <p className="text-sm text-destructive">{(removeMutation.error as Error).message}</p>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ExpenseCard({ expense: exp, sym, groupId, userId }: { expense: any; sym: string; groupId: string; userId: string }) {
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editDate, setEditDate] = useState<Date>(new Date());

  const { data: expenseDetail } = useQuery({
    queryKey: ['expense', exp.id],
    queryFn: () => api.getExpense(exp.id),
    enabled: detailOpen,
  });

  const startEditing = () => {
    if (expenseDetail) {
      setEditTitle(expenseDetail.title);
      setEditAmount(expenseDetail.amount.toString());
      setEditCategory(expenseDetail.category || '');
      setEditNote(expenseDetail.note || '');
      setEditDate(expenseDetail.date ? new Date(expenseDetail.date) : new Date());
    }
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const updateMutation = useMutation({
    mutationFn: (data: { title?: string; amount?: number; category?: string; note?: string; date?: string }) =>
      api.updateExpense(exp.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['simplified', groupId] });
      queryClient.invalidateQueries({ queryKey: ['expense', exp.id] });
      setEditing(false);
      toast.success('Expense updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update expense');
    },
  });

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      title: editTitle,
      amount: parseFloat(editAmount),
      category: editCategory || undefined,
      note: editNote || undefined,
      date: editDate.toISOString(),
    });
  };

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteExpense(exp.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['simplified', groupId] });
      setDeleteOpen(false);
      toast.success('Expense deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete expense');
    },
  });

  return (
    <>
      <Card className="border-0 shadow-sm group/card hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailOpen(true)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-foreground">{exp.title}</h4>
              <p className="text-sm text-muted-foreground mt-0.5">
                Paid by {exp.paidByName || 'Unknown'} · {exp.splitMethod} split
              </p>
              {exp.category && (
                <Badge variant="secondary" className="mt-1.5 text-xs">{exp.category}</Badge>
              )}
              {exp.note && (
                <p className="text-xs text-muted-foreground mt-1.5 italic">"{exp.note}"</p>
              )}
            </div>
            <div className="flex items-start gap-2">
              <span className="font-display font-bold text-foreground text-lg">
                {sym}{exp.amount.toFixed(2)}
              </span>
              <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover/card:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </DialogTrigger>
                <DialogContent onClick={(e) => e.stopPropagation()}>
                  <DialogHeader>
                    <DialogTitle className="font-display">Delete Expense</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete "{exp.title}"? This will recalculate all balances.
                  </p>
                  <div className="flex gap-3 justify-end mt-4">
                    <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteMutation.mutate()}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                  {deleteMutation.isError && (
                    <p className="text-sm text-destructive">{(deleteMutation.error as Error).message}</p>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) setEditing(false); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-display">{editing ? 'Edit Expense' : 'Expense Details'}</DialogTitle>
              {!editing && expenseDetail && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={startEditing}>
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Edit Mode */}
          {editing && expenseDetail ? (
            <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Amount ({sym})</Label>
                <Input type="number" step="0.01" min="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(editDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={editDate} onSelect={(d) => d && setEditDate(d)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Category (optional)</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Input placeholder="Add a note..." value={editNote} onChange={(e) => setEditNote(e.target.value)} />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={cancelEditing}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-primary text-primary-foreground" disabled={updateMutation.isPending || !editTitle.trim() || !parseFloat(editAmount)}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
              {updateMutation.isError && (
                <p className="text-sm text-destructive">{(updateMutation.error as Error).message}</p>
              )}
            </form>
          ) : expenseDetail ? (
            /* View Mode */
            <div className="space-y-4 mt-2">
              <div>
                <h3 className="font-semibold text-lg text-foreground">{expenseDetail.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-display font-bold text-2xl text-primary">
                    {sym}{expenseDetail.amount.toFixed(2)}
                  </span>
                  {expenseDetail.category && (
                    <Badge variant="secondary">{expenseDetail.category}</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid by</span>
                  <span className="font-medium text-foreground">{expenseDetail.paidByName || 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Split method</span>
                  <span className="font-medium text-foreground capitalize">{expenseDetail.splitMethod}</span>
                </div>
                {expenseDetail.date && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium text-foreground">
                      {new Date(expenseDetail.date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {expenseDetail.note && (
                <div className="p-3 bg-accent rounded-lg">
                  <p className="text-sm text-muted-foreground">Note</p>
                  <p className="text-sm text-foreground mt-1">{expenseDetail.note}</p>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-sm text-foreground mb-2">Split Details</h4>
                <div className="space-y-2">
                  {expenseDetail.splits?.map((split: any) => (
                    <div key={split.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded-md">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-semibold">
                          {split.userName?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="text-sm font-medium text-foreground">{split.userName || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {split.percentage && (
                          <span className="text-xs text-muted-foreground">{split.percentage}%</span>
                        )}
                        <span className="text-sm font-semibold text-foreground">
                          {sym}{split.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
