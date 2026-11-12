import AuthLayoutTemplate from '@/layouts/auth/auth-pond-layout';

export default function AuthLayout({
    title = '',
    description = '',
    step,
    wide = false,
    children,
}: {
    title?: string;
    description?: string;
    step?: string;
    wide?: boolean;
    children: React.ReactNode;
}) {
    return (
        <AuthLayoutTemplate title={title} description={description} step={step} wide={wide}>
            {children}
        </AuthLayoutTemplate>
    );
}
