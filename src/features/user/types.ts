export type UserDto = {
	id: number
	emailAddress: string
	realName: string
	userName: string
	thumbnailUrl: string | null
	userRole: string
	createdAt: string
	lastLoginAt: string | null
	progressRate: number
}

export type UserPageDto = {
	userDtos: UserDto[]
	pageNum: number
	pageSize: number
	totalSize: number
}

export type UserImportResponseDto = {
	importedCount: number
}