import {createSelector} from 'reselect';

import {isKustomizationResource} from '@redux/services/kustomize';

import {RootState} from '@shared/models/rootState';
import {isDefined} from '@shared/utils/filter';

import {getResourceMetaMapFromState} from './resourceMapGetters';

type HeadingNode = {
  type: 'heading';
  icon: 'helm' | 'kustomize' | 'command';
  label: string;
};

type HelmValuesNode = {
  type: 'helm-values';
  chartId: string;
  valuesId: string;
  valuesName: string;
};

type HelmConfigNode = {
  type: 'helm-config';
  configId: string;
  configName: string;
};

type KustomizeNode = {
  type: 'kustomize';
  kustomizationId: string;
  kustomizationName: string;
};

type CommandNode = {
  type: 'command';
  commandId: string;
  commandName: string;
};

type DryRunNode = HeadingNode | HelmValuesNode | HelmConfigNode | KustomizeNode | CommandNode;

export const dryRunNodesSelector = createSelector(
  [
    (state: RootState) => getResourceMetaMapFromState(state, 'local'),
    (state: RootState) => state.main.helmChartMap,
    (state: RootState) => state.main.helmValuesMap,
    (state: RootState) => state.config.projectConfig?.helm?.previewConfigurationMap,
    (state: RootState) => state.config.projectConfig?.savedCommandMap,
  ],
  (localResourceMetaMap, helmChartMap, helmValuesMap, previewConfigurationMap, savedCommandMa) => {
    const list: DryRunNode[] = [];

    const kustomizations = Object.values(localResourceMetaMap)
      .filter(i => isKustomizationResource(i))
      .sort((a, b) => a.name.localeCompare(b.name));
    list.push({type: 'heading', label: 'kustomize', icon: 'kustomize'});
    list.push(
      ...kustomizations.map(k => ({type: 'kustomize' as const, kustomizationId: k.id, kustomizationName: k.name}))
    );

    const helmCharts = Object.values(helmChartMap).sort((a, b) => a.name.localeCompare(b.name));
    helmCharts.forEach(helmChart => {
      list.push({type: 'heading', label: helmChart.name, icon: 'helm'});
      const helmValues = helmChart.valueFileIds.map(id => helmValuesMap[id]).filter(isDefined);
      helmValues.forEach(helmValue => {
        list.push({
          type: 'helm-values',
          chartId: helmChart.id,
          valuesId: helmValue.id,
          valuesName: helmValue.name,
        });
      });

      // TODO: make sure the filtering on filePath works correctly, otherwise we will have to add chartId to the helm config
      const helmConfigs = Object.values(previewConfigurationMap ?? {})
        .filter(c => c?.helmChartFilePath === helmChart.filePath)
        .filter(isDefined)
        .sort((a, b) => a.name.localeCompare(b.name));
      helmConfigs.forEach(helmConfig => {
        list.push({
          type: 'helm-config',
          configId: helmConfig.id,
          configName: helmConfig.name,
        });
      });
    });

    const commands = Object.values(savedCommandMa ?? {})
      .filter(isDefined)
      .sort((a, b) => a.label.localeCompare(b.label));

    list.push({type: 'heading', label: 'commands', icon: 'command'});
    commands.forEach(command => {
      list.push({
        type: 'command',
        commandId: command.id,
        commandName: command.label,
      });
    });

    return list;
  }
);

export const dryRunLabelSelector = createSelector(
  [
    (state: RootState) => state.main.preview,
    (state: RootState) => getResourceMetaMapFromState(state, 'local'),
    (state: RootState) => state.main.helmChartMap,
    (state: RootState) => state.config.projectConfig?.helm?.previewConfigurationMap,
    (state: RootState) => state.config.projectConfig?.savedCommandMap,
  ],
  (preview, localResourceMetaMap, helmChartMap, previewConfigurationMap, savedCommandMap) => {
    if (!preview) {
      return undefined;
    }

    if (preview.type === 'kustomize') {
      const resource = localResourceMetaMap[preview.kustomizationId];
      return resource?.name;
    }

    if (preview.type === 'helm') {
      const helmChart = helmChartMap[preview.chartId];
      return helmChart?.name;
    }

    if (preview.type === 'helm-config') {
      const config = previewConfigurationMap?.[preview.configId];
      return config?.name;
    }

    if (preview.type === 'command') {
      const command = savedCommandMap?.[preview.commandId];
      return command?.label;
    }

    return undefined;
  }
);
