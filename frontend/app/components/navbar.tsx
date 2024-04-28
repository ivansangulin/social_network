import { Link } from "@remix-run/react";

export const Navbar = () => {
  return (
    <div className="flex flex-row bg-primary min-h-24 justify-between items-center drop-shadow-2xl sticky top-0 z-10">
      <div className="text-white text-4xl py-4 px-12">App name</div>
      <Link
        to={"/login"}
        className="text-white text-3xl py-4 pr-24 hover:underline"
      >
        Log out
      </Link>
    </div>
  );
};
