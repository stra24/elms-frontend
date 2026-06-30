'use client';
import { API_URL } from '@/lib/apiUrl';

import { useState } from 'react';
import Link from 'next/link';
import { useApiRequest } from '@/hooks/useApiRequest';
import { GRADIENT_PRIMARY, GRADIENT_PRIMARY_HOVER } from '@/lib/gradients';

export default function PasswordResetForm() {
	const [emailAddress, setEmailAddress] = useState('');
	const [sent, setSent] = useState(false);

	const { executeApi, isLoading } = useApiRequest();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await executeApi(`${API_URL}/api/password-reset/request`, 'POST', { emailAddress });
		setSent(true);
	};

	if (sent) {
		return (
			<div className="flex justify-center items-center min-h-screen bg-slate-100">
				<div className="w-full max-w-md px-4">
					<div className="text-center mb-8">
						<h1 className="text-2xl font-bold text-slate-800 tracking-wide">Javaエンジニア養成講座</h1>
					</div>
					<div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center">
						<div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
							<svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<h2 className="text-lg font-semibold text-slate-800 mb-2">メールを送信しました</h2>
						<p className="text-sm text-slate-500 mb-6">
							ご登録のメールアドレスにパスワード再設定リンクをお送りしました。<br />
							メールをご確認ください。
						</p>
						<Link href="/login" className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors">
							ログイン画面へ戻る
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
					<p className="text-slate-500 mt-2 text-sm">パスワード再設定</p>
				</div>

				<form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
					<p className="text-sm text-slate-600 mb-6">
						ご登録のメールアドレスを入力してください。<br />
						パスワード再設定リンクをお送りします。
					</p>

					<div className="mb-6">
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

					<button
						type="submit"
						className={`w-full bg-gradient-to-r ${GRADIENT_PRIMARY} text-white py-3 rounded-xl font-semibold ${GRADIENT_PRIMARY_HOVER} transition-all hover:cursor-pointer shadow-md shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed`}
						disabled={isLoading}
					>
						{isLoading ? '送信中...' : '再設定リンクを送信'}
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
