'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import authService from '@/lib/auth';
import { useGroup } from '@/hooks/useGroups';
import { useBalances, useCreateExpense } from '@/hooks/useExpenses';
import { ArrowLeft, Users, DollarSign, Plus, X } from 'lucide-react';

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Expense form state
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const { data: group, isLoading: groupLoading } = useGroup(groupId);
  const { data: balances, isLoading: balancesLoading } = useBalances(groupId);
  const createExpense = useCreateExpense();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }
    setUser(authService.getUser());
  }, [router]);

  useEffect(() => {
    if (group && user) {
      // Set default paidBy to current user
      setPaidBy(user.id);
      // Select all members by default
      const allMemberIds = group.members?.map(m => m.userId) || [];
      setSelectedMembers(allMemberIds);
    }
  }, [group, user]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !paidBy || selectedMembers.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const splits = selectedMembers.map(userId => ({ userId }));

      await createExpense.mutateAsync({
        groupId,
        amount: parseFloat(amount),
        paidBy,
        splitMethod: 'equal',
        title: title || 'Expense',
        category: category || undefined,
        splits
      });

      // Reset form
      setAmount('');
      setTitle('');
      setCategory('');
      setShowExpenseModal(false);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create expense');
    }
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  if (!user) return null;

  if (groupLoading || balancesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Group not found</h2>
          <button onClick={() => router.push('/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
                <p className="text-sm text-gray-600">
                  {group.members?.length || 0} members • {group.currency}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Add Expense
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balances Section */}
          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Current Balances</h2>

              {balances && balances.balances.length > 0 ? (
                <div className="space-y-3">
                  {balances.balances.map((balance) => (
                    <div
                      key={balance.userId}
                      className="flex items-center justify-between p-4 rounded-lg"
                      style={{
                        backgroundColor: balance.balance > 0
                          ? 'rgba(16, 185, 129, 0.1)'
                          : balance.balance < 0
                          ? 'rgba(239, 68, 68, 0.1)'
                          : 'var(--gray-100)'
                      }}
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{balance.name}</p>
                        <p className="text-sm text-gray-600">{balance.email}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-lg font-bold"
                          style={{
                            color: balance.balance > 0
                              ? 'var(--success)'
                              : balance.balance < 0
                              ? 'var(--error)'
                              : 'var(--gray-600)'
                          }}
                        >
                          {balance.balance > 0 ? '+' : ''}{balance.balance.toFixed(2)} {group.currency}
                        </p>
                        <p className="text-sm text-gray-600">
                          {balance.status === 'owed' && 'is owed'}
                          {balance.status === 'owes' && 'owes'}
                          {balance.status === 'settled' && 'settled up'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No expenses yet. Add your first expense to get started!
                </div>
              )}

              {balances && (
                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between text-sm text-gray-600">
                  <span>Total Expenses: {balances.expenseCount}</span>
                  <span className="font-semibold">
                    {balances.totalExpenses.toFixed(2)} {group.currency}
                  </span>
                </div>
              )}
            </div>

            {/* Expenses List */}
            <div className="card mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Expenses</h2>
              <div className="text-center py-8 text-gray-500">
                <DollarSign size={48} className="mx-auto mb-2 opacity-30" />
                <p>Expense history coming soon</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Members Card */}
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Members</h2>
              <div className="space-y-3">
                {group.members?.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.user?.name || member.guestEmail || 'Guest'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {member.role === 'admin' ? 'Admin' : 'Member'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full btn-secondary text-sm">
                Add Member
              </button>
            </div>

            {/* Quick Stats */}
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Group Stats</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Members</span>
                  <span className="font-semibold text-gray-900">
                    {group.members?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Expenses</span>
                  <span className="font-semibold text-gray-900">
                    {balances?.expenseCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-semibold text-gray-900">
                    {balances?.totalExpenses.toFixed(2) || '0.00'} {group.currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowExpenseModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Quick Add Expense</h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              {/* Amount - Most Important */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                    {group.currency === 'USD' && '$'}
                    {group.currency === 'EUR' && '€'}
                    {group.currency === 'GBP' && '£'}
                    {group.currency === 'INR' && '₹'}
                    {group.currency === 'AUD' && 'A$'}
                    {group.currency === 'CAD' && 'C$'}
                  </span>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    required
                    className="input pl-8"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {/* Paid By */}
              <div>
                <label htmlFor="paidBy" className="block text-sm font-medium text-gray-700 mb-1">
                  Paid by <span className="text-red-500">*</span>
                </label>
                <select
                  id="paidBy"
                  className="input"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  required
                >
                  <option value="">Select person</option>
                  {group.members?.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.user?.name || member.guestEmail || 'Guest'}
                      {member.userId === user.id && ' (You)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Split With */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Split with <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {group.members?.map((member) => (
                    <label
                      key={member.userId}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.userId)}
                        onChange={() => toggleMember(member.userId)}
                        className="w-4 h-4 rounded border-gray-300"
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      <span className="text-gray-900">
                        {member.user?.name || member.guestEmail || 'Guest'}
                        {member.userId === user.id && ' (You)'}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Split equally among {selectedMembers.length} {selectedMembers.length === 1 ? 'person' : 'people'}
                </p>
              </div>

              {/* Optional Fields */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <input
                  id="title"
                  type="text"
                  className="input"
                  placeholder="Dinner, Gas, etc."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category (optional)
                </label>
                <select
                  id="category"
                  className="input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Select category</option>
                  <option value="food">Food & Dining</option>
                  <option value="transport">Transportation</option>
                  <option value="accommodation">Accommodation</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="shopping">Shopping</option>
                  <option value="utilities">Utilities</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createExpense.isPending || !amount || !paidBy || selectedMembers.length === 0}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {createExpense.isPending ? 'Adding...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
