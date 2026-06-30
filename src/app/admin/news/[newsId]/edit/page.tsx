import AdminLayout from "@/components/AdminLayout";
import NewsDetailForAdmin from "@/features/news/components/NewsDetailForAdmin";

type Props = {
	params: Promise<{
		newsId: string;
	}>;
};

export default async function NewsPage({ params }: Props) {
	const { newsId } = await params;
	return (
		<AdminLayout>
			<NewsDetailForAdmin newsId={parseInt(newsId, 10)} isNew={false} />
		</AdminLayout>
	);
}
