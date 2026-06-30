import AdminLayout from "@/components/AdminLayout";
import NewsDetailForAdmin from "@/features/news/components/NewsDetailForAdmin";

export default function NewsPage() {
	return (
		<AdminLayout>
			<NewsDetailForAdmin isNew={true} />
		</AdminLayout>
	);
}
