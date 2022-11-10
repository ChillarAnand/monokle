import {useCallback} from 'react';

import {Button, Popover, Tag} from 'antd';

import styled from 'styled-components';

import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {extendResourceFilter} from '@redux/reducers/main';

import {ResourceRefsIconPopover} from '@molecules';

import Colors from '@styles/Colors';

import {ItemCustomComponentProps} from '@monokle-desktop/shared';

const Container = styled.span`
  display: flex;
  align-items: center;
  & .ant-popover-inner-content {
    padding: 0 !important;
  }
`;

const StyledTag = styled(Tag)<{$isSelected: boolean}>`
  margin: 1px 5px 1px 0px;
  color: ${props => (props.$isSelected ? Colors.blackPure : Colors.whitePure)};
  font-weight: ${props => (props.$isSelected ? 700 : undefined)};
  font-size: 12px;
  padding: 0 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Prefix = (props: ItemCustomComponentProps) => {
  const {itemInstance} = props;
  const dispatch = useAppDispatch();
  const resource = useAppSelector(state => state.main.resourceMap[itemInstance.id]);
  const filterNamespace = useAppSelector(state => state.main.resourceFilter.namespace);

  const applyNamespaceFilter = useCallback(() => {
    dispatch(extendResourceFilter({namespace: resource.namespace, labels: {}, annotations: {}}));
  }, [resource, dispatch]);

  if (!resource) {
    return null;
  }

  return (
    <Container>
      <ResourceRefsIconPopover
        isSelected={itemInstance.isSelected}
        isDisabled={itemInstance.isDisabled}
        resource={resource}
        type="incoming"
      />
      {resource.namespace && !filterNamespace && (
        <Popover
          title="Filter"
          overlayClassName="resource-prefix-popover-overlay"
          content={
            <Button type="link" onClick={applyNamespaceFilter} style={{padding: 0}}>
              Set namespace filter to {resource.namespace}
            </Button>
          }
        >
          <StyledTag $isSelected={itemInstance.isSelected} color="default">
            {resource.namespace}
          </StyledTag>
        </Popover>
      )}
    </Container>
  );
};

export default Prefix;
