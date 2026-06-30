import PageTitle from "@/components/page-title/PageTitle";
import { pageContainer } from "@/lib/pageLayout";
import Header from "@/components/Header";
import UserDetail from "@/features/user/components/UserDetail";

export default function MyAccount() {
	return (
		<>
			<Header />
			<div>
				{/* タイトル */}
				<PageTitle title="マイアカウント" containerClassName={pageContainer.medium} />

				{/* アカウント情報 */}
				<UserDetail />
			</div>
		</>
	);
}
