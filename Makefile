.PHONY: help version-bump release build test lint clean

# Auto-generate version from today's date with auto-incrementing patch
# Format: YYYYMMDD.0.X where X increments if releasing multiple times per day
# Checks both git tags and npm registry to avoid collisions
PACKAGE_NAME := discourse-comments
define get_next_version
$(shell \
	TODAY=$$(date +%Y%m%d); \
	GIT_LATEST=$$(git tag -l "v$$TODAY.*" 2>/dev/null | sort -V | tail -1 | sed 's/^v//'); \
	NPM_LATEST=$$(npm view $(PACKAGE_NAME) versions --json 2>/dev/null | grep "\"$$TODAY\." | tail -1 | tr -d ' ",' || true); \
	LATEST=""; \
	if [ -n "$$GIT_LATEST" ] && [ -n "$$NPM_LATEST" ]; then \
		LATEST=$$(printf '%s\n%s' "$$GIT_LATEST" "$$NPM_LATEST" | sort -V | tail -1); \
	elif [ -n "$$GIT_LATEST" ]; then \
		LATEST="$$GIT_LATEST"; \
	elif [ -n "$$NPM_LATEST" ]; then \
		LATEST="$$NPM_LATEST"; \
	fi; \
	if [ -z "$$LATEST" ]; then \
		echo "$$TODAY.0.0"; \
	else \
		PATCH=$$(echo "$$LATEST" | sed 's/.*\.0\.\([0-9]*\)/\1/'); \
		echo "$$TODAY.0.$$((PATCH + 1))"; \
	fi \
)
endef

VERSION := $(get_next_version)

help:
	@echo "discourse-comments Makefile"
	@echo ""
	@echo "Usage:"
	@echo "  make release                       - Auto-version and release (recommended)"
	@echo "  make release VERSION=20260125.0.0  - Release with specific version"
	@echo "  make build                         - Build bundle"
	@echo "  make test                          - Run tests"
	@echo "  make lint                          - Run type checking"
	@echo "  make clean                         - Clean build artifacts"
	@echo ""
	@echo "Next version will be: $(VERSION)"

# Bump version in package.json and commit on a branch
version-bump:
	@echo "Next version: $(VERSION)"
	@echo "Creating release branch for version $(VERSION)..."
	@git checkout -b release/v$(VERSION)
	@echo "Bumping version to $(VERSION)..."
	@npm version $(VERSION) --no-git-tag-version
	@git add package.json package-lock.json
	@git commit -m "chore: bump version to $(VERSION)"
	@echo ""
	@echo "Created branch release/v$(VERSION)"
	@echo "Version bumped to $(VERSION)"
	@echo "Commit created"

# Merge to main, tag, push, and trigger GitHub Actions release
release: version-bump
	@echo "Merging into main..."
	@git checkout main
	@git merge --no-ff release/v$(VERSION) -m "Merge branch 'release/v$(VERSION)'"
	@echo "Creating tag v$(VERSION) on main..."
	@git tag -a v$(VERSION) -m "Release v$(VERSION)"
	@echo "Pushing to origin..."
	@git push origin main
	@git push origin v$(VERSION)
	@echo ""
	@echo "Released v$(VERSION)"
	@echo "  - Merged release/v$(VERSION) into main"
	@echo "  - Tagged v$(VERSION)"
	@echo "  - Pushed to GitHub"
	@echo "  - GitHub Actions will build and publish to npm"

# Build bundle
build:
	npm run build

# Run tests
test:
	npx vitest run

# Type check
lint:
	npx tsc --noEmit

# Clean build artifacts
clean:
	rm -rf dist/
