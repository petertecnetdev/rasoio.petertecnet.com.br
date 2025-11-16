import React from "react";
import PropTypes from "prop-types";
import "./GlobalButton.css";

export default function GlobalButton({
  children,
  variant,
  onClick,
  full,
  rounded,
  disabled,
  loading,
  size,
  className,
  type,
  stopPropagation,
}) {
  const handleClick = (e) => {
    if (stopPropagation) e.stopPropagation();
    if (onClick) onClick(e);
  };

  return (
    <button
      type={type}
      className={`
        gbtn
        gbtn-${variant}
        ${full ? "gbtn-full" : ""}
        ${rounded ? "gbtn-rounded" : ""}
        gbtn-${size}
        ${className || ""}
      `}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading ? <span className="gbtn-loader"></span> : children}
    </button>
  );
}

GlobalButton.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    "primary",
    "danger",
    "success",
    "outline",
    "ghost",
    "warning",
  ]),
  onClick: PropTypes.func,
  full: PropTypes.bool,
  rounded: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  className: PropTypes.string,
  type: PropTypes.string,
  stopPropagation: PropTypes.bool,
};

GlobalButton.defaultProps = {
  variant: "primary",
  full: false,
  rounded: false,
  disabled: false,
  loading: false,
  size: "md",
  type: "button",
  stopPropagation: false,
};
