import { useState, useRef, useEffect } from "react";
import { ChevronDown, Info } from "lucide-react";
import Required from "./Required";

type Country = {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
};

type PhoneInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  optional?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  description?: string;
  countries?: Country[];
};

const defaultCountries: Country[] = [
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
];

export default function PhoneInput({
  id,
  label,
  value,
  onChange,
  required = false,
  optional = false,
  error,
  className,
  disabled = false,
  description,
  countries = defaultCountries,
}: PhoneInputProps) {
  const [selected, setSelected] = useState<Country>(countries[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!countries.find((c) => c.code === selected.code)) {
      setSelected(countries[0]);
    }
  }, [countries]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const val = e.target.value.replace(/[^\d]/g, "");
    let formatted = val;
    if (val.length > 3) formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
    if (val.length > 6)
      formatted = `${val.slice(0, 3)}-${val.slice(3, 6)}-${val.slice(6, 10)}`;
    //  Return full number with country code prefix
    const fullNumber = `${selected.dialCode} ${formatted}`;
    onChange(fullNumber);
  };

  const inputDisabled = disabled
    ? "bg-bg-weak-25 text-text-disabled-300 cursor-not-allowed border border-bg-weak-25"
    : "hover:bg-bg-weak-50-light text-text-soft-400";

  const wrapperClass = `
    flex items-center relative border rounded-[10px] transition
    ${
      error
        ? "border-red-500 shadow-error-focus"
        : isFocused
        ? "border-blue-500 shadow-neutral-focus"
        : ""
    }
  `;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="font-brico text-sm flex items-center gap-1"
      >
        <span className="text-stroke-strong-950-light">{label}</span>
        {required && <Required />}
        {optional && (
          <span className="text-text-sub-600-light">(Optional)</span>
        )}
        <Info
        size={12.5}
          className="text-icon-disabled-300 w-12.5 h-12.5 fill-icon-disabled-300m hover:text-gray-600"
        />
      </label>

      <div className={wrapperClass}>
        {/* Country Dropdown */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => setDropdownOpen((prev) => !prev)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`shrink-0 z-10 inline-flex items-center py-2.5 px-3 rounded-l-[10px] focus:border-r-sky-700 text-sm font-medium text-gray-900 border-r ${inputDisabled}`}
        >
          <span className="me-2 border w-5 h-5 rounded-full object-contain">
            {selected.flag}
          </span>
          {selected.dialCode}
          <ChevronDown size={12} className="ms-2.5" />
        </button>

        {dropdownOpen && (
          <div
            ref={dropdownRef}
            className="absolute top-12 z-20 bg-white border rounded-lg shadow w-52 left-0"
          >
            <ul className="py-2 text-sm text-gray-700 max-h-64 overflow-auto">
              {countries.map((country) => (
                <li key={country.code}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(country);
                      setDropdownOpen(false);
                    }}
                    className="inline-flex w-full px-4 py-2 items-center hover:bg-gray-100"
                  >
                    <span className="text-lg me-2">{country.flag}</span>
                    {country.name} ({country.dialCode})
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Phone Input */}
        <input
          id={id}
          type="text"
          value={value}
          onChange={handlePhoneChange}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="123-456-7890"
          className={`block py-2.5 pl-3 pr-2.5 w-full z-20 border-l focus:border-sky-700 text-sm text-gray-900 outline-none rounded-e-lg border-0 ${className} ${inputDisabled}`}
          pattern="\d{3}-\d{3}-\d{4}"
        />
      </div>

      {error ? (
        <span className="text-red-500 text-sm mt-1">{error}</span>
      ) : description ? (
        <span className="text-text-sub-600-light text-sm mt-1">
          {description}
        </span>
      ) : null}
    </div>
  );
}
