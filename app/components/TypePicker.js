import { MBTI_CODES, getTypeProfile } from "../../lib/mbti";

// Pure HTML/CSS card picker: each option is a radio input styled as a
// card via the adjacent-sibling :checked selector, so no client-side JS
// is needed and it still works as a plain <form> field like every other
// input in this app.
export default function TypePicker({ name, defaultValue, required }) {
  return (
    <div className="type-grid">
      {MBTI_CODES.map((code) => {
        const profile = getTypeProfile(code);
        const id = `${name}-${code}`;
        return (
          <div key={code} className="type-card-wrap">
            <input
              type="radio"
              id={id}
              name={name}
              value={code}
              defaultChecked={defaultValue === code}
              required={required}
              className="type-card-input"
            />
            <label htmlFor={id} className="type-card">
              <span className="type-card-archetype">{profile.archetype}</span>
              <span className="type-card-code">{code}</span>
              <span className="type-card-tagline">{profile.tagline}</span>
            </label>
          </div>
        );
      })}
    </div>
  );
}
