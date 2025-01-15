interface PageHeaderProps {
  title: string;
  description?: string;
  right?: React.ReactNode;
}

export function PageHeader({ title, description, right }: PageHeaderProps) {
  return (
    <div className='flex items-center justify-between'>
      <div className='space-y-1'>
        <h1 className='font-semibold text-2xl'>{title}</h1>
        {description && <p className='text-muted-foreground'>{description}</p>}
      </div>
      {right}
    </div>
  );
}
