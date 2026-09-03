import "./auth.css";
import PageCard from "../../components/PageCard/PageCard";
import InputField from "../../components/InputField/Input";
import { useState, type ChangeEvent } from "react";
import { loginUser, registerUser } from "../../services/authAPI";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "../../components/Button/Button";

function Auth() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const getErrorMessage = (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return "Something went wrong. Please try again.";
    }

    const serverMessage = error.response?.data?.message;

    if (typeof serverMessage === "string") {
      if (serverMessage.includes("E11000")) {
        return "That email is already registered. Try signing in instead.";
      }

      if (serverMessage.includes("validation failed")) {
        return "Please check your information and try again.";
      }

      if (serverMessage.includes("Invalid Credentials")) {
        return "The email or password is incorrect.";
      }

      return serverMessage;
    }

    return "We could not complete your request. Please try again.";
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        };

    try {
      setIsSubmitting(true);

      const response = isLogin
        ? await loginUser(payload)
        : await registerUser(payload);

      if (isLogin) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("userName", response.user.name);
        localStorage.setItem("userEmail", response.user.email);
        localStorage.setItem("userRole", response.user.role || "host");
        navigate("/home");
      } else {
        setSuccessMessage(
          "Your account was created successfully. Please sign in.",
        );
        setIsLogin(true);
        setFormData({ name: "", email: "", password: "" });
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageCard className="auth-card">
      <h1>{isLogin ? "Welcome back" : "Create your account"}</h1>
      <p className="auth-intro">
        {isLogin
          ? "Sign in to host debates and join your next discussion."
          : "Set up your account and start leading better discussions."}
      </p>

      {errorMessage && <p className="auth-error">{errorMessage}</p>}
      {successMessage && (
        <p className="auth-success" role="status">
          {successMessage}
        </p>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        {!isLogin && (
          <InputField
            label="Name"
            name="name"
            value={formData.name}
            placeholder="Your name"
            onChange={handleChange}
          />
        )}
        <InputField
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          placeholder="you@example.com"
          onChange={handleChange}
        />
        <InputField
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          placeholder="Enter your password"
          showPasswordToggle
          onChange={handleChange}
        />
        {isLogin && (
          <a className="forgot-password" href="/forgot-password">
            Forgot password?
          </a>
        )}
        <Button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Please wait..."
            : isLogin
              ? "Sign in"
              : "Create account"}
        </Button>
      </form>

      <div className="auth-switch">
        <span>
          {isLogin ? "New to Debate Room?" : "Already have an account?"}
        </span>
        <Button
          variant="ghost"
          type="button"
          onClick={() => setIsLogin((current) => !current)}
        >
          {isLogin ? "Create an account" : "Sign in instead"}
        </Button>
      </div>
    </PageCard>
  );
}

export default Auth;
