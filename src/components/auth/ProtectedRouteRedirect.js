import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Keeps the user's original self-service destination across authentication.
 * This is especially important for acquisition CTAs that land directly on
 * establishment/service/staff setup routes.
 */
export default function ProtectedRouteRedirect({ user, children }) {
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        }}
      />
    );
  }

  if (!user.email_verified_at) {
    return (
      <Navigate
        to="/email-verify"
        replace
        state={{
          from: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
          },
        }}
      />
    );
  }

  return children;
}
