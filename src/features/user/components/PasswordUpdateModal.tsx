import { API_URL } from '@/lib/apiUrl';
import { FC, useState } from "react";
import { GRADIENT_PRIMARY, GRADIENT_PRIMARY_HOVER } from "@/lib/gradients";
import { resolve } from "path";
import { useApiRequest } from "@/hooks/useApiRequest";

interface PasswordUpdateModalProps {
	setIsPasswordUpdateModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const PasswordUpdateModal: FC<PasswordUpdateModalProps> = ({
	setIsPasswordUpdateModalOpen,
}) => {
	const [currentPassword, setCurrentPassword] = useState<string>('');
	const [newPassword, setNewPassword] = useState<string>('');
	const [confirmPassword, setConfirmPassword] = useState<string>('');

	const {
		executeApi: executeUpdatePasswordApi,
		isLoading: isLoadingUpdatePasswordApi,
		isError: isErrorUpdatePasswordApi,
		} = useApiRequest();

	// パスワード更新処理
	const updatePassword = async() => {
		if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
			alert("すべての項目を入力してください");
			return;
		}

		if(newPassword !== confirmPassword){
			alert("パスワードが一致しません");
			return;
		}

		try{
			const response = await executeUpdatePasswordApi(
				`${API_URL}/api/users/password`,
				'PUT',
				{
					currentPassword,
					newPassword,
				}
			);
			if (!response) {
				alert("通信エラーが発生しました");
				return;
			}
			
			if (response.ok) {
				alert("パスワードを変更しました。");
				cancel();
				return;
			}

			if (response.status === 400) {
				alert("パスワードが一致しません。");
				return;
			}

			if (response.status === 401) {
				alert("認証に失敗しました。ログインし直してください。");
				return;
			}

			if (response.status === 404) {
				alert("ユーザーが存在しません。");
				return;
			}

			if (response.status === 500) {
				alert("エラーが発生しました");
				return;
			}
		} catch(e){
			alert("パスワードの変更に失敗しました。");
		}
	};

	// モーダルをキャンセルする関数
	const cancel = () => {
		setCurrentPassword('');
		setNewPassword('');
		setConfirmPassword('');
		setIsPasswordUpdateModalOpen(false)
	}

	return (
		<div
			className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
			onClick={() => cancel()}
		>
			<div
				className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl border border-blue-100"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 className="text-base font-bold text-slate-800 mb-6 text-center">パスワードの変更</h2>

				<div className="mb-4">
					<label className="block text-sm font-semibold text-slate-700 mb-1.5">
						現在のパスワード
					</label>
					<input
						type="password"
						value={currentPassword}
						onChange={(e) => setCurrentPassword(e.target.value)}
						className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
					/>
				</div>

				<div className="mb-7">
					<label className="block text-sm font-semibold text-slate-700 mb-1.5">
						新しいパスワード
					</label>
					<input
						type="password"
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
					/>
				</div>

				<div className="mb-7">
					<label className="block text-sm font-semibold text-slate-700 mb-1.5">
						確認用パスワード
					</label>
					<input
						type="password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
					/>
				</div>

				<div className="flex justify-end gap-3">
					<button
						className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 hover:cursor-pointer transition-colors"
						onClick={() => cancel()}
					>
						キャンセル
					</button>
					<button
						className={`px-5 py-2.5 text-sm font-semibold bg-gradient-to-r ${GRADIENT_PRIMARY} text-white rounded-xl ${GRADIENT_PRIMARY_HOVER} transition-all hover:cursor-pointer shadow-md shadow-indigo-200`}
						onClick={updatePassword}
						disabled={isLoadingUpdatePasswordApi}
					>
						保存
					</button>
				</div>
			</div>
		</div>
	);
};

export default PasswordUpdateModal;
