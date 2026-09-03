import "./auth.css";
import PageCard from "../../components/PageCard/PageCard";
import InputField from "../../components/InputField/Input";
import { useState, type ChangeEvent } from "react";
import { forgetPasswordUser } from "../../services/authAPI";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Button from "../../components/Button/Button";

function ForgetPassword() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    newPassword: "",
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

    const payload = {
      email: formData.email,
      newPassword: formData.newPassword,
    };

    try {
      setIsSubmitting(true);

      await forgetPasswordUser(payload);

      navigate("/");

      setFormData({ email: "", newPassword: "" });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <PageCard className="auth-card">
      <h1>Reset Password</h1>
      <p className="auth-intro">Enter Your Email and your new password</p>

      {errorMessage && <p className="auth-error">{errorMessage}</p>}
      {successMessage && (
        <p className="auth-success" role="status">
          {successMessage}
        </p>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
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
          value={formData.newPassword}
          placeholder="Enter your password"
          showPasswordToggle
          onChange={handleChange}
        />

        <Button className="auth-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Please wait..." : "Reset Password"}
        </Button>
      </form>

      <div className="auth-switch">
        <span>Remembered Your Password?</span>
        <Link to="/auth">Login</Link>
      </div>
    </PageCard>
  );
}

export default ForgetPassword;
