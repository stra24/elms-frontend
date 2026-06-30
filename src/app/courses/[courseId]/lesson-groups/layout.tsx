'use client';

import { useState } from "react";
import { BookOpen } from 'lucide-react';
import Header from "@/components/Header";
import LessonListSidebar from "@/components/sidebar/LessonListSidebar";

export default function LessonGroupsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
	const [isSidebarOpen, setIsSidebarOpen] = useState(true);

	const handleLessonSelect = (lessonId: number) => {
		setSelectedLessonId(lessonId);
	};

	return (
		<div>
			<Header />
			<div className="flex mt-[60px]">
				{/* Mobile backdrop */}
				{isSidebarOpen && (
					<div
						className="fixed inset-0 bg-black/50 z-20 md:hidden"
						onClick={() => setIsSidebarOpen(false)}
					/>
				)}

				{/* Lesson sidebar */}
				<div
					className={`fixed top-[60px] left-0 bottom-0 z-30
						w-full md:w-120
						transition-transform duration-300 ease-in-out
						md:translate-x-0
						${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
				>
					<LessonListSidebar
						onLessonSelect={handleLessonSelect}
						selectedLessonId={selectedLessonId}
						onClose={() => setIsSidebarOpen(false)}
					/>
				</div>

				{/* Main content */}
				<div className="flex-1 w-full md:ml-[30rem] min-w-0">
					{children}
				</div>
			</div>

			{/* Mobile FAB to toggle sidebar */}
			<button
				className="fixed bottom-6 right-6 z-20 md:hidden bg-blue-600 text-white pl-4 pr-5 py-3 rounded-full shadow-xl flex items-center gap-2 text-sm font-semibold"
				onClick={() => setIsSidebarOpen(true)}
			>
				<BookOpen size={18} />
				レッスン一覧
			</button>
		</div>
	);
}
