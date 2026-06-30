'use client'

import AdminLayout from "@/components/AdminLayout";
import UserList from "@/features/user/components/UserList";

export default function Home() {
	return (
		<AdminLayout>
			<UserList />
		</AdminLayout>
	);
}
