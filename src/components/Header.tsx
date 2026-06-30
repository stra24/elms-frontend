'use client';
import { API_URL } from '@/lib/apiUrl';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import { GRADIENT_HEADER } from '@/lib/gradients';
import { useApiRequest } from '@/hooks/useApiRequest';
import { getJWTFromCookie, getSubjectFromJWT, setUserRoleCookie, clearUserRoleCookie } from '@/lib/jwtUtil';
import { UserDto } from '@/features/user/types';

const Header = () => {
	const router = useRouter();

	// リフレッシュトークンAPI
	const {
		executeApi: executeRefreshTokenApi,
	} = useApiRequest();

	// ログアウトAPI
	const {
		executeApi: executeLogoutApi,
	} = useApiRequest();

	// ユーザー取得API
	const {
		executeApi: executeFindUserByIdApi,
		response: responseOfFindUserByIdApi
	} = useApiRequest();

	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	const toTopPage = async () => {
		try {
			// リフレッシュトークンを使用して JWT を更新
			await executeRefreshTokenApi(`${API_URL}/api/auth/refresh`, 'GET');

			// 新しい JWT をクッキーから取得
			const newToken = getJWTFromCookie();

			if (!newToken) {
				// トークンがない場合、ログインページへリダイレクト
				router.push("/login");
				return;
			}

			// JWT から userId を取得して、ユーザー取得APIを実行。
			const userId = getSubjectFromJWT(newToken);
			await executeFindUserByIdApi(`${API_URL}/api/users/${userId}`, 'GET');
		} catch (err) {
			// リフレッシュトークンAPI失敗時
			console.log('リフレッシュトークンAPI - 失敗')
			console.log(err);
		}
	};

	const toMyAccountPage = () => {
		router.push('/account');
	};

	const logout = async () => {
		await executeLogoutApi(`${API_URL}/api/auth/logout`, 'POST');
		clearUserRoleCookie();
		router.push('/login');
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			// メニューが存在している、かつ、メニューの外側を押したとき
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		} else {
			document.removeEventListener('mousedown', handleClickOutside);
		}

		// クリーンアップ
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);

	useEffect(() => {
		// API結果を待ってから画面遷移を行う。
		if (responseOfFindUserByIdApi) {
			responseOfFindUserByIdApi.json()?.then((response: UserDto) => {
				setUserRoleCookie(response.userRole);
				if (response.userRole === '管理者') {
					router.push('/admin/users');
				} else {
					router.push('/courses');
				}
			})
		}
	}, [responseOfFindUserByIdApi, router]);

	return (
		<header className={`fixed top-0 left-0 w-full bg-gradient-to-r ${GRADIENT_HEADER} text-white shadow-lg z-50`}>
			<div className="flex justify-between items-center h-[60px] px-6">
				{/* 左側：画面タイトル */}
				<h1 onClick={toTopPage} className="text-base md:text-xl font-bold tracking-wide hover:opacity-80 hover:cursor-pointer transition-opacity truncate mr-4">
					Javaエンジニア養成講座
				</h1>

				{/* 右側：ハンバーガーメニュー＋メニューモーダル */}
				<div className="relative" ref={menuRef}>
					<button
						onClick={() => setIsOpen(!isOpen)}
						className="focus:outline-none flex items-center hover:opacity-80 hover:cursor-pointer transition-opacity"
					>
						{isOpen ? <X size={28} /> : <Menu size={28} />}
					</button>

					{isOpen && (
						<div className="absolute right-0 mt-3 w-44 bg-white text-slate-700 rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
							<ul className="py-2">
								<li onClick={toMyAccountPage} className="px-4 py-2.5 text-sm font-medium hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors">マイアカウント</li>
								<li onClick={logout} className="px-4 py-2.5 text-sm font-medium hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors">ログアウト</li>
							</ul>
						</div>
					)}
				</div>
			</div>
		</header>
	);
};

export default Header;