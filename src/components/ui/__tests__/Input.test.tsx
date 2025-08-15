import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../input';

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with different input types', () => {
      const { rerender } = render(<Input type="text" placeholder="Text" />);
      expect(screen.getByPlaceholderText('Text')).toHaveAttribute('type', 'text');
      
      rerender(<Input type="email" placeholder="Email" />);
      expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email');
      
      rerender(<Input type="password" placeholder="Password" />);
      expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');
    });
  });

  describe('Design Tokens', () => {
    it('applies semantic size tokens', () => {
      render(<Input placeholder="Size test" />);
      const input = screen.getByPlaceholderText('Size test');
      expect(input.className).toContain('h-size-md');
    });

    it('applies semantic spacing tokens', () => {
      render(<Input placeholder="Spacing test" />);
      const input = screen.getByPlaceholderText('Spacing test');
      expect(input.className).toContain('px-space-sm');
      expect(input.className).toContain('py-space-xs');
    });

    it('applies semantic typography tokens', () => {
      render(<Input placeholder="Typography test" />);
      const input = screen.getByPlaceholderText('Typography test');
      expect(input.className).toContain('text-text-base');
      expect(input.className).toContain('md:text-text-sm');
    });

    it('applies animation duration tokens', () => {
      render(<Input placeholder="Animation test" />);
      const input = screen.getByPlaceholderText('Animation test');
      expect(input.className).toContain('duration-md');
    });

    it('applies border radius token', () => {
      render(<Input placeholder="Border test" />);
      const input = screen.getByPlaceholderText('Border test');
      expect(input.className).toContain('rounded-md');
    });
  });

  describe('Styling', () => {
    it('applies base styling classes', () => {
      render(<Input placeholder="Style test" />);
      const input = screen.getByPlaceholderText('Style test');
      
      expect(input.className).toContain('flex');
      expect(input.className).toContain('w-full');
      expect(input.className).toContain('border');
      expect(input.className).toContain('border-input');
      expect(input.className).toContain('bg-background');
    });

    it('applies focus styling', () => {
      render(<Input placeholder="Focus test" />);
      const input = screen.getByPlaceholderText('Focus test');
      
      expect(input.className).toContain('focus-visible:outline-none');
      expect(input.className).toContain('focus-visible:ring-2');
      expect(input.className).toContain('focus-visible:ring-ring');
      expect(input.className).toContain('focus-visible:ring-offset-2');
    });

    it('applies disabled styling', () => {
      render(<Input placeholder="Disabled test" disabled />);
      const input = screen.getByPlaceholderText('Disabled test');
      
      expect(input).toBeDisabled();
      expect(input.className).toContain('disabled:cursor-not-allowed');
      expect(input.className).toContain('disabled:opacity-50');
    });

    it('applies placeholder styling', () => {
      render(<Input placeholder="Placeholder test" />);
      const input = screen.getByPlaceholderText('Placeholder test');
      
      expect(input.className).toContain('placeholder:text-muted-foreground');
    });

    it('applies file input styling', () => {
      render(<Input type="file" data-testid="file-input" />);
      const input = screen.getByTestId('file-input');
      
      expect(input.className).toContain('file:border-0');
      expect(input.className).toContain('file:bg-transparent');
      expect(input.className).toContain('file:text-text-sm');
      expect(input.className).toContain('file:font-medium');
    });
  });

  describe('Interactions', () => {
    it('handles value changes', async () => {
      const handleChange = vi.fn();
      render(<Input placeholder="Change test" onChange={handleChange} />);
      
      const input = screen.getByPlaceholderText('Change test');
      await userEvent.type(input, 'Hello');
      
      expect(handleChange).toHaveBeenCalled();
      expect(input).toHaveValue('Hello');
    });

    it('handles focus and blur events', async () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();
      
      render(
        <Input 
          placeholder="Focus test" 
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      );
      
      const input = screen.getByPlaceholderText('Focus test');
      
      await userEvent.click(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);
      
      await userEvent.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('respects readonly state', async () => {
      render(<Input placeholder="Readonly test" readOnly value="Read only" />);
      
      const input = screen.getByPlaceholderText('Readonly test');
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveValue('Read only');
      
      await userEvent.type(input, 'New text');
      expect(input).toHaveValue('Read only'); // Value shouldn't change
    });
  });

  describe('Custom Classes', () => {
    it('merges custom className with default classes', () => {
      render(<Input placeholder="Custom test" className="custom-input-class" />);
      const input = screen.getByPlaceholderText('Custom test');
      
      expect(input.className).toContain('custom-input-class');
      // Should still have default classes
      expect(input.className).toContain('h-size-md');
      expect(input.className).toContain('px-space-sm');
      expect(input.className).toContain('text-text-base');
    });
  });

  describe('Props Forwarding', () => {
    it('forwards all HTML input attributes', () => {
      render(
        <Input 
          placeholder="Props test"
          autoComplete="off"
          autoFocus={false}
          name="test-input"
          id="test-id"
          maxLength={10}
          pattern="[A-Za-z]+"
          required
        />
      );
      
      const input = screen.getByPlaceholderText('Props test');
      
      expect(input).toHaveAttribute('autocomplete', 'off');
      expect(input).toHaveAttribute('name', 'test-input');
      expect(input).toHaveAttribute('id', 'test-id');
      expect(input).toHaveAttribute('maxlength', '10');
      expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
      expect(input).toHaveAttribute('required');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = vi.fn();
      render(<Input ref={ref} placeholder="Ref test" />);
      
      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLInputElement);
    });
  });
});