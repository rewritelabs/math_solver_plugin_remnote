import { ChangeEvent, TextareaHTMLAttributes, useEffect, useRef } from 'react';

interface AutoResizeTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  minRows?: number;
  maxRows?: number;
  className?: string;
}

export const AutoResizeTextarea = ({
  value,
  onChange,
  className = '',

  ...props
}: AutoResizeTextareaProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = (): void => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(textarea.scrollHeight, 36) + 5}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    onChange?.(e);
    // Small delay to ensure the DOM is updated
    setTimeout(adjustHeight, 0);
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      className={`${className}`}
      {...props}
    />
  );
};
