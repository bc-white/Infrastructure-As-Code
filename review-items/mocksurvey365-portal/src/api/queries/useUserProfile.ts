import { useMutation, useQuery, useQueryClient, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import * as userService from '../services/userProfile';
import type { Profile, ProfileUpdatePayload } from '../services/userProfile';

// Query keys for user-related queries
export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};

// Get user profile
export const useUserProfile = (
  options?: Omit<UseQueryOptions<Profile>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: userService.getProfile,
    ...options,
  });
};

// Update user profile
export const useUpdateUserProfile = (
  options?: Omit<UseMutationOptions<Profile, Error, ProfileUpdatePayload>, 'mutationFn'>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: () => {
      // Invalidate and refetch user profile after successful update
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
    ...options,
  });
};
