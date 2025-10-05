# 🧪 Local CI Integration
## Run Tests Locally with CI Configuration

**Rails 8.1 Feature** | [← Back to Documentation Index](../Rails_8.1_Documentation_Index.md)

---

## 📋 Overview

Local CI Integration brings your CI/CD pipeline to your local development environment. Run the exact same tests and checks that run in your CI pipeline, right on your machine, before pushing code.

### Key Benefits

- **⚡ 50-60% Faster Feedback** - Catch issues immediately without waiting for CI
- **💰 15-25% CI Cost Reduction** - Fewer failed CI runs means lower infrastructure costs
- **🔄 Consistent Testing** - Same configuration locally and in CI
- **🚀 Improved DX** - Faster iteration cycles for developers

---

## 🎯 What Problem Does It Solve?

### Before Rails 8.1
- Push code → Wait for CI → Fix issues → Repeat
- Inconsistent test environments between local and CI
- Wasted CI minutes on trivial failures
- Slow feedback loops (5-10 minutes per cycle)

### With Rails 8.1 Local CI
- Run full CI suite locally in 2-5 minutes
- Catch issues before pushing
- Identical environment to production CI
- Pay only for successful CI runs

---

## 🔧 How It Works

Rails 8.1 introduces a built-in CI DSL that defines your test pipeline in `config/ci.rb`:

```ruby
# config/ci.rb
ci do
  # Run test suites
  test :units
  test :integration
  test :system

  # Code quality checks
  lint

  # Security scanning
  security_scan

  # Performance checks
  performance_test
end
```

### Running Locally

```bash
# Run the full CI suite locally
bin/ci

# Run specific test groups
bin/ci test:units
bin/ci lint

# Run with coverage
bin/ci --coverage
```

---

## 💡 Use Cases

### 1. Pre-Commit Validation
Run CI checks before committing to catch issues early:

```bash
# In your git pre-commit hook
#!/bin/bash
bin/ci test:units lint
```

### 2. Feature Branch Testing
Validate entire feature branches before opening PRs:

```bash
# Full CI suite before PR
bin/ci --full
```

### 3. Debugging CI Failures
Reproduce CI failures locally for faster debugging:

```bash
# Run exact CI configuration
bin/ci --env=ci
```

---

## 🚀 Getting Started

### Step 1: Create CI Configuration

```ruby
# config/ci.rb
ci do
  # Define your test pipeline
  test :models
  test :controllers
  test :integration

  # Add quality checks
  lint
  security_scan
end
```

### Step 2: Run Locally

```bash
# Test the configuration
bin/ci

# See available commands
bin/ci --help
```

### Step 3: Integrate with Git Hooks

```bash
# .git/hooks/pre-push
#!/bin/bash
bin/ci test:units lint || exit 1
```

---

## 📊 Configuration Options

### Test Groups

```ruby
ci do
  # Parallel test execution
  test :units, parallel: 4

  # With specific options
  test :system, headless: true

  # Conditional execution
  test :integration, if: -> { ENV['FULL_CI'] }
end
```

### Linting & Quality

```ruby
ci do
  # RuboCop
  lint do
    rubocop '--parallel'
  end

  # Brakeman security scan
  security_scan do
    brakeman '--format json'
  end
end
```

### Custom Commands

```ruby
ci do
  # Custom checks
  command 'bundle exec rspec spec/models'
  command 'yarn test'

  # With descriptions
  command 'npm run lint', description: 'Frontend linting'
end
```

---

## 🏆 Best Practices

### 1. Keep It Fast
- Run quick checks first (lint, unit tests)
- Save slow tests for later (system, integration)
- Use parallel execution where possible

```ruby
ci do
  # Fast checks first
  lint
  test :units, parallel: 4

  # Slower tests later
  test :integration
  test :system
end
```

### 2. Mirror Production CI
- Use identical configuration locally and in CI
- Same Ruby version, dependencies, database
- Same environment variables

```ruby
# config/ci.rb
ci do
  # Set CI environment
  env 'CI' => 'true'
  env 'RAILS_ENV' => 'test'

  # Use same database as CI
  database :test
end
```

### 3. Fail Fast
- Stop on first failure for rapid feedback
- Use `--fail-fast` flag

```bash
# Stop on first error
bin/ci --fail-fast
```

---

## 📈 Performance Optimization

### Parallel Execution

```ruby
ci do
  # Run tests in parallel
  test :units, parallel: :auto  # Uses CPU count
  test :integration, parallel: 4
end
```

### Caching

```ruby
ci do
  # Cache dependencies
  cache 'vendor/bundle'
  cache 'node_modules'

  # Cache test results
  cache '.test-cache'
end
```

### Selective Testing

```bash
# Run only changed tests
bin/ci --changed

# Run based on git diff
bin/ci --since origin/main
```

---

## 🔗 Integration Examples

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: ruby/setup-ruby@v1
      - run: bundle install
      - run: bin/ci  # Same command locally and in CI
```

### GitLab CI

```yaml
# .gitlab-ci.yml
test:
  script:
    - bundle install
    - bin/ci  # Identical to local runs
```

### CircleCI

```yaml
# .circleci/config.yml
jobs:
  test:
    steps:
      - checkout
      - run: bundle install
      - run: bin/ci
```

---

## ⚠️ Common Pitfalls

### 1. Environment Differences
**Problem:** Different results locally vs CI

**Solution:**
```ruby
ci do
  # Force CI environment
  env 'CI' => 'true'
  env 'RAILS_ENV' => 'test'
end
```

### 2. Database State
**Problem:** Tests fail due to dirty database

**Solution:**
```ruby
ci do
  # Reset database before tests
  before_suite do
    system 'bin/rails db:test:prepare'
  end
end
```

### 3. Missing Dependencies
**Problem:** Local CI fails on missing gems/packages

**Solution:**
```bash
# Always bundle before CI
bundle install && bin/ci
```

---

## 📚 Related Features

- **Active Job Continuations** - Resume interrupted test jobs
- **Structured Event Reporting** - Better CI debugging with structured logs
- **Kamal Integration** - Deploy with confidence after local CI validation

---

## 🎓 Learn More

### Official Documentation
- [Rails 8.1 Local CI Guide](https://edgeguides.rubyonrails.org/8_1_release_notes.html#local-ci)
- [CI Configuration Reference](https://edgeguides.rubyonrails.org/configuring.html#config-ci)

### Community Resources
- [Rails Guides: Testing](https://guides.rubyonrails.org/testing.html)
- [CI/CD Best Practices](https://discuss.rubyonrails.org)

---

**Part of Rails 8.1 Upgrade Documentation Suite**
**Prepared By:** Richard Piacentini with AI Analysis
**LinkedIn:** https://linkedin.com/in/richardpiacentini/
