# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListPlaceholders*](#listplaceholders)
- [**Mutations**](#mutations)
  - [*InsertPlaceholder*](#insertplaceholder)
  - [*UpdatePlaceholder*](#updateplaceholder)
  - [*DeletePlaceholder*](#deleteplaceholder)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListPlaceholders
You can execute the `ListPlaceholders` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listPlaceholders(options?: ExecuteQueryOptions): QueryPromise<ListPlaceholdersData, undefined>;

interface ListPlaceholdersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListPlaceholdersData, undefined>;
}
export const listPlaceholdersRef: ListPlaceholdersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listPlaceholders(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListPlaceholdersData, undefined>;

interface ListPlaceholdersRef {
  ...
  (dc: DataConnect): QueryRef<ListPlaceholdersData, undefined>;
}
export const listPlaceholdersRef: ListPlaceholdersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listPlaceholdersRef:
```typescript
const name = listPlaceholdersRef.operationName;
console.log(name);
```

### Variables
The `ListPlaceholders` query has no variables.
### Return Type
Recall that executing the `ListPlaceholders` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListPlaceholdersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListPlaceholdersData {
  placeholders: ({
    id: UUIDString;
    status?: string | null;
  } & Placeholder_Key)[];
}
```
### Using `ListPlaceholders`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listPlaceholders } from '@dataconnect/generated';


// Call the `listPlaceholders()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listPlaceholders();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listPlaceholders(dataConnect);

console.log(data.placeholders);

// Or, you can use the `Promise` API.
listPlaceholders().then((response) => {
  const data = response.data;
  console.log(data.placeholders);
});
```

### Using `ListPlaceholders`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listPlaceholdersRef } from '@dataconnect/generated';


// Call the `listPlaceholdersRef()` function to get a reference to the query.
const ref = listPlaceholdersRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listPlaceholdersRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.placeholders);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.placeholders);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## InsertPlaceholder
You can execute the `InsertPlaceholder` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
insertPlaceholder(vars?: InsertPlaceholderVariables): MutationPromise<InsertPlaceholderData, InsertPlaceholderVariables>;

interface InsertPlaceholderRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: InsertPlaceholderVariables): MutationRef<InsertPlaceholderData, InsertPlaceholderVariables>;
}
export const insertPlaceholderRef: InsertPlaceholderRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
insertPlaceholder(dc: DataConnect, vars?: InsertPlaceholderVariables): MutationPromise<InsertPlaceholderData, InsertPlaceholderVariables>;

interface InsertPlaceholderRef {
  ...
  (dc: DataConnect, vars?: InsertPlaceholderVariables): MutationRef<InsertPlaceholderData, InsertPlaceholderVariables>;
}
export const insertPlaceholderRef: InsertPlaceholderRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the insertPlaceholderRef:
```typescript
const name = insertPlaceholderRef.operationName;
console.log(name);
```

### Variables
The `InsertPlaceholder` mutation has an optional argument of type `InsertPlaceholderVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface InsertPlaceholderVariables {
  status?: string | null;
}
```
### Return Type
Recall that executing the `InsertPlaceholder` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `InsertPlaceholderData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface InsertPlaceholderData {
  placeholder_insert: Placeholder_Key;
}
```
### Using `InsertPlaceholder`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, insertPlaceholder, InsertPlaceholderVariables } from '@dataconnect/generated';

// The `InsertPlaceholder` mutation has an optional argument of type `InsertPlaceholderVariables`:
const insertPlaceholderVars: InsertPlaceholderVariables = {
  status: ..., // optional
};

// Call the `insertPlaceholder()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await insertPlaceholder(insertPlaceholderVars);
// Variables can be defined inline as well.
const { data } = await insertPlaceholder({ status: ..., });
// Since all variables are optional for this mutation, you can omit the `InsertPlaceholderVariables` argument.
const { data } = await insertPlaceholder();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await insertPlaceholder(dataConnect, insertPlaceholderVars);

console.log(data.placeholder_insert);

// Or, you can use the `Promise` API.
insertPlaceholder(insertPlaceholderVars).then((response) => {
  const data = response.data;
  console.log(data.placeholder_insert);
});
```

### Using `InsertPlaceholder`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, insertPlaceholderRef, InsertPlaceholderVariables } from '@dataconnect/generated';

// The `InsertPlaceholder` mutation has an optional argument of type `InsertPlaceholderVariables`:
const insertPlaceholderVars: InsertPlaceholderVariables = {
  status: ..., // optional
};

// Call the `insertPlaceholderRef()` function to get a reference to the mutation.
const ref = insertPlaceholderRef(insertPlaceholderVars);
// Variables can be defined inline as well.
const ref = insertPlaceholderRef({ status: ..., });
// Since all variables are optional for this mutation, you can omit the `InsertPlaceholderVariables` argument.
const ref = insertPlaceholderRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = insertPlaceholderRef(dataConnect, insertPlaceholderVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.placeholder_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.placeholder_insert);
});
```

## UpdatePlaceholder
You can execute the `UpdatePlaceholder` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updatePlaceholder(vars: UpdatePlaceholderVariables): MutationPromise<UpdatePlaceholderData, UpdatePlaceholderVariables>;

interface UpdatePlaceholderRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdatePlaceholderVariables): MutationRef<UpdatePlaceholderData, UpdatePlaceholderVariables>;
}
export const updatePlaceholderRef: UpdatePlaceholderRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updatePlaceholder(dc: DataConnect, vars: UpdatePlaceholderVariables): MutationPromise<UpdatePlaceholderData, UpdatePlaceholderVariables>;

interface UpdatePlaceholderRef {
  ...
  (dc: DataConnect, vars: UpdatePlaceholderVariables): MutationRef<UpdatePlaceholderData, UpdatePlaceholderVariables>;
}
export const updatePlaceholderRef: UpdatePlaceholderRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updatePlaceholderRef:
```typescript
const name = updatePlaceholderRef.operationName;
console.log(name);
```

### Variables
The `UpdatePlaceholder` mutation requires an argument of type `UpdatePlaceholderVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdatePlaceholderVariables {
  id: UUIDString;
  status?: string | null;
}
```
### Return Type
Recall that executing the `UpdatePlaceholder` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdatePlaceholderData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdatePlaceholderData {
  placeholder_update?: Placeholder_Key | null;
}
```
### Using `UpdatePlaceholder`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updatePlaceholder, UpdatePlaceholderVariables } from '@dataconnect/generated';

// The `UpdatePlaceholder` mutation requires an argument of type `UpdatePlaceholderVariables`:
const updatePlaceholderVars: UpdatePlaceholderVariables = {
  id: ..., 
  status: ..., // optional
};

// Call the `updatePlaceholder()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updatePlaceholder(updatePlaceholderVars);
// Variables can be defined inline as well.
const { data } = await updatePlaceholder({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updatePlaceholder(dataConnect, updatePlaceholderVars);

console.log(data.placeholder_update);

// Or, you can use the `Promise` API.
updatePlaceholder(updatePlaceholderVars).then((response) => {
  const data = response.data;
  console.log(data.placeholder_update);
});
```

### Using `UpdatePlaceholder`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updatePlaceholderRef, UpdatePlaceholderVariables } from '@dataconnect/generated';

// The `UpdatePlaceholder` mutation requires an argument of type `UpdatePlaceholderVariables`:
const updatePlaceholderVars: UpdatePlaceholderVariables = {
  id: ..., 
  status: ..., // optional
};

// Call the `updatePlaceholderRef()` function to get a reference to the mutation.
const ref = updatePlaceholderRef(updatePlaceholderVars);
// Variables can be defined inline as well.
const ref = updatePlaceholderRef({ id: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updatePlaceholderRef(dataConnect, updatePlaceholderVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.placeholder_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.placeholder_update);
});
```

## DeletePlaceholder
You can execute the `DeletePlaceholder` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
deletePlaceholder(vars: DeletePlaceholderVariables): MutationPromise<DeletePlaceholderData, DeletePlaceholderVariables>;

interface DeletePlaceholderRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: DeletePlaceholderVariables): MutationRef<DeletePlaceholderData, DeletePlaceholderVariables>;
}
export const deletePlaceholderRef: DeletePlaceholderRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
deletePlaceholder(dc: DataConnect, vars: DeletePlaceholderVariables): MutationPromise<DeletePlaceholderData, DeletePlaceholderVariables>;

interface DeletePlaceholderRef {
  ...
  (dc: DataConnect, vars: DeletePlaceholderVariables): MutationRef<DeletePlaceholderData, DeletePlaceholderVariables>;
}
export const deletePlaceholderRef: DeletePlaceholderRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the deletePlaceholderRef:
```typescript
const name = deletePlaceholderRef.operationName;
console.log(name);
```

### Variables
The `DeletePlaceholder` mutation requires an argument of type `DeletePlaceholderVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface DeletePlaceholderVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `DeletePlaceholder` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `DeletePlaceholderData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface DeletePlaceholderData {
  placeholder_delete?: Placeholder_Key | null;
}
```
### Using `DeletePlaceholder`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, deletePlaceholder, DeletePlaceholderVariables } from '@dataconnect/generated';

// The `DeletePlaceholder` mutation requires an argument of type `DeletePlaceholderVariables`:
const deletePlaceholderVars: DeletePlaceholderVariables = {
  id: ..., 
};

// Call the `deletePlaceholder()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await deletePlaceholder(deletePlaceholderVars);
// Variables can be defined inline as well.
const { data } = await deletePlaceholder({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await deletePlaceholder(dataConnect, deletePlaceholderVars);

console.log(data.placeholder_delete);

// Or, you can use the `Promise` API.
deletePlaceholder(deletePlaceholderVars).then((response) => {
  const data = response.data;
  console.log(data.placeholder_delete);
});
```

### Using `DeletePlaceholder`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, deletePlaceholderRef, DeletePlaceholderVariables } from '@dataconnect/generated';

// The `DeletePlaceholder` mutation requires an argument of type `DeletePlaceholderVariables`:
const deletePlaceholderVars: DeletePlaceholderVariables = {
  id: ..., 
};

// Call the `deletePlaceholderRef()` function to get a reference to the mutation.
const ref = deletePlaceholderRef(deletePlaceholderVars);
// Variables can be defined inline as well.
const ref = deletePlaceholderRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = deletePlaceholderRef(dataConnect, deletePlaceholderVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.placeholder_delete);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.placeholder_delete);
});
```

