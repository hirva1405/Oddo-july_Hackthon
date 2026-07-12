import AuthCard from "@/components/AuthCard";
import { loginAction } from "@/lib/actions/auth";
export const metadata = { title: "Log in — TransitOps" };
export default function LoginPage() { return <AuthCard action={loginAction} mode="login" />; }
