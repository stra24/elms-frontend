'use client';
import { API_URL } from '@/lib/apiUrl';

import { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from 'next/navigation';
import { UserDto } from "@/features/user/types";
import PasswordUpdateModal from "./PasswordUpdateModal";
import Thumbnail from "@/components/Thumbnail";
import { useApiRequest } from "@/hooks/useApiRequest";
import { getJWTFromCookie, getSubjectFromJWT } from "@/lib/jwtUtil";
import { GRADIENT_PRIMARY, GRADIENT_PRIMARY_HOVER } from "@/lib/gradients";
import { pageContainer } from "@/lib/pageLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function UserDetail() {
	const router = useRouter();

	const paramUserId = useParams().userId; // URL パラメータから userId を取得
	const pathname = usePathname();
	const isNewUser = pathname === '/admin/users/new';

	// 画面に表示するState
	const [realName, setRealName] = useState<string>("");
	const [userName, setUserName] = useState<string>("");
	const [emailAddress, setEmailAddress] = useState<string>("");
	const [thumbnailUrl, setThumbnailUrl] = useState<string>("")
	const [selectedThumbnailFile, setSelectedThumbnailFile] = useState<File | null>(null);
	const [userRole, setUserRole] = useState<string>("GENERAL")

	// パスワード関連のState
	const [password, setPassword] = useState<string>("");
	const [confirmPassword, setConfirmPassword] = useState<string>("");

	// モーダルのState
	const [isPasswordUpdateModalOpen, setIsPasswordUpdateModalOpen] = useState<boolean>(false);

	// 認証にまつわるState
	const [userId, setUserId] = useState<number | null>(null);

	// ファイルアップロードAPI
	const {
		executeApi: executeUploadFileApi,
		isLoading: isLoadingUploadFileApi,
		isError: isErrorUploadFileApi,
		response: responseOfUploadFileApi
	} = useApiRequest();

	// ユーザー新規作成API
	const {
		executeApi: executeCreateUserApi,
		isLoading: isLoadingCreateUserApi,
		isError: isErrorCreateUserApi,
		response: responseOfCreateUserApi
	} = useApiRequest();

	// ユーザー更新API
	const {
		executeApi: executeUpdateUserApi,
		isLoading: isLoadingUpdateUserApi,
		isError: isErrorUpdateUserApi,
		response: responseOfUpdateUserApi
	} = useApiRequest();

	// リフレッシュトークンAPI
	const {
		executeApi: executeRefreshTokenApi,
	} = useApiRequest();

	// ユーザー取得API
	const {
		executeApi: executeFindUserByIdApi,
		isLoading: isLoadingFindUserByIdApi,
		response: responseOfFindUserByIdApi,
		isError: isErrorFindUserByIdApi
	} = useApiRequest();

	// サムネイル画像を変更する関数
	const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setSelectedThumbnailFile(file); // ファイルを保存
			setThumbnailUrl(URL.createObjectURL(file)); // プレビュー表示だけ
		}
	};

	// ユーザー情報を保存する関数
	const handleSave = async () => {
		try {
			if (isNewUser && password != confirmPassword) {
				throw new Error('パスワードが一致しません。');
			}

			let uploadedThumbnailPath = thumbnailUrl;

			// もし新しいサムネイルが選ばれてたらアップロードする
			if (selectedThumbnailFile) {
				const formData = new FormData();
				formData.append("file", selectedThumbnailFile);

				// 画像アップロードAPIを呼び出し
				const uploadFileApiResponse = await executeUploadFileApi(`${API_URL}/api/files/upload`, 'POST', formData);

				if (!uploadFileApiResponse?.ok) {
					throw new Error('サムネイルアップロード失敗');
				}

				// アップロードしたファイルのパスを取得
				uploadedThumbnailPath = await uploadFileApiResponse.text(); // 新しいパスを取得
			}

			if (isNewUser) {
				// ユーザー情報を新規作成する
				const createUserApiResponse = await executeCreateUserApi(
					`${API_URL}/api/users`,
					'POST',
					{
						realName,
						userName,
						emailAddress,
						password,
						confirmPassword,
						thumbnailUrl: uploadedThumbnailPath,
						userRole,
					}
				);

				if (!createUserApiResponse?.ok) {
					throw new Error('ユーザー新規作成 - 失敗');
				}
			} else {
				// ユーザー情報を更新する
				const updateUserApiResponse = await executeUpdateUserApi(
					`${API_URL}/api/users/${userId}`,
					'PUT',
					{
						userId,
						realName,
						userName,
						emailAddress,
						thumbnailUrl: uploadedThumbnailPath,
					}
				);

				if (!updateUserApiResponse?.ok) {
					throw new Error('ユーザー更新 - 失敗');
				}
			}

			alert('保存しました！');
			router.push('/admin/users');
		} catch (error) {
			console.error(error);
			alert('保存に失敗しました');
		}
	};

	// JWT の有効期限が切れている場合にトークンをリフレッシュし、userId を取得
	useEffect(() => {
		const refreshAndSetToken = async () => {
			try {
				// リフレッシュトークンを使用して JWT を更新
				await executeRefreshTokenApi(`${API_URL}/api/auth/refresh`, 'GET');

				// 新しい JWT をクッキーから取得
				const newToken = getJWTFromCookie();

				if (!newToken) {
					alert("トークンがありません")
					return;
				}

				// JWT から userId を取得
				setUserId(getSubjectFromJWT(newToken));
			} catch (error) {
				console.error("トークンリフレッシュ失敗", error);
				// router.push("/login");
				alert("トークンリフレッシュ失敗")
			}
		};

		if (paramUserId) {
			// ユーザー編集画面の場合
			setUserId(parseInt(Array.isArray(paramUserId) ? paramUserId[0] : paramUserId, 10));
		} else if (isNewUser) {
			// ユーザー新規画面の場合
			setUserId(null)
			setRealName("");
			setUserName("");
			setEmailAddress("");
			setThumbnailUrl("");
		} else {
			// マイアカウント画面の場合
			refreshAndSetToken();
		}
	}, [executeRefreshTokenApi, isNewUser, paramUserId, router]);

	// userId がセットされたら（新規画面以外でしかセットされない）、ユーザー情報取得を行う。
	useEffect(() => {
		if (userId && !isNewUser) {
			executeFindUserByIdApi(`${API_URL}/api/users/${userId}`, 'GET');
		}
	}, [executeFindUserByIdApi, userId, isNewUser]);

	// ユーザー情報を取得したら、State にセットする
	useEffect(() => {
		if (responseOfFindUserByIdApi) {
			responseOfFindUserByIdApi.json()?.then((userDto: UserDto) => {
				setUserName(userDto.userName);
				setRealName(userDto.realName);
				setEmailAddress(userDto.emailAddress);
				if (userDto.thumbnailUrl) {
					setThumbnailUrl(userDto.thumbnailUrl);
				}
				setUserRole(userDto.userRole == '管理者' ? 'ADMIN' : 'GENERAL');
			})
		}
	}, [isPasswordUpdateModalOpen, paramUserId, responseOfFindUserByIdApi]);

	// 新規画面の場合、ユーザー取得処理は行わないので、新規画面以外かつユーザー取得レスポンスがまだ返ってきていない場合はロード画面とする。
	if (!isNewUser && (!userId || !responseOfFindUserByIdApi)) {
		return <LoadingSpinner />;
	}

	if (isErrorFindUserByIdApi) {
		return <ErrorMessage />;
	}

	const inputCls = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent";

	return (
		<div className="min-h-screen bg-slate-50">
			<div className={`${pageContainer.medium} py-8`}>
				<div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
					{[
						{
							label: "権限",
							value: (
								<select value={userRole} onChange={(e) => setUserRole(e.target.value)} disabled={!isNewUser} className={`${inputCls} ${!isNewUser ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}>
									<option value="GENERAL">一般</option>
									<option value="ADMIN">管理者</option>
								</select>
							),
						},
						{
							label: "氏名",
							value: (
								<input type="text" value={realName} onChange={(e) => setRealName(e.target.value)} autoComplete="off" className={inputCls} />
							),
						},
						{
							label: "ユーザー名",
							value: (
								<input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} autoComplete="off" className={inputCls} />
							),
						},
						{
							label: "メールアドレス",
							value: (
								<input type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} autoComplete="off" className={inputCls} />
							),
						},
						isNewUser && {
							label: "パスワード",
							value: (
								<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className={inputCls} />
							),
						},
						isNewUser && {
							label: "確認用パスワード",
							value: (
								<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className={inputCls} />
							),
						},
						{
							label: "サムネイル画像",
							value: (
								<div className="flex items-center gap-5">
									<div className="w-24 h-24 rounded-full overflow-hidden border-2 border-blue-100 shrink-0">
										{thumbnailUrl ? <Thumbnail thumbnailUrl={thumbnailUrl} alt="サムネイル画像" /> : <div className="w-full h-full bg-slate-100" />}
									</div>
									<label className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline hover:cursor-pointer transition-colors">
										画像を変更
										<input type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" />
									</label>
								</div>
							),
						},
					].map((item, index) => (
						item && (
							<div key={index} className="grid grid-cols-1 sm:grid-cols-[180px_1fr] border-b border-slate-100 last:border-b-0">
								<div className="bg-slate-50 px-5 py-3 sm:py-4 sm:border-r border-b sm:border-b-0 border-slate-100 flex items-center">
									<span className="text-sm font-semibold text-slate-600">{item.label}</span>
								</div>
								<div className="bg-white px-5 py-3 sm:py-4">
									{item.value}
								</div>
							</div>
						)
					))}
				</div>

				<div className="flex justify-end py-6 gap-3">
					{!isNewUser && (
						<button
							className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 hover:cursor-pointer text-sm font-medium transition-colors"
							onClick={() => setIsPasswordUpdateModalOpen(true)}
						>
							パスワードを変更する
						</button>
					)}
					<button
						className={`px-8 py-2.5 bg-gradient-to-r ${GRADIENT_PRIMARY} text-white rounded-xl ${GRADIENT_PRIMARY_HOVER} transition-all hover:cursor-pointer text-sm font-semibold shadow-md shadow-indigo-200`}
						onClick={() => handleSave()}
					>
						保存
					</button>
				</div>

				{isPasswordUpdateModalOpen && (
					<PasswordUpdateModal setIsPasswordUpdateModalOpen={setIsPasswordUpdateModalOpen} />
				)}
			</div>
		</div>
	);
};