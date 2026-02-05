import { useEffect, useState } from 'react';
import Select from 'react-select';
import './App.css';
import Login from './Login';

interface Asset {
  id: number;
  fundName: string;
  investmentAmount: number;
  acquisitionPrice: number;
  currentPrice: number | null;
  code?: string;
}

interface AssetSummary {
  totalInvestmentAmount: number;
  totalCurrentValue: number | null;
  totalProfitLoss: number | null;
}

interface FundOption {
  value: string;
  label: string;
}

function App() {
  const [authHeader, setAuthHeader] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [summary, setSummary] = useState<AssetSummary | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // フォームの状態
  const [form, setForm] = useState({
    fundName: '',
    investmentAmount: 0,
    acquisitionPrice: 0,
    code: ''
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Asset>>({});
  const [fundOptions, setFundOptions] = useState<FundOption[]>([]);

  useEffect(() => {
    if (authHeader) fetchAll();
  }, [authHeader]);

  const fetchAll = () => {
    if (!authHeader) return;
    fetch('http://localhost:8080/api/assets', { headers: { 'Authorization': authHeader } })
      .then((res) => res.json()).then((data) => setAssets(data));
    fetch('http://localhost:8080/api/assets/summary', { headers: { 'Authorization': authHeader } })
      .then((res) => res.json()).then((data) => setSummary(data));
  };

  const handleSearchFund = (inputValue: string) => {
    if (!inputValue || !authHeader) return;
    fetch(`http://localhost:8080/api/master/search?keyword=${inputValue}`, {
      headers: { 'Authorization': authHeader }
    })
    .then(res => res.json())
    .then((data: any[]) => {
      const options = data.map(item => ({
        value: item.code,
        label: item.fundName
      }));
      setFundOptions(options);
    });
  };

  const handleRefresh = () => {
    if (!authHeader) return;
    setIsRefreshing(true);
    fetch('http://localhost:8080/api/assets/refresh', {
      method: 'POST',
      headers: { 'Authorization': authHeader }
    })
    .then(res => res.json())
    .then(data => {
      setAssets(data);
      alert("最新価格に更新しました！");
    })
    .finally(() => setIsRefreshing(false));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authHeader) return;
    if (!form.fundName) { alert("ファンド名を選択または入力してください"); return; }

    fetch('http://localhost:8080/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
      body: JSON.stringify(form),
    }).then((res) => {
      if (res.ok) {
        fetchAll();
        // フォームリセット
        setForm({ fundName: '', investmentAmount: 0, acquisitionPrice: 0, code: '' });
      }
    });
  };

  const saveUpdate = (id: number) => {
      if (!authHeader) return;
      fetch(`http://localhost:8080/api/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify(editForm),
      }).then((res) => { if (res.ok) { setEditingId(null); fetchAll(); } });
  };

  const deleteAsset = (id: number) => {
      if(!window.confirm("削除しますか？")) return;
      if (!authHeader) return;
      fetch(`http://localhost:8080/api/assets/${id}`, { method: 'DELETE', headers: { 'Authorization': authHeader } })
        .then(() => fetchAll());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  // ★重要: 表示用の計算ロジック
  const calcCurrentValue = (asset: Asset) => {
    if (!asset.currentPrice || !asset.acquisitionPrice || !asset.investmentAmount) return 0;
    if (asset.acquisitionPrice === 0) return 0;
    const ratio = asset.currentPrice / asset.acquisitionPrice;
    return Math.floor(asset.investmentAmount * ratio);
  };

  if (!authHeader) return <Login onLogin={(header) => setAuthHeader(header)} />;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>💰 資産管理アプリ</h1>
        <div>
          <button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            style={{ marginRight: '10px', background: isRefreshing ? '#ccc' : 'orange', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: isRefreshing ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
          >
            {isRefreshing ? '⏳ 取得中...' : '🔄 最新価格を取得'}
          </button>
          <button onClick={() => setAuthHeader(null)} style={{ background: '#666', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px' }}>ログアウト</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
        <div><div style={{color:'#666'}}>総投資額</div><div style={{fontSize:'1.5em', fontWeight:'bold'}}>{summary?.totalInvestmentAmount?.toLocaleString()} 円</div></div>
        
        {/* ★変更: 時価総額 → 保有金額 */}
        <div><div style={{color:'#666'}}>保有金額</div><div style={{fontSize:'1.5em', fontWeight:'bold'}}>{summary?.totalCurrentValue?.toLocaleString()} 円</div></div>
        
        <div><div style={{color:'#666'}}>損益</div><div style={{fontSize:'1.5em', fontWeight:'bold', color:(summary?.totalProfitLoss||0)>=0?'green':'red'}}>{summary?.totalProfitLoss?.toLocaleString()} 円</div></div>
      </div>

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', background: '#fff' }}>
        <h3>新規登録</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          
          <div style={{ width: '300px' }}>
            <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>銘柄検索 (自動入力)</label>
            <Select 
              options={fundOptions} 
              onInputChange={(newValue) => handleSearchFund(newValue)}
              placeholder="例: eMAXIS..."
              onChange={(option) => {
                if (option) {
                  setForm({ ...form, fundName: option.label, code: option.value });
                }
              }}
              isClearable
              isSearchable
              noOptionsMessage={() => "銘柄名を入力してください"}
            />
          </div>

          <div>
            <label style={{display:'block', marginBottom:'5px', fontSize:'0.9em'}}>コード</label>
            <input type="text" name="code" value={form.code} readOnly style={{background:'#eee', border:'1px solid #ccc', padding:'8px', width:'80px', borderRadius:'4px'}} />
          </div>

          <div>
             <label style={{display:'block', marginBottom:'5px'}}>投資額</label>
             <input type="number" name="investmentAmount" value={form.investmentAmount} onChange={handleChange} required style={{padding:'8px', width:'100px', borderRadius:'4px', border:'1px solid #ccc'}} />
          </div>
          <div>
             {/* ★変更: 取得価格 → 取得単価 */}
             <label style={{display:'block', marginBottom:'5px'}}>取得単価</label>
             <input type="number" name="acquisitionPrice" value={form.acquisitionPrice} onChange={handleChange} required style={{padding:'8px', width:'100px', borderRadius:'4px', border:'1px solid #ccc'}} />
          </div>
          
          <div style={{ alignSelf: 'center' }}>
             <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius:'4px', cursor:'pointer' }}>登録</button>
          </div>
        </form>
      </div>

      <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f2f2f2' }}>
          {/* ★変更: 時価評価額 → 保有金額 */}
          <tr><th>銘柄名</th><th>コード</th><th>投資額</th><th>保有金額</th><th>損益</th><th>操作</th></tr>
        </thead>
        <tbody>
          {assets.map((asset) => {
            const currentValue = calcCurrentValue(asset);
            const profitLoss = currentValue - asset.investmentAmount;

            return (
            <tr key={asset.id}>
              {editingId === asset.id ? (
                <>
                  <td><input type="text" name="fundName" value={editForm.fundName} onChange={handleEditChange} style={{width:'100%'}} /></td>
                  <td><input type="text" name="code" value={editForm.code || ''} onChange={handleEditChange} style={{width:'80px'}} /></td>
                  <td><input type="number" name="investmentAmount" value={editForm.investmentAmount} onChange={handleEditChange} style={{width:'80px'}} /></td>
                  <td>-</td>
                  <td>-</td>
                  <td><button onClick={() => saveUpdate(asset.id)}>保存</button></td>
                </>
              ) : (
                <>
                  <td>{asset.fundName}</td>
                  <td>{asset.code || '-'}</td>
                  <td>{asset.investmentAmount.toLocaleString()}</td>
                  
                  <td style={{fontWeight:'bold'}}>
                    {asset.currentPrice ? currentValue.toLocaleString() : '-'}
                    <br/>
                    <span style={{fontSize:'0.8em', color:'#888'}}>
                      (基準価額: {asset.currentPrice?.toLocaleString()})
                    </span>
                  </td>

                  <td style={{fontWeight:'bold', color: profitLoss >= 0 ? 'green' : 'red'}}>
                    {asset.currentPrice ? profitLoss.toLocaleString() : '-'}
                  </td>
                  
                  <td>
                    <button onClick={() => {setEditingId(asset.id); setEditForm(asset);}}>編集</button>
                    <button onClick={() => deleteAsset(asset.id)} style={{marginLeft:'5px', color:'red'}}>削除</button>
                  </td>
                </>
              )}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default App;