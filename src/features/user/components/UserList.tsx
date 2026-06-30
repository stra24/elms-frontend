"use client";
import { API_URL } from '@/lib/apiUrl';

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserDto, UserImportResponseDto, UserPageDto } from "@/features/user/types";
import { convertDateTimeString } from "@/lib/dateUtil";
import Thumbnail from "@/components/Thumbnail";
import { useApiRequest } from "@/hooks/useApiRequest";
import { GRADIENT_PRIMARY, GRADIENT_PRIMARY_HOVER, GRADIENT_ACCENT } from "@/lib/gradients";
import { pageContainer } from "@/lib/pageLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

export type UserSearchCondition = {
	userId?: number;
	userRole?: "ADMIN" | "GENERAL" | "";
	realName?: string;
	userName?: string;
	emailAddress?: string;
	createdDateFrom?: string; // yyyy-MM-dd
	createdDateTo?: string;
};

export default function UserList() {
	const router = useRouter();
	const csvFileInputRef = useRef<HTMLInputElement>(null);

	const [isOpen, setIsOpen] = useState(false);
	const [showImportConfirmDialog, setShowImportConfirmDialog] = useState(false);

	// 検索条件
	const [cond, setCond] = useState<UserSearchCondition>({});
	const [dateError, setDateError] = useState<string | null>(null);

	const userRoleOptions = [
		{ value: "", label: "全て" },
		{ value: "ADMIN", label: "管理者" },
		{ value: "GENERAL", label: "一般" },
	];

	// ユーザーリスト取得API
	const {
		executeApi: executeFindUsersApi,
		isLoading: isLoadingFindUsersApi,
		isError: isErrorFindUsersApi,
	} = useApiRequest();

	// ユーザー削除API
	const {
		executeApi: executeDeleteUserApi,
	} = useApiRequest();

	// ユーザー情報CSV出力API
	const {
		executeApi: executeExportUsersCsvApi,
		isLoading: isLoadingExportUsersCsvApi,
		isError: isErrorExportUsersCsvApi,
	} = useApiRequest();

	// ユーザー情報CSV取込API
	const {
		executeApi: executeImportUsersCsvApi,
		isLoading: isLoadingImportUsersCsvApi,
		isError: isErrorImportUsersCsvApi,
	} = useApiRequest();

	// 1ページで表示する件数
	const [pageSize, setPageSize] = useState(10);

	// ページ番号
	const [pageNum, setPageNum] = useState(1);

	// 合計ページ数
	const [totalPageNum, setTotalPageNum] = useState(1);

	// ユーザーDTOリスト
	const [userDtos, setUserDtos] = useState<UserDto[]>([]);

	// ユーザー詳細画面に遷移する関数
	const toUserDetailView = (id: number) => {
		router.push(`/admin/users/${id}/edit`);
	};

	// ユーザーを削除し、最新のユーザー一覧を取得する
	const deleteAndFetchUsers = async (e: React.MouseEvent, userId: number) => {
		e.stopPropagation();
		const res = await executeDeleteUserApi(
			`${API_URL}/api/users/${userId}`,
			"DELETE"
		);
		if (!res?.ok) {
			alert("削除に失敗しました");
			return;
		}

		if (pageNum === 1) {
			fetchUsers(1, pageSize);
		} else {
			// pageNumが1以外から1に変更されたらuseEffectにより、fetchUsersが実行される。
			setPageNum(1);
		}
	};

	// 検索フィルターの内容を更新する
	const update = <K extends keyof UserSearchCondition>(
		key: K,
		value: UserSearchCondition[K]
	) => setCond((prev) => ({ ...prev, [key]: value }));

	// 該当ページのユーザーを検索する
	const fetchUsers = useCallback(async (pageNum: number, pageSize: number) => {
		if (cond.createdDateFrom && cond.createdDateTo && cond.createdDateFrom > cond.createdDateTo) {
			setDateError("作成日Fromは作成日Toより前の日付を入力してください。");
			return;
		}
		setDateError("");

		// クエリパラメータ
		const queryParams = new URLSearchParams({
			userId: cond.userId ? cond.userId.toString() : "",
			userRole: cond.userRole ? cond.userRole : "",
			realName: cond.realName ? cond.realName : "",
			userName: cond.userName ? cond.userName : "",
			emailAddress: cond.emailAddress ? cond.emailAddress : "",
			createdDateFrom: cond.createdDateFrom ? cond.createdDateFrom : "",
			createdDateTo: cond.createdDateTo ? cond.createdDateTo : "",
			pageNum: pageNum.toString(),
			pageSize: pageSize.toString(),
		});
		const findUsersApiResponse = await executeFindUsersApi(
			`${API_URL}/api/users?${queryParams.toString()}`,
			"GET"
		);
		findUsersApiResponse?.json()?.then((userPageDto: UserPageDto) => {
			setUserDtos(userPageDto.userDtos ?? []);
			setTotalPageNum(Math.ceil(userPageDto.totalSize / userPageDto.pageSize));
		});
	}, [cond]);

	// ユーザー情報CSV出力ボタン押下時に呼ばれるハンドラー
	const handleExportUsersCsv = async () => {
		try{
			const response = await executeExportUsersCsvApi(`${API_URL}/api/users/export`, "GET");
			if(!response) return;
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "users.csv"; 
			a.click();
			window.URL.revokeObjectURL(url);
		} catch(error){
			console.error("UsersCsv出力エラー:", error);
		}
	}

	const handleImportButtonClick = () => {
		setShowImportConfirmDialog(true);
	};

	const handleImportConfirm = () => {
		setShowImportConfirmDialog(false);
		csvFileInputRef.current?.click();
	};

	const handleImportCancel = () => {
		setShowImportConfirmDialog(false);
	};

	const handleCsvFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const formData = new FormData();
		formData.append("file", file);

		try {
			const response = await executeImportUsersCsvApi(
				`${API_URL}/api/users/import`,
				"POST",
				formData
			);

			if (!response?.ok) {
				alert("CSV取込に失敗しました");
				return;
			}

			const result: UserImportResponseDto = await response.json();
			alert(`${result.importedCount}件のユーザーを取り込みました`);

			if (pageNum === 1) {
				fetchUsers(1, pageSize);
			} else {
				setPageNum(1);
			}
		} catch (error) {
			console.error("CSV取込エラー:", error);
			alert("CSV取込中にエラーが発生しました");
		} finally {
			e.target.value = "";
		}
	};

	// セレクトボックスの変更時に呼ばれるハンドラー
	const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newPageSize = Number(e.target.value);
		const newPageNum = 1;
		setPageSize(newPageSize);
		setPageNum(newPageNum);
	};

	// 1ページあたりの件数セレクトボックス変更時や、ページング時にユーザー一覧取得を実行する。
	useEffect(() => {
		fetchUsers(pageNum, pageSize);
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

	if (isErrorFindUsersApi) return <ErrorMessage />;
	if (isLoadingFindUsersApi) return <LoadingSpinner />;

	return (
		<div className="min-h-screen bg-slate-50">
			<div className={`${pageContainer.adminWide} py-8`}>
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
					<div className="flex items-center gap-3">
						<span className={`block w-1 h-8 rounded-full bg-gradient-to-b ${GRADIENT_ACCENT} shrink-0`} />
						<h1 className="text-2xl font-bold text-slate-800">ユーザー一覧</h1>
					</div>
					<div className="flex flex-wrap gap-2">
						<input
							ref={csvFileInputRef}
							type="file"
							accept=".csv,text/csv"
							className="hidden"
							onChange={handleCsvFileSelected}
						/>
						<button
							onClick={handleExportUsersCsv}
							className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 whitespace-nowrap hover:cursor-pointer text-sm font-medium transition-colors disabled:opacity-50"
							disabled={isLoadingExportUsersCsvApi}
						>
							{isLoadingExportUsersCsvApi ? "出力中..." : "CSV出力"}
						</button>
						{isErrorExportUsersCsvApi && (
							<p className="text-red-500 text-sm self-center">CSV出力に失敗しました</p>
						)}
						<button
							onClick={handleImportButtonClick}
							className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 whitespace-nowrap hover:cursor-pointer text-sm font-medium transition-colors disabled:opacity-50"
							disabled={isLoadingImportUsersCsvApi}
						>
							{isLoadingImportUsersCsvApi ? "取込中..." : "CSV取込"}
						</button>
						{isErrorImportUsersCsvApi && (
							<p className="text-red-500 text-sm self-center">CSV取込に失敗しました</p>
						)}
						<button
							onClick={() => router.push("/admin/users/new")}
							className={`bg-gradient-to-r ${GRADIENT_PRIMARY} text-white px-5 py-2.5 rounded-xl ${GRADIENT_PRIMARY_HOVER} transition-all whitespace-nowrap hover:cursor-pointer text-sm font-semibold shadow-md shadow-indigo-200`}
						>
							＋ ユーザー登録
						</button>
					</div>
				</div>

				{/* 検索フィルター */}
				<div className="mb-6 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
					<button
						onClick={() => setIsOpen(!isOpen)}
						className="w-full text-left px-5 py-3.5 flex justify-between items-center hover:bg-slate-50 transition-colors hover:cursor-pointer"
					>
						<span className="text-sm font-semibold text-slate-700">検索条件</span>
						<span className="text-slate-400 text-sm">{isOpen ? "▲" : "▼"}</span>
					</button>
					{isOpen && (
						<div className="border-t border-slate-200 p-5 bg-white space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1.5">ユーザーID</label>
									<input
										type="number"
										min="1"
										value={cond.userId ?? ""}
										onChange={(e) => update("userId", e.target.value ? Number(e.target.value) : undefined)}
										className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-slate-700 mb-1.5">権限</label>
									<select
										value={cond.userRole ?? ""}
										onChange={(e) => update("userRole", e.target.value as "ADMIN" | "GENERAL" | "")}
										className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
									>
										{userRoleOptions.map((o) => (
											<option key={o.value} value={o.value}>{o.label}</option>
										))}
									</select>
								</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								{[["氏名", "realName"], ["ユーザー名", "userName"], ["メールアドレス", "emailAddress"]].map(([label, key]) => (
									<div key={key}>
										<label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
										<input
											type="text"
											value={cond[key as keyof UserSearchCondition] ?? ""}
											onChange={(e) => update(key as keyof UserSearchCondition, e.target.value)}
											className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
										/>
									</div>
								))}
							</div>
							<div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
								{["From", "To"].map((suffix) => (
									<div key={suffix}>
										<label className="block text-sm font-medium text-slate-700 mb-1.5">作成日 {suffix}</label>
										<input
											type="date"
											value={suffix === "From" ? cond.createdDateFrom ?? "" : cond.createdDateTo ?? ""}
											onChange={(e) => update(suffix === "From" ? "createdDateFrom" : "createdDateTo", e.target.value)}
											className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
										/>
									</div>
								))}
								<button
									onClick={() => fetchUsers(1, pageSize)}
									className={`bg-gradient-to-r ${GRADIENT_PRIMARY} text-white px-5 py-2.5 rounded-xl ${GRADIENT_PRIMARY_HOVER} transition-all cursor-pointer text-sm font-medium`}
								>
									検索
								</button>
								{dateError && <div className="md:col-span-3 text-red-500 text-sm">{dateError}</div>}
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

				{/* テーブル */}
				<div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-slate-100">
							<thead className="bg-slate-50">
								<tr>
									{["ユーザーID", "サムネイル", "権限", "氏名", "メールアドレス", "ユーザー名", "作成日時", "最終ログイン日時", "進捗率", ""].map((h) => (
										<th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
									))}
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100 bg-white">
								{userDtos.map((user) => (
									<tr
										key={user.id}
										className="hover:bg-blue-50 cursor-pointer transition-colors whitespace-nowrap"
										onClick={() => toUserDetailView(user.id)}
									>
										<td className="px-4 py-3 text-sm text-slate-600">{user.id}</td>
										<td className="px-4 py-3">
											<div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200">
												{user.thumbnailUrl ? <Thumbnail thumbnailUrl={user.thumbnailUrl} alt="サムネイル" /> : <div className="w-full h-full bg-slate-100" />}
											</div>
										</td>
										<td className="px-4 py-3">
											<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${user.userRole === '管理者' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
												{user.userRole}
											</span>
										</td>
										<td className="px-4 py-3 text-sm text-slate-700">{user.realName}</td>
										<td className="px-4 py-3 text-sm text-slate-600">{user.emailAddress}</td>
										<td className="px-4 py-3 text-sm text-slate-600">{user.userName}</td>
										<td className="px-4 py-3 text-sm text-slate-500">{convertDateTimeString(user.createdAt)}</td>
										<td className="px-4 py-3 text-sm text-slate-500">
											{user.lastLoginAt ? convertDateTimeString(user.lastLoginAt) : <span className="text-slate-300">ログイン履歴なし</span>}
										</td>
										<td className="px-4 py-3 text-sm font-medium text-blue-600">{user.progressRate}%</td>
										<td className="px-4 py-3">
											<button
												className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 hover:cursor-pointer text-xs font-medium transition-colors whitespace-nowrap"
												onClick={(e) => deleteAndFetchUsers(e, user.id)}
											>
												削除
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
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
					<span className="text-sm font-medium text-slate-600">{pageNum} / {totalPageNum} ページ</span>
					<button
						onClick={handleNextPage}
						disabled={pageNum === totalPageNum}
						className="px-4 py-1.5 text-sm font-medium bg-white border border-blue-200 text-blue-600 rounded-xl enabled:hover:bg-blue-50 enabled:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
					>
						次へ
					</button>
				</div>
			</div>

			{showImportConfirmDialog && (
				<div className="fixed inset-0 flex items-center justify-center z-50">
					<div className="absolute inset-0 bg-black/60 z-40" onClick={handleImportCancel}></div>
					<div className="relative bg-white p-7 rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-sm z-50 border border-slate-200">
						<h3 className="text-base font-bold text-slate-800 mb-2">CSV取込の確認</h3>
						<p className="text-sm text-slate-600 mb-5">
							CSV取込を実施すると、現在存在するユーザーが全て削除されます。よろしいですか？
						</p>
						<div className="flex justify-end gap-3">
							<button
								onClick={handleImportCancel}
								className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer transition-colors"
							>
								いいえ
							</button>
							<button
								onClick={handleImportConfirm}
								className="px-5 py-2.5 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 cursor-pointer transition-colors"
							>
								はい
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
