import { Link } from "@remix-run/react";

export default () => {
  return (
    <div className="grow flex flex-col justify-center items-center space-y-4">
      <div className="text-bold text-6xl">404</div>
      <div className="text-bold text-6xl">Route not found!</div>
      <Link to={"/"} className="px-4 py-2 bg-primary text-white text-4xl rounded-xl hover:bg-primary-dark">
        Return
      </Link>
    </div>
  );
};
