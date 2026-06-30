'use client';
import { GRADIENT_HEADER } from '@/lib/gradients';
import { useRouter } from 'next/navigation';

export default function NotImplementedPage() {
	const router = useRouter();

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
			<div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
				<div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${GRADIENT_HEADER} mb-6`}>
					<span className="text-white text-2xl font-bold">!</span>
				</div>
				<h1 className="text-xl font-bold text-gray-800 mb-3">APIが未実装です</h1>
				<p className="text-gray-500 text-sm mb-6">
					呼び出したAPIがバックエンドにまだ実装されていません。<br />
					バックエンドのコントローラーを確認してください。
				</p>
				<button
					onClick={() => router.back()}
					className={`bg-gradient-to-r ${GRADIENT_HEADER} text-white text-sm font-medium px-6 py-2 rounded-lg hover:opacity-90 transition-opacity`}
				>
					前のページに戻る
				</button>
			</div>
		</div>
	);
}
