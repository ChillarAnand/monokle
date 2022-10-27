import React, {useCallback, useMemo} from 'react';

import {DEFAULT_PANE_CONFIGURATION} from '@constants/constants';

import {useAppDispatch, useAppSelector} from '@redux/hooks';
import {setPaneConfiguration} from '@redux/reducers/ui';
import {activeProjectSelector} from '@redux/selectors';

import {useMainPaneDimensions} from '@utils/hooks';

import {ResizableColumnsPanel, ResizableRowsPanel} from '@monokle/components';

import ActionsPane from '../ActionsPane';
import BottomPaneManager from '../BottomPaneManager';
import NavigatorPane from '../NavigatorPane';
import {RecentProjectsPage, StartProjectPage} from '../StartProjectPane';
import * as S from './NewPaneManager.styled';
import NewPaneManagerLeftMenu from './NewPaneManagerLeftMenu';
import {activities} from './activities';

const NewPaneManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeProject = useAppSelector(activeProjectSelector);
  const bottomPaneHeight =
    useAppSelector(state => state.ui.paneConfiguration.bottomPaneHeight) || DEFAULT_PANE_CONFIGURATION.bottomPaneHeight;
  const bottomSelection = useAppSelector(state => state.ui.leftMenu.bottomSelection);
  const isProjectLoading = useAppSelector(state => state.config.isProjectLoading);
  const isStartProjectPaneVisible = useAppSelector(state => state.ui.isStartProjectPaneVisible);
  const layout = useAppSelector(state => state.ui.paneConfiguration);
  const leftMenuSelection = useAppSelector(state => state.ui.leftMenu.selection);
  const projects = useAppSelector(state => state.config.projects);

  const {height, width} = useMainPaneDimensions();

  const gridColumns = useMemo(() => {
    if (!activeProject || isStartProjectPaneVisible) {
      return '1fr';
    }

    return 'max-content 1fr';
  }, [activeProject, isStartProjectPaneVisible]);

  const topPaneFlex = useMemo(
    () => (bottomSelection ? 1 - layout.bottomPaneHeight / height : 1),
    [bottomSelection, height, layout.bottomPaneHeight]
  );

  const paneHeight = useMemo(
    () => (bottomSelection ? height - bottomPaneHeight - 2 : height),
    [bottomPaneHeight, bottomSelection, height]
  );

  const handleColumnResize = useCallback(
    (position: 'center' | 'right' | 'left', flex: number) => {
      if (position === 'center') {
        dispatch(setPaneConfiguration({navPane: flex}));
      } else if (position === 'left') {
        dispatch(setPaneConfiguration({leftPane: flex}));
      } else if (position === 'right') {
        dispatch(setPaneConfiguration({editPane: flex}));
      }
    },

    [dispatch]
  );

  const handleRowResize = useCallback(
    (position: 'top' | 'bottom', flex: number) => {
      if (position !== 'bottom') {
        return;
      }

      dispatch(setPaneConfiguration({bottomPaneHeight: flex * height}));
    },
    [dispatch, height]
  );

  const currentActivity = useMemo(() => activities.find(a => a.name === leftMenuSelection), [leftMenuSelection]);

  console.log(currentActivity);

  return (
    <S.PaneManagerContainer $gridTemplateColumns={gridColumns}>
      {isProjectLoading ? (
        <S.Skeleton />
      ) : activeProject && !isStartProjectPaneVisible ? (
        <>
          <NewPaneManagerLeftMenu />

          <ResizableRowsPanel
            layout={{top: topPaneFlex, bottom: layout.bottomPaneHeight / height}}
            top={
              <ResizableColumnsPanel
                left={
                  // <Suspense fallback={<div />}>
                  //   {leftActiveMenu === 'explorer' && <FileTreePane height={paneHeight} />}
                  //   {leftActiveMenu === 'helm-pane' && <HelmPane />}
                  //   {leftActiveMenu === 'git' && <GitPane height={paneHeight} />}
                  //   {leftActiveMenu === 'kustomize-pane' && <KustomizePane />}
                  //   {leftActiveMenu === 'images-pane' && <ImagesPane />}
                  //   {leftActiveMenu === 'templates-pane' && <TemplateManagerPane height={paneHeight} />}
                  //   {leftActiveMenu === 'validation' && <ValidationPane height={paneHeight} />}
                  //   {leftActiveMenu === 'search' && <SearchPane height={paneHeight} />}
                  // </Suspense>
                  currentActivity?.component
                }
                center={<NavigatorPane height={paneHeight} />}
                right={<ActionsPane height={paneHeight} />}
                layout={{left: layout.leftPane, center: layout.navPane, right: layout.editPane}}
                width={width}
                onStopResize={handleColumnResize}
              />
            }
            bottom={<BottomPaneManager />}
            splitterStyle={{display: bottomSelection === 'terminal' ? 'block' : 'none'}}
            bottomElementStyle={{
              overflow: bottomSelection === 'terminal' ? 'hidden' : 'auto',
              display: bottomSelection === 'terminal' ? 'block' : 'none',
            }}
            onStopResize={handleRowResize}
          />
        </>
      ) : projects.length > 0 ? (
        <RecentProjectsPage />
      ) : (
        <StartProjectPage />
      )}
    </S.PaneManagerContainer>
  );
};

export default NewPaneManager;
