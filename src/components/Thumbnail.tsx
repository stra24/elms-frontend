import { API_URL } from '@/lib/apiUrl';

interface ThumbnailProps {
	thumbnailUrl: string;
	alt: string;
	className?: string;
}

export default function Thumbnail({ thumbnailUrl, alt, className }: ThumbnailProps) {
	const imageSrc = thumbnailUrl.startsWith('blob:') || thumbnailUrl.startsWith('http')
		? thumbnailUrl
		: `${API_URL}${thumbnailUrl}`;

	return (
		<img
			src={imageSrc}
			alt={alt}
			className={className}
		/>
	);
}