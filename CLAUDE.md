# CLAUDE.md

このファイルは、本リポジトリを編集する際の開発ガイドです。

## Project Overview

英文の暗号文の頻度分析と手動解読を支援する静的Webツールです。
「生成AIで作るセキュリティツール100」のDay009です。ビルドとnpm依存はありません。

## Development Commands

ビルドせずに開発できます。

- ローカル確認：`index.html`をfile://で直接開く。外部通信なしで全機能が動く。
- HTTP確認：`python -m http.server 8000`で配信する。
- テスト：Node 22以上で`npm test`（node --test、依存なし）を実行する。

## Code Architecture

### Core Components

**HTML Structure (`index.html`)**

- 暗号文の入力欄と統計パネル
- 頻度表、SVG比較グラフ、n-gramパネル
- システム推測と手動調整を並べた文字マッピング表
- 変更ハイライト付きの解読結果

**純粋ロジック（`freq-logic.js`）**

- 定数：`ENGLISH_FREQ`、`ETAOIN_ORDER`
- 集計：`analyzeText`、`indexOfCoincidence`、`classifyIC`、`isICReliable`
- 語内の集計：`wordsOf`、`ngramCounts`、`doubledLetters`
- マッピング：`systemGuess`、`candidatesFor`、`mergeMapping`、`decodeWithMapping`
- URLパラメーター：`readTextParam`（URLSearchParamsを受け取る）

DOMを参照せず、古典スクリプトの`globalThis.FrequencyLogic`とCommonJSから使えます。
ES moduleにはしません。

**DOM処理（`main.js`）**

- `analyze()`：純粋ロジックの結果で統計・頻度表・n-gramを更新する。
- `generateSystemGuess()`：ETAOIN推測を適用し、manualCharsの編集値を保持する。
- `createMappingTable()`：名前付き入力欄と候補列をDOMで構築する。
- `decodeText()`：復号結果と変更ハイライトを更新する。
- `drawFrequencyChart()`：観測％の棒、背景色の下線、期待％のマーカーを描く。
- テーマ・ヘルプ・コピー：保存値の検証、Escで閉じるヘルプ、手動コピーへの代替処理

**その他のファイル**

- `style.css`：ライト・ダークのCSS変数、768px以下の1カラム表示
- `test/`：freq-logic・urlparam・readme・html・contrast・formatの6ファイル
- `.github/workflows/test.yml`：pushとpull_requestでNode 22のテスト
- `package.json`：npm testコマンド
- `assets/`：画像4枚と既存のDocswellサムネイル
- `LICENSE`：Copyright (c) 2025 ipusironのMITライセンス

**Data Flow**:

1. 入力した暗号文を`analyze()`で処理する。
2. 純粋ロジックで頻度・IC・n-gramを集計して表示する。
3. ETAOIN推測を生成し、手動編集済みの文字は保持する。
4. 入力欄の変更に応じて、全行の候補と重複表示を更新する。
5. 復号結果を更新し、変化した場合に背景で示す。

### Key Features

- 頻度分析：観測回数・観測％と英語標準頻度の比較
- ETAOIN対応付け：英語頻度順位に基づく機械的な出発点
- 手動マッピング：再分析時の保持と重複検出
- 即時プレビュー：編集ごとの復号結果更新
- 視覚的フィードバック：SVGグラフと変更ハイライト

頻度分析は大文字の暗号文だけを対象とし、小文字は確定平文として扱います。
IC・n-gramも大文字だけを集計し、小文字はn-gramの区切りにします。
例：`ABcDE`の二重字は`AB`と`DE`だけで、`BD`は数えません。
ICの30字境界は低信頼を示す目安です。システム推測のETAOIN順は変更しません。
リセットはmanualCharsを消して推測に戻し、クリアはすべて初期化します。

### Safety Rules

- 入力を外部送信せず、依存・CDN・fetchを追加しない。
- localStorageには検証済みのテーマだけを保存する。
- CSPのmetaにframe-ancestorsを書かない。metaでは適用されないためである。
- 頻度表や期待値を変更するときはnpm testを通す。期待値の書き換えだけで通さない。
- 初期暗号文とETAOIN方式、既存Docswell画像を保持する。

### Security Tool Context

学習用の古典暗号の解析を支援します。

- シーザー暗号の分析
- 単一換字式暗号の解読
- 列分割後のヴィジュネル暗号の分析
- 暗号の教育用デモ

## URL Parameter Support

URLパラメーターから暗号文を読み込めます。

- パラメーター：`?text=<URL-encoded-text>`
- 上限：5,000文字
- `URLSearchParams.get`の値をそのまま使い、二重デコードしない。超過は画面に警告する。
- 例：`index.html?text=LW%20LV%20LPSRVVLEOH`

Modular Text Dividerなど、同シリーズのツールから暗号文を渡す際に使用します。

## Related Tools

関連ツールと組み合わせて古典暗号を解析できます。

- Caesar Cipher Wheel：暗号文の作成
- Modular Text Divider（Day030）：ヴィジュネル暗号文の列分割
- IC Learning Visualizer（Day047）：一致指数の理解
- Cipher Clairvoyance（Day044）：暗号方式の推測
- AlphaLoom（Day046）：鍵文字列の分析
