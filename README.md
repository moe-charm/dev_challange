# DEV Challenge Portfolio

DEV.to Frontend Challengeへの提出作品を集めたポートフォリオサイトです。

🌐 **Live Demo**: https://moe-charm.github.io/dev_challange/

## 📁 プロジェクト構成

```
dev_challange/
├── index.html              # チャレンジ一覧ページ
├── halloween/              # Halloween Challenge (2024)
│   ├── index.html
│   ├── game-bitecs.js
│   ├── style.css
│   ├── objects/
│   ├── systems/
│   └── ...
├── christmas/              # Coming Soon...
└── new-year/               # Coming Soon...
```

---

## 🎃 Halloween Town Explorer (2024)

JavaScriptとWeb Audio APIを使用した3Dレイキャスト技術のハロウィン探索＆逃走ゲーム。

**🎮 プレイ**: https://moe-charm.github.io/dev_challange/halloween/

### ゲーム内容

1. **フェーズ1: 魔女っこを探す** - マップを探索して魔女っこを見つける
2. **フェーズ2: かぼちゃ収集** - 5個のかぼちゃを集める
3. **フェーズ3: 魔女っこに報告** - 集めたかぼちゃを届けに行く
4. **フェーズ4: 裏切り** - 「実はあなたは生け贄なのよ！」
5. **フェーズ5: 逃走** - 30秒間敵から逃げ切る！

### 主な機能

- **3Dレイキャスト技術**を使用した疑似3D環境
- **25x25の広大なマップ**（5つのエリア: 幽霊屋敷、魔女の森、街、墓地、かぼちゃ畑）
- **11種類のハロウィンキャラクター**（詳細なスプライト描画）
- **敵AI**（プレイヤー追跡、壁回避、ゴーストは壁すり抜け）
- **HPシステム**（❤️×3、敵との接触でダメージ）
- **フェーズベースのゲーム進行**
- **勝利演出**（フェードアウト＋パーティクル）
- **星空と月**のある美しい夜空
- Web Audio APIによる効果音・足音・環境音
- ミニマップ（敵の位置表示付き）

### 操作方法

- **↑↓←→ キー** - 移動
- **S キー** - 音のオン/オフ
- **A キー** - 環境音の切り替え
- **画面クリック** - 音を有効化

### 技術スタック

- 純粋なJavaScript (ES6+)
- HTML5 Canvas（2D描画）
- Web Audio API
- **3Dレイキャスト技術**（Wolfenstein 3D方式）
- **Z-バッファ**（深度管理、壁貫通防止）
- **bitECS** - 超軽量・高速ECSライブラリ (~5KB)
- **スプライト描画システム**（距離ソート）
- **敵AIシステム**（プレイヤー追跡、壁回避）

### パフォーマンス最適化

- レイキャスト数制限（最大240レイ）
- レンダリング50FPS制限
- スプライトキャッシング
- ミニマップ更新10FPS制限
- グラデーション/Z-バッファの再利用
- 星の数削減（40個）

### ファイル構造

```
halloween/
├── index.html          # メインHTML
├── style.css           # スタイルシート
├── map.js              # マップデータ（25x25）
├── ecs-bitecs.js       # bitECSコンポーネント定義
├── game-bitecs.js      # メインゲームロジック
├── sounds.js           # 音効果管理
├── objects/            # スプライト描画
│   ├── index.js        # スプライトシステム
│   ├── ghost.js        # おばけ
│   ├── pumpkin.js      # かぼちゃ
│   ├── witch.js        # 魔女
│   ├── lantern.js      # ランタン
│   ├── bat.js          # コウモリ
│   ├── cat.js          # 黒猫
│   ├── skeleton.js     # 骸骨
│   └── witch-girl.js   # 魔女っこ（案内役）
└── systems/
    └── input-bitecs.js # 入力システム
```

---

## 🎄 Coming Soon...

次回のDEVチャレンジをお楽しみに！

---

## 🚀 ローカルで実行

```bash
# リポジトリをクローン
git clone git@github.com:moe-charm/dev_challange.git
cd dev_challange

# ローカルHTTPサーバーを起動
python3 -m http.server 8000

# ブラウザで開く
open http://localhost:8000
```

---

## 📝 ライセンス

MIT License

---

## 👤 Author

**moe-charm**
- GitHub: [@moe-charm](https://github.com/moe-charm)
- DEV.to: [@moe-charm](https://dev.to/moe-charm)
