import { useEffect, useState } from 'react';
import './App.css';

// 個別データの型
interface Asset {
  id: number;
  fundName: string;
  investmentAmount: number;
  acquisitionPrice: number;
  currentPrice: number | null;
  investmentDate: string;
}

// ★追加: 集計データの型
interface AssetSummary {
  totalInvestmentAmount: number;
  totalCurrentValue: number | null;
  totalProfitLoss: number | null;
}

function App() {
  const [assets, setAssets] = useState<Asset[]>([]);
  
  // ★追加: 集計データを入れる箱
  const [summary, setSummary] = useState<AssetSummary | null>(null);

  const [form, setForm] = useState({
    fundName: '',
    investmentAmount: 0,
    acquisitionPrice: 0,
    investmentDate: ''
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Asset>>({});

  useEffect(() => {
    fetchAll();
  }, []);

  // ★変更: 一覧と集計の両方を取得する関数
  const fetchAll = () => {
    // 1. 一覧を取得
    fetch('http://localhost:8080/api/assets')
      .then((res) => res.json())
      .then((data) => setAssets(data));

    // 2. 集計を取得 (Javaで作った計算ロジックを利用)
    fetch('http://localhost:8080/api/assets/summary')
      .then((res) => res.json())
      .then((data) => setSummary(data));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch('http://localhost:8080/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then((res) => {
      if (res.ok) {
        alert('登録しました！');
        fetchAll(); // ★再読み込み
        setForm({ fundName: '', investmentAmount: 0, acquisitionPrice: 0, investmentDate: '' });
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const startEditing = (asset: Asset) => {
    setEditingId(asset.id);
    setEditForm({ ...asset });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const saveUpdate = (id: number) => {
    fetch(`http://localhost:8080/api/assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    }).then((res) => {
      if (res.ok) {
        alert('更新しました！');
        setEditingId(null);
        fetchAll(); // ★再読み込み
      }
    });
  };

  const deleteAsset = (id: number) => {
    if(!window.confirm("本当に削除しますか？")) return;
    fetch(`http://localhost:8080/api/assets/${id}`, {
      method: 'DELETE',
    }).then(() => {
      fetchAll(); // ★再読み込み
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>💰 資産管理アプリ</h1>

      {/* --- ★追加: トータル集計エリア --- */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>総投資額</div>
          <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
            {summary?.totalInvestmentAmount?.toLocaleString()} 円
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>時価総額</div>
          <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
            {summary?.totalCurrentValue ? summary.totalCurrentValue.toLocaleString() : '-'} 円
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>トータル損益</div>
          <div style={{ 
            fontSize: '1.5em', 
            fontWeight: 'bold', 
            color: (summary?.totalProfitLoss || 0) >= 0 ? 'green' : 'red' 
          }}>
            {summary?.totalProfitLoss != null ? (summary.totalProfitLoss > 0 ? '+' : '') + summary.totalProfitLoss.toLocaleString() : '-'} 円
          </div>
        </div>
      </div>

      {/* 新規登録フォーム */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>新規登録</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label>銘柄名: <input type="text" name="fundName" value={form.fundName} onChange={handleChange} required style={{display:'block', padding:'5px'}} /></label>
          <label>投資額: <input type="number" name="investmentAmount" value={form.investmentAmount} onChange={handleChange} required style={{display:'block', padding:'5px'}} /></label>
          <label>基準価額(取得): <input type="number" name="acquisitionPrice" value={form.acquisitionPrice} onChange={handleChange} required style={{display:'block', padding:'5px'}} /></label>
          <label>投資日: <input type="date" name="investmentDate" value={form.investmentDate} onChange={handleChange} required style={{display:'block', padding:'5px'}} /></label>
          <button type="submit" style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius:'4px', cursor:'pointer' }}>登録</button>
        </form>
      </div>

      {/* 資産リスト */}
      <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: '#f2f2f2' }}>
          <tr>
            <th>銘柄名</th>
            <th>投資額</th>
            <th>現在価格 (時価)</th>
            <th>含み益</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id}>
              {editingId === asset.id ? (
                <>
                  <td><input type="text" name="fundName" value={editForm.fundName} onChange={handleEditChange} style={{width: '100px'}} /></td>
                  <td>{asset.investmentAmount.toLocaleString()}</td>
                  <td>
                    <input 
                      type="number" 
                      name="currentPrice" 
                      placeholder="時価を入力"
                      value={editForm.currentPrice || ''} 
                      onChange={handleEditChange} 
                      style={{width: '100px', background: '#e0ffe0'}}
                    />
                  </td>
                  <td>-</td>
                  <td>
                    <button onClick={() => saveUpdate(asset.id)} style={{marginRight:'5px', background:'green', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px'}}>保存</button>
                    <button onClick={cancelEditing} style={{border:'none', padding:'5px 10px', borderRadius:'4px'}}>中止</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{asset.fundName}</td>
                  <td>{asset.investmentAmount.toLocaleString()} 円</td>
                  <td>{asset.currentPrice ? `${asset.currentPrice.toLocaleString()} 円` : '-'}</td>
                  <td style={{ fontWeight: 'bold', color: (asset.currentPrice || 0) - asset.investmentAmount >= 0 ? 'green' : 'red' }}>
                    {asset.currentPrice 
                      ? `${(asset.currentPrice - asset.investmentAmount > 0 ? '+' : '')}${(asset.currentPrice - asset.investmentAmount).toLocaleString()} 円` 
                      : '-'}
                  </td>
                  <td>
                    <button onClick={() => startEditing(asset)} style={{marginRight:'5px', padding:'5px 10px'}}>編集</button>
                    <button onClick={() => deleteAsset(asset.id)} style={{background: '#ff4d4d', color: 'white', border:'none', padding:'5px 10px', borderRadius:'4px'}}>削除</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;