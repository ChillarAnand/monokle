import {AlertState} from './alert';
import {AppState} from './appState';
import {CompareState} from './compare';
import {AppConfig} from './config';
import {DashboardState} from './dashboard';
import {ExtensionState} from './extension';
import {FormsState} from './form';
import {GitSliceState} from './git';
import {NavigatorState} from './navigator';
import {TerminalState} from './terminal';
import {UiState} from './ui';
import {ValidationSliceState} from './validation';

/**
 * This is the redux store root state
 * Exported to a separate file so we can use the RootState type in the main process without importing the store
 */
type RootState = {
  alert: AlertState;
  compare: CompareState;
  config: AppConfig;
  extension: ExtensionState;
  form: FormsState;
  git: GitSliceState;
  main: AppState;
  navigator: NavigatorState;
  terminal: TerminalState;
  ui: UiState;
  validation: ValidationSliceState;
  dashboard: DashboardState;
};

export type {RootState};
