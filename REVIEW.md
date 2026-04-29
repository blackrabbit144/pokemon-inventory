# 在庫管理システム 仕組みレビュー

初心者向けに、今回作ったものを図と一緒に説明します。

---

## 全体の構成（アーキテクチャ）

```
ブラウザ（あなたが見る画面）
    ↕ データのやり取り
React（フロントエンド） ← localhost:5173
    ↕ API通信（HTTP）
Django（バックエンド） ← localhost:8000
    ↕ SQL
MySQL（データベース）  ← localhost:3306
```

**3つの役割：**

| 役割 | 技術 | 一言説明 |
|------|------|---------|
| 画面を作る | React | ユーザーが実際に見るHTML/CSS/JS |
| 処理・ルール | Django | データの管理・ログイン認証・APIの提供 |
| データの保存 | MySQL | 拡張パック情報を永続的に保存するDB |

---

## クローリングって何をしたの？

### クローリングとは？
プログラムが自動でWebサイトを読み込んで、必要な情報だけを抜き出す処理です。  
人間がブラウザで「右クリック → コピー」を繰り返すのを、自動化したイメージです。

### 今回の対象サイト
`https://pokemoncard.co.kr/card/category/info1`

このページのHTMLを取得して、商品名と画像URLを抽出しました。

### HTMLの実際の構造（抜粋）
サイトのHTMLはこんな構造になっていました：

```html
<div class="point">
  <div class="white-panel-img">
    <img src="https://data1.pokemonkorea.co.kr/.../ninja.png">
  </div>
  MEGA 확장팩 「닌자스피너」
</div>
```

`div.point` というブロックが商品1件に対応していて、  
その中に `img`（画像）とテキスト（商品名）が入っていました。

### クローラーのコード（`backend/cards/crawler.py`）

```python
# 一覧ページを取得
res = requests.get('https://pokemoncard.co.kr/card/category/info1')
soup = BeautifulSoup(res.text, 'html.parser')

# div.point を全部探す
for point in soup.find_all('div', class_='point'):
    img = point.find('img')        # 画像タグを取得
    name = point.get_text()        # テキスト（商品名）を取得
    img_src = img['src']           # 画像のURLを取得
```

**使ったライブラリ：**

- `requests` → URLにアクセスしてHTMLを取得する（ブラウザの代わり）
- `BeautifulSoup` → 取得したHTMLを解析して必要な部分だけ抜き出す

### なぜ価格が取れなかったの？

一覧ページには価格情報がHTMLに含まれていませんでした。  
価格は `/card/887` のような**サブページ**に書いてあります。

```
https://pokemoncard.co.kr/card/887
→ MEGA 확장팩 「닌자스피너」
   가격 1,000원(1팩), 30,000원(1상자)
```

サブページには一覧からリンクがなかったため、  
IDを 890 → 889 → 888 ... と**1つずつスキャン**して価格を取っています。  
（これが今バックグラウンドで動いている `run_price_scan()` です）

---

## Django（バックエンド）の仕組み

### ファイル構成
```
backend/
├── config/
│   ├── settings.py   ← DBやインストールアプリの設定
│   └── urls.py       ← URLとViewの対応表
├── cards/
│   ├── models.py     ← DBのテーブル定義
│   ├── serializers.py← データをJSON形式に変換する設定
│   ├── views.py      ← APIの処理
│   ├── urls.py       ← cardsアプリのURL設定
│   ├── crawler.py    ← クローリングスクリプト
│   └── admin.py      ← 管理画面の設定
└── venv/             ← Pythonの仮想環境（ライブラリ置き場）
```

### DBテーブル（`models.py`）

```python
class ExpansionPack(models.Model):
    serial_code = models.CharField(...)   # シリアルコード（手動入力）
    name        = models.CharField(...)   # 확장팩명
    price1      = models.IntegerField()   # 가격1（1パック）
    price2      = models.IntegerField()   # 가격2（1ボックス）
    quantity    = models.IntegerField()   # 수량
    img_src     = models.URLField(...)    # 画像URL
```

これが MySQL の `expansion_packs` テーブルに対応しています。  
Djangoが自動でSQLを生成するので、SQLを直接書かなくていいです。

### APIエンドポイント

| URL | メソッド | 説明 |
|-----|---------|------|
| `/api/token/` | POST | ログイン → JWTトークンを返す |
| `/api/packs/` | GET | 全拡張パック一覧を返す |

#### JWTとは？
ログインすると**トークン（長い文字列）**が発行されます。  
以降のAPIリクエストはそのトークンを一緒に送ることで「このユーザーは認証済み」と証明します。  
パスワードを毎回送らなくて済む安全な仕組みです。

```
1. POST /api/token/ にユーザー名とパスワードを送る
   → "eyJhbGciOi..." というトークンが返ってくる

2. GET /api/packs/ のヘッダーに↑のトークンを添付
   → 認証OKなら商品データが返ってくる
```

---

## React（フロントエンド）の仕組み

### ファイル構成
```
frontend/src/
├── App.jsx              ← 画面のルーティング（URL→どの画面か）
├── api/
│   └── client.js        ← DjangoへのAPI通信設定
├── pages/
│   ├── LoginPage.jsx    ← ログイン画面
│   └── PacksPage.jsx    ← 商品一覧画面
└── components/
    └── PackCard.jsx     ← 商品1件のカードUI
```

### 画面の流れ

```
アクセス
  ↓
ログインしてる？ → NO → /login（ログイン画面）
  ↓ YES
/（商品一覧画面）
  ↓
DjangoのAPIから商品データを取得
  ↓
PackCard を125枚グリッド表示
```

### `client.js` の役割

```javascript
// トークンをlocalStorageから取り出してリクエストに自動付与
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

毎回手動でトークンを添付しなくていいように、  
リクエストを送る直前に自動でトークンを付ける設定です。

### モバイル対応（レスポンシブデザイン）

CSSの `@media` クエリを使って画面サイズに応じてレイアウトを変えています。

```css
/* PC: 1列あたり最小200px で自動調整（5〜6列になる） */
.packs-grid {
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}

/* スマホ: 強制的に2列 */
@media (max-width: 600px) {
  .packs-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## 今後の課題

| 項目 | 状況 | 対応方法 |
|------|------|---------|
| 価格 | スキャン中（バックグラウンド） | 完了後に自動反映 |
| シリアルコード | 未入力 | `localhost:8000/admin` から手動入力 |
| 数量 | 全て0 | Admin画面から手動入力 |

---

## 開発時の起動方法（まとめ）

```bash
# MySQLを起動（初回のみ or 再起動後）
brew services start mysql

# Djangoを起動
cd ~/Desktop/pokemon-inventory/backend
source venv/bin/activate
python manage.py runserver

# Reactを起動（別ターミナルで）
cd ~/Desktop/pokemon-inventory/frontend
npm run dev
```

- React画面: http://localhost:5173
- Django管理画面: http://localhost:8000/admin
