// client/src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ isAuthenticated, children }) {
    if (isAuthenticated === null) {
        return <div>Loading...</div>; // Optional: Show loading while App.js checks auth
    }

    return isAuthenticated ? children : <Navigate to="/login" state={{ from: window.location.pathname }} />;
}

export default ProtectedRoute;