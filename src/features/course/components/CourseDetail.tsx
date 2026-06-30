"use client";
import { API_URL } from '@/lib/apiUrl';

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from 'next/navigation';
import Thumbnail from "@/components/Thumbnail";
import { useApiRequest } from "@/hooks/useApiRequest";
import { CourseDto } from "@/features/course/types";
import { CourseLessonsDto } from "@/features/lesson/types";
import { findFirstLessonEditPath } from "@/features/lesson/lessonNavigation";
import { GRADIENT_PRIMARY, GRADIENT_PRIMARY_HOVER, GRADIENT_ACCENT } from "@/lib/gradients";
import { pageContainer } from "@/lib/pageLayout";

export default function CourseDetail() {
	const router = useRouter();

	const paramCourseId = useParams().courseId;
	const pathname = usePathname();
	const isNewCourse = pathname === '/admin/courses/new';

	// フォーム
	const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
	const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
	const [title, setTitle] = useState("");
	const [courseOrder, setCourseOrder] = useState(0);
	const [description, setDescription] = useState("");

	// 認証にまつわるState
	const [courseId, setCourseId] = useState<number | null>(null);

	// ファイルアップロードAPI
	const {
		executeApi: executeUploadFileApi
	} = useApiRequest();

	// コース新規作成API
	const {
		executeApi: executeCreateCourseApi
	} = useApiRequest();

	// コース更新API
	const {
		executeApi: executeUpdateCourseApi
	} = useApiRequest();

	// コース取得API
	const {
		executeApi: executeFindCourseByIdApi
	} = useApiRequest();

	// レッスン一覧取得API（先頭レッスンへの遷移用）
	const {
		executeApi: executeFindLessonsByCourseIdApi
	} = useApiRequest();

	// レッスン編集画面に遷移する
	const toLessonEditPage = async () => {
		if (courseId === null) return;
		const response = await executeFindLessonsByCourseIdApi(`${API_URL}/api/courses/${courseId}/lessons`, 'GET');
		if (response?.ok) {
			const courseLessonsDto: CourseLessonsDto = await response.json();
			const firstLessonPath = findFirstLessonEditPath(courseId, courseLessonsDto.lessonGroups);
			router.push(firstLessonPath ?? `/admin/courses/${courseId}/lesson-groups`);
		}
	};

	// サムネイル画像変更時の関数
	const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			setThumbnailFile(file); // ファイル
			setThumbnailUrl(URL.createObjectURL(file)); // ファイルのURL
		}
	};

	// フォーム送信時の処理
	const handleSave = async () => {
		try {
			let uploadedThumbnailPath = thumbnailUrl;

			// もし新しいサムネイルが選ばれてたらアップロードする
			if (thumbnailFile) {
				const formData = new FormData();
				formData.append("file", thumbnailFile);

				// 画像アップロードAPIを呼び出し
				const uploadFileApiResponse = await executeUploadFileApi(`${API_URL}/api/files/upload`, 'POST', formData);

				if (!uploadFileApiResponse?.ok) {
					throw new Error('サムネイルアップロード失敗');
				}

				// アップロードしたファイルのパスを取得
				uploadedThumbnailPath = await uploadFileApiResponse.text();
			}

			if (isNewCourse) {
				// コース情報を新規作成する
				const createCourseApiResponse = await executeCreateCourseApi(
					`${API_URL}/api/courses`,
					'POST',
					{
						title,
						description,
						thumbnailUrl: uploadedThumbnailPath,
					}
				);

				if (!createCourseApiResponse?.ok) {
					throw new Error('コース新規作成 - 失敗');
				}
			} else {
				// コース情報を更新する
				const updateCourseApiResponse = await executeUpdateCourseApi(
					`${API_URL}/api/courses/${courseId}`,
					'PUT',
					{
						courseId,
						title,
						courseOrder,
						description,
						thumbnailUrl: uploadedThumbnailPath,
					}
				);

				if (!updateCourseApiResponse?.ok) {
					throw new Error('コース更新 - 失敗');
				}
			}

			alert('保存しました！');
			router.push('/admin/courses');
		} catch (error) {
			console.error(error);
			alert('保存に失敗しました');
		}
	};

	useEffect(() => {
		if (paramCourseId) {
			// コース編集画面の場合
			setCourseId(parseInt(Array.isArray(paramCourseId) ? paramCourseId[0] : paramCourseId, 10));
		} else {
			// コース新規画面の場合
			setCourseId(null)
			setTitle("");
			setDescription("");
			setThumbnailUrl("");
		}
	}, [paramCourseId, router]);

	// courseId がセットされたら（編集画面だったら）、コース情報取得を行う。
	useEffect(() => {
		if (courseId && !isNewCourse) {
			executeFindCourseByIdApi(`${API_URL}/api/courses/${courseId}`, 'GET');
		}
	}, [courseId, isNewCourse, executeFindCourseByIdApi]);

	useEffect(() => {
		const fetchData = async () => {
			if (courseId && !isNewCourse) {
				const findCourseByIdApiResponse = await executeFindCourseByIdApi(`${API_URL}/api/courses/${courseId}`, 'GET');
				findCourseByIdApiResponse?.json()?.then((courseDto: CourseDto) => {
					setTitle(courseDto.title);
					setCourseOrder(courseDto.courseOrder);
					setDescription(courseDto.description);
					setThumbnailUrl(courseDto.thumbnailUrl);
				})
			}
		}
		fetchData();
	}, [courseId, executeFindCourseByIdApi, isNewCourse])

	return (
		<div className="min-h-screen bg-slate-50">
			<div className={`${pageContainer.adminNarrow} py-8`}>
				{/* タイトル行 */}
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
					<div className="flex items-center gap-3">
					<span className={`block w-1 h-8 rounded-full bg-gradient-to-b ${GRADIENT_ACCENT} shrink-0`} />
					<h1 className="text-2xl font-bold text-slate-800">{isNewCourse ? "コース新規作成" : "コース編集"}</h1>
				</div>
					{!isNewCourse && (
						<button
							type="button"
							onClick={toLessonEditPage}
							className={`bg-gradient-to-r ${GRADIENT_PRIMARY} text-white px-5 py-2.5 rounded-xl ${GRADIENT_PRIMARY_HOVER} transition-all text-sm font-semibold shadow-md shadow-indigo-200 hover:cursor-pointer whitespace-nowrap self-start md:self-auto`}
						>
							レッスン編集
						</button>
					)}
				</div>

				{/* フォーム */}
				<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
					<form onSubmit={handleSave} className="space-y-6">
						{/* サムネイル画像 */}
						<div>
							<label className="block text-sm font-semibold text-slate-700 mb-2">サムネイル画像</label>
							<input
								type="file"
								accept="image/*"
								onChange={handleThumbnailChange}
								className="px-4 py-2.5 border border-gray-200 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
							/>
							{thumbnailUrl && (
								<div className="mt-4">
									<Thumbnail
										thumbnailUrl={thumbnailUrl}
										alt="サムネイル画像プレビュー"
										className="max-w-[280px] max-h-[180px] object-cover rounded-xl"
									/>
								</div>
							)}
						</div>

						{/* コースタイトル */}
						<div>
							<label className="block text-sm font-semibold text-slate-700 mb-2">コースタイトル</label>
							<input
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="コースのタイトルを入力"
								required
								className="px-4 py-2.5 border border-gray-200 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
							/>
						</div>

						{/* コース概要 */}
						<div>
							<label className="block text-sm font-semibold text-slate-700 mb-2">コース概要</label>
							<textarea
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="コースの概要を入力"
								required
								rows={4}
								className="px-4 py-2.5 border border-gray-200 rounded-xl w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
							/>
						</div>

						{/* 登録ボタン */}
						<div className="flex justify-end pt-2">
							<button
								type="submit"
								className={`bg-gradient-to-r ${GRADIENT_PRIMARY} text-white px-8 py-2.5 rounded-xl ${GRADIENT_PRIMARY_HOVER} transition-all text-sm font-semibold shadow-md shadow-indigo-200 hover:cursor-pointer`}
							>
								{isNewCourse ? "登録" : "更新"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
