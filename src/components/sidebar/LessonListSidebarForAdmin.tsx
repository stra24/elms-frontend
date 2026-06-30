"use client";
import { API_URL } from '@/lib/apiUrl';
import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Trash2, Plus, GripVertical } from "lucide-react";
import { useParams } from 'next/navigation';
import { useApiRequest } from "@/hooks/useApiRequest";
import { CourseLessonsDto, LessonGroupDto } from "@/features/lesson/types";
import { buildLessonOrderUpdateBody, reorderLessons } from "@/features/lesson/lessonNavigation";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import { X } from "lucide-react";

export default function LessonListSidebarForAdmin({
	setDeleteTarget,
	setShowDeleteModal,
	onLessonSelect,
	selectedLessonId,
	isEditPage = false,
	onClose,
	refreshKey = 0,
}: {
	setDeleteTarget: React.Dispatch<React.SetStateAction<any>>;
	setShowDeleteModal: React.Dispatch<React.SetStateAction<boolean>>;
	onLessonSelect?: (lessonId: number | null) => void;
	selectedLessonId?: number | null;
	isEditPage?: boolean;
	onClose?: () => void;
	refreshKey?: number;
}) {
	const params = useParams();
	const courseId = parseInt(params.courseId as string, 10);
	const lessonId = params.lessonId ? parseInt(params.lessonId as string, 10) : null;
	const router = useRouter();

	const touchStartX = useRef<number>(0);
	const dragGhostRef = useRef<HTMLElement | null>(null);

	// APIから取得したレッスンデータ
	const [lessonGroups, setLessonGroups] = useState<LessonGroupDto[]>([]);
	const [openGroups, setOpenGroups] = useState<number[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [isCreatingGroup, setIsCreatingGroup] = useState(false);
	const [newGroupTitle, setNewGroupTitle] = useState("");
	const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
	const [editingGroupTitle, setEditingGroupTitle] = useState("");
	const [draggedLesson, setDraggedLesson] = useState<{
		groupId: number;
		lessonId: number;
		fromIndex: number;
		title: string;
	} | null>(null);
	const [dropInsertIndex, setDropInsertIndex] = useState<number | null>(null);
	const [isReordering, setIsReordering] = useState(false);

	// レッスン一覧取得API
	const {
		executeApi: executeFindLessonsByCourseIdApi,
		isLoading: isLoadingApi,
		isError: isErrorApi
	} = useApiRequest();

	// レッスングループ新規作成API
	const {
		executeApi: executeCreateLessonGroupApi,
	} = useApiRequest();

	// レッスングループ更新API
	const {
		executeApi: executeUpdateLessonGroupApi,
	} = useApiRequest();

	// レッスン並び順更新API
	const {
		executeApi: executeUpdateLessonOrderApi,
	} = useApiRequest();

	// レッスンデータを取得
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
				
				// レッスングループをlessonGroupOrderでソート
				const sortedGroups = courseLessonsDto.lessonGroups.sort((a, b) => a.lessonGroupOrder - b.lessonGroupOrder);
				
				// 各グループ内のレッスンをlessonOrderでソート
				const sortedGroupsWithSortedLessons = sortedGroups.map(group => ({
					...group,
					lessons: group.lessons.sort((a, b) => a.lessonOrder - b.lessonOrder)
				}));

				setLessonGroups(sortedGroupsWithSortedLessons);
				setOpenGroups(sortedGroupsWithSortedLessons.map(g => g.id));
				
				// URLのlessonIdパラメータに合致するレッスンを選択
				if (lessonId && onLessonSelect) {
					onLessonSelect(lessonId);
				} else if (!isEditPage && onLessonSelect) {
					// 新規作成ページの場合は選択を解除
					onLessonSelect(null);
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

	// コンポーネントマウント時にレッスンデータを取得
	useEffect(() => {
		if (courseId) {
			fetchLessons();
		}
	}, [courseId, refreshKey]);

	const toggleGroup = (groupId: number) => {
		setOpenGroups((prev) =>
			prev.includes(groupId)
				? prev.filter((id) => id !== groupId)
				: [...prev, groupId]
		);
	};

	const handleDeleteGroup = (groupId: number) => {
		const group = lessonGroups.find((g) => g.id === groupId);
		setDeleteTarget({
			type: "group",
			groupId,
			groupTitle: group?.name ?? "",
		});
		setShowDeleteModal(true);
	};

	const handleDeleteLesson = (groupId: number, lessonId: number) => {
		const group = lessonGroups.find((g) => g.id === groupId);
		const lesson = group?.lessons.find((l) => l.id === lessonId);
		setDeleteTarget({
			type: "lesson",
			groupId,
			groupTitle: group?.name ?? "",
			lessonId,
			lessonTitle: lesson?.title ?? "",
		});
		setShowDeleteModal(true);
	};

	const handleCreateGroup = async () => {
		if (newGroupTitle.trim() === "") return;

		const response = await executeCreateLessonGroupApi(
			`${API_URL}/api/courses/${courseId}/lesson-groups`,
			'POST',
			{
				title: newGroupTitle.trim(),
			}
		);

		if (response && response.ok) {
			const createdLessonGroup = await response.json();
			
			alert("レッスングループを作成しました");
			// 作成後に選択状態にする
			setLessonGroups((prev) => [...prev, createdLessonGroup]);
			setOpenGroups((prev) => [...prev, createdLessonGroup.id]); // 作ったグループも開いた状態に
			setNewGroupTitle("");
			setIsCreatingGroup(false);
		} else {
			alert("レッスングループの作成に失敗しました");
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			handleCreateGroup();
		} else if (e.key === "Escape") {
			setIsCreatingGroup(false);
			setNewGroupTitle("");
		}
	};

	const startEditingGroup = (groupId: number, currentName: string) => {
		setEditingGroupId(groupId);
		setEditingGroupTitle(currentName);
	};

	const cancelEditingGroup = () => {
		setEditingGroupId(null);
		setEditingGroupTitle("");
	};

	const handleUpdateGroup = async (groupId: number) => {
		const title = editingGroupTitle.trim();
		if (title === "") {
			alert("グループ名を入力してください");
			return;
		}

		const group = lessonGroups.find((g) => g.id === groupId);
		if (group?.name === title) {
			cancelEditingGroup();
			return;
		}

		const response = await executeUpdateLessonGroupApi(
			`${API_URL}/api/courses/${courseId}/lesson-groups/${groupId}`,
			'PUT',
			{ title }
		);

		if (response && response.ok) {
			const updatedLessonGroup: LessonGroupDto = await response.json();
			setLessonGroups((prev) =>
				prev.map((g) =>
					g.id === groupId
						? { ...g, name: updatedLessonGroup.name, updatedAt: updatedLessonGroup.updatedAt }
						: g
				)
			);
			cancelEditingGroup();
		} else {
			alert("レッスングループの更新に失敗しました");
		}
	};

	const handleEditGroupKeyDown = (
		e: React.KeyboardEvent<HTMLInputElement>,
		groupId: number
	) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleUpdateGroup(groupId);
		} else if (e.key === "Escape") {
			cancelEditingGroup();
		}
	};

	const handleEditGroupBlur = () => {
		setTimeout(() => cancelEditingGroup(), 150);
	};

	const handleLessonDragStart = (
		e: React.DragEvent,
		groupId: number,
		lessonId: number,
		fromIndex: number,
		title: string
	) => {
		if (isReordering) {
			e.preventDefault();
			return;
		}

		setDraggedLesson({ groupId, lessonId, fromIndex, title });
		e.dataTransfer.effectAllowed = "move";
		e.dataTransfer.setData("text/plain", String(lessonId));

		const sourceRow = e.currentTarget.closest("li");
		if (sourceRow) {
			const ghost = sourceRow.cloneNode(true) as HTMLElement;
			ghost.style.position = "fixed";
			ghost.style.top = "-1000px";
			ghost.style.left = "-1000px";
			ghost.style.width = `${sourceRow.getBoundingClientRect().width}px`;
			ghost.style.opacity = "0.9";
			ghost.style.background = "rgb(51 65 85)";
			ghost.style.boxShadow = "0 12px 28px rgba(0, 0, 0, 0.45)";
			ghost.style.borderRadius = "8px";
			ghost.style.border = "1px solid rgba(96, 165, 250, 0.5)";
			ghost.style.pointerEvents = "none";
			document.body.appendChild(ghost);
			dragGhostRef.current = ghost;

			const rect = e.currentTarget.getBoundingClientRect();
			e.dataTransfer.setDragImage(
				ghost,
				e.clientX - rect.left + 8,
				e.clientY - rect.top + 8
			);
		}
	};

	const handleLessonDragEnd = () => {
		if (dragGhostRef.current) {
			document.body.removeChild(dragGhostRef.current);
			dragGhostRef.current = null;
		}
		setDraggedLesson(null);
		setDropInsertIndex(null);
	};

	const handleLessonDragOver = (
		e: React.DragEvent,
		groupId: number,
		lessonIndex: number
	) => {
		if (!draggedLesson || draggedLesson.groupId !== groupId) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();
		e.dataTransfer.dropEffect = "move";

		const rect = e.currentTarget.getBoundingClientRect();
		const insertAfter = e.clientY > rect.top + rect.height / 2;
		const insertIndex = insertAfter ? lessonIndex + 1 : lessonIndex;

		if (dropInsertIndex !== insertIndex) {
			setDropInsertIndex(insertIndex);
		}
	};

	const handleLessonDragLeave = (e: React.DragEvent) => {
		if (!e.currentTarget.contains(e.relatedTarget as Node)) {
			setDropInsertIndex(null);
		}
	};

	const handleLessonListDragLeave = (e: React.DragEvent) => {
		if (!e.currentTarget.contains(e.relatedTarget as Node)) {
			setDropInsertIndex(null);
		}
	};

	const handleLessonDrop = async (
		e: React.DragEvent,
		groupId: number,
		toIndex: number
	) => {
		e.preventDefault();
		e.stopPropagation();
		setDropInsertIndex(null);

		if (!draggedLesson || draggedLesson.groupId !== groupId) {
			return;
		}

		const { lessonId, fromIndex } = draggedLesson;
		const targetIndex = dropInsertIndex ?? toIndex;
		const normalizedToIndex =
			fromIndex < targetIndex ? targetIndex - 1 : targetIndex;

		if (fromIndex === normalizedToIndex) {
			setDraggedLesson(null);
			return;
		}

		const group = lessonGroups.find((g) => g.id === groupId);
		if (!group) {
			setDraggedLesson(null);
			return;
		}

		const reorderedLessons = reorderLessons(group.lessons, fromIndex, normalizedToIndex);
		const orderUpdateBody = buildLessonOrderUpdateBody(reorderedLessons, lessonId);
		const previousGroups = lessonGroups;

		setLessonGroups((prev) =>
			prev.map((g) =>
				g.id === groupId ? { ...g, lessons: reorderedLessons } : g
			)
		);
		setDraggedLesson(null);
		setIsReordering(true);

		try {
			const response = await executeUpdateLessonOrderApi(
				`${API_URL}/api/courses/${courseId}/lesson-groups/${groupId}/lessons/${lessonId}/order`,
				'PUT',
				orderUpdateBody
			);

			if (!response?.ok) {
				alert("並び順の更新に失敗しました");
				setLessonGroups(previousGroups);
				return;
			}

			const updatedLesson = await response.json();
			setLessonGroups((prev) =>
				prev.map((g) =>
					g.id === groupId
						? {
							...g,
							lessons: g.lessons
								.map((lesson) =>
									lesson.id === updatedLesson.id
										? { ...lesson, lessonOrder: updatedLesson.lessonOrder }
										: lesson
								)
								.sort((a, b) => a.lessonOrder - b.lessonOrder),
						}
						: g
				)
			);
		} catch (error) {
			console.error("レッスン並び順更新エラー:", error);
			alert("並び順の更新中にエラーが発生しました");
			setLessonGroups(previousGroups);
		} finally {
			setIsReordering(false);
		}
	};

	const handleCreateLesson = (lessonGroupId: number) => {
		if (onLessonSelect) {
			onLessonSelect(null);
		}
		onClose?.();
		router.push(`/admin/courses/${courseId}/lesson-groups/${lessonGroupId}/lessons/new`);
	};

	const handleEditLesson = (lessonGroupId: number, lessonId: number) => {
		if (isEditPage) {
			if (onLessonSelect) {
				onLessonSelect(lessonId);
			}
			router.push(`/admin/courses/${courseId}/lesson-groups/${lessonGroupId}/lessons/${lessonId}/edit`);
		} else {
			router.push(`/admin/courses/${courseId}/lesson-groups/${lessonGroupId}/lessons/${lessonId}/edit`);
		}
		onClose?.();
	};

	if (isLoading || isLoadingApi) {
		return (
			<div className="w-full h-full bg-slate-800 p-4 overflow-y-auto">
				<h2 className="text-sm font-bold text-slate-300 mb-4">レッスン一覧</h2>
				<LoadingSpinner size="sm" />
			</div>
		);
	}

	if (error || isErrorApi) {
		return (
			<div className="w-full h-full bg-slate-800 p-4 overflow-y-auto">
				<h2 className="text-sm font-bold text-slate-300 mb-4">レッスン一覧</h2>
				<div className="text-center py-8 text-sm text-red-400">
					エラーが発生しました: {error || 'データの取得に失敗しました'}
				</div>
			</div>
		);
	}

	return (
		<div
			className="w-full h-full bg-slate-800 overflow-y-auto"
			onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
			onTouchEnd={(e) => {
				const deltaX = e.changedTouches[0].clientX - touchStartX.current;
				if (deltaX < -60) onClose?.();
			}}
		>
			<div className="px-4 py-4 border-b border-slate-700 flex items-center justify-between">
				<h2 className="text-sm font-bold text-slate-300">レッスン一覧</h2>
				{onClose && (
					<button onClick={onClose} className="md:hidden text-slate-600 hover:text-slate-400 p-1 transition-colors">
						<X size={18} />
					</button>
				)}
			</div>
			<ul className="p-3 mb-11">
				{lessonGroups.map((group) => {
					const isOpen = openGroups.includes(group.id);
					return (
						<div key={group.id} className="rounded-xl overflow-hidden mb-2 border border-slate-600">
							<div className="flex justify-between items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 cursor-pointer bg-slate-700 hover:bg-slate-600 transition-colors">
								{editingGroupId === group.id ? (
									<div className="flex-1 min-w-0">
										<input
											type="text"
											className="w-full bg-slate-600 border border-blue-500 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											value={editingGroupTitle}
											onChange={(e) => setEditingGroupTitle(e.target.value)}
											onKeyDown={(e) => handleEditGroupKeyDown(e, group.id)}
											onBlur={handleEditGroupBlur}
											onClick={(e) => e.stopPropagation()}
											autoFocus
										/>
									</div>
								) : (
									<span
										onClick={() => toggleGroup(group.id)}
										onDoubleClick={(e) => {
											e.stopPropagation();
											startEditingGroup(group.id, group.name);
										}}
										className="flex-1"
										title="ダブルクリックで編集"
									>
										{group.name}
									</span>
								)}
								<div className="flex shrink-0 items-center gap-2">
									{editingGroupId !== group.id && (
										<button
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteGroup(group.id);
											}}
											className="text-slate-400 hover:text-red-400 transition-colors"
											title="グループ削除"
										>
											<Trash2 size={14} />
										</button>
									)}
									{isOpen ? (
										<ChevronUp size={14} className="text-slate-400" />
									) : (
										<ChevronDown size={14} className="text-slate-400" />
									)}
								</div>
							</div>

							{isOpen && (
								<ul
									className="bg-slate-800"
									onDragLeave={handleLessonListDragLeave}
								>
									{group.lessons?.map((lesson, lessonIndex) => {
										const isDragging = draggedLesson?.lessonId === lesson.id;
										const showInsertLineBefore =
											draggedLesson?.groupId === group.id &&
											dropInsertIndex === lessonIndex &&
											!isDragging;
										const showInsertLineAfter =
											draggedLesson?.groupId === group.id &&
											dropInsertIndex === lessonIndex + 1 &&
											!isDragging &&
											lessonIndex === group.lessons.length - 1;

										return (
											<li
												key={lesson.id}
												className={`relative flex justify-between items-center gap-2 text-sm px-4 py-2.5 border-b border-slate-700 last:border-b-0 ${
													selectedLessonId === lesson.id && !isDragging
														? 'bg-blue-600/20 text-blue-300 font-semibold border-l-2 border-blue-500'
														: isDragging
															? 'bg-slate-900/40 text-slate-500 opacity-35'
															: 'text-slate-300 hover:bg-slate-700 hover:text-white'
												}`}
												onDragOver={(e) =>
													handleLessonDragOver(e, group.id, lessonIndex)
												}
												onDragLeave={handleLessonDragLeave}
												onDrop={(e) => handleLessonDrop(e, group.id, lessonIndex)}
											>
												{showInsertLineBefore && (
													<div className="absolute inset-x-0 top-0 h-0.5 bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)] pointer-events-none" />
												)}
												{showInsertLineAfter && (
													<div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.8)] pointer-events-none" />
												)}
												{isDragging && (
													<div className="absolute inset-0 border border-dashed border-slate-500 rounded pointer-events-none" />
												)}
												<button
													type="button"
													draggable={!isReordering}
													onDragStart={(e) =>
														handleLessonDragStart(
															e,
															group.id,
															lesson.id,
															lessonIndex,
															lesson.title
														)
													}
													onDragEnd={handleLessonDragEnd}
													onClick={(e) => e.stopPropagation()}
													className="text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing shrink-0 disabled:cursor-not-allowed disabled:opacity-50"
													title="ドラッグして並び替え"
													disabled={isReordering}
												>
													<GripVertical size={14} />
												</button>
												<span
													className={`flex-1 cursor-pointer ${isDragging ? 'opacity-0' : ''}`}
													onClick={() => handleEditLesson(group.id, lesson.id)}
												>
													{lesson.title}
												</span>
												<button
													onClick={(e) => {
														e.stopPropagation();
														handleDeleteLesson(group.id, lesson.id);
													}}
													className={`text-slate-500 hover:text-red-400 transition-colors shrink-0 ${isDragging ? 'opacity-0' : ''}`}
													title="レッスン削除"
													disabled={isReordering || isDragging}
												>
													<Trash2 size={14} />
												</button>
											</li>
										);
									})}
									<li
										className="text-blue-400 text-sm font-medium px-4 py-2.5 hover:bg-slate-700 cursor-pointer transition-colors flex items-center gap-1"
										onClick={() => handleCreateLesson(group.id)}
									>
										<Plus size={14} />
										レッスンを作成
									</li>
								</ul>
							)}
						</div>
					);
				})}

				{/* グループ追加のエリア */}
				{isCreatingGroup ? (
					<li className="p-2">
						<input
							type="text"
							className="w-full p-2.5 bg-slate-700 border border-blue-500 rounded-xl text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="グループ名を入力してEnter"
							value={newGroupTitle}
							onChange={(e) => setNewGroupTitle(e.target.value)}
							onKeyDown={handleKeyDown}
							autoFocus
						/>
					</li>
				) : (
					<li
						className="text-blue-400 text-sm font-medium px-4 py-2.5 hover:bg-slate-700 cursor-pointer border border-dashed border-slate-600 rounded-xl text-center transition-colors flex items-center justify-center gap-1"
						onClick={() => setIsCreatingGroup(true)}
					>
						<Plus size={14} />
						レッスングループを作成
					</li>
				)}
			</ul>
		</div>
	);
}
