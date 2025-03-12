/**
 * This is the entry point for the extension.
 */

import { setupCa } from "core/util/ca";
import { extractMinimalStackTraceInfo } from "core/util/extractMinimalStackTraceInfo";
import { Telemetry } from "core/util/posthog";
import * as vscode from "vscode";

import { getExtensionVersion } from "./util/util";

import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

async function dynamicImportAndActivate(context: vscode.ExtensionContext) {
  await setupCa();
  const { activateExtension } = await import("./activation/activate");
  return await activateExtension(context);
}

export function activate(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'loginWebview',
        '用户登录',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(context.extensionPath, 'webview'))
            ]
        }
    );

    // 读取 HTML 文件内容
    const htmlFilePath = path.join(context.extensionPath, 'webview', 'login.html');
    let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

    // 替换 HTML 中的资源路径为 vscode-resource 协议
    const baseUri = panel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'webview'))).toString();
    htmlContent = htmlContent.replace(/(src|href)="([^"]+)"/g, (match, attr, src) => {
        if (!src.startsWith('http')) {
            return `${attr}="${baseUri}/${src}"`;
        }
        return match;
    });

    panel.webview.html = htmlContent;

    panel.webview.onDidReceiveMessage(
        async (message) => {
          console.log('接收到消息:', message);  
          const command = message.command;
            switch (command) {
                case 'login':
                    const { data } = message;
                    const product_source = 'FZH_CS';
                    const api_key = 'RPqltRBX7MRICFGKGKxk/w==';
                    const fullData = {
                        ...data,
                        product_source,
                        api_key
                    };
                    try {
                        const response = await axios.post('http://10.29.180.154:8777/api/ext_doc_qa/ext_user_check', fullData, {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        const responseData = response.data;
                        // 将登录结果发送给 Webview
                        panel.webview.postMessage({
                            command: 'loginResult',
                            data: responseData
                        });
                        if (responseData.code === 200) {
                            // 关闭 Webview 并回收资源
                            panel.dispose();
                            // 执行后续逻辑
                            try {
                                await dynamicImportAndActivate(context);
                            } catch (e) {
                              const error = e as Error;  
                              console.log("Error activating extension: ", error);
                                Telemetry.capture(
                                    "vscode_extension_activation_error",
                                    {
                                        stack: extractMinimalStackTraceInfo(error.stack),
                                        message: error.message
                                    },
                                    false,
                                    true
                                );
                                vscode.window
                                   .showWarningMessage(
                                        "Error activating the Continue extension.",
                                        "View Logs",
                                        "Retry"
                                    )
                                   .then((selection) => {
                                        if (selection === "View Logs") {
                                            vscode.commands.executeCommand("continue.viewLogs");
                                        } else if (selection === "Retry") {
                                            vscode.commands.executeCommand("workbench.action.reloadWindow");
                                        }
                                    });
                            }
                        } else {
                            // 登录失败，继续监听下次输入
                            console.log('登录失败，继续等待输入');
                        }
                    } catch (error) {
                        console.error('Error during login:', error);
                        panel.webview.postMessage({
                            command: 'loginResult',
                            data: {
                                code: 500,
                                msg: '登录失败，请稍后再试'
                            }
                        });
                    }
                    break;
                default:
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

export function deactivate() {
  Telemetry.capture(
    "deactivate",
    {
      extensionVersion: getExtensionVersion(),
    },
    true,
  );

  Telemetry.shutdownPosthogClient();
}
