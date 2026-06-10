const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs, makeMemoryCacheProvider } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'multi-landlord-apartment-manager-c7e',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;
const dataConnectSettings = {
  cacheSettings: {
    cacheProvider: makeMemoryCacheProvider()
  }
};
exports.dataConnectSettings = dataConnectSettings;

const listPlaceholdersRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListPlaceholders');
}
listPlaceholdersRef.operationName = 'ListPlaceholders';
exports.listPlaceholdersRef = listPlaceholdersRef;

exports.listPlaceholders = function listPlaceholders(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listPlaceholdersRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const insertPlaceholderRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'InsertPlaceholder', inputVars);
}
insertPlaceholderRef.operationName = 'InsertPlaceholder';
exports.insertPlaceholderRef = insertPlaceholderRef;

exports.insertPlaceholder = function insertPlaceholder(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars);
  return executeMutation(insertPlaceholderRef(dcInstance, inputVars));
}
;

const updatePlaceholderRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdatePlaceholder', inputVars);
}
updatePlaceholderRef.operationName = 'UpdatePlaceholder';
exports.updatePlaceholderRef = updatePlaceholderRef;

exports.updatePlaceholder = function updatePlaceholder(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updatePlaceholderRef(dcInstance, inputVars));
}
;

const deletePlaceholderRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'DeletePlaceholder', inputVars);
}
deletePlaceholderRef.operationName = 'DeletePlaceholder';
exports.deletePlaceholderRef = deletePlaceholderRef;

exports.deletePlaceholder = function deletePlaceholder(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(deletePlaceholderRef(dcInstance, inputVars));
}
;
