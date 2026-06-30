"use client";
import { API_URL } from '@/lib/apiUrl';
import CourseCard from "./CourseCard";
import { useApiRequest } from "@/hooks/useApiRequest";
import { CourseDto, CoursePageDto } from "@/features/course/types";
import Link from "next/link";
import { useEffect, useState } from "react";
import SimplePagenation from "@/components/pagenation/SimplePagenation";
import { GRADIENT_PRIMARY, GRADIENT_PRIMARY_HOVER, GRADIENT_ACCENT } from "@/lib/gradients";
import { pageContainer } from "@/lib/pageLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function CourseListForAdmin() {
	// 1ページで表示する件数
	const [pageSize, setPageSize] = useState(10);

	// ページ番号
	const [pageNum, setPageNum] = useState(1);

	// 合計ページ数
	const [totalPageNum, setTotalPageNum] = useState(1);

	// コースリスト 
	const [courseDtos, setCourseDtos] = useState<CourseDto[]>([]);

	// コース一覧取得API
	const {
		executeApi: executeFindCoursesApi,
		isLoading: isLoadingFindCoursesApi,
		isError: isErrorFindCoursesApi
	} = useApiRequest();

	// コース削除API
	const {
		executeApi: executeDeleteCourseApi,
	} = useApiRequest();

	// 全レッスンCSV出力API
	const {
		executeApi: executeExportAllLessonsCsvApi,
		isLoading: isLoadingExportAllLessonsCsvApi,
		isError: isErrorExportAllLessonsCsvApi,
	} = useApiRequest();

	const updateCourseList = async (pageSize: number, pageNum: number) => {
		const queryParams = new URLSearchParams({
			pageSize: pageSize.toString(),
			pageNum: pageNum.toString(),
		});
		const findCoursesApiResponse = await executeFindCoursesApi(`${API_URL}/api/courses?${queryParams.toString()}`, 'GET');
		if (!findCoursesApiResponse) {
			return;
		}
		const coursePageDto: CoursePageDto = await findCoursesApiResponse.json();
		setTotalPageNum(Math.ceil(coursePageDto.totalSize / coursePageDto.pageSize));
		setCourseDtos(coursePageDto.courseDtos);
	}

	const deleteCourse = async (courseId: number) => {
		await executeDeleteCourseApi(`${API_URL}/api/courses/${courseId}`, 'DELETE');
		updateCourseList(pageSize, pageNum);
	};

	const handleExportAllLessonsCsv = async () => {
		try {
			const response = await executeExportAllLessonsCsvApi(`${API_URL}/api/courses/lessons/export`, "GET");
			if (!response) return;
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "lessons.csv";
			a.click();
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("LessonsCsv出力エラー:", error);
		}
	};

	useEffect(() => {
		updateCourseList(pageSize, pageNum);
	}, [executeFindCoursesApi, pageNum, pageSize])

	if (isErrorFindCoursesApi) return <ErrorMessage />;
	if (isLoadingFindCoursesApi) return <LoadingSpinner />;

	// ページネーション：前ページ遷移時の挙動
	const handlePrevPage = () => {
		const prevPage: number = pageNum - 1;
		setPageNum(prevPage);
	};

	// ページネーション：次ページ遷移時の挙動
	const handleNextPage = () => {
		const nextPage: number = pageNum + 1;
		setPageNum(nextPage);
	};

	return (
		<div className="min-h-screen bg-slate-50">
			<div className={`${pageContainer.wide} py-8`}>
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
					<div className="flex items-center gap-3">
						<span className={`block w-1 h-8 rounded-full bg-gradient-to-b ${GRADIENT_ACCENT} shrink-0`} />
						<h1 className="text-2xl font-bold text-slate-800">コース一覧</h1>
					</div>
					<div className="flex flex-wrap gap-2 self-start md:self-auto">
						<button
							onClick={handleExportAllLessonsCsv}
							className="bg-white border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 whitespace-nowrap hover:cursor-pointer text-sm font-medium transition-colors disabled:opacity-50"
							disabled={isLoadingExportAllLessonsCsvApi}
						>
							{isLoadingExportAllLessonsCsvApi ? "出力中..." : "CSV出力"}
						</button>
						{isErrorExportAllLessonsCsvApi && (
							<p className="text-red-500 text-sm self-center">CSV出力に失敗しました</p>
						)}
						<Link
							href="/admin/courses/new"
							className={`bg-gradient-to-r ${GRADIENT_PRIMARY} text-white px-5 py-2.5 rounded-xl ${GRADIENT_PRIMARY_HOVER} transition-all text-sm font-semibold shadow-md shadow-indigo-200 whitespace-nowrap`}
						>
							＋ コースを新規作成
						</Link>
					</div>
				</div>

				{/* コースカード一覧 */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
					{courseDtos.map((course) => (
						<CourseCard
							key={course.id}
							courseId={course.id}
							imageUrl={course.thumbnailUrl}
							title={course.title}
							description={course.description}
							progress={65}
							isAdmin={true}
							onDelete={deleteCourse}
						/>
					))}
				</div>

				{/* ページネーション */}
				<SimplePagenation handlePrevPage={handlePrevPage} pageNum={pageNum} totalPageNum={totalPageNum} handleNextPage={handleNextPage} />
			</div>
		</div>
	);
}
