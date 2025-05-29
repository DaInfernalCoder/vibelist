"use client";

import RouteGuard from "./RouteGuard";

/**
 * Higher-order component for protecting routes
 * @param {React.Component} WrappedComponent - The component to protect
 * @param {Object} guardOptions - Options for the route guard
 * @returns {React.Component} Protected component
 */
const withRouteGuard = (WrappedComponent, guardOptions = {}) => {
  const ProtectedComponent = (props) => {
    return (
      <RouteGuard {...guardOptions}>
        <WrappedComponent {...props} />
      </RouteGuard>
    );
  };

  // Set display name for debugging
  ProtectedComponent.displayName = `withRouteGuard(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return ProtectedComponent;
};

// Convenience functions for common use cases
export const withAuth = (WrappedComponent) =>
  withRouteGuard(WrappedComponent, {
    requireAuth: true,
    requireSubscription: false,
  });

export const withSubscription = (WrappedComponent, feature, description) =>
  withRouteGuard(WrappedComponent, {
    requireAuth: true,
    requireSubscription: true,
    feature,
    description,
  });

export const withPremium = (
  WrappedComponent,
  feature = "Premium Feature",
  description
) => withSubscription(WrappedComponent, feature, description);

export default withRouteGuard;
