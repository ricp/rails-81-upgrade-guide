# Rails 8.1 Upgrade Report
## What's Coming for Your Application

**Report Date:** October 5, 2025
**Current Version:** Rails 8.0
**Target Version:** Rails 8.1 (Beta 1 Released September 2025)
**Contributors:** 500+ developers, 2,500+ commits

---

## 📋 Executive Summary

Rails 8.1 represents a significant evolution in the Rails framework, introducing powerful new capabilities for job management, developer productivity, mobile applications, and multi-tenancy. This release continues Rails' mission to "compress the complexity of modern web apps" while maintaining backward compatibility with Rails 8.0.

**Key Highlights:**
- 🧪 **Local CI Integration** - Run tests locally with CI config - 50-60% faster feedback, 15-25% CI cost reduction
- 📱 **Native Mobile Framework** - Hotwire Native + Turbo Offline for web & mobile
- 📱 **Action Push Native** - Official iOS/Android push notifications (10M+/day at 37signals)
- 🔄 **Active Job Continuations** - Resilient, resumable background jobs
- 🏢 **Active Record Tenanting** - First-class multi-tenancy support
- 📊 **Structured Event Reporting** - Enhanced observability and logging

---

## 🚀 Major New Features

### 1. Active Job Continuations
**Impact: High** | **Led by:** Donal McBreen (37signals)

Transform long-running jobs into resilient, resumable processes that can survive deployments and restarts.

**What it does:**
- Breaks jobs into discrete steps with defined checkpoints
- Resumes execution from last completed step after interruption
- Particularly valuable for Kamal deployments (30-second shutdown windows)
- Uses cursor-based tracking for progress management

**Example Use Case:**
```ruby
class DataMigrationJob < ApplicationJob
  include ActiveJob::Continuations

  def initialize(batch_size: 1000)
    @batch_size = batch_size
  end

  def process
    # Process records in batches
    # Job automatically resumes from cursor position if interrupted
  end

  def finalize
    # Cleanup and completion tasks
  end
end
```

**Business Value:**
- Zero-downtime deployments with long-running background tasks
- Reduced job failure costs (no need to restart from beginning)
- Better resource utilization during maintenance windows

---

### 2. Local CI Integration
**Impact: High** | **Led by:** Jeremy Daer (37signals)

Run your complete test suite locally with the same configuration as CI/CD environments.

**What it does:**
- Provides default CI declaration DSL in `config/ci.rb`
- Executed via `bin/ci` command
- Significant performance improvements demonstrated
- Consistent testing between local and CI environments

**Benefits:**
- Catch issues before pushing to CI pipeline
- Faster feedback loops for developers
- Reduced CI costs from failed builds
- Standardized test execution across team

**Developer Experience:**
```bash
$ bin/ci
# Runs full test suite with CI configuration
# Same environment, same results as GitHub Actions/CircleCI
```

---

### 3. Action Push Native (Mobile Push Notifications)
**Impact: High** | **Official Rails Project**

First-class support for sending push notifications to iOS and Android devices.

**Platforms Supported:**
- **iOS:** Apple Push Notification service (APNs)
- **Android:** Firebase Cloud Messaging (FCM)

**Setup:**
```bash
bundle add action_push_native
bin/rails g action_push_native:install
bin/rails action_push_native:install:migrations
bin/rails db:migrate
```

**Configuration (`config/push.yml`):**
- Apple: token authentication (key_id, team_id, encryption_key, topic)
- Google: Firebase service account credentials (project_id, encryption_key)

**API Design:**
- Familiar ActiveMailer-style interface
- Asynchronous delivery via ActiveJob
- Built-in retry and error handling

**Business Value:**
- Native mobile engagement capabilities
- No third-party service dependencies
- Cost reduction (direct APNs/FCM integration)
- Consistent notification delivery across platforms

---

### 4. Active Record Tenanting
**Impact: High** | **Multi-Tenant Architecture**

Build multi-tenant applications while writing code as if it were single-tenant.

**What it does:**
- Automatic tenant isolation at the database level
- Tenant resolver extracts tenant information from requests
- Convention-based approach (minimal configuration)
- Seamless integration with existing Active Record patterns

**Architecture:**
```ruby
# Write code as single-tenant
class Post < ApplicationRecord
  belongs_to :user
end

# Framework handles multi-tenancy automatically
# Each tenant sees only their data
```

**Business Value:**
- Simplified SaaS application development
- Data isolation and security by default
- Reduced development complexity
- Scalable multi-customer architecture

---

### 5. Structured Event Reporting
**Impact: Medium** | **Led by:** Adrianna Chang (Shopify)

Unified interface for producing structured, machine-readable events.

**What it does:**
- Complements existing `ActiveSupport::Notifications`
- JSON-structured events optimized for post-processing
- Event tagging and context management
- Flexible subscriber system

**Usage Examples:**
```ruby
# Emit structured events
Rails.event.notify("user.signup", user_id: 123, email: "user@example.com")

# Tag events for filtering
Rails.event.tagged("graphql") do
  Rails.event.notify("user.signup", user_id: 123)
end

# Set global context
Rails.event.set_context(request_id: "abc123", shop_id: 456)
```

**Business Value:**
- Enhanced observability and monitoring
- Better integration with logging platforms (Datadog, New Relic)
- Improved debugging and troubleshooting
- Compliance and audit trail capabilities

---

### 6. Turbo Offline (Offline-First Applications)
**Impact: Medium-High** | **Status:** In Development

Enable offline-first web and mobile applications with Hotwire.

**What it enables:**
- Progressive Web App (PWA) capabilities
- Offline data synchronization
- Native mobile app offline support (via Hotwire Native)
- Seamless online/offline transitions

**Use Cases:**
- Field service applications
- Mobile data collection
- Remote work scenarios
- Areas with unreliable connectivity

**Integration:**
- Works with existing Turbo/Hotwire applications
- Supports Turbo Native (iOS/Android)
- Service Worker-based architecture

---

## 📱 Mobile & Native Developments

### Hotwire Native Ecosystem

Rails 8.1 significantly enhances mobile development capabilities with a complete native mobile framework:

**1. Hotwire Native Framework**
- **Evolution:** Consolidation of Turbo Native + Strada (announced Sept 2024)
- **Current Versions:** iOS 1.2.2 (Jul 2025), Android 1.2.4 (Jul 2025)
- **Architecture:** Web-first framework wrapping Rails HTML in native shell
- **SDK Access:** Full iOS and Android SDK/API access when needed
- **Proven:** Rails 8 conference app already using Hotwire Native in production

**2. Action Push Native** ⭐ **Production-Ready**
- **Official Rails gem** for iOS (APNs) and Android (FCM) push notifications
- **Battle-Tested:** Handles 10M+ notifications/day (Basecamp, HEY by 37signals)
- **Performance:** HTTP/2 persistent connections to APNs, optimized job processing
- **Features:** Auto-retry, rate limiting, dead device cleanup built-in
- **Cost Savings:** Direct service integration (37signals migrated off AWS SNS/Pinpoint)
- **Setup:** Simple gem installation with generator (`action_push_native:install`)

**3. Turbo Offline** 🆕 **Rails 8.1 Exclusive**
- **Purpose:** Offline-first applications for Rails + Hotwire
- **Platform Support:** Works on web AND mobile (via Hotwire Native)
- **Capabilities:** Local data storage, background sync, seamless online/offline transitions
- **Use Cases:** Field service apps, mobile data collection, remote work scenarios
- **Status:** In development for Rails 8.1 (standardizes offline patterns)

**4. Development Benefits**
- **Build Once, Deploy Everywhere:** Single Rails HTML/CSS codebase → web + iOS + Android
- **No Rewrite Needed:** Existing Rails apps can add mobile with minimal code
- **Feature Parity:** Web and mobile share same screens and business logic
- **Native Performance:** Full access to platform capabilities when needed
- **Rapid Deployment:** Ship mobile features as fast as web features

**Business Impact:**
- ✅ Eliminate separate mobile dev teams
- ✅ Reduce infrastructure costs (direct push notifications)
- ✅ Faster time to market (single codebase)
- ✅ Offline capabilities open new markets
- ✅ Native UX without native complexity

---

## ⚠️ Breaking Changes & Deprecations

### Action Dispatch / Routing
- **REMOVED:** Deprecated support for skipping leading brackets in parameter names
- **DEPRECATED:** `Rails.application.config.action_dispatch.ignore_leading_brackets`

### Active Record
- **REMOVED:** `:retries` option for SQLite3 adapter
- **REMOVED:** `:unsigned_float` and `:unsigned_decimal` column methods for MySQL
- **CHANGED:** Table columns in `schema.rb` now sorted alphabetically
  - ⚠️ **Impact:** Schema file changes in version control
  - **Action:** Update `.gitattributes` for schema normalization

### Active Storage
- **REMOVED:** `:azure` storage service (deprecated)
  - **Migration Path:** Switch to `:azure_storage_service` or alternative provider

### Active Job
- **REMOVED:** `ActiveJob::Base.enqueue_after_transaction_commit` `:never`, `:always`, `:default` options
- **REMOVED:** `Rails.application.config.active_job.enqueue_after_transaction_commit`

### Active Record Associations
- **NEW:** Deprecation support for associations
  - **Modes:** `:warn`, `:raise`, `:notify`
  - **Use Case:** Gradual migration of deprecated associations

---

## 🛠️ Ecosystem Improvements

### Lexxy - Modern Rich Text Editor
**Expected to become default ActionText editor**

Features:
- PDF and video previews
- Real-time code syntax highlighting
- Markdown shortcuts and formatting
- Enhanced media handling
- Modern, accessible interface

**Impact:** Improved content editing experience

---

### Markdown Rendering
**Simplified markdown response handling**

- Native markdown rendering support
- Streamlined content formatting
- Better integration with ActionText

---

### Infrastructure Tools

**Beamer - SQLite Replication**
- Multi-server, geographically distributed Rails apps with SQLite
- Database replication for edge deployments
- Ideal for: Kamal deployments, edge computing, distributed systems

**Kamal Geo Proxy**
- Extends Kamal Proxy for multi-region routing
- Intelligent geographic request routing
- Reduced latency for global users

**Omarchy - Development Operating System**
- Arch Linux optimized for Rails development
- Pre-installed Ruby/Rails toolchain
- Common ecosystem libraries included
- Streamlined developer onboarding

---

## 🔄 Migration Strategy

### Recommended Approach

**Phase 1: Preparation**
1. ✅ Ensure comprehensive test coverage (>80%)
2. ✅ Review Rails 8.0 deprecation warnings
3. ✅ Audit third-party gem compatibility with Rails 8.1
4. ✅ Review schema.rb changes in version control

**Phase 2: Testing**
1. ✅ Upgrade to Rails 8.1 in development environment
2. ✅ Run full test suite and address failures
3. ✅ Test in staging environment with production data
4. ✅ Performance benchmarking (before/after comparison)

**Phase 3: Deployment**
1. ✅ Deploy to production during low-traffic window
2. ✅ Monitor error rates and performance metrics
3. ✅ Have rollback plan ready (database backup, previous version)

**Phase 4: Optimization (Ongoing)**
1. ✅ Implement new Rails 8.1 features progressively
2. ✅ Refactor to leverage Active Job Continuations
3. ✅ Add Structured Event Reporting for observability
4. ✅ Evaluate multi-tenancy with Active Record Tenanting

---

## 💡 Feature Adoption Roadmap

### Immediate Opportunities (Quick Wins)

**1. Local CI Integration** ⏱️ 1-2 days
- Setup: Add `config/ci.rb` configuration
- Impact: Faster developer feedback, reduced CI costs
- Risk: Low

**2. Structured Event Reporting** ⏱️ 3-5 days
- Setup: Configure event subscribers
- Impact: Enhanced monitoring and observability
- Risk: Low

**3. Markdown Rendering** ⏱️ 1-2 days
- Setup: Update controllers to use new markdown helpers
- Impact: Simplified content rendering
- Risk: Low

### Medium-Term Initiatives

**1. Active Job Continuations**
- Refactor: Identify long-running jobs for conversion
- Impact: Zero-downtime deployments, resilient job processing
- Risk: Medium (requires job architecture changes)

**2. Lexxy Rich Text Editor**
- Migration: Replace existing ActionText editor
- Impact: Enhanced content editing experience
- Risk: Low-Medium (user retraining needed)

### Strategic Initiatives

**1. Action Push Native**
- Setup: Mobile app infrastructure, APNs/FCM configuration
- Impact: Native mobile engagement, user retention
- Risk: Medium (requires mobile app development)

**2. Active Record Tenanting**
- Architecture: Multi-tenant data model design
- Impact: SaaS capabilities, customer isolation
- Risk: High (fundamental architecture change)

**3. Turbo Offline**
- Implementation: Service workers, offline data sync
- Impact: Offline-capable mobile and web apps
- Risk: Medium (requires offline-first architecture)

---

## 📊 Risk Assessment

### Low Risk ✅
- Local CI integration
- Structured event reporting
- Markdown rendering improvements
- Lexxy rich text editor adoption

### Medium Risk ⚠️
- Active Job Continuations (requires job refactoring)
- Action Push Native (mobile infrastructure setup)
- Turbo Offline (offline architecture design)
- Schema.rb alphabetical sorting (version control churn)

### High Risk 🚨
- Active Record Tenanting (fundamental data model changes)
- Breaking changes in Action Dispatch/Active Record
- Third-party gem incompatibilities

---

## 🎯 Recommendations

### For Your Rails 8.0 Application

**1. Start Planning Now**
- Review breaking changes against your codebase
- Audit gem compatibility (check GitHub issues for Rails 8.1)
- Assess test coverage completeness

**2. Prioritize Quick Wins**
- Implement Local CI for developer productivity
- Add Structured Event Reporting for observability
- Evaluate Markdown rendering if applicable

**3. Strategic Feature Adoption**
- **If you have long-running jobs:** Prioritize Active Job Continuations
- **If you're building SaaS:** Evaluate Active Record Tenanting
- **If you have mobile apps:** Plan Action Push Native integration
- **If offline capability is needed:** Research Turbo Offline

**4. Migration Timeline**
- Wait for Rails 8.1 stable release (estimated Q4 2025)
- Begin migration in non-production environments
- Plan for 6-8 week migration timeline including testing

**5. Training & Documentation**
- Schedule team training on new features
- Update internal documentation and coding standards
- Create migration runbooks for deployment

---

## 📚 Resources

**Official Documentation:**
- Rails 8.1 Release Notes: https://edgeguides.rubyonrails.org/8_1_release_notes.html
- Rails 8.1 Beta Announcement: https://rubyonrails.org/2025/9/4/rails-8-1-beta-1
- Upgrading Ruby on Rails Guide: https://guides.rubyonrails.org/upgrading_ruby_on_rails.html

**GitHub Repositories:**
- Rails Framework: https://github.com/rails/rails
- Action Push Native: https://github.com/rails/action_push_native
- Hotwire Native: https://github.com/hotwired/hotwire-native-ios

**Community Resources:**
- RailsWorld 2025 Presentations (Amsterdam)
- Rails 8.1 Feature Discussions: https://discuss.rubyonrails.org

---

## 📞 Next Steps

1. **Review this report** with your development team
2. **Assess impact** of breaking changes on your application
3. **Identify priority features** aligned with business objectives
4. **Create migration plan** with timeline and resource allocation
5. **Schedule follow-up** to discuss implementation strategy

---

**Report Prepared By:** Richard Piacentini with AI Analysis
**LinkedIn:** https://linkedin.com/in/richardpiacentini/
**Based on:** Official Rails documentation, community announcements, and ecosystem research
**Recommendations:** Consult with Rails experts for application-specific guidance

---

*This report reflects information available as of October 5, 2025. Rails 8.1 is currently in beta; features and timelines may change before final release.*
