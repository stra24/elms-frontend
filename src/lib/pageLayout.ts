/** ページ見出しとメインコンテンツで共通利用するコンテナクラス */
export const pageContainer = {
	narrow: "max-w-[800px] mx-auto px-4",
	adminNarrow: "max-w-[800px] mx-auto px-6",
	medium: "max-w-3xl mx-auto px-6",
	wide: "max-w-[1100px] mx-auto px-6",
	adminWide: "max-w-[1500px] mx-auto px-6",
} as const;

/** 管理画面サイドバー見出しと PageTitle（embedded）の高さ */
export const adminHeaderHeight = "h-[88px]";
