type PageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  /** Alias de children — botões/ações no canto direito */
  actions?: React.ReactNode;
};

export function PageHeader({ title, description, children, actions }: PageHeaderProps) {
  const actionSlot = actions ?? children;
  return (
    <div className="page-header-shell">
      <div className="min-w-0 flex-1">
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-desc">{description}</p>}
      </div>
      {actionSlot && <div className="page-header-actions">{actionSlot}</div>}
    </div>
  );
}
