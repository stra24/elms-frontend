export function getJWTFromCookie(): string | null {
	return document.cookie
		.split("; ")
		.find((row) => row.startsWith("JWT="))
		?.split("=")[1] || null;
}

export function getSubjectFromJWT(token: string): string {
	return JSON.parse(atob(token.split(".")[1])).sub
}

export function setUserRoleCookie(userRole: string): void {
	const roleCode = userRole === '管理者' ? 'ADMIN' : 'GENERAL';
	document.cookie = `userRole=${roleCode}; path=/; SameSite=Strict`;
}

export function clearUserRoleCookie(): void {
	document.cookie = `userRole=; path=/; max-age=0; SameSite=Strict`;
}
