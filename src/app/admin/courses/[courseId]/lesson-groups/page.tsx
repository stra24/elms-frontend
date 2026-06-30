'use client';
import { API_URL } from '@/lib/apiUrl';

import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import { useApiRequest } from "@/hooks/useApiRequest";
import { CourseLessonsDto, LessonGroupDto } from "@/features/lesson/types";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function LessonGroupsPage() {
	const params = useParams();
	const courseId = parseInt(params.courseId as string, 10);

	const [lessonGroups, setLessonGroups] = useState<LessonGroupDto[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const {
		executeApi: executeFindLessonsByCourseIdApi,
		isLoading: isLoadingApi,
		isError: isErrorApi
	} = useApiRequest();

	const fetchLessons = async () => {
		try {
			setIsLoading(true);
			setError(null);

			const response = await executeFindLessonsByCourseIdApi(
				`${API_URL}/api/courses/${courseId}/lessons`,
				'GET'
			);

			if (response && response.ok) {
				const courseLessonsDto: CourseLessonsDto = await response.json();

				const sortedGroups = courseLessonsDto.lessonGroups.sort(
					(a, b) => a.lessonGroupOrder - b.lessonGroupOrder
				);
				const sortedGroupsWithSortedLessons = sortedGroups.map(group => ({
					...group,
					lessons: group.lessons.sort((a, b) => a.lessonOrder - b.lessonOrder)
				}));

				setLessonGroups(sortedGroupsWithSortedLessons);
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

	if (isLoading || isLoadingApi) {
		return <LoadingSpinner />;
	}

	if (error || isErrorApi) {
		return (
			<div className="px-4 py-12">
				<div className="text-center text-red-600">
					エラーが発生しました: {error || 'データの取得に失敗しました'}
				</div>
			</div>
		);
	}

	const hasLessons = lessonGroups.some((group) => group.lessons.length > 0);

	let message: string;
	if (lessonGroups.length === 0) {
		message = "まだ一つもレッスングループが作成されていません";
	} else if (!hasLessons) {
		message = "左のサイドバーからレッスンを作成してください";
	} else {
		message = "左のサイドバーからレッスンを選択してください";
	}

	return (
		<div className="px-4 py-12">
			<div className="text-center">
				<p className="text-gray-500 text-lg">{message}</p>
			</div>
		</div>
	);
}
