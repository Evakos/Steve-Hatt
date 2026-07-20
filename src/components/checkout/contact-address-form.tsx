"use client";

export interface ContactAddressValue {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: { line1: string; line2: string; city: string; postcode: string };
}

export const EMPTY_CONTACT_ADDRESS: ContactAddressValue = {
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: { line1: "", line2: "", city: "London", postcode: "" },
};

interface Props {
  value: ContactAddressValue;
  onChange: (value: ContactAddressValue) => void;
  showAddress: boolean;
}

const inputClass =
  "w-full border border-border bg-white px-4 py-2.5 text-sm text-navy outline-none transition-colors placeholder:text-text-light/50 focus:border-navy";

export default function ContactAddressForm({ value, onChange, showAddress }: Props) {
  return (
    <>
      <p className="mb-4 text-xs font-medium tracking-wide text-navy uppercase">Contact</p>
      <div>
        <label className="mb-1.5 block text-xs font-medium tracking-wide text-navy uppercase">Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={value.email}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
          className={inputClass}
          style={{ borderRadius: "3px" }}
        />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-navy uppercase">First name</label>
          <input
            type="text"
            placeholder="John"
            value={value.firstName}
            onChange={(e) => onChange({ ...value, firstName: e.target.value })}
            className={inputClass}
            style={{ borderRadius: "3px" }}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium tracking-wide text-navy uppercase">Last name</label>
          <input
            type="text"
            placeholder="Smith"
            value={value.lastName}
            onChange={(e) => onChange({ ...value, lastName: e.target.value })}
            className={inputClass}
            style={{ borderRadius: "3px" }}
          />
        </div>
      </div>
      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-medium tracking-wide text-navy uppercase">Phone</label>
        <input
          type="tel"
          placeholder="07700 900000"
          value={value.phone}
          onChange={(e) => onChange({ ...value, phone: e.target.value })}
          className={inputClass}
          style={{ borderRadius: "3px" }}
        />
      </div>

      {showAddress && (
        <div className="mt-6 border-t border-border pt-5">
          <p className="mb-4 text-xs font-medium tracking-wide text-navy uppercase">Delivery address</p>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Address line 1"
              value={value.address.line1}
              onChange={(e) => onChange({ ...value, address: { ...value.address, line1: e.target.value } })}
              className={inputClass}
              style={{ borderRadius: "3px" }}
            />
            <input
              type="text"
              placeholder="Address line 2 (optional)"
              value={value.address.line2}
              onChange={(e) => onChange({ ...value, address: { ...value.address, line2: e.target.value } })}
              className={inputClass}
              style={{ borderRadius: "3px" }}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="City"
                value={value.address.city}
                onChange={(e) => onChange({ ...value, address: { ...value.address, city: e.target.value } })}
                className={inputClass}
                style={{ borderRadius: "3px" }}
              />
              <input
                type="text"
                placeholder="Postcode"
                value={value.address.postcode}
                onChange={(e) => onChange({ ...value, address: { ...value.address, postcode: e.target.value } })}
                className={inputClass}
                style={{ borderRadius: "3px" }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
