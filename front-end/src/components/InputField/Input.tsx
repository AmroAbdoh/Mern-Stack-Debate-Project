import { useState, type ChangeEvent } from "react";
import "./input.css";
import Button from "../Button/Button";

interface InputFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password";
  value?: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  showPasswordToggle?: boolean;
}

function InputField({
  label,
  name,
  type = "text",
  value,
  placeholder,
  required = false,
  onChange,
  showPasswordToggle = false,
}: InputFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputType = type === "password" && isPasswordVisible ? "text" : type;

  return (
    <div className="input-field">
      <label htmlFor={name}>{label}</label>
      <div className="input-wrapper">
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          placeholder={placeholder}
          required={required}
          onChange={onChange}
        />
        {type === "password" && showPasswordToggle && (
          <Button
            className="password-toggle"
            variant="ghost"
            type="button"
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            onClick={() => setIsPasswordVisible((current) => !current)}
          >
            {isPasswordVisible ? "Hide" : "Show"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default InputField;
