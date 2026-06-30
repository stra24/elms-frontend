"use client";
import { API_URL } from '@/lib/apiUrl';

import { useParams } from 'next/navigation';
import PageTitle from "@/components/page-title/PageTitle";
import { pageContainer } from "@/lib/pageLayout";
import { NewsDto } from '@/features/news/types';
import { convertDateString } from '@/lib/dateUtil';
import { useApiRequest } from '@/hooks/useApiRequest';
import { useEffect, useState } from 'react';
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";

export default function NewsDetail() {
	const newsId = useParams().newsId;

	// お知らせリスト 
	const [newsDto, setNewsDto] = useState<NewsDto | null>(null);

	// お知らせ取得API
	const {
		executeApi: executeFindNewsByIdApi,
		isLoading: isLoadingFindNewsByIdApi,
		isError: isErrorFindNewsByIdApi
	} = useApiRequest();

	useEffect(() => {
		const fetchData = async () => {
			const findNewsByIdApiResponse = await executeFindNewsByIdApi(`${API_URL}/api/news/${newsId}`, 'GET');
			findNewsByIdApiResponse?.json()?.then((newsDto: NewsDto) => {
				setNewsDto(newsDto);
			})
		}
		fetchData();
	}, [executeFindNewsByIdApi, newsId])

	if (isErrorFindNewsByIdApi) return <ErrorMessage />;
	if (isLoadingFindNewsByIdApi) return <LoadingSpinner />;

	if (!newsDto) {
		return (
			<>
				<PageTitle title="お知らせ詳細" containerClassName={pageContainer.narrow} />
				<div className="text-center mt-20">
					<p className="text-gray-500 text-lg">お知らせが見つかりませんでした。</p>
				</div>
			</>
		);
	}

	return (
		<>
			<PageTitle title="お知らせ詳細" containerClassName={pageContainer.narrow} />
			<div className={`${pageContainer.narrow} py-8`}>
				<div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-8">
					<div className="text-xs font-medium text-slate-400 mb-3">{convertDateString(newsDto.createdAt)}</div>
					<h2 className="text-2xl font-bold text-slate-800 mb-6 pb-4 border-b border-gray-100">{newsDto.title}</h2>
					<p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm">{newsDto.content}</p>
				</div>
			</div>
		</>
	);
}
