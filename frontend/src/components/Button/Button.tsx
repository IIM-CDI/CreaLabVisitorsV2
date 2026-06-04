import React from "react";
import "./Button.css";

interface ButtonProps {
    type?: "primary" | "secondary" | "accept" | "danger";
  text: string;
  onClick: () => void;
}

const Button = ({ type = "primary", text, onClick }: ButtonProps) => {
  return (
    <button className={`button button-${type}`} onClick={onClick}>
        <p className="button-text">
            {text}
        </p>
    </button>
  );
};