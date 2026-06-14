export function SearchField(
  { value, onChange, placeholder }:
  { value: string; onChange: (v: string) => void; placeholder?: string },
) {
  return (
    <div className="on-search">
      <span className="on-search__icon" aria-hidden="true">⌕</span>
      <input
        className="on-search__input"
        type="search"
        aria-label={placeholder ?? 'Search'}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
