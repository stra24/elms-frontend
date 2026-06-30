# eラーニング管理システム（ELMS） — フロントエンド

受講生がコース・レッスンを学習し、管理者がコンテンツ・ユーザー・お知らせを管理できる eラーニングプラットフォームのフロントエンドです。

## 技術スタック

| 分類 | 技術 |
|---|---|
| フレームワーク | Next.js 15.5.18（App Router / Turbopack） |
| UI ライブラリ | React 19 |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS 4 |
| データ取得 | SWR / fetch（`useApiRequest` フック） |
| リッチテキスト | TipTap（レッスン本文編集） |
| 認証 | JWT Cookie（JS から読み取り可）+ RefreshToken Cookie（HttpOnly）+ userRole Cookie |

## 画面一覧

### 一般ユーザー画面（要ログイン）

| URL | 説明 |
|---|---|
| /courses | ホーム（受講コース一覧・お知らせサマリー） |
| /courses/{courseId}/lesson-groups/{lessonGroupId}/lessons/{lessonId} | レッスン視聴（サイドバーでレッスン切り替え） |
| /news | お知らせ一覧 |
| /news/{newsId} | お知らせ詳細 |
| /account | アカウント情報・パスワード変更 |

> ミドルウェアにより、`/courses` と `/news` は **GENERAL ロール** のみアクセスできます。ADMIN でログインしている場合は `/admin/courses` へリダイレクトされます。

### 管理者画面（ADMIN ロール要ログイン）

#### コース管理
| URL | 説明 |
|---|---|
| /admin/courses | コース一覧・削除・全レッスン CSV エクスポート |
| /admin/courses/new | コース新規作成 |
| /admin/courses/{courseId}/edit | コース編集 |
| /admin/courses/{courseId}/lesson-groups | レッスングループ管理（作成・編集・削除）・レッスン並び順変更（ドラッグ&ドロップ） |
| /admin/courses/{courseId}/lesson-groups/{lessonGroupId}/lessons/new | レッスン新規作成 |
| /admin/courses/{courseId}/lesson-groups/{lessonGroupId}/lessons/{lessonId}/edit | レッスン編集 |

#### ユーザー管理
| URL | 説明 |
|---|---|
| /admin/users | ユーザー一覧・CSV インポート/エクスポート・削除 |
| /admin/users/new | ユーザー新規作成 |
| /admin/users/{userId}/edit | ユーザー編集 |

#### お知らせ管理
| URL | 説明 |
|---|---|
| /admin/news | お知らせ一覧・削除 |
| /admin/news/new | お知らせ新規作成 |
| /admin/news/{newsId}/edit | お知らせ編集 |

### 認証関連（認証不要）

| URL | 説明 |
|---|---|
| / | `/login` へリダイレクト |
| /login | ログイン |
| /password | パスワードリセット申請 |
| /reset-password?token=... | パスワードリセット（メールリンクから遷移） |

## 前提条件

- Node.js 20 以上
- バックエンドが起動済みであること（デフォルト: http://localhost:8080）

## セットアップ

### 1. 依存パッケージをインストール

```bash
npm install
```

### 2. 環境変数ファイルを作成

```bash
cp .env.dev.example .env
```

`.env` の内容：

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SERVER_HOST=localhost
```

`NEXT_PUBLIC_SERVER_HOST` は Next.js Image 最適化で許可するホスト名です。

### 3. 開発サーバーを起動

```bash
npm run dev
```

アプリケーションは **http://localhost:3000** で起動します。

## ログイン情報

バックエンドのシードデータに含まれる初期アカウントです。

| メールアドレス | パスワード | ロール | ログイン後の遷移先 |
|---|---|---|---|
| kanri@test.com | password | ADMIN | /admin/courses |
| ippan@test.com | password | GENERAL | /courses |

## 認証フロー

1. `POST /api/auth/login` → バックエンドが **JWT Cookie**（JS から読み取り可）と **RefreshToken Cookie**（HttpOnly）をセット
2. 以降の API リクエストでは、JWT を `Authorization: Bearer <token>` ヘッダーに付与し、Cookie は `credentials: 'include'` で送信
3. ログイン成功後、ユーザー API から取得したロールを `userRole` Cookie（JS 書き込み可、`ADMIN` / `GENERAL`）に保存 → ミドルウェアがページアクセス制御に使用
4. JWT の有効期限切れ時は `GET /api/auth/refresh` で再発行（RefreshToken Cookie を利用）
5. バックエンドの `@PreAuthorize` が API レベルで認可を保証

ログアウト時は `POST /api/auth/logout` を呼びサーバー側で Cookie を削除します。

## コーディング規約（フロントエンド）

### はじめに

本プロジェクトでは、保守性・拡張性の高いシステムを目指し、以下のルールに基づいて設計と実装を行います。

### ディレクトリ構成

```
src/
├── app/                  # ルーティング・ページ定義
├── components/           # グローバルで使う再利用可能な UI 部品
├── constants/            # 定数、設定値など
├── features/             # ドメイン単位の UI / ロジック
│   └── {ドメイン名}/     # 例: user, course, lesson, news, login
│       ├── components/   # 該当ドメインに関する再利用可能な UI 部品
│       ├── hooks/        # 該当ドメインに関するカスタムフック
│       ├── types.ts      # 該当ドメインに関する型定義
│       └── utils.ts      # 該当ドメインに関するユーティリティ関数
├── hooks/                # グローバルで使うカスタムフック
├── lib/                  # グローバルで使うライブラリ、ユーティリティ
├── types/                # グローバルで使う型
└── middleware.ts         # ルートガード（Next.js ミドルウェア）
```

| ディレクトリ | 役割 |
|---|---|
| `app/` | Next.js App Router のルーティング・ページ定義 |
| `components/` | 複数ドメインから参照する共通 UI 部品（Header、サイドバー、ページネーション等） |
| `constants/` | アプリ全体で共有する定数・設定値 |
| `features/{ドメイン名}/` | ドメイン単位に UI とロジックをまとめる。ページ（`app/`）から呼び出す |
| `features/{ドメイン名}/components/` | そのドメイン専用の UI 部品 |
| `features/{ドメイン名}/hooks/` | そのドメイン専用のカスタムフック |
| `features/{ドメイン名}/types.ts` | そのドメインの DTO 型・画面用の型定義 |
| `features/{ドメイン名}/utils.ts` | そのドメイン専用のユーティリティ関数 |
| `hooks/` | ドメイン横断で使うカスタムフック（例: `useApiRequest`） |
| `lib/` | API URL、Cookie 操作、日付変換など横断的なユーティリティ |
| `types/` | 複数ドメインで共有する型定義 |

**配置の目安**

- 1 ドメイン内だけで完結するもの → `features/{ドメイン名}/` 配下
- 2 ドメイン以上から使うもの → `components/`・`hooks/`・`lib/`・`types/`・`constants/`

### 現状のプロジェクトとの差分

規約上の配置先のうち、以下は現時点では未作成または一部ドメインのみ整備されています。新規追加時は上記規約に従ってください。

| パス | 現状 |
|---|---|
| `constants/` | 未作成 |
| `types/`（グローバル） | 未作成（型は各 `features/*/types.ts` に配置） |
| `features/*/hooks/` | 未作成 |
| `features/*/utils.ts` | 未作成（`lesson/lessonNavigation.ts` 等、ドメイン直下に置かれているものあり） |
| `features/login/types.ts` | 未作成 |

## プロジェクト構成（現状）

```
src/
├── app/                        # ページ（App Router）
│   ├── admin/                  # 管理者画面
│   ├── courses/                # コース・レッスン視聴
│   ├── news/                   # お知らせ
│   ├── account/                # アカウント設定
│   ├── login/                  # ログイン
│   ├── password/               # パスワードリセット申請
│   └── reset-password/         # パスワードリセット実行
├── components/                 # 共通 UI（Header, AdminLayout, sidebar 等）
├── features/                   # ドメイン別モジュール
│   ├── course/                 # components/, types.ts
│   ├── lesson/                 # components/, types.ts, lessonNavigation.ts
│   ├── news/                   # components/, types.ts
│   ├── user/                   # components/, types.ts
│   └── login/                  # components/
├── hooks/                      # useApiRequest.ts
├── lib/                        # apiUrl, jwtUtil, dateUtil 等
└── middleware.ts               # ルートガード
```

## ビルド

```bash
npm run build
npm run start
```

## Lint

```bash
npm run lint
```
