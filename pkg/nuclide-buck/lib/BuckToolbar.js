/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * @flow
 */

import type {
  AppState,
  DeploymentTarget,
  Platform,
  PlatformGroup,
  TaskType,
  TaskSettings,
} from './types';

import {React} from 'react-for-atom';
import shallowequal from 'shallowequal';

import BuckToolbarSettings from './ui/BuckToolbarSettings';
import BuckToolbarTargetSelector from './ui/BuckToolbarTargetSelector';
import {maybeToString} from '../../commons-node/string';
import {Button, ButtonSizes} from '../../nuclide-ui/Button';
import {Dropdown} from '../../nuclide-ui/Dropdown';
import type {Option} from '../../nuclide-ui/Dropdown';
import {LoadingSpinner} from '../../nuclide-ui/LoadingSpinner';
import addTooltip from '../../nuclide-ui/add-tooltip';

type Props = {
  activeTaskType: ?TaskType,
  appState: AppState,
  setBuildTarget(buildTarget: string): void,
  setDeploymentTarget(deploymentTarget: DeploymentTarget): void,
  setTaskSettings(taskType: TaskType, settings: TaskSettings): void,
};

type State = {
  settingsVisible: boolean,
};

type DropdownGroup = {
  header: Option,
  selectableOptions: Array<Option>,
};

export default class BuckToolbar extends React.Component {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    (this: any)._handleDeploymentTargetChange = this._handleDeploymentTargetChange.bind(this);
    this.state = {settingsVisible: false};
  }

  render(): React.Element<any> {
    const {
      buildRuleType,
      buildTarget,
      buckRoot,
      isLoadingRule,
      isLoadingPlatforms,
      platformGroups,
      projectRoot,
      selectedDeploymentTarget,
      taskSettings,
    } = this.props.appState;

    let status;
    if (isLoadingRule || isLoadingPlatforms) {
      const title = isLoadingRule
        ? 'Loading target build rule...' : 'Loading available platforms...';
      status =
        <div ref={addTooltip({title, delay: 0})}>
          <LoadingSpinner
            className="inline-block"
            size="EXTRA_SMALL"
          />
        </div>;
    } else if (buildTarget && buildRuleType == null) {
      let title;
      if (buckRoot == null) {
        if (projectRoot != null) {
          title = `No Buck project found in the Current Working Root:<br />${projectRoot}`;
        } else {
          title = 'No Current Working Root.';
        }
      } else {
        title =
          `Rule "${buildTarget}" could not be found in ${buckRoot}.<br />` +
          `Check your Current Working Root: ${maybeToString(projectRoot)}`;
      }

      status =
        <span
          className="icon icon-alert"
          ref={addTooltip({title, delay: 0})}
        />;
    }

    const widgets = [];
    if (status != null) {
      widgets.push(
        <div key="status" className="nuclide-buck-status inline-block text-center">
          {status}
        </div>,
      );
    } else if (platformGroups.length) {
      const options = this._optionsFromPlatformGroups(platformGroups);

      widgets.push(
        <Dropdown
          key="simulator-dropdown"
          className="inline-block"
          value={selectedDeploymentTarget}
          options={options}
          onChange={this._handleDeploymentTargetChange}
          size="sm"
          title="Choose a device"
          selectionComparator={shallowequal}
        />,
      );
    }

    const {activeTaskType} = this.props;
    return (
      <div className="nuclide-buck-toolbar">
        <BuckToolbarTargetSelector
          appState={this.props.appState}
          setBuildTarget={this.props.setBuildTarget}
        />
        <Button
          className="nuclide-buck-settings icon icon-gear"
          size={ButtonSizes.SMALL}
          disabled={activeTaskType == null || buckRoot == null}
          onClick={() => this._showSettings()}
        />
        {widgets}
        {this.state.settingsVisible && activeTaskType != null ?
          <BuckToolbarSettings
            currentBuckRoot={buckRoot}
            settings={taskSettings[activeTaskType] || {}}
            buildType={activeTaskType}
            onDismiss={() => this._hideSettings()}
            onSave={settings => this._saveSettings(activeTaskType, settings)}
          /> :
          null}
      </div>
    );
  }

  _handleDeploymentTargetChange(deploymentTarget: DeploymentTarget) {
    this.props.setDeploymentTarget(deploymentTarget);
  }

  _showSettings() {
    this.setState({settingsVisible: true});
  }

  _hideSettings() {
    this.setState({settingsVisible: false});
  }

  _saveSettings(taskType: TaskType, settings: TaskSettings) {
    this.props.setTaskSettings(taskType, settings);
    this._hideSettings();
  }

  _optionsFromPlatformGroups(platformGroups: Array<PlatformGroup>): Array<Option> {
    return platformGroups.reduce((options, platformGroup) => {
      let dropdownGroup = null;
      if (platformGroup.platforms.length === 1) {
        dropdownGroup = this._turnDevicesIntoSelectableOptions(platformGroup.platforms[0]);
      } else {
        dropdownGroup = this._putDevicesIntoSubmenus(platformGroup);
      }

      options.push(dropdownGroup.header);
      return options.concat(dropdownGroup.selectableOptions);
    }, []);
  }

  _turnDevicesIntoSelectableOptions(platform: Platform): DropdownGroup {
    const header = {
      label: platform.name,
      value: platform.name,
      disabled: true,
    };

    const selectableOptions = platform.devices.map(device => {
      return {
        label: `  ${device.name}`,
        selectedLabel: device.name,
        value: {platform, device},
      };
    });
    return {header, selectableOptions};
  }

  _putDevicesIntoSubmenus(platformGroup: PlatformGroup): DropdownGroup {
    const header = {
      label: platformGroup.name,
      value: platformGroup.name,
      disabled: true,
    };

    const selectableOptions = platformGroup.platforms.map(platform => {
      if (platform.devices.length) {
        return {
          type: 'submenu',
          label: `  ${platform.name}`,
          submenu: platform.devices.map(device => ({
            label: device.name,
            selectedLabel: `${device.name}`,
            value: {platform, device},
          })),
        };
      } else {
        return {
          label: `  ${platform.name}`,
          selectedLabel: platform.name,
          value: {platform, device: null},
        };
      }
    });

    return {header, selectableOptions};
  }
}
