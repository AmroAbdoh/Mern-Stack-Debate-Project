import Auth from "./pages/LandingPage/LandingPage";
import AuthPage from "./pages/Auth/Auth";

function App() {
  return window.location.pathname === "/auth" ? <AuthPage /> : <Auth />;
}

export default App;
