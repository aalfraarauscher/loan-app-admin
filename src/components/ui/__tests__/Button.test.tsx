import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, buttonVariants } from '../button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders button with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('renders as child component when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      expect(screen.getByRole('link', { name: /link button/i })).toBeInTheDocument();
    });
  });

  describe('Design Tokens', () => {
    it('applies semantic spacing tokens', () => {
      render(<Button>Test Button</Button>);
      const button = screen.getByRole('button');
      const classes = button.className;
      
      // Check for semantic token classes
      expect(classes).toContain('gap-space-xs');
      expect(classes).toContain('px-space-md');
      expect(classes).toContain('py-space-xs');
    });

    it('applies semantic size tokens', () => {
      render(<Button size="default">Default Size</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-size-md');
    });

    it('applies semantic typography tokens', () => {
      render(<Button>Typography Test</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('text-text-sm');
    });

    it('applies animation duration tokens', () => {
      render(<Button>Animation Test</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('duration-md');
    });
  });

  describe('Variants', () => {
    it('applies default variant styles', () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-primary');
      expect(button.className).toContain('text-primary-foreground');
    });

    it('applies destructive variant styles', () => {
      render(<Button variant="destructive">Destructive</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-destructive');
      expect(button.className).toContain('text-destructive-foreground');
    });

    it('applies outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('border');
      expect(button.className).toContain('border-input');
      expect(button.className).toContain('bg-background');
    });

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-secondary');
      expect(button.className).toContain('text-secondary-foreground');
    });

    it('applies ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('hover:bg-accent');
      expect(button.className).toContain('hover:text-accent-foreground');
    });

    it('applies link variant styles', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('text-primary');
      expect(button.className).toContain('underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('applies small size with semantic tokens', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-size-sm');
      expect(button.className).toContain('px-space-sm');
    });

    it('applies default size with semantic tokens', () => {
      render(<Button size="default">Default</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-size-md');
      expect(button.className).toContain('px-space-md');
      expect(button.className).toContain('py-space-xs');
    });

    it('applies large size with semantic tokens', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-size-lg');
      expect(button.className).toContain('px-space-xl');
    });

    it('applies icon size with semantic tokens', () => {
      render(<Button size="icon" aria-label="Icon button">⚙️</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('h-size-md');
      expect(button.className).toContain('w-size-md');
    });
  });

  describe('Interactions', () => {
    it('handles click events', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('respects disabled state', async () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button.className).toContain('disabled:pointer-events-none');
      expect(button.className).toContain('disabled:opacity-50');
      
      await userEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Custom Classes', () => {
    it('merges custom className with default classes', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
      // Should still have default classes
      expect(button.className).toContain('gap-space-xs');
      expect(button.className).toContain('text-text-sm');
    });
  });

  describe('buttonVariants export', () => {
    it('generates correct classes for variants', () => {
      const defaultClasses = buttonVariants({ variant: 'default', size: 'default' });
      expect(defaultClasses).toContain('bg-primary');
      expect(defaultClasses).toContain('h-size-md');
      expect(defaultClasses).toContain('px-space-md');
      
      const smallOutlineClasses = buttonVariants({ variant: 'outline', size: 'sm' });
      expect(smallOutlineClasses).toContain('border');
      expect(smallOutlineClasses).toContain('h-size-sm');
      expect(smallOutlineClasses).toContain('px-space-sm');
    });
  });
});