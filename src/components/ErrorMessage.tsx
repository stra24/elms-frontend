import { AlertCircle } from "lucide-react";

type Props = {
	message?: string;
};

export default function ErrorMessage({ message }: Props) {
	return (
		<div className="min-h-[calc(100vh-60px)] flex flex-col items-center justify-center gap-3">
			<div className="flex flex-col items-center gap-3 bg-white border border-red-100 rounded-2xl px-10 py-8 shadow-sm">
				<AlertCircle className="text-red-400" size={36} />
				<p className="text-sm font-semibold text-slate-600">エラーが発生しました</p>
				{message && <p className="text-xs text-slate-400">{message}</p>}
			</div>
		</div>
	);
}
