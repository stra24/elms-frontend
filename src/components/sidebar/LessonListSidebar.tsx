"use client";
import { API_URL } from '@/lib/apiUrl';
import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { useParams, useRouter } from 'next/navigation';
import { useApiRequest } from "@/hooks/useApiRequest";
import { UserLessonGroupDto } from "@/features/lesson/types";
import { getJWTFromCookie, getSubjectFromJWT } from "@/lib/jwtUtil";
import { GRADIENT_PRIMARY } from "@/lib/gradients";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function LessonListSidebar({
	onLessonSelect,
	selectedLessonId,
	onClose,
}: {
	onLessonSelect?: (lessonId: number) => void;
	selectedLessonId?: number | null;
	onClose?: () => void;
}) {
	const params = useParams();
	const courseId = parseInt(params.courseId as string, 10);
	const lessonId = params.lessonId ? parseInt(params.lessonId as string, 10) : null;
	const router = useRouter();

	const touchStartX = useRef<number>(0);

	const [lessonGroups, setLessonGroups] = useState<UserLessonGroupDto[]>([]);
	const [openGroups, setOpenGroups] = useState<number[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const {
		executeApi: executeFindUserLessonsApi,
		isLoading: isLoadingApi,
		isError: isErrorApi
	} = useApiRequest();

	const fetchLessons = async () => {
		try {
			setIsLoading(true);
			setError(null);

			const jwt = getJWTFromCookie();
			if (!jwt) {
				setError('認証情報が見つかりません');
				return;
			}

			const userId = getSubjectFromJWT(jwt);
			const response = await executeFindUserLessonsApi(
				`${API_URL}/api/users/${userId}/courses/${courseId}/lessons`,
				'GET'
			);

			if (response && response.ok) {
				const userLessonGroups: UserLessonGroupDto[] = await response.json();

				const sortedGroups = userLessonGroups.sort((a, b) => a.lessonGroupOrder - b.lessonGroupOrder);
				const sortedGroupsWithSortedLessons = sortedGroups.map(group => ({
					...group,
					userLessons: [...group.userLessons].sort(
						(a, b) => a.lesson.lessonOrder - b.lesson.lessonOrder
					),
				}));

				setLessonGroups(sortedGroupsWithSortedLessons);
				setOpenGroups(sortedGroupsWithSortedLessons.map(g => g.id));

				if (lessonId && onLessonSelect) {
					onLessonSelect(lessonId);
				}
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

	useEffect(() => {
		if (courseId) {
			fetchLessons();
		}
	}, [courseId]);

	const toggleGroup = (groupId: number) => {
		setOpenGroups((prev) =>
			prev.includes(groupId)
				? prev.filter((id) => id !== groupId)
				: [...prev, groupId]
		);
	};

	const handleLessonClick = (lessonGroupId: number, lessonId: number) => {
		if (onLessonSelect) {
			onLessonSelect(lessonId);
		}
		onClose?.();
		router.push(`/courses/${courseId}/lesson-groups/${lessonGroupId}/lessons/${lessonId}`);
	};

	if (isLoading || isLoadingApi) {
		return (
			<div className="w-full h-full bg-white p-4 overflow-y-auto border-r border-blue-100">
				<h2 className="text-sm font-bold text-slate-700 mb-4">レッスン一覧</h2>
				<LoadingSpinner size="sm" />
			</div>
		);
	}

	if (error || isErrorApi) {
		return (
			<div className="w-full h-full bg-white p-4 overflow-y-auto border-r border-blue-100">
				<h2 className="text-sm font-bold text-slate-700 mb-4">レッスン一覧</h2>
				<div className="text-center py-8 text-sm text-red-500">
					エラーが発生しました: {error || 'データの取得に失敗しました'}
				</div>
			</div>
		);
	}

	return (
		<div
			className="w-full h-full bg-white overflow-y-auto border-r border-blue-100"
			onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
			onTouchEnd={(e) => {
				const deltaX = e.changedTouches[0].clientX - touchStartX.current;
				if (deltaX < -60) onClose?.();
			}}
		>
			<div className="px-4 py-4 border-b border-blue-100 flex items-center justify-between">
				<h2 className="text-sm font-bold text-slate-700">レッスン一覧</h2>
				{onClose && (
					<button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600 p-1 transition-colors">
						<X size={18} />
					</button>
				)}
			</div>
			<ul className="p-3 mb-11">
				{lessonGroups.map((group) => {
					const isOpen = openGroups.includes(group.id);
					return (
						<div key={group.id} className="rounded-xl overflow-hidden mb-2 border border-blue-100">
							<div className={`flex justify-between items-center text-sm font-semibold text-white px-3 py-2.5 cursor-pointer bg-gradient-to-r ${GRADIENT_PRIMARY}`}>
								<span onClick={() => toggleGroup(group.id)} className="flex-1">
									{group.name}
								</span>
								<div className="flex items-center gap-2">
									{isOpen ? (
										<ChevronUp size={14} className="text-blue-200" />
									) : (
										<ChevronDown size={14} className="text-blue-200" />
									)}
								</div>
							</div>

							{isOpen && (
								<ul className="bg-white">
									{group.userLessons.map((userLesson) => (
										<li
											key={userLesson.lesson.id}
											className={`flex items-center justify-between gap-2 text-sm px-4 py-2.5 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
												selectedLessonId === userLesson.lesson.id
													? 'bg-blue-50 text-blue-700 font-semibold border-l-2 border-blue-500'
													: 'text-slate-700 hover:bg-blue-50 hover:text-blue-600'
											}`}
											onClick={() => handleLessonClick(group.id, userLesson.lesson.id)}
										>
											<span className="flex-1">{userLesson.lesson.title}</span>
											{userLesson.isLessonCompleted && (
												<Check size={16} className="text-green-500 shrink-0" aria-label="完了" />
											)}
										</li>
									))}
								</ul>
							)}
						</div>
					);
				})}
			</ul>
		</div>
	);
}
