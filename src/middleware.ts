import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const jwtToken = request.cookies.get('JWT')?.value;
	const refreshToken = request.cookies.get('RefreshToken')?.value;
	const userRole = request.cookies.get('userRole')?.value;
	const isAuthenticated = !!(jwtToken || refreshToken);

	// ルートパスはログインページへ
	if (pathname === '/') {
		return NextResponse.redirect(new URL('/login', request.url));
	}

	// ログイン済みでロールが確定している場合、ログインページを適切なページへ置き換え
	if (pathname === '/login') {
		if (isAuthenticated && userRole) {
			const dest = userRole === 'ADMIN' ? '/admin/courses' : '/courses';
			return NextResponse.redirect(new URL(dest, request.url));
		}
		return NextResponse.next();
	}

	// 未認証またはロール不明の場合はログインページへ
	if (!isAuthenticated || !userRole) {
		return NextResponse.redirect(new URL('/login', request.url));
	}

	// 管理者ページは ADMIN のみ
	if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
		return NextResponse.redirect(new URL('/courses', request.url));
	}

	// 一般ページ（コース・ニュース）は GENERAL のみ
	if ((pathname.startsWith('/courses') || pathname.startsWith('/news')) && userRole !== 'GENERAL') {
		return NextResponse.redirect(new URL('/admin/courses', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		'/',
		'/login',
		'/admin/:path*',
		'/courses/:path*',
		'/news/:path*',
		'/account',
	],
};
