/**
 * Button
 *
 * Usage:
 *   <Button>Default</Button>
 *   <Button variant="primary" size="lg" onClick={save}>Save Record</Button>
 *   <Button variant="outline" size="sm" icon={<IcDownload/>}>Export</Button>
 *   <Button variant="danger" loading>Deleting…</Button>
 *   <Button as="a" href="/docs" variant="ghost">Docs</Button>
 *   <Button iconOnly icon={<IcSearch/>} aria-label="Search" />
 */

import { forwardRef } from 'react';

const Button = forwardRef(function Button(
  {
    children,
    /** 'primary' | 'teal' | 'success' | 'danger' | 'outline' | 'ghost' */
    variant  = 'outline',
    /** 'xs' | 'sm' | 'md' | 'lg' | 'xl' */
    size     = 'md',
    /** Icon element rendered before children */
    icon,
    /** Icon-only square button — hides children, use aria-label */
    iconOnly = false,
    /** Show spinner and disable interaction */
    loading  = false,
    /** Make button full-width */
    fullWidth = false,
    /** Render as a different element (e.g. 'a') */
    as: Tag  = 'button',
    className = '',
    disabled,
    style,
    ...rest
  },
  ref
) {
  const sizeClass = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
    xl: 'btn-xl',
  }[size] ?? '';

  const variantClass = {
    primary: 'btn-primary',
    teal:    'btn-teal',
    success: 'btn-success',
    danger:  'btn-danger',
    outline: 'btn-outline',
    ghost:   'btn-ghost',
  }[variant] ?? 'btn-outline';

  const classes = [
    'btn',
    variantClass,
    sizeClass,
    iconOnly  ? 'btn-icon'  : '',
    fullWidth ? 'btn-full'  : '',
    loading   ? 'btn-loading' : '',
    className,
  ].filter(Boolean).join(' ');

  const isDisabled = disabled || loading;

  return (
    <Tag
      ref={ref}
      className={classes}
      disabled={Tag === 'button' ? isDisabled : undefined}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      style={style}
      {...rest}
    >
      {loading
        ? <div className={`btn-spinner${variant === 'outline' || variant === 'ghost' ? ' dark' : ''}`} />
        : icon && <span className="btn-icon-slot" aria-hidden="true">{icon}</span>
      }
      {!iconOnly && !loading && children && (
        <span>{children}</span>
      )}
      {iconOnly && !loading && icon && (
        <span aria-hidden="true">{icon}</span>
      )}
    </Tag>
  );
});

export default Button;
