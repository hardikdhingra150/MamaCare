export default function Button({ children, variant = 'primary', onClick, className = '' }) {
    const baseStyle = variant === 'primary' ? 'btn-primary' : 'btn-secondary';
    
    return (
      <button onClick={onClick} className={`${baseStyle} ${className}`}>
        {children}
      </button>
    );
  }
  