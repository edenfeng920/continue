import { ILLM } from "core";
import { EXTENSION_NAME } from "core/control-plane/env";
import * as vscode from "vscode";

import { Battery } from "../util/battery";
import {
  CONTINUE_WORKSPACE_KEY,
  getContinueWorkspaceConfig,
} from "../util/workspaceConfig";

export enum StatusBarStatus {
  Disabled,
  Enabled,
  Paused,
}

export const quickPickStatusText = (status: StatusBarStatus | undefined) => {
  switch (status) {
    case undefined:
    case StatusBarStatus.Disabled:
      return "$(circle-slash) 禁用自动补全";
    case StatusBarStatus.Enabled:
      return "$(check) 开启自动补全";
    case StatusBarStatus.Paused:
      return "$(debug-pause) 暂停自动补全";
  }
};

export const getStatusBarStatusFromQuickPickItemLabel = (
  label: string,
): StatusBarStatus | undefined => {
  switch (label) {
    case "$(circle-slash) 禁用自动补全":
      return StatusBarStatus.Disabled;
    case "$(check) 开启自动补全":
      return StatusBarStatus.Enabled;
    case "$(debug-pause) 暂停自动补全":
      return StatusBarStatus.Paused;
    default:
      return undefined;
  }
};

const statusBarItemText = (
  status: StatusBarStatus | undefined,
  loading?: boolean,
  error?: boolean,
) => {
  if (error) {
    return "$(alert) 仓颉智码 (FATAL ERROR)";
  }

  switch (status) {
    case undefined:
      if (loading) {
        return "$(loading~spin) 仓颉智码";
      }
    case StatusBarStatus.Disabled:
      return "$(circle-slash) 仓颉智码";
    case StatusBarStatus.Enabled:
      return "$(check) 仓颉智码";
    case StatusBarStatus.Paused:
      return "$(debug-pause) 仓颉智码";
  }
};

const statusBarItemTooltip = (status: StatusBarStatus | undefined) => {
  switch (status) {
    case undefined:
    case StatusBarStatus.Disabled:
      return "自动补全已禁用，点击去开启";
    case StatusBarStatus.Enabled:
      return "自动补全已开启";
    case StatusBarStatus.Paused:
      return "自动补全已暂停";
  }
};

let statusBarStatus: StatusBarStatus | undefined = undefined;
let statusBarItem: vscode.StatusBarItem | undefined = undefined;
let statusBarFalseTimeout: NodeJS.Timeout | undefined = undefined;
let statusBarError: boolean = false;

export function stopStatusBarLoading() {
  statusBarFalseTimeout = setTimeout(() => {
    setupStatusBar(StatusBarStatus.Enabled, false);
  }, 100);
}

/**
 * TODO: We should clean up how status bar is handled.
 * Ideally, there should be a single 'status' value without
 * 'loading' and 'error' booleans.
 */
export function setupStatusBar(
  status: StatusBarStatus | undefined,
  loading?: boolean,
  error?: boolean,
) {
  if (loading !== false) {
    clearTimeout(statusBarFalseTimeout);
    statusBarFalseTimeout = undefined;
  }

  // If statusBarItem hasn't been defined yet, create it
  if (!statusBarItem) {
    statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
    );
  }

  if (error !== undefined) {
    statusBarError = error;

    if (status === undefined) {
      status = statusBarStatus;
    }

    if (loading === undefined) {
      loading = loading;
    }
  }

  statusBarItem.text = statusBarItemText(status, loading, statusBarError);
  statusBarItem.tooltip = statusBarItemTooltip(status ?? statusBarStatus);
  statusBarItem.command = "continue.openTabAutocompleteConfigMenu";

  statusBarItem.show();
  if (status !== undefined) {
    statusBarStatus = status;
  }

  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration(CONTINUE_WORKSPACE_KEY)) {
      const enabled = getContinueWorkspaceConfig().get<boolean>(
        "enableTabAutocomplete",
      );
      if (enabled && statusBarStatus === StatusBarStatus.Paused) {
        return;
      }
      setupStatusBar(
        enabled ? StatusBarStatus.Enabled : StatusBarStatus.Disabled,
      );
    }
  });
}

export function getStatusBarStatus(): StatusBarStatus | undefined {
  return statusBarStatus;
}

export function monitorBatteryChanges(battery: Battery): vscode.Disposable {
  return battery.onChangeAC((acConnected: boolean) => {
    const config = vscode.workspace.getConfiguration(EXTENSION_NAME);
    const enabled = config.get<boolean>("enableTabAutocomplete");
    if (!!enabled) {
      const pauseOnBattery = config.get<boolean>(
        "pauseTabAutocompleteOnBattery",
      );
      setupStatusBar(
        acConnected || !pauseOnBattery
          ? StatusBarStatus.Enabled
          : StatusBarStatus.Paused,
      );
    }
  });
}

export function getAutocompleteStatusBarDescription(
  selected: string | undefined,
  { title, apiKey, providerName }: ILLM,
): string | undefined {
  if (title !== selected) {
    return undefined;
  }

  let description = "当前自动补全模型";

  // Only set for Mistral since our default config includes Codestral without
  // an API key
  if ((apiKey === undefined || apiKey === "") && providerName === "mistral") {
    description += " (Missing API key)";
  }

  return description;
}

export function getAutocompleteStatusBarTitle(
  selected: string | undefined,
  { title }: ILLM,
): string {
  if (!title) {
    return "未命名模型";
  }

  if (title === selected) {
    return `$(check) ${title}`;
  }

  return title;
}
