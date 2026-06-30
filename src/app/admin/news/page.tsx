import AdminLayout from "@/components/AdminLayout";
import NewsListForAdmin from "@/features/news/components/NewsListForAdmin";

export default function Home() {
	return (
		<AdminLayout>
			<NewsListForAdmin />
		</AdminLayout>
	);
}
