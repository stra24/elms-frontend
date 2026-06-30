import { getJWTFromCookie } from '@/lib/jwtUtil';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

// リクエストヘッダーを取得する関数
function getRequestHeaders(
	jwt: string | null,
	body?: Record<string, unknown> | FormData
): HeadersInit {
	const headers: HeadersInit = {};

	if (jwt) {
		headers['Authorization'] = `Bearer ${jwt}`;
	}

	if (body && !(body instanceof FormData)) {
		headers['Content-Type'] = 'application/json';
	}

	return headers;
}

// APIリクエストを実行するカスタムフック
export function useApiRequest() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState(false);
	const [response, setResponse] = useState<Response | null>(null);

	const executeApi = useCallback(
		async (url: string, method: string, body?: Record<string, unknown> | FormData) => {
			setIsLoading(true);
			setIsError(false);
			setResponse(null);

			const jwt = getJWTFromCookie();
			const headers = getRequestHeaders(jwt, body);
			try {
				const response = await fetch(
					url,
					{
						method,
						headers,
						credentials: 'include',
						body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
					}
				);

				if (response.status === 401) {
					router.push('/login');
					setIsError(true);
					setIsLoading(false);
					return;
				}

				if (response.status === 404) {
					// Spring のデフォルト 404（APIルート未実装）と
					// GlobalExceptionHandler の 404（リソース未存在）を区別する。
					// Spring デフォルトは body に error: "Not Found" が含まれる。
					const body = await response.clone().json().catch(() => ({}));
					if (body.error === 'Not Found') {
						router.push('/not-implemented');
						setIsError(true);
						setIsLoading(false);
						return;
					}
				}

				if (response.status === 403) {
					alert('認証エラー');
					setIsError(true);
					setIsLoading(false);
					return;
				}

				setResponse(response);
				return response;
			} catch (error) {
				console.error('APIエラー:', error);
				setIsError(true);
			} finally {
				setIsLoading(false);
			}
		},
		[router]
	);

	return { executeApi, isLoading, isError, response };
}
