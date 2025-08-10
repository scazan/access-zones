# Publishing rbac-zones to npm

This document outlines the steps to publish the rbac-zones package to npm.

## Prerequisites

1. **npm account**: You need an npm account with publishing permissions
2. **Authentication**: Login to npm using `npm login`
3. **Version management**: Follow semantic versioning

## Pre-publish Checklist

Before publishing, ensure:

- [ ] All tests pass (`npm test`)
- [ ] Code builds successfully (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Documentation is up to date
- [ ] CHANGELOG.md is updated
- [ ] Version number is bumped appropriately

## Publishing Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
npm test
```

### 3. Build the Package
```bash
npm run build
```

### 4. Version Bump
```bash
# For patch releases (bug fixes)
npm version patch

# For minor releases (new features)
npm version minor

# For major releases (breaking changes)
npm version major
```

### 5. Publish to npm
```bash
# Dry run first to check what will be published
npm publish --dry-run

# Publish to npm
npm publish
```

### 6. Create Git Tag
```bash
git push origin main --tags
```

## Package Contents

The published package will include:
- `dist/` - Compiled JavaScript and TypeScript declarations
- `README.md` - Package documentation
- `LICENSE` - MIT license
- `package.json` - Package metadata

Files excluded from publishing (via .npmignore):
- Source TypeScript files (`src/`)
- Test files (`__tests__/`)
- Development configuration files
- Examples and documentation source

## Automated Publishing

For automated publishing, you can use GitHub Actions:

```yaml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Version Strategy

Follow semantic versioning (semver):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backward compatible

## Post-publish

After publishing:

1. Verify the package on npmjs.com
2. Test installation: `npm install rbac-zones`
3. Update documentation if needed
4. Announce the release

## Troubleshooting

### Common Issues

1. **Authentication Error**: Run `npm login` and verify credentials
2. **Version Conflict**: Ensure version number is higher than published version
3. **File Size**: Check package size with `npm pack` and optimize if needed
4. **Missing Files**: Verify .npmignore and package.json "files" field

### Package Size Optimization

- Use .npmignore to exclude unnecessary files
- Minimize dependencies
- Use tree-shaking friendly exports
- Consider splitting large packages

## Support

For publishing issues:
- Check npm documentation: https://docs.npmjs.com/
- Contact npm support: https://www.npmjs.com/support
- Review package guidelines: https://docs.npmjs.com/packages-and-modules/
