import {memo, useState} from 'react';

import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {selectResource} from '@redux/reducers/main';
import {useResourceMeta} from '@redux/selectors/resourceSelectors';
import {isResourceHighlighted, isResourceSelected} from '@redux/services/resource';

import {isResourcePassingFilter} from '@utils/resources';

import {ResourceIdentifier} from '@shared/models/k8sResource';
import {isLocalOrigin} from '@shared/models/origin';
import {trackEvent} from '@shared/utils';
import {isEqual} from '@shared/utils/isEqual';
import {isInClusterModeSelector} from '@shared/utils/selectors';

import KustomizeContextMenu from './KustomizeContextMenu';
import KustomizePrefix from './KustomizePrefix';
import KustomizeQuickAction from './KustomizeQuickAction';
import * as S from './KustomizeRenderer.styled';
import KustomizeSuffix from './KustomizeSuffix';

type IProps = {
  identifier: ResourceIdentifier;
};

const KustomizeRenderer: React.FC<IProps> = props => {
  const {identifier} = props;

  const dispatch = useAppDispatch();
  const resourceMeta = useResourceMeta(identifier);
  const isDisabled = useAppSelector(state =>
    Boolean(
      (state.main.preview?.type === 'kustomize' && state.main.preview?.kustomizationId !== identifier.id) ||
        isInClusterModeSelector(state) ||
        (resourceMeta && !isResourcePassingFilter(resourceMeta, state.main.resourceFilter))
    )
  );
  const isHighlighted = useAppSelector(state =>
    Boolean(identifier && isResourceHighlighted(identifier, state.main.highlights))
  );
  const isSelected = useAppSelector(state =>
    Boolean(identifier && isResourceSelected(identifier, state.main.selection))
  );

  const [isHovered, setIsHovered] = useState<boolean>(false);

  if (!resourceMeta) {
    return null;
  }

  return (
    <S.ItemContainer
      isDisabled={isDisabled}
      isHovered={isHovered}
      isSelected={isSelected}
      isHighlighted={isHighlighted}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (!isDisabled) {
          dispatch(selectResource({resourceIdentifier: identifier}));
          trackEvent('explore/select_overlay');
        }
      }}
    >
      <S.PrefixContainer>
        <KustomizePrefix resourceMeta={resourceMeta} isSelected={isSelected} isDisabled={isDisabled} />
      </S.PrefixContainer>

      <S.ItemName isDisabled={isDisabled} isSelected={isSelected} isHighlighted={isHighlighted}>
        {isLocalOrigin(resourceMeta.origin) && resourceMeta.origin.filePath.lastIndexOf('/') > 1
          ? resourceMeta.origin.filePath.substring(0, resourceMeta.origin.filePath.lastIndexOf('/'))
          : resourceMeta.name}
      </S.ItemName>

      <S.SuffixContainer>
        <KustomizeSuffix resourceMeta={resourceMeta} isSelected={isSelected} isDisabled={isDisabled} />
      </S.SuffixContainer>

      <div
        style={{display: 'flex', alignItems: 'center', marginLeft: 'auto'}}
        onClick={e => {
          e.stopPropagation();
        }}
      >
        <S.QuickActionContainer>
          <KustomizeQuickAction id={resourceMeta.id} isSelected={isSelected} />
        </S.QuickActionContainer>

        {isHovered ? (
          <S.ContextMenuContainer>
            <KustomizeContextMenu id={resourceMeta.id} isSelected={isSelected} />
          </S.ContextMenuContainer>
        ) : (
          <S.ContextMenuPlaceholder />
        )}
      </div>
    </S.ItemContainer>
  );
};

export default memo(KustomizeRenderer, isEqual);
