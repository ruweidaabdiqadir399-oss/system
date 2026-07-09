import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { FiLoader } from 'react-icons/fi';

const VARIANT_CLASS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  success: 'btn-success',
};

const SIZE_CLASS = {
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
};

const Button = forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon = null,
      rightIcon = null,
      to,
      className = '',
      children,
      disabled = false,
      type = 'button',
      ...rest
    },
    ref
  ) => {
    const classes = [VARIANT_CLASS[variant] ?? VARIANT_CLASS.primary, SIZE_CLASS[size] ?? SIZE_CLASS.md, className]
      .filter(Boolean)
      .join(' ');

    const content = (
      <>
        {isLoading ? <FiLoader className="h-4 w-4 animate-spin" aria-hidden="true" /> : leftIcon}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon}
      </>
    );

    if (to) {
      return (
        <Link ref={ref} to={to} className={classes} {...rest}>
          {content}
        </Link>
      );
    }

    return (
      <button ref={ref} type={type} className={classes} disabled={disabled || isLoading} {...rest}>
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
