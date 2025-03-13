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

export class ContinueGUIWebviewViewProvider
  implements vscode.WebviewViewProvider
{
  public static readonly viewType = "continue.continueGUIView";
  public webviewProtocol: VsCodeWebviewProtocol;
  private _webview?: vscode.Webview;
  private _webviewView?: vscode.WebviewView;
  private isLoggedIn = false;
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

    if (!this.isLoggedIn) {
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
      webviewView.webview.html = this.getSidebarContent(
        this.extensionContext,
        webviewView,
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

  private async handleLogin(data: any) {
    const product_source = 'FZH_CS'; 
    const api_key = 'RPqltRBX7MRICFGKGKxk/w=='; 
    const fullData = {
      ...data,
      product_source,
      api_key
    };

    try {
      const response = await axios.post(
        'http://10.29.180.154:8777/api/ext_doc_qa/ext_user_check',
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
        this.isLoggedIn = true;
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
    } catch (error) {
      console.error('Error during login:', error);
      this._webview?.postMessage({
        command: 'loginResult',
        data: {
          code: 500,
          msg: '登录失败，请稍后再试'
        }
      });
      vscode.window.showErrorMessage('登录失败，请稍后再试');
    }
  }
}