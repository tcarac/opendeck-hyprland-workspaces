# Release procedure

1. Review PRs and check CI/CodeQL/dependency-review status.
2. Manually test an OpenDeck session and at least one supported physical device.
3. Update version and CHANGELOG with tested compatibility.
4. Create a signed/tagged release via GitHub UI or `gh release create`; inspect generated artifacts before publishing.
5. Never publish an automated release from an unreviewed AI-authored PR.
