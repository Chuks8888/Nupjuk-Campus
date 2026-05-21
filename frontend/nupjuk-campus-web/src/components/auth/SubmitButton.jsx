export default function SubmitButton({ text, icon: Icon, disabled = false }) {
  return (
    <button 
      type="submit" 
      className="login-button" 
      disabled={disabled}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
    >
      {Icon && <Icon size={18} />}
      {text}
    </button>
  );
}
