# Contributing to Claude Code Remote Installer

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using GitHub's [issue tracker](https://github.com/mfzzf/ClaudeDeploy/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/mfzzf/ClaudeDeploy/issues/new); it's that easy!

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

People *love* thorough bug reports. I'm not even kidding.

## Use a Consistent Coding Style

* 2 spaces for indentation rather than tabs
* You can try running `npm run lint` for style unification

## Pull Request Template & Lightweight CI

To keep CI lightweight and fast:

- PR Template: `.github/pull_request_template.md` 提供概要、风险、验收清单与 CI 说明。
- CI 触发：仅在 Pull Request 上触发；默认只运行 Lint（`npm ci` + `npm run lint`）。
- 路径过滤：仅当变更涉及 `**/*.js`、`package*.json`、`.eslintrc.json`、`.prettierrc*`、`.github/workflows/**` 时触发；纯文档改动不会触发。
- 显式跳过：在 PR 标题或描述中包含 `[skip ci]`，或为 PR 添加标签 `skip-ci` 可跳过 CI。

## License

By contributing, you agree that your contributions will be licensed under its MIT License.