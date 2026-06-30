'use client';
import { API_URL } from '@/lib/apiUrl';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApiRequest } from '@/hooks/useApiRequest';
import { getJWTFromCookie, getSubjectFromJWT } from '@/lib/jwtUtil';
import { UserDto } from '@/features/user/types';
import { GRADIENT_PRIMARY, GRADIENT_PRIMARY_HOVER } from '@/lib/gradients';

type Props = {
	token: string;
};

export default function NewPasswordForm({ token }: Props) {
	const router = useRouter();
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState('');

	const { executeApi: executeConfirmApi, isLoading: isLoadingConfirm } = useApiRequest();
	const {
		executeApi: executeFindUserApi,
		isLoading: isLoadingFindUser,
		response: findUserResponse,
	} = useApiRequest();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');

		if (newPassword !== confirmPassword) {
			setError('パスワードが一致しません。');
			return;
		}

		if (newPassword.length < 8) {
			setError('パスワードは8文字以上で入力してください。');
			return;
		}

		try {
			const res = await executeConfirmApi(
				`${API_URL}/api/password-reset/confirm`,
				'POST',
				{ token, newPassword }
			);

			if (!res || !res.ok) {
				setError('パスワードの再設定に失敗しました。リンクの有効期限が切れているか、すでに使用済みの可能性があります。');
				return;
			}

			const jwt = getJWTFromCookie();
			if (!jwt) {
				router.push('/login');
				return;
			}

			const userId = getSubjectFromJWT(jwt);
			await executeFindUserApi(`${API_URL}/api/users/${userId}`, 'GET');
		} catch {
			setError('エラーが発生しました。もう一度お試しください。');
		}
	};

	useEffect(() => {
		if (findUserResponse) {
			findUserResponse.json()?.then((user: UserDto) => {
				if (user.userRole === '管理者') {
					router.push('/admin/courses');
				} else {
					router.push('/courses');
				}
			});
		}
	}, [findUserResponse, router]);

	if (!token) {
		return (
			<div className="flex justify-center items-center min-h-screen bg-slate-100">
				<div className="w-full max-w-md px-4">
					<div className="text-center mb-8">
						<h1 className="text-2xl font-bold text-slate-800 tracking-wide">Javaエンジニア養成講座</h1>
					</div>
					<div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center">
						<p className="text-sm text-red-600 mb-6">無効なリンクです。再度パスワード再設定をお試しください。</p>
						<Link href="/password" className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors">
							パスワード再設定画面へ
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex justify-center items-center min-h-screen bg-slate-100">
			<div className="w-full max-w-md px-4">
				<div className="text-center mb-8">
					<h1 className="text-2xl font-bold text-slate-800 tracking-wide">Javaエンジニア養成講座</h1>
					<p className="text-slate-500 mt-2 text-sm">新しいパスワードを設定</p>
				</div>

				<form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
					{error && (
						<div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
							{error}
						</div>
					)}

					<div className="mb-5">
						<label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
							新しいパスワード
						</label>
						<input
							type="password"
							id="newPassword"
							className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder="8文字以上"
							required
						/>
					</div>

					<div className="mb-6">
						<label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
							パスワード（確認）
						</label>
						<input
							type="password"
							id="confirmPassword"
							className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="もう一度入力してください"
							required
						/>
					</div>

					<button
						type="submit"
						className={`w-full bg-gradient-to-r ${GRADIENT_PRIMARY} text-white py-3 rounded-xl font-semibold ${GRADIENT_PRIMARY_HOVER} transition-all hover:cursor-pointer shadow-md shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed`}
						disabled={isLoadingConfirm || isLoadingFindUser}
					>
						{isLoadingConfirm || isLoadingFindUser ? '処理中...' : 'パスワードを設定する'}
					</button>

					<div className="mt-5 text-center">
						<Link href="/login" className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors">
							ログイン画面へ戻る
						</Link>
					</div>
				</form>
			</div>
		</div>
	);
}
