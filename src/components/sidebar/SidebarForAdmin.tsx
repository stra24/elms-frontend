"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useRef } from "react";
import { adminHeaderHeight } from "@/lib/pageLayout";

export default function SidebarForAdmin({ onClose }: { onClose?: () => void }) {
	const touchStartX = useRef<number>(0);

	const sections = [
		{ id: "courses", label: "コース一覧", href: "/admin/courses" },
		{ id: "users", label: "ユーザー一覧", href: "/admin/users" },
		{ id: "news", label: "お知らせ一覧", href: "/admin/news" },
	];

	return (
		<div
			className="w-full h-full bg-slate-800 text-white flex flex-col"
			onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
			onTouchEnd={(e) => {
				const deltaX = e.changedTouches[0].clientX - touchStartX.current;
				if (deltaX < -60) onClose?.();
			}}
		>
			<div
				className={`px-5 ${adminHeaderHeight} border-b border-slate-700 flex items-center justify-between shrink-0`}
			>
				<div>
					<p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Admin</p>
					<h2 className="text-base font-bold text-white">管理者メニュー</h2>
				</div>
				{onClose && (
					<button
						onClick={onClose}
						className="md:hidden text-slate-400 hover:text-white p-1 transition-colors"
					>
						<X size={20} />
					</button>
				)}
			</div>
			<ul className="flex-1 py-3 px-3 space-y-1">
				{sections.map((section) => (
					<li key={section.id}>
						<Link
							href={section.href}
							onClick={onClose}
							className="flex items-center px-4 py-2.5 text-sm font-medium text-slate-300 rounded-xl hover:bg-slate-700 hover:text-white transition-colors"
						>
							{section.label}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
