type Props = {
	size?: "sm" | "md";
};

export default function LoadingSpinner({ size = "md" }: Props) {
	if (size === "sm") {
		return (
			<div className="flex justify-center items-center py-4">
				<div className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
			</div>
		);
	}
	return (
		<div className="min-h-[calc(100vh-60px)] flex justify-center items-center">
			<div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
		</div>
	);
}
