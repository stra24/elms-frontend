import NewPasswordForm from '@/features/login/components/NewPasswordForm';

type Props = {
	searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
	const params = await searchParams;
	return <NewPasswordForm token={params.token ?? ''} />;
}
