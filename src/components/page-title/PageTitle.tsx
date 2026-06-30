import { GRADIENT_ACCENT } from '@/lib/gradients';
import { adminHeaderHeight } from '@/lib/pageLayout';

type PageTitleProps = {
	title: string;
	containerClassName?: string;
	/** AdminLayout 内など、ヘッダー分の mt を付けない場合に true */
	embedded?: boolean;
};

export default function PageTitle({
	title,
	containerClassName = "max-w-5xl mx-auto px-8",
	embedded = false,
}: PageTitleProps) {
	return (
		<div
			className={`${embedded ? "" : "mt-[60px]"} w-full bg-white border-b border-blue-100 shadow-sm`}
		>
			<div
				className={`${containerClassName} ${embedded ? adminHeaderHeight : "py-7"} flex items-center gap-3`}
			>
				<span className={`block w-1 h-8 rounded-full bg-gradient-to-b ${GRADIENT_ACCENT} shrink-0`} />
				<h1 className="text-2xl font-bold text-slate-800">{title}</h1>
			</div>
		</div>
	);
}
