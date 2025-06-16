"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import clsx from "clsx"; // Optional utility to clean up classNames (install if you want)

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Patient Dashboard", path: "/patient" },
    { name: "More", path: "/more" },
  ];

  return (
    <nav className="w-full px-6 py-4 bg-[var(--background)] text-[var(--foreground)] shadow-sm rounded-2xl mx-auto max-w-screen-xl mt-4">
      <div className="flex justify-between items-center">
        {/* Web title */}
        <div
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-xl font-semibold tracking-tight cursor-pointer"
        >
          <Image src="/image/logo.png" alt="Precision Rehabilitation" width={36} height={36} />
          Precision Rehabilitation
        </div>

        {/* Links */}
        <div className="flex gap-4 text-sm font-medium items-center">
          {navItems.map(({ name, path }) => {
            const isActive = pathname === path;
            return (
              <button
                key={name}
                onClick={() => router.push(path)}
                className={clsx(
                  "px-4 py-1.5 rounded-full transition",
                  isActive
                    ? "bg-[var(--color-primary)] text-[var(--button-text)]"
                    : "hover:text-[var(--color-primary)]"
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
