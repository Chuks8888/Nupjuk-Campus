export default function InputField({ label, type, value, onChange, placeholder, required = true }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input 
        type={type} 
        className="form-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}