import React, {useCallback, useMemo} from 'react';
import {shallowEqual} from 'react-redux';

import {Dropdown} from 'antd';

import {DownOutlined} from '@ant-design/icons';

import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {selectHelmValuesFile, selectK8sResource} from '@redux/reducers/main';
import {isKustomizationResource} from '@redux/services/kustomize';
import {startPreview} from '@redux/services/preview';

import {HelmChartMenuItem, KustomizationMenuItem} from '@monokle-desktop/shared/models';
import {BackgroundColors, Colors} from '@monokle-desktop/shared/styles/Colors';

import * as S from './PreviewDropdown.styled';
import PreviewMenu from './PreviewMenu';

interface IProps {
  btnStyle?: React.CSSProperties;
}

const PreviewDropdown: React.FC<IProps> = props => {
  const {btnStyle} = props;

  const dispatch = useAppDispatch();
  const previewHelmChart = useAppSelector(state =>
    previewValuesFile ? state.main.helmChartMap[previewValuesFile.helmChartId] : undefined
  );
  const previewResource = useAppSelector(state =>
    state.main.previewResourceId ? state.main.resourceMap[state.main.previewResourceId] : undefined
  );
  const previewValuesFile = useAppSelector(state =>
    state.main.previewValuesFileId ? state.main.helmValuesMap[state.main.previewValuesFileId] : undefined
  );
  const selectedResourceId = useAppSelector(state => state.main.selectedResourceId);
  const selectedValuesFileId = useAppSelector(state => state.main.selectedValuesFileId);

  const helmCharts: HelmChartMenuItem[] = useAppSelector(state => {
    const helmValuesMap = state.main.helmValuesMap;
    return Object.values(state.main.helmChartMap).map(helmChart => {
      const valuesFiles = helmChart.valueFileIds.map(valuesFileId => helmValuesMap[valuesFileId]);
      return {
        id: helmChart.id,
        name: helmChart.name,
        subItems: valuesFiles.map(valuesFile => {
          return {
            id: valuesFile.id,
            name: valuesFile.name,
          };
        }),
      };
    });
  }, shallowEqual);

  const kustomizations: KustomizationMenuItem[] = useAppSelector(state => {
    return Object.values(state.main.resourceMap)
      .filter(i => isKustomizationResource(i))
      .map(res => ({id: res.id, name: res.name}))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, shallowEqual);

  const selectAndPreviewKustomization = useCallback(
    (resourceId: string) => {
      if (resourceId !== selectedResourceId) {
        dispatch(selectK8sResource({resourceId}));
      }
      if (resourceId !== previewResource?.id) {
        startPreview(resourceId, 'kustomization', dispatch);
      }
    },
    [selectedResourceId, previewResource, dispatch]
  );

  const selectAndPreviewHelmValuesFile = useCallback(
    (valuesFileId: string) => {
      if (valuesFileId !== selectedValuesFileId) {
        dispatch(selectHelmValuesFile({valuesFileId}));
      }
      if (valuesFileId !== previewValuesFile?.id) {
        startPreview(valuesFileId, 'helm', dispatch);
      }
    },
    [selectedValuesFileId, previewValuesFile, dispatch]
  );

  const previewKey = useMemo(() => {
    if (previewResource) {
      return `kustomization__${previewResource.id}`;
    }
    if (previewValuesFile) {
      return `valuesFile__${previewValuesFile.id}`;
    }
  }, [previewResource, previewValuesFile]);

  const previewText = useMemo(() => {
    if (previewResource) {
      return `Kustomization: ${previewResource.name}`;
    }
    if (previewValuesFile && previewHelmChart) {
      return `Helm Chart: ${previewHelmChart.name} - ${previewValuesFile.name}`;
    }
  }, [previewResource, previewValuesFile, previewHelmChart]);

  const onMenuItemClick = ({key}: {key: string}) => {
    const [type, id] = key.split('__');

    if (type === 'kustomization') {
      selectAndPreviewKustomization(id);
    }
    if (type === 'valuesFile') {
      selectAndPreviewHelmValuesFile(id);
    }
  };

  return (
    <Dropdown
      disabled={helmCharts.length === 0 && kustomizations.length === 0}
      overlay={
        <PreviewMenu
          helmCharts={helmCharts}
          kustomizations={kustomizations}
          onClick={onMenuItemClick}
          previewKey={previewKey}
        />
      }
    >
      <S.PreviewButton
        type={previewText ? 'default' : 'primary'}
        ghost={!previewText}
        style={
          previewText
            ? {background: BackgroundColors.previewModeBackground, color: Colors.blackPure, ...btnStyle}
            : btnStyle
        }
      >
        <span>{previewText || 'Preview'}</span> <DownOutlined />
      </S.PreviewButton>
    </Dropdown>
  );
};
export default PreviewDropdown;
