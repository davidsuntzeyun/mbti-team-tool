import json

snippets = json.load(open("quickmatch-snippets.json"))

DICHOTOMIES = [
    ("EI", 0, "E", "I"),
    ("SN", 1, "S", "N"),
    ("TF", 2, "T", "F"),
    ("JP", 3, "J", "P"),
]

def quick_match(type_a, type_b):
    result = {"strengths": [], "weaknesses": [], "conflicts": []}
    for key, idx, letter1, letter2 in DICHOTOMIES:
        a, b = type_a[idx], type_b[idx]
        bucket = snippets[key]
        if a == b == letter1:
            entry = bucket[f"both{letter1}"]
        elif a == b == letter2:
            entry = bucket[f"both{letter2}"]
        else:
            entry = bucket["mixed"]
        result["strengths"].append(entry["strength"])
        result["weaknesses"].append(entry["weakness"])
        result["conflicts"].append(entry["conflict"])
    return result

# Sanity check a few pairings
for a, b in [("INTJ", "ENFP"), ("ISTJ", "ISTJ"), ("ESFJ", "INTP")]:
    print(f"\n=== {a} x {b} ===")
    r = quick_match(a, b)
    print("Strengths:", len(r["strengths"]), "Weaknesses:", len(r["weaknesses"]), "Conflicts:", len(r["conflicts"]))
    print("Sample strength:", r["strengths"][0])
