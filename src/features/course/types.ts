export type CourseDto = {
	id: number;
	courseOrder: number;
	thumbnailUrl: string;
	title: string;
	description: string;
};

export type CoursePageDto = {
	courseDtos: CourseDto[];
	pageNum: number;
	pageSize: number;
	totalSize: number;
};

export type UserCourseDto = {
	id: number;
	courseOrder: number;
	thumbnailUrl: string | null;
	title: string;
	description: string;
	createdAt: string;
	updatedAt: string;
	courseProgress: number;
};