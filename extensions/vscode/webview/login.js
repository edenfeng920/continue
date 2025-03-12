// 获取 VSCode API
const vscode = window.acquireVsCodeApi();

document.addEventListener('DOMContentLoaded', () => {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePasswordButton = document.getElementById('togglePassword');
    const messageElement = document.getElementById('message');
    const loginForm = document.getElementById('loginForm');

    let showPassword = false;

    // 切换密码显示状态
    togglePasswordButton.addEventListener('click', () => {
        showPassword = !showPassword;
        passwordInput.type = showPassword ? 'text' : 'password';
        togglePasswordButton.textContent = showPassword ? '👁️' : '👁️‍🗨️';
    });

    // 处理登录表单提交
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // 清空之前的错误提示
        messageElement.textContent = '';

        const username = usernameInput.value;
        const password = passwordInput.value;

        // 检查输入是否为空
        if (!username) {
            messageElement.textContent = '请输入OA账号';
            return;
        }

        if (!password) {
            messageElement.textContent = '请输入登录密码';
            return;
        }

        // 检查用户名格式
        const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
        if (!usernameRegex.test(username)) {
            messageElement.textContent = '请输入正确的OA账号，无需邮箱后缀';
            return;
        }

        if (vscode) {
            // 向插件发送登录请求消息
            vscode.postMessage({
                command: 'login',
                data: {
                    user_id: username,
                    password
                }
            });
        }
    });

    // 监听插件返回的消息
    window.addEventListener('message', (event) => {
        const message = event.data;
        switch (message.command) {
            case 'loginResult':
                const { code, msg } = message.data;
                if (code === 200) {
                    messageElement.textContent = '登录成功';
                } else {
                    messageElement.textContent = msg;
                    // 重置输入框内容
                    usernameInput.value = '';
                    passwordInput.value = '';
                }
                break;
            default:
                break;
        }
    });
});