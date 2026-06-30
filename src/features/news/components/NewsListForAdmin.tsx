"use client";
import { API_URL } from '@/lib/apiUrl';

import { useRouter } from "next/navigation";
import { NewsDto, NewsPageDto } from "@/features/news/types";
import { convertDateString } from "@/lib/dateUtil";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useEffect, useState, useCallback } from "react";
import { GRADIENT_PRIMARY, GRADIENT_PRIMARY_HOVER, GRADIENT_ACCENT } from "@/lib/gradients";
import { pageContainer } from "@/lib/pageLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function NewsList() {
	const router = useRouter();

	// 検索フィルターの開閉
	const [isOpen, setIsOpen] = useState(false);

	// 検索フィルター：タイトル
	const [title, setTitle] = useState("");

	// 検索フィルター：作成日 From
	const [createdDateFrom, setCreatedDateFrom] = useState("");

	// 検索フィルター：作成日 To
	const [createdDateTo, setCreatedDateTo] = useState("");

	// 検索フィルター作成日に関するエラーメッセージ
	const [createdDateErrorMessage, setCreatedDateErrorMessage] = useState<string | null>(null);

	// ページング情報：1ページで表示する件数
	const [pageSize, setPageSize] = useState(10);

	// ページング情報：ページ番号
	const [pageNum, setPageNum] = useState(1);

	// ページング情報：合計ページ数
	const [totalPageNum, setTotalPageNum] = useState(1);

	// お知らせリスト
	const [newsDtos, setNewsDtos] = useState<NewsDto[]>([]);

	// お知らせ一覧取得API
	const {
		executeApi: executeFindNewsApi,
		isLoading: isLoadingFindNewsApi,
		isError: isErrorFindNewsApi
	} = useApiRequest();

	// お知らせ削除API
	const { executeApi: executeDeleteNewsApi } = useApiRequest();

	// お知らせ詳細画面に遷移する
	const toNewsDetailPage = (newsId: number) => {
		router.push(`/admin/news/${newsId}/edit`);
	};

	// お知らせを削除し、最新のお知らせ一覧を取得する
	const deleteAndFetchNews = async (e: React.MouseEvent, newsId: number) => {
		e.stopPropagation();
		const res = await executeDeleteNewsApi(
			`${API_URL}/api/news/${newsId}`,
			"DELETE"
		);
		if (!res?.ok) {
			alert("削除に失敗しました");
			return;
		}

		if (pageNum === 1) {
			fetchNews(1, pageSize);
		} else {
			// pageNumが1以外から1に変更されたらuseEffectにより、fetchNewsが実行される。
			setPageNum(1);
		}
	};

	// 該当ページのお知らせを検索する
	const fetchNews = useCallback(async (pageNum: number, pageSize: number) => {
		if (createdDateFrom && createdDateTo && createdDateFrom > createdDateTo) {
			setCreatedDateErrorMessage("作成日Fromは作成日Toより前の日付を入力してください。");
			return;
		}
		setCreatedDateErrorMessage("");

		// クエリパラメータ
		const queryParams = new URLSearchParams({
			title,
			createdDateFrom,
			createdDateTo,
			pageNum: pageNum.toString(),
			pageSize: pageSize.toString(),
		});
		const findNewsApiResponse = await executeFindNewsApi(
			`${API_URL}/api/news?${queryParams.toString()}`,
			"GET"
		);
		findNewsApiResponse?.json()?.then((newsPageDto: NewsPageDto) => {
			setNewsDtos(newsPageDto.newsDtos);
			setTotalPageNum(Math.ceil(newsPageDto.totalSize / newsPageDto.pageSize));
		});
	}, [title, createdDateFrom, createdDateTo]);

	// セレクトボックスの変更時に呼ばれるハンドラー
	const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newPageSize = Number(e.target.value);
		const newPageNum = 1;
		setPageSize(newPageSize);
		setPageNum(newPageNum);
	};

	// 1ページあたりの件数セレクトボックス変更時や、ページング時にお知らせ一覧取得を実行する。
	useEffect(() => {
		fetchNews(pageNum, pageSize);
	}, [pageNum, pageSize]);

	// ページネーション：前ページ遷移時の挙動
	const handlePrevPage = () => {
		const prevPage: number = pageNum - 1;
		setPageNum(prevPage);
	};

	// ページネーション：次ページ遷移時の挙動
	const handleNextPage = () => {
		const nextPage: number = pageNum + 1;
		setPageNum(nextPage);
	};

	if (isErrorFindNewsApi) return <ErrorMessage />;
	if (isLoadingFindNewsApi) return <LoadingSpinner />;

	return (
		<div className="min-h-screen bg-slate-50">
			<div className={`${pageContainer.adminNarrow} py-8`}>
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
					<div className="flex items-center gap-3">
						<span className={`block w-1 h-8 rounded-full bg-gradient-to-b ${GRADIENT_ACCENT} shrink-0`} />
						<h1 className="text-2xl font-bold text-slate-800">お知らせ一覧</h1>
					</div>
					<button
						onClick={() => router.push("/admin/news/new")}
						className={`bg-gradient-to-r ${GRADIENT_PRIMARY} text-white px-5 py-2.5 rounded-xl ${GRADIENT_PRIMARY_HOVER} transition-all text-sm font-semibold shadow-md shadow-indigo-200 whitespace-nowrap cursor-pointer self-start md:self-auto`}
					>
						＋ お知らせを新規作成
					</button>
				</div>

				{/* 検索フィルター */}
				<div className="mb-6 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
					<button
						onClick={() => setIsOpen(!isOpen)}
						className="w-full text-left px-5 py-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer"
					>
						<span className="text-sm font-semibold text-slate-700">検索条件</span>
						<span className="text-slate-400 text-sm">{isOpen ? "▲" : "▼"}</span>
					</button>
					{isOpen && (
						<div className="border-t border-slate-200 p-5 bg-white">
							<div className="mb-4">
								<label className="block text-sm font-medium text-slate-700 mb-1.5">タイトル</label>
								<input
									type="text"
									placeholder="タイトルで検索"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
								/>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1.5">作成日 From</label>
									<input
										type="date"
										value={createdDateFrom}
										onChange={(e) => setCreatedDateFrom(e.target.value)}
										className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1.5">作成日 To</label>
									<input
										type="date"
										value={createdDateTo}
										onChange={(e) => setCreatedDateTo(e.target.value)}
										className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
									/>
								</div>
								<div className="flex items-end">
									<button
										onClick={() => fetchNews(1, pageSize)}
										className={`bg-gradient-to-r ${GRADIENT_PRIMARY} text-white px-5 py-2.5 rounded-xl ${GRADIENT_PRIMARY_HOVER} transition-all cursor-pointer text-sm font-medium`}
									>
										検索
									</button>
								</div>
								{createdDateErrorMessage && (
									<div className="w-full md:col-span-3 text-red-500 text-sm">{createdDateErrorMessage}</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* 表示件数 */}
				<div className="flex items-center justify-end mb-3 text-sm text-slate-600">
					<label className="mr-2">1ページあたり：</label>
					<select
						value={pageSize}
						onChange={handlePageSizeChange}
						className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
					>
						<option value={10}>10件</option>
						<option value={20}>20件</option>
						<option value={30}>30件</option>
					</select>
				</div>

				{/* お知らせ一覧 */}
				<div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
					<ul className="divide-y divide-slate-100">
						{newsDtos.map((newsDto) => (
							<li
								key={newsDto.id}
								className="py-4 px-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
								onClick={() => toNewsDetailPage(`${newsDto.id}`)}
							>
								<div>
									<div className="text-xs font-medium text-slate-400 mb-1">
										{convertDateString(newsDto.createdAt)}
									</div>
									<div className="text-sm font-medium text-slate-700">
										{newsDto.title}
									</div>
								</div>
								<button
									onClick={(e) => deleteAndFetchNews(e, newsDto.id)}
									className="bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600 transition-colors cursor-pointer text-sm font-medium ml-4 shrink-0"
								>
									削除
								</button>
							</li>
						))}
					</ul>
				</div>

				{/* ページネーション */}
				<div className="flex items-center justify-center mt-6 pb-6 gap-3">
					<button
						onClick={handlePrevPage}
						disabled={pageNum == 1}
						className="px-4 py-1.5 text-sm font-medium bg-white border border-blue-200 text-blue-600 rounded-xl enabled:hover:bg-blue-50 enabled:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
					>
						前へ
					</button>
					<span className="text-sm font-medium text-slate-600">
						{pageNum} / {totalPageNum} ページ
					</span>
					<button
						onClick={handleNextPage}
						disabled={pageNum === totalPageNum}
						className="px-4 py-1.5 text-sm font-medium bg-white border border-blue-200 text-blue-600 rounded-xl enabled:hover:bg-blue-50 enabled:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
					>
						次へ
					</button>
				</div>
			</div>
		</div>
	);
}
