import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Settlement, SimplifiedSettlementsResponse, RecordSettlementData } from '@/types';

export function useSimplifiedSettlements(groupId: string) {
  return useQuery({
    queryKey: ['simplified-settlements', groupId],
    queryFn: async () => {
      const response = await api.get<SimplifiedSettlementsResponse>(
        `/api/settlements/group/${groupId}/simplified`
      );
      return response.data;
    },
    enabled: !!groupId,
  });
}

export function useSettlements(groupId: string) {
  return useQuery({
    queryKey: ['settlements', groupId],
    queryFn: async () => {
      const response = await api.get<Settlement[]>(`/api/settlements/group/${groupId}`);
      return response.data;
    },
    enabled: !!groupId,
  });
}

export function useRecordSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RecordSettlementData) => {
      const response = await api.post<Settlement>('/api/settlements', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settlements', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['simplified-settlements', variables.groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', variables.groupId] });
    },
  });
}

export function useConfirmSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settlementId: string) => {
      const response = await api.patch<Settlement>(`/api/settlements/${settlementId}/confirm`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settlements', data.groupId] });
      queryClient.invalidateQueries({ queryKey: ['simplified-settlements', data.groupId] });
      queryClient.invalidateQueries({ queryKey: ['balances', data.groupId] });
    },
  });
}
