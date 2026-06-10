import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions, MutationRef, MutationPromise, DataConnectSettings } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;
export const dataConnectSettings: DataConnectSettings;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface DeletePlaceholderData {
  placeholder_delete?: Placeholder_Key | null;
}

export interface DeletePlaceholderVariables {
  id: UUIDString;
}

export interface InsertPlaceholderData {
  placeholder_insert: Placeholder_Key;
}

export interface InsertPlaceholderVariables {
  status?: string | null;
}

export interface ListPlaceholdersData {
  placeholders: ({
    id: UUIDString;
    status?: string | null;
  } & Placeholder_Key)[];
}

export interface Placeholder_Key {
  id: UUIDString;
  __typename?: 'Placeholder_Key';
}

export interface UpdatePlaceholderData {
  placeholder_update?: Placeholder_Key | null;
}

export interface UpdatePlaceholderVariables {
  id: UUIDString;
  status?: string | null;
}

interface ListPlaceholdersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPlaceholdersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListPlaceholdersData, undefined>;
  operationName: string;
}
export const listPlaceholdersRef: ListPlaceholdersRef;

export function listPlaceholders(options?: ExecuteQueryOptions): QueryPromise<ListPlaceholdersData, undefined>;
export function listPlaceholders(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPlaceholdersData, undefined>;

interface InsertPlaceholderRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: InsertPlaceholderVariables): MutationRef<InsertPlaceholderData, InsertPlaceholderVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: InsertPlaceholderVariables): MutationRef<InsertPlaceholderData, InsertPlaceholderVariables>;
  operationName: string;
}
export const insertPlaceholderRef: InsertPlaceholderRef;

export function insertPlaceholder(vars?: InsertPlaceholderVariables): MutationPromise<InsertPlaceholderData, InsertPlaceholderVariables>;
export function insertPlaceholder(dc: DataConnect, vars?: InsertPlaceholderVariables): MutationPromise<InsertPlaceholderData, InsertPlaceholderVariables>;

interface UpdatePlaceholderRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePlaceholderVariables): MutationRef<UpdatePlaceholderData, UpdatePlaceholderVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdatePlaceholderVariables): MutationRef<UpdatePlaceholderData, UpdatePlaceholderVariables>;
  operationName: string;
}
export const updatePlaceholderRef: UpdatePlaceholderRef;

export function updatePlaceholder(vars: UpdatePlaceholderVariables): MutationPromise<UpdatePlaceholderData, UpdatePlaceholderVariables>;
export function updatePlaceholder(dc: DataConnect, vars: UpdatePlaceholderVariables): MutationPromise<UpdatePlaceholderData, UpdatePlaceholderVariables>;

interface DeletePlaceholderRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeletePlaceholderVariables): MutationRef<DeletePlaceholderData, DeletePlaceholderVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: DeletePlaceholderVariables): MutationRef<DeletePlaceholderData, DeletePlaceholderVariables>;
  operationName: string;
}
export const deletePlaceholderRef: DeletePlaceholderRef;

export function deletePlaceholder(vars: DeletePlaceholderVariables): MutationPromise<DeletePlaceholderData, DeletePlaceholderVariables>;
export function deletePlaceholder(dc: DataConnect, vars: DeletePlaceholderVariables): MutationPromise<DeletePlaceholderData, DeletePlaceholderVariables>;

