import React, {useState, useContext, useMemo} from 'react';
import styled from 'styled-components';
import 'antd/dist/antd.less';
import {Button, Space, Tooltip} from 'antd';
import {
  ClusterOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  ApartmentOutlined,
  CodeOutlined,
  ApiOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import Colors, {BackgroundColors} from '@styles/Colors';
import {AppBorders} from '@styles/Borders';
import {Row, Col, Content, SplitView} from '@atoms';
import {ActionsPane, FileTreePane, PluginManagerPane, NavigatorPane, ClustersPane, NavigatorDiff} from '@organisms';
import {LogViewer, GraphView} from '@molecules';
import featureJson from '@src/feature-flags.json';
import {
  ClusterExplorerTooltip,
  FileExplorerTooltip,
  PluginManagerTooltip,
  NavigatorDiffTooltip,
} from '@constants/tooltips';
import {ROOT_FILE_ENTRY, TOOLTIP_DELAY} from '@constants/constants';
import {useAppSelector, useAppDispatch} from '@redux/hooks';
import {toggleLeftMenu, toggleRightMenu, setLeftMenuSelection, setRightMenuSelection} from '@redux/reducers/ui';
import AppContext from '@src/AppContext';

const StyledRow = styled(Row)`
  background-color: ${BackgroundColors.darkThemeBackground};
  width: 100%;
  padding: 0px;
  margin: 0px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
`;
const StyledColumnLeftMenu = styled(Col)`
  background-color: ${BackgroundColors.darkThemeBackground};
  height: 100%;
  padding: 0px;
  margin: 0px;
  border-right: ${AppBorders.pageDivider};
`;
const StyledColumnPanes = styled(Col)`
  background-color: ${BackgroundColors.darkThemeBackground};
  height: 100%;
  padding: 0px;
  margin: 0px;
  overflow-x: visible !important;
  overflow-y: visible !important;
`;
const StyledColumnRightMenu = styled(Col)`
  background-color: ${BackgroundColors.darkThemeBackground};
  height: 100%;
  padding: 0px;
  margin: 0px;
  border-left: ${AppBorders.pageDivider};
`;

const StyledContent = styled(Content)`
  overflow-y: clip;
`;

const MenuIcon = (props: {
  icon: React.ElementType;
  active: boolean;
  isSelected: boolean;
  style?: React.CSSProperties;
}) => {
  const {icon: IconComponent, active, isSelected, style: customStyle = {}} = props;
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const style = {
    ...customStyle,
    fontSize: 25,
    color: Colors.grey7,
  };

  if (isHovered || (active && isSelected)) {
    style.color = Colors.grey400;
  }

  return (
    <IconComponent style={style} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} />
  );
};

const iconMenuWidth = 45;

const PaneManager = () => {
  const dispatch = useAppDispatch();
  const {windowSize} = useContext(AppContext);

  const contentWidth = windowSize.width - (featureJson.ShowRightMenu ? 2 : 1) * iconMenuWidth;
  const contentHeight = `${windowSize.height - 75}px`;

  const fileMap = useAppSelector(state => state.main.fileMap);
  const leftMenuSelection = useAppSelector(state => state.ui.leftMenu.selection);
  const leftActive = useAppSelector(state => state.ui.leftMenu.isActive);
  const rightMenuSelection = useAppSelector(state => state.ui.rightMenu.selection);
  const rightActive = useAppSelector(state => state.ui.rightMenu.isActive);

  const isFolderOpen = useMemo(() => {
    return Boolean(fileMap[ROOT_FILE_ENTRY]);
  }, [fileMap]);

  const setActivePanes = (side: string, selectedMenu: string) => {
    if (side === 'left') {
      if (leftMenuSelection === selectedMenu) {
        dispatch(toggleLeftMenu());
      } else {
        dispatch(setLeftMenuSelection(selectedMenu));
        if (!leftActive) {
          dispatch(toggleLeftMenu());
        }
      }
    }

    if (side === 'right' && featureJson.ShowRightMenu) {
      if (rightMenuSelection === selectedMenu) {
        dispatch(toggleRightMenu());
      } else {
        dispatch(setRightMenuSelection(selectedMenu));
        if (!rightActive) {
          dispatch(toggleRightMenu());
        }
      }
    }
  };

  return (
    <StyledContent style={{height: contentHeight}}>
      <StyledRow style={{height: contentHeight + 4}}>
        <StyledColumnLeftMenu>
          <Space direction="vertical" style={{width: 43}}>
            <Tooltip mouseEnterDelay={TOOLTIP_DELAY} title={FileExplorerTooltip} placement="right">
              <Button
                size="large"
                type="text"
                onClick={() => setActivePanes('left', 'file-explorer')}
                icon={
                  <MenuIcon
                    style={{marginLeft: 4}}
                    icon={isFolderOpen ? FolderOpenOutlined : FolderOutlined}
                    active={leftActive}
                    isSelected={leftMenuSelection === 'file-explorer'}
                  />
                }
              />
            </Tooltip>
            <Tooltip mouseEnterDelay={TOOLTIP_DELAY} title={ClusterExplorerTooltip} placement="right">
              <Button
                size="large"
                type="text"
                onClick={() => setActivePanes('left', 'cluster-explorer')}
                icon={
                  <MenuIcon
                    icon={ClusterOutlined}
                    active={leftActive}
                    isSelected={leftMenuSelection === 'cluster-explorer'}
                  />
                }
              />
            </Tooltip>
            <Tooltip mouseEnterDelay={TOOLTIP_DELAY} title={NavigatorDiffTooltip} placement="right">
              <Button
                size="large"
                type="text"
                onClick={() => setActivePanes('left', 'navigator-diff')}
                icon={
                  <MenuIcon
                    icon={SwapOutlined}
                    active={leftActive}
                    isSelected={leftMenuSelection === 'navigator-diff'}
                  />
                }
              />
            </Tooltip>
            {featureJson.PluginManager && (
              <Tooltip mouseEnterDelay={TOOLTIP_DELAY} title={PluginManagerTooltip} placement="right">
                <Button
                  size="large"
                  type="text"
                  onClick={() => setActivePanes('left', 'plugin-manager')}
                  icon={
                    <MenuIcon
                      icon={ApiOutlined}
                      active={leftActive}
                      isSelected={leftMenuSelection === 'plugin-manager'}
                    />
                  }
                />
              </Tooltip>
            )}
          </Space>
        </StyledColumnLeftMenu>
        <StyledColumnPanes style={{width: contentWidth}}>
          <SplitView
            contentWidth={contentWidth}
            left={
              <>
                <div style={{display: leftMenuSelection === 'file-explorer' ? 'inline' : 'none'}}>
                  <FileTreePane />
                </div>
                <div
                  style={{
                    display:
                      featureJson.ShowClusterView && leftMenuSelection === 'cluster-explorer' ? 'inline' : 'none',
                  }}
                >
                  <ClustersPane />
                </div>
                <div
                  style={{
                    display: featureJson.PluginManager && leftMenuSelection === 'plugin-manager' ? 'inline' : 'none',
                  }}
                >
                  <PluginManagerPane />
                </div>
                <div style={{display: leftMenuSelection === 'navigator-diff' ? 'inline' : 'none'}}>
                  <NavigatorDiff />
                </div>
              </>
            }
            hideLeft={!leftActive}
            nav={<NavigatorPane />}
            editor={<ActionsPane contentHeight={contentHeight} />}
            right={
              <>
                {featureJson.ShowGraphView && rightMenuSelection === 'graph' ? (
                  <GraphView editorHeight={contentHeight} />
                ) : undefined}
                <div style={{display: rightMenuSelection === 'logs' ? 'inline' : 'none'}}>
                  <LogViewer editorHeight={contentHeight} />
                </div>
              </>
            }
            hideRight={!rightActive}
          />
        </StyledColumnPanes>
        <StyledColumnRightMenu style={{display: featureJson.ShowRightMenu ? 'inline' : 'none'}}>
          <Space direction="vertical" style={{width: 43}}>
            <Button
              size="large"
              type="text"
              onClick={() => setActivePanes('right', 'graph')}
              icon={
                <MenuIcon icon={ApartmentOutlined} active={rightActive} isSelected={rightMenuSelection === 'graph'} />
              }
              style={{display: featureJson.ShowGraphView ? 'inline' : 'none'}}
            />

            <Button
              size="large"
              type="text"
              onClick={() => setActivePanes('right', 'logs')}
              icon={<MenuIcon icon={CodeOutlined} active={rightActive} isSelected={rightMenuSelection === 'logs'} />}
            />
          </Space>
        </StyledColumnRightMenu>
      </StyledRow>
    </StyledContent>
  );
};

export default PaneManager;
