import { useState } from 'react';

interface LoginProps {
  onLogin: (base64Credentials: string) => void;
}

// ここに export default が絶対に必要です
export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const credentials = btoa(`${username}:${password}`);
    const authHeader = `Basic ${credentials}`;

    try {
      const response = await fetch('http://localhost:8080/api/assets', {
        headers: { 'Authorization': authHeader },
      });

      if (response.ok) {
        onLogin(authHeader);
      } else {
        setError('IDまたはパスワードが違います');
      }
    } catch (err) {
      setError('サーバーに接続できません');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>ログイン</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>ユーザー名:</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>パスワード:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
          ログイン
        </button>
      </form>
    </div>
  );
}