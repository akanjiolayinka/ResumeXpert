interface PageHeaderProps {
  title: string;
  description: string;
  helperText?: string;
}

export function PageHeader({ title, description, helperText }: PageHeaderProps) {
  return (
    <div className="mb-8 md:mb-12">
      <h1 className="text-3xl md:text-4xl font-bold mb-3">{title}</h1>
      <p className="text-lg text-muted-foreground max-w-2xl">{description}</p>
      {helperText && (
        <p className="text-sm text-muted-foreground mt-2 italic">{helperText}</p>
      )}
    </div>
  );
}
