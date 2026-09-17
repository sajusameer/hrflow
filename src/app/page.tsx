import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/session";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (token) {
    const session = await verifySession(token);
    if (session) {
      redirect("/dashboard");
    }
  }

  redirect("/login");
}