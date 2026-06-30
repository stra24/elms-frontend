import { API_URL } from '@/lib/apiUrl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Thumbnail from '@/components/Thumbnail';
import { useApiRequest } from '@/hooks/useApiRequest';
import { CourseLessonsDto } from '@/features/lesson/types';
import { findFirstLessonPath } from '@/features/lesson/lessonNavigation';
import { GRADIENT_ACCENT } from '@/lib/gradients';

type CourseCardProps = {
	courseId: number;
	imageUrl: string;
	title: string;
	progress: number; // 0〜100
	description: string;
	isAdmin: boolean;
	onDelete?: (courseId: number) => void;
};

export default function CourseCard({ courseId, imageUrl, title, progress, description, isAdmin, onDelete }: CourseCardProps) {
	const router = useRouter();
	const [isNavigating, setIsNavigating] = useState(false);

	const {
		executeApi: executeFindLessonsByCourseIdApi
	} = useApiRequest();

	const toLessonPage = async () => {
		if (isAdmin) {
			router.push(`/admin/courses/${courseId}/edit`);
		} else {
			try {
				setIsNavigating(true);

				const lessonsResponse = await executeFindLessonsByCourseIdApi(
					`${API_URL}/api/courses/${courseId}/lessons`,
					'GET'
				);

				if (lessonsResponse && lessonsResponse.ok) {
					const courseLessonsDto: CourseLessonsDto = await lessonsResponse.json();
					const firstLessonPath = findFirstLessonPath(courseId, courseLessonsDto.lessonGroups);

					if (firstLessonPath) {
						router.push(firstLessonPath);
					} else {
						alert('このコースにはまだレッスンが登録されていません');
					}
				} else {
					alert('レッスン情報の取得に失敗しました');
				}
			} catch (error) {
				console.error('レッスン取得エラー:', error);
				alert('レッスンの取得中にエラーが発生しました');
			} finally {
				setIsNavigating(false);
			}
		}
	};

	const handleDelete = async (e: React.MouseEvent) => {
		e.stopPropagation(); // 親カードクリックを無効化
		if (onDelete) {
			onDelete(courseId);
		}
	};

	return (
		<div
			onClick={toLessonPage}
			className={`relative w-full rounded-2xl overflow-hidden shadow-lg bg-white flex flex-col group border border-blue-100 hover:shadow-xl hover:border-blue-200 transition-all duration-200 ${
				isNavigating ? 'opacity-50 cursor-wait' : 'hover:cursor-pointer'
			}`}
		>
			{/* ホバー時の背景オーバーレイ */}
			<div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200 pointer-events-none z-10" />

			{/* サムネイル画像 */}
			<div className="relative aspect-[16/9] overflow-hidden">
				<Thumbnail thumbnailUrl={imageUrl} alt={title} className="object-cover transition-transform transform duration-300 group-hover:scale-105" />

				{/* 削除ボタン（右下に重ねる） */}
				{isAdmin && (
					<button
						onClick={handleDelete}
						className="absolute bottom-2 right-2 text-sm bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 hover:cursor-pointer z-20 transition-colors shadow"
					>
						削除
					</button>
				)}
			</div>

			{/* 説明概要 */}
			<div className="p-4 flex flex-col justify-between flex-1">
				<div>
					{/* コースタイトル */}
					<h2 className="text-base font-bold mb-2 line-clamp-3 text-slate-800">{title}</h2>

					{/* コース説明 */}
					<p className="text-sm text-slate-500 mb-3 line-clamp-3">{description}</p>
				</div>

				{!isAdmin && (
					<div>
						{/* 進捗バー */}
						<div className="h-1.5 bg-blue-100 rounded-full mb-1.5">
							<div
								className={`h-1.5 bg-gradient-to-r ${GRADIENT_ACCENT} rounded-full transition-all duration-300`}
								style={{ width: `${progress}%` }}
							/>
						</div>

						{/* 進捗率表示 */}
						<p className="text-xs font-medium text-blue-600 mt-1">{progress}% 完了</p>
					</div>
				)}
			</div>
		</div>
	);
}
