# Changesets

This project uses [changesets](https://github.com/changesets/changesets) to manage versioning and changelogs.

## For contributors

When making changes that should be released, run:

```bash
npx changeset
```

This will prompt you to:
1. Select the package (fin-charter)
2. Choose the semver bump type (patch/minor/major)
3. Write a summary of the change

The changeset file is committed with your PR. When the PR merges, the Release workflow will collect all changesets and create a "Version Packages" PR that bumps the version and updates CHANGELOG.md.

## Versioning guide

- **patch** (0.1.0 → 0.1.1): Bug fixes, documentation updates
- **minor** (0.1.0 → 0.2.0): New features, non-breaking API additions
- **major** (0.1.0 → 1.0.0): Breaking API changes
