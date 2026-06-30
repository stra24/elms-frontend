'use client';
import { API_URL } from '@/lib/apiUrl';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApiRequest } from '@/hooks/useApiRequest';
import { getJWTFromCookie, getSubjectFromJWT, setUserRoleCookie } from '@/lib/jwtUtil';
import { UserDto } from '@/features/user/types';
import { GRADIENT_PRIMARY, GRADIENT_PRIMARY_HOVER } from '@/lib/gradients';

export default function LoginForm() {
	const router = useRouter();
	const [emailAddress, setEmailAddress] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [rememberMe, setRememberMe] = useState(false);
	const [isCheckingAuth, setIsCheckingAuth] = useState(true);

	// ユーザー取得API
	const {
		executeApi: executeFindUserByIdApi,
		isLoading: isLoadingFindUserByIdApi,
		response: responseOfFindUserByIdApi
	} = useApiRequest();

	// ログインAPI
	const {
		executeApi: executeLoginApi,
		isLoading: isLoadingLoginApi,
	} = useApiRequest();

	// 画面表示時に既ログイン済みか確認し、済みならリダイレクトする
	useEffect(() => {
		const checkAuth = async () => {
			try {
				const jwt = getJWTFromCookie();
				const res = await fetch(`${API_URL}/api/auth/refresh`, {
					method: 'GET',
					headers: { 'Authorization': `Bearer ${jwt ?? 'dummy'}` },
					credentials: 'include',
				});

				if (res.ok) {
					// 認証済み：新しいJWTを取得してユーザー情報を確認しリダイレクト
					const newToken = getJWTFromCookie();
					if (newToken) {
						const userId = getSubjectFromJWT(newToken);
						const userRes = await executeFindUserByIdApi(`${API_URL}/api/users/${userId}`, 'GET');
						if (userRes?.ok) return;
					}
				}
			} catch {
				// ネットワークエラー等は無視してログイン画面を表示
			}
			setIsCheckingAuth(false);
		};

		checkAuth();
	}, [executeFindUserByIdApi]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			await executeLoginApi(`${API_URL}/api/auth/login`, 'POST', { emailAddress, password, rememberMe });
			// 新しい JWT をクッキーから取得
			const newToken = getJWTFromCookie();
			console.log('token: ' + newToken)
			if (!newToken) {
				// ログインAPIでJWTがクッキーに登録されるため、運用上ここに処理が渡ることは起こりえないが、後続の処理でnullでないことを確約してある必要があるため、実装。
				router.push("/login");
				return;
			}

			// JWT から userId を取得して、ユーザー取得APIを実行。
			const userId = getSubjectFromJWT(newToken);
			await executeFindUserByIdApi(`${API_URL}/api/users/${userId}`, 'GET');
		} catch (err) {
			// ログインAPI失敗時
			console.log('ログインAPI - 失敗')
			console.log(err);
		}
	};

	useEffect(() => {
		// API結果を待ってから画面遷移を行う。
		if (responseOfFindUserByIdApi) {
			responseOfFindUserByIdApi.json()?.then((response: UserDto) => {
				setUserRoleCookie(response.userRole);
				if (response.userRole === '管理者') {
					router.push('/admin/courses');
				} else {
					router.push('/courses');
				}
			})
		}
	}, [responseOfFindUserByIdApi, router]);

	if (isCheckingAuth) return null;

	return (
		<div className="flex justify-center items-center min-h-screen bg-slate-100">
			<div className="w-full max-w-md px-4">
				{/* ロゴ／タイトルエリア */}
				<div className="text-center mb-8">
					<h1 className="text-2xl font-bold text-slate-800 tracking-wide">Javaエンジニア養成講座</h1>
					<p className="text-slate-500 mt-2 text-sm">アカウントにログインしてください</p>
				</div>

				<form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
					{error && (
						<div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
							{error}
						</div>
					)}

					<div className="mb-5">
						<label htmlFor="emailAddress" className="block text-sm font-medium text-slate-700 mb-1.5">
							メールアドレス
						</label>
						<input
							type="email"
							id="emailAddress"
							className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
							value={emailAddress}
							onChange={(e) => setEmailAddress(e.target.value)}
							required
						/>
					</div>

					<div className="mb-5">
						<label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
							パスワード
						</label>
						<input
							type="password"
							id="password"
							className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>

					<div className="flex items-center mb-6">
						<input
							type="checkbox"
							id="remember"
							className="h-4 w-4 accent-blue-600 border-gray-300 rounded cursor-pointer"
							checked={rememberMe}
							onChange={(e) => setRememberMe(e.target.checked)}
						/>
						<label htmlFor="remember" className="ml-2 text-sm text-slate-600 cursor-pointer">
							ログイン状態を保持する
						</label>
					</div>

					<button
						type="submit"
						className={`w-full bg-gradient-to-r ${GRADIENT_PRIMARY} text-white py-3 rounded-xl font-semibold ${GRADIENT_PRIMARY_HOVER} transition-all hover:cursor-pointer shadow-md shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed`}
						disabled={isLoadingLoginApi || isLoadingFindUserByIdApi}
					>
						{isLoadingLoginApi || isLoadingFindUserByIdApi ? 'ログイン中...' : 'ログイン'}
					</button>

					<div className="mt-5 text-center">
						<Link href="/password" className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors">
							パスワードをお忘れの方はこちら
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
}
