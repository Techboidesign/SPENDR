import { ComponentProps, CSSProperties } from 'react';
import { Input } from '../ui/input';

export const formFieldStyle: CSSProperties = {
  width: '100%',
  height: 50,
  fontSize: 16,
  borderRadius: 14,
  border: '1px solid #3E37FF',
  borderColor: '#3E37FF',
  backgroundColor: 'rgba(255, 255, 255, 1)',
  borderImage: 'none',
  outline: 'none',
  boxShadow: 'none',
};

export const formFieldStyleCompact: CSSProperties = {
  ...formFieldStyle,
  height: 32,
  fontSize: 13,
  borderRadius: 10,
};

export const formSelectStyle: CSSProperties = {
  ...formFieldStyle,
  paddingLeft: 14,
  paddingRight: 48,
  fontFamily: 'inherit',
  cursor: 'pointer',
  appearance: 'auto',
};

const inputClassName =
  'form-field bg-white border-[#3E37FF] shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-[#3E37FF]';

export function FormInput({
  style,
  className,
  ...props
}: ComponentProps<typeof Input>) {
  return (
    <Input
      className={[inputClassName, className].filter(Boolean).join(' ')}
      style={{ ...formFieldStyle, ...style }}
      {...props}
    />
  );
}

export function FormSelect({
  style,
  className,
  ...props
}: ComponentProps<'select'>) {
  return (
    <select
      className={['form-field', className].filter(Boolean).join(' ')}
      style={{ ...formSelectStyle, ...style }}
      {...props}
    />
  );
}
