import AdminLayout from "@/components/AdminLayout";
import UserDetail from "@/features/user/components/UserDetail";
import PageTitle from "@/components/page-title/PageTitle";
import { pageContainer } from "@/lib/pageLayout";

export default function Home() {
	return (
		<AdminLayout>
			<PageTitle
				title="ユーザー詳細"
				containerClassName={pageContainer.medium}
				embedded
			/>
			<UserDetail />
		</AdminLayout>
	);
}
