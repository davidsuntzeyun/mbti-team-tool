import { ROLE_CODES, getRoleProfile } from "../../lib/mbti";

// Same pure-CSS radio-card pattern as IdentityPicker, for the optional
// role field (people manager / project manager / individual contributor).
// Always includes a "Not sure yet" option since this is meant to be
// skippable without blocking anything else in the tool.
export default function RolePicker({ name, defaultValue }) {
  return (
    <div className="type-grid" style={{ gridTemplateColumns: "1fr" }}>
      {ROLE_CODES.map((code) => {
        const profile = getRoleProfile(code);
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
