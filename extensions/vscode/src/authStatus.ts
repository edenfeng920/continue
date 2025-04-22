// import * as vscode from 'vscode';
import * as fs from 'fs';
import { getConfigJsonPath } from 'core/util/paths';
import { outputChannel2 } from './extension';

export let isLoggedIn = false;

const subscribers = new Set<() => void>();

// 对于仓颉大模型的apikey，检测其携带的用户ID是否为当前登录用户ID
const updateConfigJson = (userId: string) => {
  const configPath = getConfigJsonPath();
  console.log(configPath);
  outputChannel2.appendLine('已找到路径 ' + configPath);
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(configContent);  
  console.log(config);
  outputChannel2.appendLine('已成功读取config文件');

  let needsUpdate = 0;

  config.models.forEach(model => {
    if (model.apiBase === "http://10.29.180.154:8100/v1") {
      const apiKeyParts = model.apiKey.split('#');
      if (apiKeyParts.length === 1) {
        model.apiKey = `${apiKeyParts[0]}#${userId}#`;
        needsUpdate = 1;
      } else if (apiKeyParts.length === 3 && apiKeyParts[1] !== userId) {
        model.apiKey = `${apiKeyParts[0]}#${userId}#${apiKeyParts[2]}`;
        needsUpdate = 2;
      }
    }
  });

  if (config.tabAutocompleteModel.apiBase === "http://10.29.180.154:8100/v1") {
    const apiKeyParts = config.tabAutocompleteModel.apiKey.split('#');
    if (apiKeyParts.length === 1) {
      config.tabAutocompleteModel.apiKey = `${apiKeyParts[0]}#${userId}#`;
      needsUpdate = 1;
    } else if (apiKeyParts.length === 3 && apiKeyParts[1] !== userId) {
      config.tabAutocompleteModel.apiKey = `${apiKeyParts[0]}#${userId}#${apiKeyParts[2]}`;
      needsUpdate = 2;
    }
  }

  if (config.embeddingsProvider.apiBase === "http://10.29.180.154:8100/v1") {
    const apiKeyParts = config.embeddingsProvider.apiKey.split('#');
    if (apiKeyParts.length === 1) {
      config.embeddingsProvider.apiKey = `${apiKeyParts[0]}#${userId}#`;
      needsUpdate = 1;
    } else if (apiKeyParts.length === 3 && apiKeyParts[1] !== userId) {
      config.embeddingsProvider.apiKey = `${apiKeyParts[0]}#${userId}#${apiKeyParts[2]}`;
      needsUpdate = 2;
    }
  }

  if (config.reranker.params.apiBase === "http://10.29.180.154:8100/v1") {
    const apiKeyParts = config.reranker.params.apiKey.split('#');
    if (apiKeyParts.length === 1) {
      config.reranker.params.apiKey = `${apiKeyParts[0]}#${userId}#`;
      needsUpdate = 1;
    } else if (apiKeyParts.length === 3 && apiKeyParts[1] !== userId) {
      config.treranker.params.apiKey = `${apiKeyParts[0]}#${userId}#${apiKeyParts[2]}`;
      needsUpdate = 2;
    }
  }

  if (needsUpdate ===1) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(config);
    outputChannel2.appendLine('config已添加账号信息');
  } else if (needsUpdate ===2){
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(config);
    outputChannel2.appendLine('config已更新账号信息');
  } else {
    console.log('config无需更新');
    outputChannel2.appendLine('config无需更新');
  }

};

export const login = (userId: string) => {
  console.log('检查config信息');
  outputChannel2.appendLine('检查config信息');
  updateConfigJson(userId);
  isLoggedIn = true;
  subscribers.forEach((callback) => callback());
};

export const logout = () => {
  isLoggedIn = false;
  subscribers.forEach((callback) => callback());
};

export const subscribeToAuthChanges = (callback: () => void) => {
  subscribers.add(callback);
};

export const unsubscribeFromAuthChanges = (callback: () => void) => {
  subscribers.delete(callback);
};
