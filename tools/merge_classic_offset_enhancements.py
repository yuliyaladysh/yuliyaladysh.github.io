#!/usr/bin/env python3
"""One-off: merge enhanced layout into classic/variant-offset.html while preserving classic copy."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EN = (ROOT / "variant-offset.html").read_text()
CL = (ROOT / "classic" / "variant-offset.html").read_text()
# Timeline copy must come from canonical classic main page — not classic/variant-offset
# (which already carries merged/enhanced wording and breaks paragraph extraction order).
CL_INDEX = (ROOT / "classic" / "index.html").read_text()


def one_section(html: str, start_pat: str) -> str:
    m = re.search(start_pat, html, re.S)
    if not m:
        raise SystemExit(f"section not found: {start_pat[:40]}")
    start = m.start()
    rest = html[start:]
    depth = 0
    i = 0
    tag_open = re.compile(r"<section\b")
    tag_close = re.compile(r"</section>")
    while i < len(rest):
        mo = tag_open.search(rest, i)
        mc = tag_close.search(rest, i)
        if not mc:
            raise SystemExit("unclosed section")
        if mo and mo.start() < mc.start():
            depth += 1
            i = mo.end()
        else:
            depth -= 1
            if depth == 0:
                return rest[: mc.end()]
            i = mc.end()
    raise SystemExit("parse fail")


def strip_inline_anchor_tags(fragment: str) -> str:
    """Project body blurbs are plain text; only favicon tiles (project-brand) remain links."""
    return re.sub(r"<a\s[^>]*>(.*?)</a>", r"\1", fragment, flags=re.S)


def extract_timeline_ps(ex_html: str) -> list[str]:
    inner = one_section(ex_html, r'<section id="experience"')
    return re.findall(r"</header>\s*<p>(.*?)</p>", inner, re.S)


def swap_timeline_ps(ex_html: str, new_ps: list[str]) -> str:
    """Replace each timeline body <p> without re-matching the first slot every time."""
    sec = one_section(ex_html, r'<section id="experience"')
    pos = ex_html.index(sec)
    matches = list(re.finditer(r"</header>\s*<p>.*?</p>", sec, re.S))
    if len(matches) != len(new_ps):
        raise SystemExit(f"timeline slots {len(matches)} vs classic paragraphs {len(new_ps)}")
    h = sec
    for m, ptxt in zip(reversed(matches), reversed(new_ps)):
        h = h[: m.start()] + "</header>\n            <p>" + ptxt + "</p>" + h[m.end() :]
    return ex_html[:pos] + h + ex_html[pos + len(sec) :]


# Classic timeline body paragraphs (plain text fragments, may include entities)
classic_ps = extract_timeline_ps(CL_INDEX)
exp_en = one_section(EN, r'<section id="experience"')
exp_merged = swap_timeline_ps(exp_en, classic_ps)
# Classic LinkedIn foot copy
exp_merged = exp_merged.replace(
    "See the full timeline on LinkedIn →",
    "View complete experience on LinkedIn →",
)

# Remove experience intro (classic had none) — optional: keep for enhancement
exp_merged = re.sub(
    r'<div class="section-head reveal">\s*<h2>Selected experience</h2>\s*<p class="section-intro">.*?</p>\s*</div>',
    '<div class="section-head reveal">\n        <h2>Selected experience</h2>\n      </div>',
    exp_merged,
    count=1,
    flags=re.S,
)

edu_en = one_section(EN, r'<section id="education"')
edu_en = edu_en.replace(
    "Business Administration · Joint programme INCAE Business School / Kozminski University",
    "Business Administration · Joint programme INCAE Business School/ Kozminski University",
)
edu_en = edu_en.replace("2011 — 2013 · Costa Rica / Poland", "2011 — 2013 · Costa Rica/ Poland")

# Projects: enhanced structure + classic first body paragraphs
en_ul = re.search(r'<ul class="project-list">(.*?)</ul>\s*</section>\s*\n\s*<section id="contact"', EN, re.S)
if not en_ul:
    raise SystemExit("enhanced project ul")
en_ul_body = en_ul.group(1)
cl_ul = re.search(r'<ul class="project-list">(.*?)</ul>', CL, re.S).group(1)
enh_chunks = re.split(r"(?=<li class=\"project-row reveal\">)", en_ul_body)
enh_chunks = [c for c in enh_chunks if c.strip().startswith("<li")]
# Classic offset may use simple <li><h3><p> rows or merged offset rows with project-body.
classic_descr = re.findall(
    r'<div class="project-body">\s*<h3>.*?</h3>\s*<p>(.*?)</p>',
    cl_ul,
    re.S,
)
if len(classic_descr) != len(enh_chunks):
    classic_descr = [
        p
        for (_, p) in re.findall(
            r'<li class="project-row reveal">\s*<h3>(.*?)</h3>\s*<p>(.*?)</p>\s*</li>',
            cl_ul,
            re.S,
        )
    ]
if len(classic_descr) != len(enh_chunks):
    raise SystemExit(f"project count {len(classic_descr)} vs {len(enh_chunks)}")
new_lis = []
for descr, chunk in zip(classic_descr, enh_chunks):
    descr = strip_inline_anchor_tags(descr)
    chunk2, n = re.subn(
        r"(<div class=\"project-body\">\s*<h3>.*?</h3>\s*)<p>.*?</p>",
        r"\1<p>" + descr + "</p>",
        chunk,
        count=1,
        flags=re.S,
    )
    if n != 1:
        raise SystemExit("project body replace fail")
    chunk2 = re.sub(
        r"\s*<p class=\"project-links\">.*?</p>",
        "",
        chunk2,
        flags=re.S,
    )
    new_lis.append(chunk2)
projects_section = (
    '    <section id="projects" class="section projects">\n'
    '      <div class="section-head reveal">\n'
    "        <h2>Successful Projects to be Proud of</h2>\n"
    '        <p class="section-intro">Classic short blurbs — logo tiles and links open the official context.</p>\n'
    "      </div>\n"
    "      <ul class=\"project-list\">\n"
    + "".join(new_lis)
    + "    </ul>\n"
    "    </section>"
)
# Root neo HTML uses `assets/...`; classic/ pages are one level deeper.
projects_section = projects_section.replace(
    'src="assets/project-brand/',
    'src="../assets/project-brand/',
)

# Assemble: classic from start through end of expertise, then merged experience, education from enh, skills from classic, projects merged, contact classic
cl_exp = one_section(CL, r'<section id="experience"')
pre = CL.split(cl_exp)[0]
# after experience in classic: education ... contact
post_exp = CL.split(cl_exp)[1]
# post_exp starts with \n\n    <section id="education"
cl_skills = one_section(CL, r'<section class="section skills-section"')
# Tail = contact + footer only (do not slice from "after skills" + projects opener:
# that .end() lands inside the opening <section id="projects" ...> tag and orphans attributes.)
m_contact = re.search(r'<section id="contact"', post_exp)
if not m_contact:
    raise SystemExit("contact not found in classic after experience")
tail = post_exp[m_contact.start() :]

out = (
    pre
    + exp_merged
    + "\n\n"
    + edu_en
    + "\n\n"
    + cl_skills
    + "\n\n"
    + projects_section
    + "\n\n"
    + tail
)
# one_section match starts at "<section", so the slice drops the line's leading spaces
out = out.replace(
    "\n\n<section id=\"education\"",
    "\n\n    <section id=\"education\"",
    1,
)
out = out.replace(
    "\n\n<section class=\"section skills-section\"",
    "\n\n    <section class=\"section skills-section\"",
    1,
)

(ROOT / "classic" / "variant-offset.html").write_text(out)
print("Wrote classic/variant-offset.html")
