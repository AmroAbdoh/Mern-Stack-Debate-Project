import { createBrowserRouter } from "react-router-dom";
import Auth from "../pages/Auth/Auth";
import ForgetPassword from "../pages/Auth/ForgetPassword";
import LandingPage from "../pages/LandingPage/LandingPage";

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
]);
