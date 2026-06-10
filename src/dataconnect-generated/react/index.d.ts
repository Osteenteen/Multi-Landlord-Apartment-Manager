import { ListPlaceholdersData, InsertPlaceholderData, InsertPlaceholderVariables, UpdatePlaceholderData, UpdatePlaceholderVariables, DeletePlaceholderData, DeletePlaceholderVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useListPlaceholders(options?: useDataConnectQueryOptions<ListPlaceholdersData>): UseDataConnectQueryResult<ListPlaceholdersData, undefined>;
export function useListPlaceholders(dc: DataConnect, options?: useDataConnectQueryOptions<ListPlaceholdersData>): UseDataConnectQueryResult<ListPlaceholdersData, undefined>;

export function useInsertPlaceholder(options?: useDataConnectMutationOptions<InsertPlaceholderData, FirebaseError, InsertPlaceholderVariables | void>): UseDataConnectMutationResult<InsertPlaceholderData, InsertPlaceholderVariables>;
export function useInsertPlaceholder(dc: DataConnect, options?: useDataConnectMutationOptions<InsertPlaceholderData, FirebaseError, InsertPlaceholderVariables | void>): UseDataConnectMutationResult<InsertPlaceholderData, InsertPlaceholderVariables>;

export function useUpdatePlaceholder(options?: useDataConnectMutationOptions<UpdatePlaceholderData, FirebaseError, UpdatePlaceholderVariables>): UseDataConnectMutationResult<UpdatePlaceholderData, UpdatePlaceholderVariables>;
export function useUpdatePlaceholder(dc: DataConnect, options?: useDataConnectMutationOptions<UpdatePlaceholderData, FirebaseError, UpdatePlaceholderVariables>): UseDataConnectMutationResult<UpdatePlaceholderData, UpdatePlaceholderVariables>;

export function useDeletePlaceholder(options?: useDataConnectMutationOptions<DeletePlaceholderData, FirebaseError, DeletePlaceholderVariables>): UseDataConnectMutationResult<DeletePlaceholderData, DeletePlaceholderVariables>;
export function useDeletePlaceholder(dc: DataConnect, options?: useDataConnectMutationOptions<DeletePlaceholderData, FirebaseError, DeletePlaceholderVariables>): UseDataConnectMutationResult<DeletePlaceholderData, DeletePlaceholderVariables>;
