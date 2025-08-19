import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '../card';

describe('Card Component', () => {
  describe('Card Container', () => {
    it('renders card with content', () => {
      render(
        <Card data-testid="card">
          <div>Card content</div>
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies design tokens for styling', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      
      expect(card.className).toContain('rounded-lg');
      expect(card.className).toContain('border');
      expect(card.className).toContain('bg-card');
      expect(card.className).toContain('text-card-foreground');
      expect(card.className).toContain('shadow-sm');
    });

    it('merges custom className', () => {
      render(
        <Card data-testid="card" className="custom-card-class">
          Content
        </Card>
      );
      
      const card = screen.getByTestId('card');
      expect(card.className).toContain('custom-card-class');
      expect(card.className).toContain('rounded-lg'); // Still has default classes
    });
  });

  describe('CardHeader', () => {
    it('renders header with content', () => {
      render(
        <CardHeader data-testid="header">
          <div>Header content</div>
        </CardHeader>
      );
      
      const header = screen.getByTestId('header');
      expect(header).toBeInTheDocument();
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    it('applies semantic spacing tokens', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>);
      const header = screen.getByTestId('header');
      
      expect(header.className).toContain('p-6');
      expect(header.className).toContain('space-y-1.5');
      expect(header.className).toContain('flex');
      expect(header.className).toContain('flex-col');
    });

    it('merges custom className', () => {
      render(
        <CardHeader data-testid="header" className="custom-header">
          Header
        </CardHeader>
      );
      
      const header = screen.getByTestId('header');
      expect(header.className).toContain('custom-header');
      expect(header.className).toContain('p-6');
    });
  });

  describe('CardTitle', () => {
    it('renders title text', () => {
      render(<CardTitle>Card Title Text</CardTitle>);
      expect(screen.getByText('Card Title Text')).toBeInTheDocument();
    });

    it('applies semantic typography tokens', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>);
      const title = screen.getByTestId('title');
      
      expect(title.className).toContain('text-2xl');
      expect(title.className).toContain('font-semibold');
      expect(title.className).toContain('leading-none');
      expect(title.className).toContain('tracking-tight');
    });

    it('merges custom className', () => {
      render(
        <CardTitle data-testid="title" className="custom-title">
          Title
        </CardTitle>
      );
      
      const title = screen.getByTestId('title');
      expect(title.className).toContain('custom-title');
      expect(title.className).toContain('text-2xl');
    });
  });

  describe('CardDescription', () => {
    it('renders description text', () => {
      render(<CardDescription>Card description text</CardDescription>);
      expect(screen.getByText('Card description text')).toBeInTheDocument();
    });

    it('applies semantic typography tokens', () => {
      render(
        <CardDescription data-testid="description">
          Description
        </CardDescription>
      );
      const description = screen.getByTestId('description');
      
      expect(description.className).toContain('text-sm');
      expect(description.className).toContain('text-muted-foreground');
    });

    it('merges custom className', () => {
      render(
        <CardDescription data-testid="description" className="custom-desc">
          Description
        </CardDescription>
      );
      
      const description = screen.getByTestId('description');
      expect(description.className).toContain('custom-desc');
      expect(description.className).toContain('text-sm');
    });
  });

  describe('CardContent', () => {
    it('renders content area', () => {
      render(
        <CardContent data-testid="content">
          <div>Main content</div>
        </CardContent>
      );
      
      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
      expect(screen.getByText('Main content')).toBeInTheDocument();
    });

    it('applies semantic spacing tokens', () => {
      render(<CardContent data-testid="content">Content</CardContent>);
      const content = screen.getByTestId('content');
      
      expect(content.className).toContain('p-6');
      expect(content.className).toContain('pt-0');
    });

    it('merges custom className', () => {
      render(
        <CardContent data-testid="content" className="custom-content">
          Content
        </CardContent>
      );
      
      const content = screen.getByTestId('content');
      expect(content.className).toContain('custom-content');
      expect(content.className).toContain('p-6');
    });
  });

  describe('CardFooter', () => {
    it('renders footer with content', () => {
      render(
        <CardFooter data-testid="footer">
          <button>Action</button>
        </CardFooter>
      );
      
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('applies semantic spacing tokens', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>);
      const footer = screen.getByTestId('footer');
      
      expect(footer.className).toContain('p-6');
      expect(footer.className).toContain('pt-0');
      expect(footer.className).toContain('flex');
      expect(footer.className).toContain('items-center');
    });

    it('merges custom className', () => {
      render(
        <CardFooter data-testid="footer" className="custom-footer">
          Footer
        </CardFooter>
      );
      
      const footer = screen.getByTestId('footer');
      expect(footer.className).toContain('custom-footer');
      expect(footer.className).toContain('p-6');
    });
  });

  describe('Complete Card Composition', () => {
    it('renders complete card with all subcomponents', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Complete Card</CardTitle>
            <CardDescription>This is a complete card example</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Card body content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Footer Action</button>
          </CardFooter>
        </Card>
      );
      
      expect(screen.getByText('Complete Card')).toBeInTheDocument();
      expect(screen.getByText('This is a complete card example')).toBeInTheDocument();
      expect(screen.getByText('Card body content goes here')).toBeInTheDocument();
      expect(screen.getByText('Footer Action')).toBeInTheDocument();
    });

    it('maintains proper spacing between sections', () => {
      render(
        <Card data-testid="card">
          <CardHeader data-testid="header">
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent data-testid="content">Content</CardContent>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );
      
      const header = screen.getByTestId('header');
      const content = screen.getByTestId('content');
      const footer = screen.getByTestId('footer');
      
      expect(header.className).toContain('p-6');
      expect(content.className).toContain('p-6');
      expect(content.className).toContain('pt-0');
      expect(footer.className).toContain('p-6');
      expect(footer.className).toContain('pt-0');
    });
  });

  describe('Complex Card Scenarios', () => {
    it('handles cards without all sections', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title Only Card</CardTitle>
          </CardHeader>
        </Card>
      );
      
      expect(screen.getByText('Title Only Card')).toBeInTheDocument();
    });

    it('handles cards with multiple action buttons in footer', () => {
      const handleCancel = vi.fn();
      const handleSubmit = vi.fn();
      
      render(
        <Card>
          <CardFooter data-testid="footer">
            <button onClick={handleCancel}>Cancel</button>
            <button onClick={handleSubmit}>Submit</button>
          </CardFooter>
        </Card>
      );
      
      const footer = screen.getByTestId('footer');
      expect(footer.className).toContain('flex');
      expect(footer.className).toContain('items-center');
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('supports forwarding refs', () => {
      const cardRef = vi.fn();
      const headerRef = vi.fn();
      const titleRef = vi.fn();
      const descRef = vi.fn();
      const contentRef = vi.fn();
      const footerRef = vi.fn();
      
      render(
        <Card ref={cardRef}>
          <CardHeader ref={headerRef}>
            <CardTitle ref={titleRef}>Title</CardTitle>
            <CardDescription ref={descRef}>Description</CardDescription>
          </CardHeader>
          <CardContent ref={contentRef}>Content</CardContent>
          <CardFooter ref={footerRef}>Footer</CardFooter>
        </Card>
      );
      
      expect(cardRef).toHaveBeenCalled();
      expect(headerRef).toHaveBeenCalled();
      expect(titleRef).toHaveBeenCalled();
      expect(descRef).toHaveBeenCalled();
      expect(contentRef).toHaveBeenCalled();
      expect(footerRef).toHaveBeenCalled();
    });
  });
});