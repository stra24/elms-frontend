# eラーニング管理システム（ELMS） — フロントエンド

受講生がコース・レッスンを学習し、管理者がコンテンツ・ユーザー・お知らせを管理できる eラーニングプラットフォームのフロントエンドです。

## 技術スタック

| 分類 | 技術 |
|---|---|
| フレームワーク | Next.js 15.5.18（App Router） |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| 認証 | JWT（HttpOnly Cookie）+ userRole Cookie |

## 画面一覧

### 一般ユーザー画面（要ログイン）

| URL | 説明 |
|---|---|
| /courses | コース一覧 |
| /courses/{courseId}/lesson-groups/{lessonGroupId}/lessons/{lessonId} | レッスン視聴 |
| /news | お知らせ一覧 |
| /news/{newsId} | お知らせ詳細 |
| /account | アカウント情報・パスワード変更 |

### 管理者画面（ADMIN ロール要ログイン）

#### コース管理
| URL | 説明 |
|---|---|
| /admin/courses | コース一覧・削除 |
| /admin/courses/new | コース新規作成 |
| /admin/courses/{courseId}/edit | コース編集 |
| /admin/courses/{courseId}/lesson-groups | レッスングループ一覧・並び順変更・削除 |
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
| /login | ログイン |
| /password | パスワードリセット申請 |
| /reset-password | パスワードリセット（メールリンクから遷移） |

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

1. `POST /api/login` → バックエンドが JWT（HttpOnly Cookie）と RefreshToken（HttpOnly Cookie）をセット
2. 以降のリクエストはブラウザが Cookie を自動送信（`credentials: 'include'`）
3. `userRole` Cookie（JS 書き込み可）にロールを保存 → ミドルウェアがページアクセス制御に使用
4. バックエンドの `@PreAuthorize` が API レベルで認可を保証

ログアウト時は `POST /api/logout` を呼びサーバー側で Cookie を削除します。

## プロジェクト構成

```
src/
├── app/                        # ページ（App Router）
│   ├── admin/                  # 管理者画面（コース / ユーザー / お知らせ）
│   ├── courses/                # コース・レッスン視聴
│   ├── news/                   # お知らせ
│   ├── account/                # アカウント設定
│   ├── login/                  # ログイン
│   ├── password/               # パスワードリセット申請
│   └── reset-password/         # パスワードリセット実行
├── components/                 # 共通 UI コンポーネント
│   ├── sidebar/
│   ├── page-title/
│   └── pagenation/
├── features/                   # 機能別モジュール
│   ├── course/                 # コース（型定義・コンポーネント）
│   ├── lesson/                 # レッスン
│   ├── news/                   # お知らせ
│   ├── user/                   # ユーザー
│   └── login/                  # ログイン
├── hooks/                      # カスタムフック
├── lib/                        # ユーティリティ（API URL・Cookie 操作）
├── constants/                  # 定数
├── types/                      # 共通型定義
└── middleware.ts                # ルートガード
```

## ビルド

```bash
npm run build
npm run start
```
