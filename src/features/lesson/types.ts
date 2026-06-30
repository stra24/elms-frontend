export type LessonDto = {
	id: number;
	lessonGroupId: number;
	courseId: number;
	lessonOrder: number;
	title: string;
	content: string;
	videoUrl: string;
	createdAt: string;
	updatedAt: string;
};

export type UserLessonDetailDto = {
	id: number;
	lessonGroupId: number;
	courseId: number;
	lessonOrder: number;
	title: string;
	content: string;
	videoUrl: string;
	createdAt: string;
	updatedAt: string;
	isLessonCompleted: boolean;
};

export type LessonPageDto = {
	lessonDtos: LessonDto[];
	pageNum: number;
	pageSize: number;
	totalSize: number;
};

export type LessonGroupDto = {
	id: number;
	courseId: number;
	lessonGroupOrder: number;
	name: string;
	createdAt: string;
	updatedAt: string;
	lessons: LessonDto[];
};

export type CourseLessonsDto = {
	courseId: number;
	lessonGroups: LessonGroupDto[];
};

export type UserLessonDto = {
	lesson: LessonDto;
	isLessonCompleted: boolean;
};

export type UserLessonGroupDto = {
	id: number;
	courseId: number;
	lessonGroupOrder: number;
	name: string;
	createdAt: string;
	updatedAt: string;
	userLessons: UserLessonDto[];
};
