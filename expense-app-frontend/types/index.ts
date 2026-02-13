export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Group {
  id: string;
  name: string;
  currency: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  members: GroupMember[];
  _count?: {
    expenses: number;
  };
}

export interface GroupMember {
  groupId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  isGuest: boolean;
  guestEmail?: string;
  user?: User;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  paidBy: string;
  splitMethod: 'equal' | 'percentage' | 'custom';
  category?: string;
  note?: string;
  date: string;
  createdAt: string;
  payer: User;
  splits: ExpenseSplit[];
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  percentage?: number;
}

export interface Balance {
  userId: string;
  name: string;
  email: string;
  balance: number;
  status: 'owed' | 'owes' | 'settled';
}

export interface GroupBalances {
  groupId: string;
  balances: Balance[];
  totalExpenses: number;
  expenseCount: number;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  note?: string;
  status: 'pending' | 'confirmed';
  recordedBy: string;
  recordedAt: string;
  confirmedAt?: string;
  fromUser: User;
  toUser: User;
}

export interface SimplifiedSettlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export interface SimplifiedSettlementsResponse {
  groupId: string;
  simplifiedSettlements: SimplifiedSettlement[];
  totalTransactions: number;
  detailedBalances: Balance[];
}

export interface CreateExpenseData {
  groupId: string;
  title?: string;
  amount: number;
  paidBy: string;
  splitMethod: 'equal' | 'percentage' | 'custom';
  category?: string;
  note?: string;
  date?: string;
  splits: {
    userId: string;
    amount?: number;
    percentage?: number;
  }[];
}

export interface CreateGroupData {
  name: string;
  currency: string;
}

export interface RecordSettlementData {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  note?: string;
}
