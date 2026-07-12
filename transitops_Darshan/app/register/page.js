import AuthCard from "@/components/AuthCard";
import { registerAction } from "@/lib/actions/auth";
export const metadata = { title: "Register — TransitOps" };
export default function RegisterPage() { return <AuthCard action={registerAction} mode="register" />; }
