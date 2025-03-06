import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from "../util/navigation";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // 检查输入是否为空
    if (!username) {
      setMessage('请输入OA账号');
      return;
    }

    if (!password) {
      setMessage('请输入登录密码');
      return;
    }

    // 检查用户名格式
    const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!usernameRegex.test(username)) {
      setMessage('请输入正确的OA账号，无需邮箱后缀');
      return;
    }
    
    const product_source = 'FZH_CS';
    const api_key = 'RPqltRBX7MRICFGKGKxk/w==';

    try {
      const response = await fetch('http://10.29.180.154:8777/api/ext_doc_qa/ext_user_check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_source,
          api_key,
          user_id: username,
          password
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      if (data.code === 200) {
        setMessage('登录成功');
        // 登录成功后跳转到主页
        navigate(ROUTES.HOME);
      } else {
        setMessage(data.msg);
      }
    } catch (error) {
      console.error('Error during login:', error);
      setMessage('登录失败，请稍后再试');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px', width: '100%' }}>
      <h1>用户登录</h1>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', width: '300px', maxWidth: '100%' }}>
        <input
          type="text"
          placeholder="请输入蜂巢OA账号"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ margin: '10px 0', padding: '10px', fontSize: '14px', width: '100%', boxSizing: 'border-box'}}
        />
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="请输入蜂巢密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ margin: '10px 0', padding: '10px', fontSize: '14px', width: '100%', boxSizing: 'border-box' }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        <button type="submit" style={{ margin: '10px 0', padding: '10px', fontSize: '16px', backgroundColor: 'rgb(64, 64, 64)', color: 'white', width: '100%', boxSizing: 'border-box'}}>
          登 录
        </button>
        {message && <p style={{ color: 'red', marginTop: '10px' }}>{message}</p>}
      </form>
      <p style={{ fontSize: '14px', color: '#666' }}>如有问题，请联系丰子灏(fengzh@zts.com.cn)</p>
    </div>
  );
};

export default LoginPage;
