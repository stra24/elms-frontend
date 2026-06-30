import { LessonDto, LessonGroupDto } from "./types";

export function findFirstLessonPath(
	courseId: number,
	lessonGroups: LessonGroupDto[]
): string | null {
	const sortedGroups = [...lessonGroups].sort((a, b) => a.lessonGroupOrder - b.lessonGroupOrder);

	for (const group of sortedGroups) {
		const sortedLessons = [...(group.lessons ?? [])].sort((a, b) => a.lessonOrder - b.lessonOrder);
		if (sortedLessons.length > 0) {
			const lesson = sortedLessons[0];
			return `/courses/${courseId}/lesson-groups/${group.id}/lessons/${lesson.id}`;
		}
	}

	return null;
}

export function findFirstLessonEditPath(
	courseId: number,
	lessonGroups: LessonGroupDto[]
): string | null {
	const sortedGroups = [...lessonGroups].sort((a, b) => a.lessonGroupOrder - b.lessonGroupOrder);

	for (const group of sortedGroups) {
		const sortedLessons = [...(group.lessons ?? [])].sort((a, b) => a.lessonOrder - b.lessonOrder);
		if (sortedLessons.length > 0) {
			const lesson = sortedLessons[0];
			return `/admin/courses/${courseId}/lesson-groups/${group.id}/lessons/${lesson.id}/edit`;
		}
	}

	return null;
}

export function reorderLessons(
	lessons: LessonDto[],
	fromIndex: number,
	toIndex: number
): LessonDto[] {
	if (fromIndex === toIndex) {
		return [...lessons];
	}

	const result = [...lessons];
	const [moved] = result.splice(fromIndex, 1);
	result.splice(toIndex, 0, moved);
	return result;
}

export function buildLessonOrderUpdateBody(lessons: LessonDto[], movedLessonId: number) {
	const newIndex = lessons.findIndex((lesson) => lesson.id === movedLessonId);

	return {
		precedingLessonId: newIndex > 0 ? lessons[newIndex - 1].id : null,
		followingLessonId: newIndex < lessons.length - 1 ? lessons[newIndex + 1].id : null,
	};
}
