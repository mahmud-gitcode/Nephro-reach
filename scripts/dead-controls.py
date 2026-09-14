"""List controls that render but do nothing.

The audit that started step 4 found 35 of them: Edit, Delete, Download PDF,
Scan Results — buttons that looked pressable and were not wired to
anything. A member pressing one cannot tell whether it worked, whether the
app is broken, or whether they mis-clicked.

A control counts as accounted for if it has an onClick, submits, targets a
form, is a link, is disabled, or carries notBuiltYet() — which says out
loud that the feature behind it does not exist yet.

Run it with `npm run audit:controls`. It exits non-zero when something new
slips through, so it can be added to CI once the count has been at zero for
a while.

Comments and the design-system gallery are skipped; the gallery's buttons
are demos on purpose.
"""
import io
import os
import re
import sys

SKIP = ("landing-page", "design-system")
ROOTS = ["src/app", "src/features", "src/components"]

# notBuiltYet() supplies `disabled` and a title, so a control carrying it
# is accounted for even though it does nothing yet.
WIRED = ("onClick", 'type="submit"', "form=", "disabled", "href", "notBuiltYet")


def blank(m: "re.Match[str]") -> str:
    """Replace a comment with blanks, keeping its newlines so line numbers
    still match the file on disk."""
    return chr(10) * m.group(0).count(chr(10))


def strip_comments(src: str) -> str:
    src = re.sub(r"\{/\*.*?\*/\}", blank, src, flags=re.S)
    src = re.sub(r"/\*.*?\*/", blank, src, flags=re.S)
    src = re.sub(r"^\s*//.*$", "", src, flags=re.M)
    return src


def opening_tags(src: str, name: str):
    """Yield (index, tag text) for each opening <name ...> tag."""
    for m in re.finditer(r"<%s\b" % name, src):
        i = m.end()
        depth = 0
        while i < len(src):
            c = src[i]
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
            elif c == ">" and depth == 0:
                break
            i += 1
        yield m.start(), src[m.start() : i + 1]


rows = []
for root in ROOTS:
    for dp, dn, fn in os.walk(root):
        if any(s in dp.replace(os.sep, "/") for s in SKIP):
            continue
        for f in fn:
            if not f.endswith(".tsx") or f.endswith(".test.tsx"):
                continue
            p = os.path.join(dp, f).replace(os.sep, "/")
            if any(s in p for s in SKIP):
                continue
            src = strip_comments(io.open(p, encoding="utf-8").read())
            for name in ("button", "Button"):
                for start, tag in opening_tags(src, name):
                    if any(k in tag for k in WIRED):
                        continue
                    line = src[:start].count("\n") + 1
                    label = re.sub(r"\s+", " ", tag)[:58]
                    rows.append((p, line, label))

by_file = {}
for p, line, label in rows:
    by_file.setdefault(p, []).append((line, label))

print("dead controls:", len(rows), "in", len(by_file), "files\n")
for p in sorted(by_file, key=lambda k: -len(by_file[k])):
    print("%2d  %s" % (len(by_file[p]), p))
    for line, label in by_file[p]:
        print("       :%-5s %s" % (line, label))

sys.exit(1 if rows else 0)
