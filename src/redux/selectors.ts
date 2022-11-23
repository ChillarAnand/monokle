import _ from 'lodash';
import {createSelector} from 'reselect';

import {CLUSTER_DIFF_PREFIX, PREVIEW_PREFIX} from '@constants/constants';

import {isKustomizationResource} from '@redux/services/kustomize';

import {isDefined} from '@utils/filter';
import {isResourcePassingFilter} from '@utils/resources';

import {getResourceKindHandler} from '@src/kindhandlers';

import {ROOT_FILE_ENTRY} from '@monokle-desktop/shared/constants/fileEntry';
import {AppState} from '@monokle-desktop/shared/models/appState';
import {AppConfig, HelmPreviewConfiguration, ProjectConfig} from '@monokle-desktop/shared/models/config';
import {HelmValuesFile} from '@monokle-desktop/shared/models/helm';
import {K8sResource} from '@monokle-desktop/shared/models/k8sResource';
import {ResourceKindHandler} from '@monokle-desktop/shared/models/resourceKindHandler';
import {RootState} from '@monokle-desktop/shared/models/rootState';
import {Colors} from '@monokle-desktop/shared/styles/colors';
import {isInPreviewModeSelector} from '@monokle-desktop/shared/utils/selectors';

import {mergeConfigs, populateProjectConfig} from './services/projectConfig';

export const rootFolderSelector = createSelector(
  (state: RootState) => state.main.fileMap,
  fileMap => fileMap[ROOT_FILE_ENTRY]?.filePath
);

export const allResourcesSelector = createSelector(
  (state: RootState) => state.main.resourceMap,
  resourceMap => Object.values(resourceMap)
);

export const activeResourcesSelector = (state: RootState) => {
  const resources = Object.values(state.main.resourceMap);
  const previewResourceId = state.main.previewResourceId;
  const previewValuesFileId = state.main.previewValuesFileId;
  const previewConfigurationId = state.main.previewConfigurationId;
  const previewCommandId = state.main.previewCommandId;

  return resources.filter(
    r =>
      ((previewResourceId === undefined &&
        previewValuesFileId === undefined &&
        previewConfigurationId === undefined &&
        previewCommandId === undefined) ||
        r.filePath.startsWith(PREVIEW_PREFIX)) &&
      !r.filePath.startsWith(CLUSTER_DIFF_PREFIX) &&
      !r.name.startsWith('Patch:')
  );
};

export const unknownResourcesSelector = (state: RootState) => {
  const isInPreviewMode = isInPreviewModeSelector(state);
  const unknownResources = Object.values(state.main.resourceMap).filter(
    resource =>
      !isKustomizationResource(resource) &&
      !getResourceKindHandler(resource.kind) &&
      !resource.name.startsWith('Patch:') &&
      (isInPreviewMode ? resource.filePath.startsWith(PREVIEW_PREFIX) : true)
  );
  return unknownResources;
};

export const selectedResourceSelector = createSelector(
  (state: RootState) => state.main.resourceMap,
  (state: RootState) => state.main.selectedResourceId,
  (resourceMap, selectedResourceId) => (selectedResourceId ? resourceMap[selectedResourceId] : undefined)
);

export const filteredResourceSelector = createSelector(
  (state: RootState) => state.main.resourceMap,
  (state: RootState) => state.main.resourceFilter,
  (resourceMap, filter) => Object.values(resourceMap).filter(resource => isResourcePassingFilter(resource, filter))
);

export const filteredResourceMapSelector = createSelector(
  (state: RootState) => state,
  state =>
    _.keyBy(
      Object.values(state.main.resourceMap).filter(resource =>
        isResourcePassingFilter(resource, state.main.resourceFilter, isInPreviewModeSelector(state))
      ),
      'id'
    )
);

export const kustomizationsSelector = createSelector(allResourcesSelector, resources =>
  resources.filter((r: K8sResource) => isKustomizationResource(r))
);

export const helmChartsSelector = createSelector(
  (state: RootState) => state.main.helmChartMap,
  helmCharts => helmCharts
);

export const helmValuesSelector = createSelector(
  (state: RootState) => state.main.helmValuesMap,
  helmValuesMap => helmValuesMap
);

export const selectHelmValues = (state: AppState, id?: string): HelmValuesFile | undefined => {
  if (!id) return undefined;
  return state.helmValuesMap[id];
};

export const selectHelmConfig = (state: RootState, id?: string): HelmPreviewConfiguration | undefined => {
  if (!id) return undefined;
  return state.config.projectConfig?.helm?.previewConfigurationMap?.[id] ?? undefined;
};

export const isInClusterModeSelector = createSelector(
  (state: RootState) => state,
  state => {
    const kubeConfig = selectCurrentKubeConfig(state);
    const previewId = state.main.previewResourceId;
    return kubeConfig && isDefined(previewId) && previewId === kubeConfig.currentContext;
  }
);

export const currentConfigSelector = createSelector(
  (state: RootState) => state.config,
  config => {
    const applicationConfig: ProjectConfig = populateProjectConfig(config);
    const projectConfig: ProjectConfig | null | undefined = config.projectConfig;
    return mergeConfigs(applicationConfig, projectConfig);
  }
);

export const settingsSelector = createSelector(
  (state: RootState) => state,
  state => {
    const currentConfig: ProjectConfig = currentConfigSelector(state);
    return currentConfig.settings || {};
  }
);

export const scanExcludesSelector = createSelector(
  (state: RootState) => state,
  state => {
    const currentKubeConfig: ProjectConfig = currentConfigSelector(state);
    return currentKubeConfig.scanExcludes || [];
  }
);

export const fileIncludesSelector = createSelector(
  (state: RootState) => state,
  state => {
    const currentKubeConfig: ProjectConfig = currentConfigSelector(state);
    return currentKubeConfig.fileIncludes || [];
  }
);

export const kubeConfigContextColorSelector = createSelector(
  (state: RootState) => state.config,
  config => {
    if (!config.kubeConfig.currentContext) {
      return Colors.volcano8;
    }

    return config.kubeConfigContextsColors[config.kubeConfig.currentContext] || Colors.volcano8;
  }
);

export const currentKubeContext = (configState: AppConfig) => {
  if (configState.kubeConfig.currentContext) {
    return configState.kubeConfig.currentContext;
  }

  return '';
};

export const kubeConfigContextsSelector = createSelector(
  (state: RootState) => state.config,
  config => {
    if (config.kubeConfig.contexts) {
      return config.kubeConfig.contexts;
    }
    return [];
  }
);

export const currentClusterAccessSelector = createSelector(
  (state: RootState) => state.config,
  config => {
    let currentContext = currentKubeContext(config);
    if (!currentContext) {
      return [];
    }

    if (!config.projectConfig?.kubeConfig?.currentContext) {
      return [];
    }

    return config.clusterAccess?.filter(ca => ca.context === currentContext) || [];
  }
);

export const kubeConfigPathSelector = createSelector(
  (state: RootState) => state.config,
  config => {
    if (config.projectConfig?.kubeConfig?.path) {
      return config.projectConfig?.kubeConfig?.path;
    }
    if (config.kubeConfig.path) {
      return config.kubeConfig.path;
    }
    return '';
  }
);

export const selectCurrentKubeConfig = (state: RootState) => {
  return state.config.projectConfig?.kubeConfig ?? state.config.kubeConfig;
};

export const registeredKindHandlersSelector = createSelector(
  (state: RootState) => state.main.registeredKindHandlers,
  registeredKindHandlers => {
    return registeredKindHandlers
      .map(kind => getResourceKindHandler(kind))
      .filter((handler): handler is ResourceKindHandler => handler !== undefined);
  }
);

export const knownResourceKindsSelector = createSelector(
  (state: RootState) => state.main.registeredKindHandlers,
  registeredKindHandlers => {
    return registeredKindHandlers
      .map(kind => getResourceKindHandler(kind))
      .filter((handler): handler is ResourceKindHandler => handler !== undefined)
      .map(handler => handler.kind);
  }
);
