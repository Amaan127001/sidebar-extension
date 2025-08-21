import { useRouteError } from "react-router-dom";

const ErrorPage = () => {
  const error = useRouteError();
  console.error(error);
  
  return (
    <div className="p-4 text-red-500">
      <h1>Something went wrong</h1>
      <p>
        {(() => {
          if (typeof error === "object" && error !== null) {
            // @ts-expect-error: error might have statusText/message
            return error.statusText || error.message || "Unknown error";
          }
          return String(error);
        })()}
      </p>
      <button onClick={() => window.location.href = "/"}>Go to Home</button>
    </div>
  );
};

export default ErrorPage;