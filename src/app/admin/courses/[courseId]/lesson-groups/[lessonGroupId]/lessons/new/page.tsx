'use client';

import { useState } from "react";
import LessonDetailForAdmin from "@/features/lesson/components/LessonDetailForAdmin";

export default function NewLessonPage() {
	// 選択されたレッスンIDの状態管理
	const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
	
	// レッスン選択時のハンドラー
	const handleLessonSelect = (lessonId: number) => {
		console.log('Selected lesson:', lessonId);
		setSelectedLessonId(lessonId);
	};

	return (
		<LessonDetailForAdmin 
			onLessonSelect={handleLessonSelect}
			selectedLessonId={selectedLessonId}
			isEditPage={false}
		/>
	);
}
