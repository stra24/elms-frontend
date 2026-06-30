"use client";
import { API_URL } from '@/lib/apiUrl';
import { useEffect, useState } from "react";
import { useParams } from 'next/navigation';
import { useApiRequest } from "@/hooks/useApiRequest";
import { GRADIENT_PRIMARY, GRADIENT_PRIMARY_HOVER } from "@/lib/gradients";
import LoadingSpinner from "@/components/LoadingSpinner";
import { UserLessonDetailDto } from "../types";
import { getJWTFromCookie, getSubjectFromJWT } from "@/lib/jwtUtil";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function LessonDetail({
	onLessonSelect,
	selectedLessonId,
}: {
	onLessonSelect?: (lessonId: number) => void;
	selectedLessonId?: number | null;
}) {
	const params = useParams();
	const courseId = parseInt(params.courseId as string, 10);
	const lessonGroupId = parseInt(params.lessonGroupId as string, 10);
	const paramLessonId = parseInt(params.lessonId as string, 10);
	
	// レッスンの状態管理
	const [lesson, setLesson] = useState<UserLessonDetailDto | null>(null);
	const [isLessonCompleted, setIsLessonCompleted] = useState(false);
	const [isUpdatingCompletion, setIsUpdatingCompletion] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [completionError, setCompletionError] = useState<string | null>(null);

	// 認証状態の管理（localStorageを使用してレッスン間で共有）
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [showManualAuthDialog, setShowManualAuthDialog] = useState(false);
	
	// 認証状態をlocalStorageから読み込み
	useEffect(() => {
		const savedAuthState = localStorage.getItem(`auth_${courseId}`);
		if (savedAuthState === 'true') {
			setIsAuthenticated(true);
		}
	}, [courseId]);
	
	// 認証状態をlocalStorageに保存
	const updateAuthState = (authState: boolean) => {
		setIsAuthenticated(authState);
		localStorage.setItem(`auth_${courseId}`, authState.toString());
	};

	// レッスン取得API
	const {
		executeApi: executeFindLessonByIdApi,
		isLoading: isLoadingApi,
		isError: isErrorApi
	} = useApiRequest();

	// レッスン完了状態更新API
	const {
		executeApi: executeUpdateUserLessonCompletionApi,
	} = useApiRequest();

	// JWT 再発行（アクセストークン短命のため、更新前にヘッダー用トークンを最新化する）
	const {
		executeApi: executeRefreshTokenApi,
	} = useApiRequest();

	// レッスンデータを取得
	const fetchLesson = async (lessonId: number) => {
		try {
			setIsLoading(true);
			setError(null);
			setCompletionError(null);

			const token = getJWTFromCookie();
			if (!token) {
				setError('ユーザー情報の取得に失敗しました');
				return;
			}
			const userId = parseInt(getSubjectFromJWT(token), 10);
			if (Number.isNaN(userId)) {
				setError('ユーザー情報の取得に失敗しました');
				return;
			}
			
			const response = await executeFindLessonByIdApi(
				`${API_URL}/api/users/${userId}/courses/${courseId}/lesson-groups/${lessonGroupId}/lessons/${lessonId}`,
				'GET'
			);

			if (response && response.ok) {
				const lessonDto: UserLessonDetailDto = await response.json();
				setLesson(lessonDto);
				setIsLessonCompleted(lessonDto.isLessonCompleted);
			} else {
				setError('レッスンの取得に失敗しました');
			}
		} catch (err) {
			console.error('レッスン取得エラー:', err);
			setError('レッスンの取得中にエラーが発生しました');
		} finally {
			setIsLoading(false);
		}
	};

	const handleLessonCompletionChange = async (checked: boolean) => {
		if (!lesson || isUpdatingCompletion) {
			return;
		}

		const previousValue = isLessonCompleted;
		setIsLessonCompleted(checked);
		setIsUpdatingCompletion(true);
		setCompletionError(null);

		try {
			// バックエンドの JwtFilter がリフレッシュしてクッキーを更新する。続く PUT では最新 JWT をヘッダーに載せる。
			await executeRefreshTokenApi(`${API_URL}/api/auth/refresh`, 'GET');

			const token = getJWTFromCookie();
			if (!token) {
				throw new Error('JWT not found');
			}
			const userId = parseInt(getSubjectFromJWT(token), 10);
			if (Number.isNaN(userId)) {
				throw new Error('invalid user id');
			}

			const response = await executeUpdateUserLessonCompletionApi(
				`${API_URL}/api/users/${userId}/courses/${courseId}/lesson-groups/${lessonGroupId}/lessons/${lesson.id}/completion`,
				'PUT',
				{ isLessonCompleted: checked }
			);

			if (!response || !response.ok) {
				throw new Error('status update failed');
			}
		} catch (err) {
			console.error('レッスン完了状態更新エラー:', err);
			setIsLessonCompleted(previousValue);
			setCompletionError('レッスン完了状態の更新に失敗しました。再度お試しください。');
		} finally {
			setIsUpdatingCompletion(false);
		}
	};

	// Google DriveのURLからファイルIDを正規表現で抽出する
	const extractFileId = (url: string): string | null => {
		const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
		return fileIdMatch ? fileIdMatch[1] : null;
	};

	// 認証済みの場合のみ、埋め込み用のGoogle DriveのURLを生成する
	const convertGoogleDriveUrl = (url: string): string => {
		if (!url) return "";

		const fileId = extractFileId(url);
		if (fileId && isAuthenticated) {
			// /view → /preview に変換してiframeで表示可能にする
			return `https://drive.google.com/file/d/${fileId}/preview`;
		}

		return "";
	};

	// Google Drive認証（手動確認）
	const authenticateWithGoogleDrive = () => {
		if (!lesson?.videoUrl) return;

		try {
			const fileId = extractFileId(lesson.videoUrl);
			if (!fileId) {
				setError("有効なGoogle DriveのファイルIDが見つかりません");
				return;
			}

			// 新しいタブでGoogle Driveを開く
			const driveUrl = `https://drive.google.com/file/d/${fileId}/view`;
			window.open(driveUrl, '_blank');
			
			// 認証確認ダイアログを表示
			setShowManualAuthDialog(true);
		} catch (error) {
			console.error('認証エラー:', error);
			setError("認証中にエラーが発生しました");
		}
	};

	// 手動認証確認
	const confirmManualAuth = () => {
		updateAuthState(true);
		setShowManualAuthDialog(false);
	};

	// 認証解除
	const revokeAuth = () => {
		updateAuthState(false);
	};

	// URLパラメータからレッスンIDがある場合の初期読み込み
	useEffect(() => {
		if (paramLessonId && lessonGroupId) {
			fetchLesson(paramLessonId);
		}
	}, [paramLessonId, courseId, lessonGroupId]);

	// サイドバーから選択されたレッスンのデータを取得
	useEffect(() => {
		if (selectedLessonId && lessonGroupId) {
			fetchLesson(selectedLessonId);
		}
	}, [selectedLessonId, courseId, lessonGroupId]);

	if (isLoading || isLoadingApi) {
		return (
			<div className="flex-1 pt-6 px-4 md:px-10 overflow-y-auto">
				<LoadingSpinner size="sm" />
			</div>
		);
	}

	if (error || isErrorApi) {
		return (
			<div className="flex-1 pt-6 px-4 md:px-10 overflow-y-auto">
				<div className="text-center py-8 text-sm text-red-500">
					エラーが発生しました: {error || 'データの取得に失敗しました'}
				</div>
			</div>
		);
	}

	if (!lesson) {
		return (
			<div className="flex-1 pt-6 px-4 md:px-10 overflow-y-auto">
				<div className="text-center py-8 text-sm text-slate-400">
					レッスンを選択してください
				</div>
			</div>
		);
	}

	const lessonDescription = lesson.content ?? "";

	return (
		<div className="flex-1 pt-6 px-4 md:px-10 pb-20 overflow-y-auto bg-[#f0f7ff]">
			{/* 認証済み表示（PC専用・動画ありのレッスンのみ） */}
			{lesson.videoUrl && isAuthenticated && (
				<div className="mb-4 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl hidden md:flex items-center">
					<span className="text-green-600 mr-2 text-sm">✓</span>
					<span className="text-green-800 text-sm font-medium">Google Drive認証済み</span>
					<button
						onClick={revokeAuth}
						className="ml-auto text-green-600 hover:text-green-800 text-sm underline cursor-pointer transition-colors"
					>
						認証を解除
					</button>
				</div>
			)}
			{lesson.videoUrl && (
			<div className="rounded-2xl overflow-hidden shadow-lg mb-6">
				{/* スマホ: Googleドライブで開くボタン */}
				<div className="md:hidden bg-slate-900 px-6 py-10 flex flex-col items-center gap-4">
					<p className="text-slate-400 text-sm text-center">
						スマホでの視聴はGoogleドライブアプリで開いてください
					</p>
					<a
						href={lesson.videoUrl}
						target="_blank"
						rel="noopener noreferrer"
						className={`bg-gradient-to-r ${GRADIENT_PRIMARY} text-white px-6 py-3.5 rounded-xl ${GRADIENT_PRIMARY_HOVER} transition-all font-semibold text-sm w-full text-center shadow-lg`}
					>
						▶ Googleドライブで動画を開く
					</a>
				</div>
				{/* PC: iframeで埋め込み */}
				<div className="hidden md:block bg-black aspect-video">
					{isAuthenticated ? (
						<iframe
							className="w-full h-full"
							src={convertGoogleDriveUrl(lesson.videoUrl)}
							title="レッスン動画"
							allowFullScreen
						/>
					) : (
						<div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center">
							<div className="text-center mb-6 px-8">
								<h3 className="text-lg font-semibold text-white mb-2">動画を視聴するには認証が必要です</h3>
								<p className="text-slate-400 text-sm mb-6">
									Google Driveの動画にアクセスするために認証を行ってください。
								</p>
								<button
									onClick={authenticateWithGoogleDrive}
									className={`bg-gradient-to-r ${GRADIENT_PRIMARY} text-white px-6 py-2.5 rounded-xl ${GRADIENT_PRIMARY_HOVER} transition-all cursor-pointer font-medium shadow-lg`}
								>
									Google Driveで認証する
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
			)}
			<div className="bg-white rounded-2xl px-8 py-6 shadow-sm border border-blue-100 mb-6">
				<h1 className="text-xl font-bold text-slate-800 mb-4">{lesson.title}</h1>
				<label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
					<input
						type="checkbox"
						checked={isLessonCompleted}
						onChange={(e) => handleLessonCompletionChange(e.target.checked)}
						disabled={isUpdatingCompletion}
						className="h-4 w-4 accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
					/>
					<span>このレッスンを完了済みにする</span>
				</label>
				{completionError && (
					<p className="mt-2 text-sm text-red-500">{completionError}</p>
				)}
			</div>
			<div className="text-base">
				{lessonDescription ? (
					<div className="lesson-content rounded-2xl border border-blue-100 bg-white px-6 py-5 md:px-8 md:py-7 shadow-sm">
						<ReactMarkdown
							remarkPlugins={[remarkGfm]}
							components={{
								a: ({ children, href }) => (
									<a href={href} target="_blank" rel="noopener noreferrer">
										{children}
									</a>
								),
							}}
						>
							{lessonDescription}
						</ReactMarkdown>
					</div>
				) : (
					<p className="text-gray-600">説明が設定されていません</p>
				)}
			</div>



			{/* 手動認証確認ダイアログ */}
			{showManualAuthDialog && (
				<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
					<div className="bg-white p-7 rounded-2xl max-w-md mx-4 shadow-2xl border border-blue-100">
						<h3 className="text-base font-bold text-slate-800 mb-3">Google Driveアクセス確認</h3>
						<p className="text-sm text-slate-600 mb-6">
							新しいタブでGoogle Driveが開きました。動画にアクセスできることを確認してください。
						</p>
						<div className="flex gap-3">
							<button
								onClick={confirmManualAuth}
								className={`bg-gradient-to-r ${GRADIENT_PRIMARY} text-white px-5 py-2.5 rounded-xl ${GRADIENT_PRIMARY_HOVER} transition-all cursor-pointer text-sm font-medium`}
							>
								アクセス可能です
							</button>
							<button
								onClick={() => setShowManualAuthDialog(false)}
								className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl hover:bg-slate-200 cursor-pointer text-sm font-medium transition-colors"
							>
								キャンセル
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}