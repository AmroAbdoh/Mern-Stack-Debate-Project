import "./auth.css";
import PageCard from "../../components/PageCard/PageCard";
import InputField from "../../components/InputField/Input";
import { useState, type ChangeEvent } from "react";

function Auth() {
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <PageCard className="auth-card">
      
      <h1>{isLogin ? "Welcome back" : "Create your account"}</h1>
      <p className="auth-intro">
        {isLogin
          ? "Sign in to host debates and join your next discussion."
          : "Set up your account and start leading better discussions."}
      </p>

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
        <button className="auth-submit" type="submit">
          {isLogin ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="auth-switch">
        <span>
          {isLogin ? "New to Debate Room?" : "Already have an account?"}
        </span>
        <button type="button" onClick={() => setIsLogin((current) => !current)}>
          {isLogin ? "Create an account" : "Sign in instead"}
        </button>
      </div>
    </PageCard>
  );
}

export default Auth;
