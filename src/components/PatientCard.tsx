"use client";
import { useRouter } from "next/navigation";

interface ProfileCardProps {
  id: string;
}

export default function ProfileCard({ id }: ProfileCardProps) {
  const router = useRouter();

  return (
    <div 
      onClick={() => router.push(`/patient/${id}`)}
      className="cursor-pointer bg-white shadow-md rounded-lg p-4 flex flex-col items-center hover:shadow-xl transition"
    >
      <h2 className="mt-2 text-lg font-semibold">Patient {id}</h2>
    </div>
  );
}
