"use client";
import { useState } from "react";
import { Menu } from "lucide-react";
import Header from "./Header";
import SidebarForAdmin from "./sidebar/SidebarForAdmin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const [sidebarOpen, setSidebarOpen] = useState(false);

	return (
		<div>
			<Header />

			<div className="flex mt-[60px] min-h-[calc(100vh-60px)]">
				{/* Mobile backdrop */}
				{sidebarOpen && (
					<div
						className="fixed inset-0 bg-black/50 z-20 md:hidden"
						onClick={() => setSidebarOpen(false)}
					/>
				)}

				{/* Admin nav sidebar */}
				<div
					className={`fixed top-[60px] left-0 bottom-0 w-70 z-30
						transition-transform duration-300 ease-in-out
						md:translate-x-0
						${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
				>
					<SidebarForAdmin onClose={() => setSidebarOpen(false)} />
				</div>

				{/* Main content */}
				<div className="flex-1 w-full md:ml-[17.5rem] min-w-0">
					{children}
				</div>
			</div>

			{/* Mobile FAB to open sidebar */}
			{!sidebarOpen && (
				<button
					className="fixed bottom-6 left-6 z-20 md:hidden bg-slate-800 text-white p-3.5 rounded-full shadow-xl"
					onClick={() => setSidebarOpen(true)}
					aria-label="メニューを開く"
				>
					<Menu size={22} />
				</button>
			)}
		</div>
	);
}
