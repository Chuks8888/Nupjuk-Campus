export default function SubmitButton({ text, icon: Icon, disabled = false }) {
  return (
    <button type="submit" className="login-button" disabled={disabled}>
      {Icon && <Icon size={18} />}
      {text}
    </button>
  );
}
