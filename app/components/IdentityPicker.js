import { IDENTITY_CODES, getIdentityProfile } from "../../lib/mbti";

// Same pure-CSS radio-card pattern as TypePicker, but for the optional
// Assertive/Turbulent Identity trait. Always includes a "Not sure yet"
// option (empty value) since, unlike the 4-letter type, this is meant to
// be skippable without blocking anything else in the tool.
export default function IdentityPicker({ name, defaultValue }) {
  return (
    <div className="type-grid">
      {IDENTITY_CODES.map((code) => {
        const profile = getIdentityProfile(code);
        const id = `${name}-${code}`;
        return (
          <div key={code} className="type-card-wrap">
            <input
              type="radio"
              id={id}
              name={name}
              value={code}
              defaultChecked={defaultValue === code}
              className="type-card-input"
            />
            <label htmlFor={id} className="type-card">
              <span className="type-card-archetype">{profile.label}</span>
              <span className="type-card-code">{code}</span>
            </label>
          </div>
        );
      })}
      <div className="type-card-wrap">
        <input
          type="radio"
          id={`${name}-none`}
          name={name}
          value=""
          defaultChecked={!defaultValue}
          className="type-card-input"
        />
        <label htmlFor={`${name}-none`} className="type-card">
          <span className="type-card-archetype">Not sure yet</span>
          <span className="type-card-tagline">Skip for now, you can set this anytime.</span>
        </label>
      </div>
    </div>
  );
}
