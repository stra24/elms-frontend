import AdminLayout from "@/components/AdminLayout";
import CourseListForAdmin from "@/features/course/components/CourseListForAdmin";

export default function Home() {
	return (
		<AdminLayout>
			<CourseListForAdmin />
		</AdminLayout>
	);
}
