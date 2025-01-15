interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className='space-y-1'>
      <h1 className='font-semibold text-2xl'>{title}</h1>
      {description && <p className='text-gray-500'>{description}</p>}
    </div>
  );
}
