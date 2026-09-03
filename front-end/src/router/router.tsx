import { createBrowserRouter } from "react-router-dom";
import Auth from "../pages/Auth/Auth";
import ForgetPassword from "../pages/Auth/ForgetPassword";
import LandingPage from "../pages/LandingPage/LandingPage";
import Home from "../pages/Home/Home";
import RequireAuth from "../components/RequireAuth/RequireAuth";
import DebateSession from "../pages/DebateSession/DebateSession";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/forgot-password",
    element: <ForgetPassword />,
  },
  {
    path: "/home",
    element: (
      <RequireAuth>
        <Home />
      </RequireAuth>
    ),
  },
  {
    path: "/sessions/:id",
    element: (
      <RequireAuth>
        <DebateSession />
      </RequireAuth>
    ),
  },
]);
