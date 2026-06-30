import AdminLayout from "@/components/AdminLayout";
import PageTitle from "@/components/page-title/PageTitle";
import UserDetail from "@/features/user/components/UserDetail";
import { pageContainer } from "@/lib/pageLayout";

export default function Home() {
	return (
		<AdminLayout>
			<PageTitle
				title="ユーザー新規作成"
				containerClassName={pageContainer.medium}
				embedded
			/>
			<UserDetail />
		</AdminLayout>
	);
}
