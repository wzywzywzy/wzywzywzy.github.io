# Personal Portfolio Site

This is a lightweight static portfolio site for GitHub Pages.

## Files

- `index.html`: page structure and content
- `styles.css`: visual design and responsive layout
- `main.js`: portrait rendering and mouse interaction
- `assets/profile.png`: source photo for the digital portrait

## Deploy To GitHub Pages

1. Create a repository named `wzywzywzy.github.io` on GitHub for a user site.
2. Copy the contents of this folder into that repository root.
3. Commit and push:

```bash
git init
git add .
git commit -m "Add portfolio site"
git branch -M main
git remote add origin git@github.com:wzywzywzy/wzywzywzy.github.io.git
git push -u origin main
```

4. In GitHub, open repository settings and confirm GitHub Pages is serving from the `main` branch root.

## Local Preview

You can preview it locally with any static server. For example:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.
