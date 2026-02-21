
export default function EmptyState({ 
    icon: Icon, 
    title, 
    description, 
    actionLabel, 
    onAction 
  }) {
    return (
      <div className="card text-center py-16">
        <div className="w-20 h-20 rounded-full bg-sage/10 mx-auto mb-6 flex items-center justify-center">
          {Icon && <Icon className="w-10 h-10 text-sage/40" strokeWidth={1.5} />}
        </div>
        <h3 className="text-2xl font-serif text-charcoal mb-2">{title}</h3>
        <p className="text-charcoal/60 mb-6 max-w-md mx-auto">{description}</p>
        {actionLabel && onAction && (
          <button onClick={onAction} className="btn-primary">
            {actionLabel}
          </button>
        )}
      </div>
    );
  }
  