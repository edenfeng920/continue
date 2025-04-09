import { ConfigHandler } from "core/config/ConfigHandler";
import * as vscode from "vscode";
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import { getTheme } from "./util/getTheme";
import { getExtensionVersion } from "./util/util";
import { getExtensionUri, getNonce, getUniqueId } from "./util/vscode";
import { VsCodeWebviewProtocol } from "./webviewProtocol";
import type { FileEdit } from "core";
import CryptoJS from 'crypto-js';
import { isLoggedIn, login } from "./authStatus";

export class ContinueGUIWebviewViewProvider
  implements vscode.WebviewViewProvider
{
  // 视图名称已在package中声明
  public static readonly viewType = "continue.continueGUIView";
  public webviewProtocol: VsCodeWebviewProtocol;
  private _webview?: vscode.Webview;
  private _webviewView?: vscode.WebviewView;
  private loginMessageListener: vscode.Disposable | null = null;

  public get isReady(): boolean {
    return !!this.webview;
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void | Thenable<void> {
    this._webviewView = webviewView;
    this._webview = webviewView.webview;

    // 如果没有登录，则显示登录页面，走登录流程
    if (!isLoggedIn) {
      this.showLoginPage(webviewView);
      this.loginMessageListener = this._webview.onDidReceiveMessage(
        async (message) => {
          const command = message.command;
          if (command === 'login') {
            await this.handleLogin(message.data);
          }
        },
        undefined,
        this.extensionContext.subscriptions
      );
    } else {
      this._webviewView.webview.html = this.getSidebarContent(
        this.extensionContext,
        this._webviewView
      );
    }
  }

  get isVisible() {
    return this._webviewView?.visible;
  }

  get webview() {
    return this._webview;
  }

  public resetWebviewProtocolWebview(): void {
    if (this._webview) {
      this.webviewProtocol.webview = this._webview;
    } else {
      console.warn("no webview found during reset");
    }
  }

  sendMainUserInput(input: string) {
    this.webview?.postMessage({
      type: "userInput",
      input
    });
  }

  constructor(
    private readonly configHandlerPromise: Promise<ConfigHandler>,
    private readonly windowId: string,
    private readonly extensionContext: vscode.ExtensionContext
  ) {
    this.webviewProtocol = new VsCodeWebviewProtocol(
      (async () => {
        const configHandler = await this.configHandlerPromise;
        return configHandler.reloadConfig();
      }).bind(this)
    );
  }

  getSidebarContent(
    context: vscode.ExtensionContext | undefined,
    panel: vscode.WebviewPanel | vscode.WebviewView,
    page: string | undefined = undefined,
    edits: FileEdit[] | undefined = undefined,
    isFullScreen = false
  ): string {
    const extensionUri = getExtensionUri();
    let scriptUri: string;
    let styleMainUri: string;
    const vscMediaUrl: string = panel.webview
      .asWebviewUri(vscode.Uri.joinPath(extensionUri, "gui"))
      .toString();

    // 根据是否开发模式，配置不同的导入页面路径
      const inDevelopmentMode =
      context?.extensionMode === vscode.ExtensionMode.Development;
    if (!inDevelopmentMode) {
      scriptUri = panel.webview
        .asWebviewUri(vscode.Uri.joinPath(extensionUri, "gui/assets/index.js"))
        .toString();
      styleMainUri = panel.webview
        .asWebviewUri(vscode.Uri.joinPath(extensionUri, "gui/assets/index.css"))
        .toString();
    } else {
      scriptUri = "http://localhost:5173/src/main.tsx";
      styleMainUri = "http://localhost:5173/src/index.css";
    }

    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(extensionUri, "gui"),
        vscode.Uri.joinPath(extensionUri, "assets")
      ],
      enableCommandUris: true,
      portMapping: [
        {
          webviewPort: 65433,
          extensionHostPort: 65433
        }
      ]
    };

    const nonce = getNonce();

    const currentTheme = getTheme();
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration("workbench.colorTheme") ||
        e.affectsConfiguration("window.autoDetectColorScheme") ||
        e.affectsConfiguration("window.autoDetectHighContrast") ||
        e.affectsConfiguration("workbench.preferredDarkColorTheme") ||
        e.affectsConfiguration("workbench.preferredLightColorTheme") ||
        e.affectsConfiguration("workbench.preferredHighContrastColorTheme") ||
        e.affectsConfiguration("workbench.preferredHighContrastLightColorTheme")
      ) {
        // Send new theme to GUI to update embedded Monaco themes
        this.webviewProtocol?.request("setTheme", { theme: getTheme() });
      }
    });

    this.webviewProtocol.webview = panel.webview;

    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>const vscode = acquireVsCodeApi();</script>
        <link href="${styleMainUri}" rel="stylesheet">

        <title>Continue</title>
      </head>
      <body>
        <div id="root"></div>

        ${
          inDevelopmentMode
            ? `<script type="module">
          import RefreshRuntime from "http://localhost:5173/@react-refresh"
          RefreshRuntime.injectIntoGlobalHook(window)
          window.$RefreshReg$ = () => {}
          window.$RefreshSig$ = () => (type) => type
          window.__vite_plugin_react_preamble_installed__ = true
          </script>`
            : ""
        }

        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>

        <script>localStorage.setItem("ide", '"vscode"')</script>
        <script>localStorage.setItem("extensionVersion", '"${getExtensionVersion()}"')</script>
        <script>window.windowId = "${this.windowId}"</script>
        <script>window.vscMachineId = "${getUniqueId()}"</script>
        <script>window.vscMediaUrl = "${vscMediaUrl}"</script>
        <script>window.ide = "vscode"</script>
        <script>window.fullColorTheme = ${JSON.stringify(currentTheme)}</script>
        <script>window.colorThemeName = "dark-plus"</script>
        <script>window.workspacePaths = ${JSON.stringify(
          vscode.workspace.workspaceFolders?.map((folder) =>
            folder.uri.toString()
          ) || []
        )}</script>
        <script>window.isFullScreen = ${isFullScreen}</script>

        ${
          edits
            ? `<script>window.edits = ${JSON.stringify(edits)}</script>`
            : ""
        }
        ${page ? `<script>window.location.pathname = "${page}"</script>` : ""}
      </body>
    </html>`;
  }

  // 登录页面的html在根目录下webview文件夹中
  private showLoginPage(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this.extensionContext.extensionPath, 'webview'))
      ]
    };

    const htmlContent = this.getHtmlContent('webview/login.html', webviewView);
    webviewView.webview.html = htmlContent;
  }

  private getHtmlContent(htmlFilePath: string, webviewView: vscode.WebviewView): string {
    const fullPath = path.join(this.extensionContext.extensionPath, htmlFilePath);
    let htmlContent = fs.readFileSync(fullPath, 'utf8');

    const baseUri = webviewView.webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionContext.extensionPath, 'webview'))).toString();
    htmlContent = htmlContent.replace(/(src|href)="([^"]+)"/g, (match, attr, src) => {
      if (!src.startsWith('http')) {
        return `${attr}="${baseUri}/${src}"`;
      }
      return match;
    });

    return htmlContent;
  }

  // 登录页面通过插件与服务端通信
  private async handleLogin(data: any, maxRetries = 3) {
    const product_source = 'FZH_CS'; 
    const api_key = 'RPqltRBX7MRICFGKGKxk/w=='; 
    
    // 加密
    const encryptedUsername = CryptoJS.AES.encrypt(data.user_id, CryptoJS.enc.Utf8.parse(api_key), {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
  }).toString();
    const encryptedPassword = CryptoJS.AES.encrypt(data.password, CryptoJS.enc.Utf8.parse(api_key), {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
  }).toString();
    const encryptedapikey = CryptoJS.AES.encrypt(api_key, CryptoJS.enc.Utf8.parse(api_key), {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7
  }).toString();

    const fullData = {
      user_id: encryptedUsername,
      password: encryptedPassword,
      api_key: encryptedapikey,
      product_source
    };

    // 增加重试机制
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const response = await axios.post(
                //  测试环境
                'http://10.29.180.154:8100/api/ext_doc_qa/ext_user_check',
                //  开发环境
                // 'http://10.49.87.67:8100/api/ext_doc_qa/ext_user_check',
                fullData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000 
                }
            );

            const responseData = response.data;
            // 将登录结果发送给 Webview
            this._webview?.postMessage({
                command: 'loginResult',
                data: responseData
            });
            if (responseData.code === 200) {
                // 标记用户已登录
                login(data.user_id); // 调用 authStatus.ts 中的 login 方法
                // 移除登录消息监听
                this.loginMessageListener?.dispose();
                this.loginMessageListener = null;
                // 登录成功，显示后续页面
                if (this._webviewView) {
                    this._webviewView.webview.html = this.getSidebarContent(
                        this.extensionContext,
                        this._webviewView
                    );
                }
                console.log('登录成功');
            } else {
                // 登录失败，继续监听下次输入
                console.log('登录失败，继续等待输入');
                vscode.window.showErrorMessage(`登录失败: ${responseData.msg}`);
            }
            return;
        } catch (error) {
            if (error.code === 'ECONNRESET' && retries < maxRetries-1) {
                retries++;
                console.log(`请求失败，正在进行第 ${retries} 次重试...`);
            } else {
                console.error('Error message:', error.message);
                
                this._webview?.postMessage({
                    command: 'loginResult',
                    data: {
                        code: 500,
                        msg: '登录失败，请稍后再试'
                    }
                });
                vscode.window.showErrorMessage('登录失败，请稍后再试');
                return;
              }
          }
      }
  }
}