"use client";
import { API_URL } from '@/lib/apiUrl';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useRouter } from 'next/navigation';
import PageTitle from "@/components/page-title/PageTitle";
import { pageContainer } from "@/lib/pageLayout";
import CourseCard from '@/features/course/components/CourseCard';
import Header from "@/components/Header";
import Link from "next/link";
import { convertDateString } from '@/lib/dateUtil';
import { getJWTFromCookie, getSubjectFromJWT } from '@/lib/jwtUtil';
import { useEffect, useState } from 'react';
import { NewsDto, NewsPageDto } from '@/features/news/types';
import { UserCourseDto } from '@/features/course/types';
import { GRADIENT_ACCENT } from '@/lib/gradients';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function Home() {
	const router = useRouter();

	// コースリスト
	const [userCourseDtos, setUserCourseDtos] = useState<UserCourseDto[]>([]);

	// お知らせリスト
	const [newsDtos, setNewsDtos] = useState<NewsDto[]>([]);

	// ユーザーコース一覧取得API
	const {
		executeApi: executeFindUserCoursesApi,
		isLoading: isLoadingFindUserCoursesApi,
		isError: isErrorFindUserCoursesApi,
	} = useApiRequest();

	// お知らせ一覧取得API
	const {
		executeApi: executeFindNewsApi,
		isLoading: isLoadingFindNewsApi,
		isError: isErrorFindNewsApi,
		response: responseOfFindNewsApi
	} = useApiRequest();

	const toNewsDetailPage = (event: React.MouseEvent<HTMLDivElement>) => {
		const newsId = event.currentTarget.id;
		router.push("/news/" + newsId);
	};

	useEffect(() => {
		const fetchData = async () => {
			const jwt = getJWTFromCookie();
			if (!jwt) return;

			const userId = getSubjectFromJWT(jwt);
			const findUserCoursesApiResponse = await executeFindUserCoursesApi(
				`${API_URL}/api/users/${userId}/courses`,
				'GET'
			);
			findUserCoursesApiResponse?.json()?.then((courses: UserCourseDto[]) => {
				setUserCourseDtos(courses);
			});

			const findNewsApiResponse = await executeFindNewsApi(`${API_URL}/api/news`, 'GET');
			findNewsApiResponse?.json()?.then((newsPageDto: NewsPageDto) => {
				setNewsDtos(newsPageDto.newsDtos);
			});
		};
		fetchData();
	}, [executeFindUserCoursesApi, executeFindNewsApi]);

	if (isErrorFindUserCoursesApi || isErrorFindNewsApi) return <ErrorMessage />;
	if (isLoadingFindUserCoursesApi || isLoadingFindNewsApi) return <LoadingSpinner />;

	return (
		<>
			<Header />
			<PageTitle title="Javaエンジニア養成講座" containerClassName={pageContainer.wide} />

			<div className={`${pageContainer.wide} py-8`}>
				{/* お知らせ欄 */}
				<div className="bg-white rounded-2xl overflow-hidden shadow-md border border-blue-100 mb-10">
					<div className="px-6 py-4 border-b border-blue-100 flex items-center justify-between">
						<h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
							<span className={`w-1 h-5 rounded-full bg-gradient-to-b ${GRADIENT_ACCENT} inline-block shrink-0`} />
							お知らせ
						</h2>
						<Link href="/news" passHref>
							<button className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors hover:cursor-pointer">
								もっと見る →
							</button>
						</Link>
					</div>
					<div className="px-6 py-2">
						{newsDtos.map((news) => (
							<div
								key={news.id}
								id={news.id}
								className="border-b border-gray-100 py-3 hover:bg-blue-50 flex items-center gap-4 hover:cursor-pointer rounded-lg px-2 transition-colors"
								onClick={toNewsDetailPage}
							>
								<p className="text-slate-400 text-xs font-medium shrink-0">{convertDateString(news.createdAt)}</p>
								<p className="text-slate-700 text-sm font-medium">{news.title}</p>
							</div>
						))}
					</div>
				</div>

				{/* コース一覧 */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{userCourseDtos.map((course) => (
						<CourseCard
							key={course.id}
							courseId={course.id}
							imageUrl={course.thumbnailUrl ?? ''}
							title={course.title}
							description={course.description}
							progress={Math.round(course.courseProgress)}
							isAdmin={false}
						/>
					))}
				</div>
			</div>
		</>
	);
}
