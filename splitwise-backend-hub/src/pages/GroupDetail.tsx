import { useState } from 'react';
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
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowLeft, Plus, UserPlus, Receipt, ArrowRightLeft, Users,
  TrendingUp, TrendingDown, CheckCircle, Clock, Trash2, Calendar as CalendarIcon,
} from 'lucide-react';
import type { CreateExpenseRequest, RecordSettlementRequest } from '@/types/api';

const CATEGORIES = ['Food', 'Transport', 'Accommodation', 'Utilities', 'Entertainment', 'Groceries', 'Other'];

const currencySymbol: Record<string, string> = {
  USD: '$', EUR: '€', GBP: '£', LKR: 'Rs', INR: '₹',
};

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">{group.name}</h1>
              <p className="text-sm text-muted-foreground">
                {group.currency} · {group.members?.length || 0} members
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Quick Actions */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <AddExpenseDialog groupId={groupId!} members={group.members || []} sym={sym} />
          <AddMemberDialog groupId={groupId!} />
          <SettleUpDialog groupId={groupId!} simplified={simplified} sym={sym} userId={user?.id || ''} members={group.members || []} />
        </div>

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
                <motion.div key={m.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <MemberCard member={m} groupId={groupId!} isAdmin={group.members?.find(mem => mem.userId === user?.id)?.role === 'admin'} currentUserId={user?.id || ''} />
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// --- Sub-components ---

function AddExpenseDialog({ groupId, members, sym }: { groupId: string; members: any[]; sym: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitMethod, setSplitMethod] = useState<'equal' | 'percentage' | 'custom'>('equal');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [percentageSplits, setPercentageSplits] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: CreateExpenseRequest) => api.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['simplified', groupId] });
      setOpen(false);
      setTitle(''); setAmount(''); setCategory(''); setNote('');
      setCustomSplits({}); setPercentageSplits({});
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

    if (splitMethod === 'equal') {
      splits = members.map((m) => ({
        userId: m.userId,
        amount: parseFloat((amt / members.length).toFixed(2)),
      }));
    } else if (splitMethod === 'percentage') {
      const totalPercentage = Object.values(percentageSplits).reduce((sum, p) => sum + (parseFloat(p) || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        alert('Percentages must sum to 100%');
        return;
      }
      splits = members.map((m) => {
        const percentage = parseFloat(percentageSplits[m.userId] || '0');
        return {
          userId: m.userId,
          amount: parseFloat(((amt * percentage) / 100).toFixed(2)),
          percentage,
        };
      }).filter(s => s.percentage > 0);
    } else if (splitMethod === 'custom') {
      const totalCustom = Object.values(customSplits).reduce((sum, a) => sum + (parseFloat(a) || 0), 0);
      if (Math.abs(totalCustom - amt) > 0.01) {
        alert(`Custom amounts must sum to ${sym}${amt.toFixed(2)}`);
        return;
      }
      splits = members.map((m) => ({
        userId: m.userId,
        amount: parseFloat(customSplits[m.userId] || '0'),
      })).filter(s => s.amount > 0);
    }

    mutation.mutate({
      groupId,
      title,
      amount: amt,
      paidBy,
      splitMethod,
      category: category || undefined,
      note: note || undefined,
      date: date.toISOString(),
      splits,
    } as any);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Add Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="Dinner" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Amount ({sym})</Label>
            <Input type="number" step="0.01" min="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Paid by</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger><SelectValue placeholder="Who paid?" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.userId} value={m.userId}>{m.userName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Split method</Label>
            <Select value={splitMethod} onValueChange={(v: any) => setSplitMethod(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">Equal</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {splitMethod === 'percentage' && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <Label>Percentage for each member</Label>
              {members.map((m) => (
                <div key={m.userId} className="flex items-center gap-2">
                  <span className="text-sm flex-1 text-foreground">{m.userName}</span>
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
              <p className="text-xs text-muted-foreground">
                Total: {Object.values(percentageSplits).reduce((sum, p) => sum + (parseFloat(p) || 0), 0).toFixed(2)}%
              </p>
            </div>
          )}

          {splitMethod === 'custom' && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              <Label>Amount for each member</Label>
              {members.map((m) => (
                <div key={m.userId} className="flex items-center gap-2">
                  <span className="text-sm flex-1 text-foreground">{m.userName}</span>
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
              <p className="text-xs text-muted-foreground">
                Total: {sym}{Object.values(customSplits).reduce((sum, a) => sum + (parseFloat(a) || 0), 0).toFixed(2)}
                {amount && ` / ${sym}${parseFloat(amount).toFixed(2)}`}
              </p>
            </div>
          )}

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
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Input placeholder="Add a note..." value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={mutation.isPending || !paidBy}>
            {mutation.isPending ? 'Adding...' : 'Add Expense'}
          </Button>
          {mutation.isError && (
            <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
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
                  <SelectItem key={m.userId} value={m.userId}>{m.userName}</SelectItem>
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
                  <SelectItem key={m.userId} value={m.userId}>{m.userName}</SelectItem>
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
    mutationFn: () => api.removeMember(groupId, m.id),
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
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-sm font-semibold text-accent-foreground">
            {m.userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="font-medium text-foreground">{m.userName}</span>
            <p className="text-xs text-muted-foreground">{m.userEmail}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
                  Are you sure you want to remove {m.userName} from this group?
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

  const { data: expenseDetail } = useQuery({
    queryKey: ['expense', exp.id],
    queryFn: () => api.getExpense(exp.id),
    enabled: detailOpen,
  });

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
              {exp.paidBy === userId && (
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
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Expense Details</DialogTitle>
          </DialogHeader>
          {expenseDetail ? (
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
