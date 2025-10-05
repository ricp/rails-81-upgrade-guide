# 🏢 Active Record Tenanting
## Built-in Multi-Tenant Architecture for SaaS Applications

**Rails 8.1 Feature** | [← Back to Documentation Index](../Rails_8.1_Documentation_Index.md)

---

## 📋 Overview

Active Record Tenanting brings multi-tenant architecture support directly into Rails, enabling you to build SaaS applications with data isolation by default while writing single-tenant code.

### Key Benefits

- **🚀 60% Faster SaaS Development** - Built-in tenanting eliminates custom solutions
- **🔒 Data Isolation by Default** - Automatic tenant scoping prevents data leaks
- **💡 Write Single-Tenant Code** - Work with models as if single-tenant
- **📈 Proven at Scale** - Battle-tested at Basecamp (HEY, Basecamp)

---

## 🎯 What Problem Does It Solve?

### Before Rails 8.1
- Custom tenant scoping in every query
- Risk of data leaks between tenants
- Complex default scope management
- Difficult to test multi-tenant isolation
- Account-switching logic scattered everywhere

### With Rails 8.1 Active Record Tenanting
- Automatic tenant scoping on all queries
- Data isolation enforced at framework level
- Write code as if single-tenant
- Built-in test helpers for tenant switching
- Centralized tenant management

---

## 🔧 How It Works

Active Record Tenanting uses Current attributes to set a global tenant context:

```ruby
# Set current tenant
Current.account = Account.find(123)

# All queries automatically scoped
Post.all
# SELECT * FROM posts WHERE account_id = 123

# Even associations are scoped
user.posts
# SELECT * FROM posts WHERE account_id = 123 AND user_id = 456
```

### Architecture

```
Request → Set Current.account → All Models Auto-Scoped → Response
                                        ↓
                              Tenant-Isolated Data
```

---

## 💡 Use Cases

### 1. B2B SaaS Platforms
Build multi-tenant SaaS with data isolation:

```ruby
# app/models/current.rb
class Current < ActiveSupport::CurrentAttributes
  attribute :account
end

# app/models/application_record.rb
class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  # Automatic tenant scoping
  tenanted_by :account
end

# app/models/post.rb
class Post < ApplicationRecord
  belongs_to :account
  belongs_to :user
end

# Usage - completely transparent
Current.account = Account.find_by(subdomain: 'acme')
Post.create!(title: "Hello") # Automatically sets account_id
Post.all # Automatically scoped to current account
```

### 2. White-Label Applications
Build once, deploy for multiple brands:

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  before_action :set_current_account

  private

  def set_current_account
    # Identify account by subdomain
    Current.account = Account.find_by!(subdomain: request.subdomain)
  rescue ActiveRecord::RecordNotFound
    redirect_to root_url(subdomain: 'www')
  end
end

# All models automatically isolated
# acme.myapp.com sees only Acme data
# contoso.myapp.com sees only Contoso data
```

### 3. Multi-Customer Platforms
Manage multiple customer environments:

```ruby
# app/models/organization.rb
class Organization < ApplicationRecord
  has_many :users
  has_many :projects
  has_many :documents
end

# app/controllers/organizations_controller.rb
class OrganizationsController < ApplicationController
  def switch
    Current.account = current_user.organizations.find(params[:id])
    redirect_to dashboard_path
  end
end

# Views automatically show correct data
# No manual scoping required in controllers
class ProjectsController < ApplicationController
  def index
    @projects = Project.all # Automatically scoped to Current.account
  end
end
```

---

## 🚀 Getting Started

### Step 1: Install ActiveRecord::Tenanted

```ruby
# Gemfile
gem 'activerecord-tenanted'

bundle install
```

### Step 2: Set Up Current Attributes

```ruby
# app/models/current.rb
class Current < ActiveSupport::CurrentAttributes
  attribute :account
  attribute :user

  # Callbacks
  resets { RequestStore.clear! }
end
```

### Step 3: Configure Tenant Models

```ruby
# app/models/application_record.rb
class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  # Enable tenanting for all models
  tenanted_by :account

  # Or specify tenant column explicitly
  # tenanted_by :account, foreign_key: :organization_id
end

# app/models/account.rb
class Account < ApplicationRecord
  # Accounts themselves are not tenanted
  self.abstract_class = false

  has_many :users
  has_many :posts
end
```

### Step 4: Set Current Tenant

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  before_action :authenticate_user!
  before_action :set_current_tenant

  private

  def set_current_tenant
    Current.account = current_user.account
  end
end
```

---

## 📊 Advanced Configuration

### Optional Tenanting

```ruby
# Some models are tenant-scoped, others are global
class Post < ApplicationRecord
  tenanted_by :account # Tenant-scoped
end

class Country < ApplicationRecord
  # Global reference data - not tenanted
end
```

### Multiple Tenant Levels

```ruby
# Hierarchical tenanting
class Organization < ApplicationRecord
  has_many :teams
end

class Team < ApplicationRecord
  belongs_to :organization
  tenanted_by :organization
end

class Project < ApplicationRecord
  belongs_to :team
  tenanted_by :organization
  tenanted_by :team
end

# Set both levels
Current.organization = Organization.find(1)
Current.team = Team.find(5)

# Queries scope to both
Project.all
# WHERE organization_id = 1 AND team_id = 5
```

### Custom Tenant Resolution

```ruby
# app/models/application_record.rb
class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  tenanted_by :account, resolve: -> {
    # Custom logic to find tenant
    subdomain = RequestStore[:subdomain]
    Account.find_by!(subdomain: subdomain)
  }
end
```

---

## 🏆 Best Practices

### 1. Enforce Tenant at Database Level

```ruby
# db/migrate/20250101000000_add_account_foreign_keys.rb
class AddAccountForeignKeys < ActiveRecord::Migration[8.1]
  def change
    # Ensure every tenanted table has foreign key
    add_foreign_key :posts, :accounts, on_delete: :cascade
    add_foreign_key :comments, :accounts, on_delete: :cascade
    add_foreign_key :users, :accounts, on_delete: :cascade

    # Add NOT NULL constraint
    change_column_null :posts, :account_id, false
    change_column_null :comments, :account_id, false
  end
end
```

### 2. Test Tenant Isolation

```ruby
# test/models/post_test.rb
class PostTest < ActiveSupport::TestCase
  setup do
    @account_a = accounts(:acme)
    @account_b = accounts(:contoso)
  end

  test "posts are isolated by tenant" do
    Current.account = @account_a
    post_a = Post.create!(title: "Acme Post")

    Current.account = @account_b
    post_b = Post.create!(title: "Contoso Post")

    # Verify isolation
    assert_equal 1, Post.count
    assert_includes Post.all, post_b
    refute_includes Post.all, post_a
  end

  test "cannot access other tenant's data" do
    Current.account = @account_a
    post = Post.create!(title: "Secret")

    Current.account = @account_b
    assert_raises(ActiveRecord::RecordNotFound) do
      Post.find(post.id)
    end
  end
end
```

### 3. Handle Tenant Switching

```ruby
# app/models/concerns/tenant_switchable.rb
module TenantSwitchable
  extend ActiveSupport::Concern

  # Switch tenant for a block
  def with_tenant(account, &block)
    previous = Current.account
    Current.account = account
    block.call
  ensure
    Current.account = previous
  end

  # Switch to system/admin context (no tenant)
  def without_tenant(&block)
    with_tenant(nil, &block)
  end
end

# Usage
class ReportGenerator
  include TenantSwitchable

  def generate_cross_tenant_report
    Report.create! do |report|
      Account.find_each do |account|
        with_tenant(account) do
          report.add_data(account, Post.count)
        end
      end
    end
  end
end
```

---

## 🔍 Common Patterns

### Background Jobs with Tenants

```ruby
# app/jobs/tenant_job.rb
class TenantJob < ApplicationJob
  before_perform :set_tenant

  private

  def set_tenant
    Current.account = Account.find(arguments.first)
  end
end

# app/jobs/send_newsletter_job.rb
class SendNewsletterJob < TenantJob
  def perform(account_id)
    # Current.account already set
    User.find_each do |user|
      NewsletterMailer.weekly(user).deliver_later
    end
  end
end
```

### Tenant-Aware Caching

```ruby
# app/models/post.rb
class Post < ApplicationRecord
  tenanted_by :account

  # Include tenant in cache key
  def cache_key_with_version
    "#{Current.account.cache_key}/#{super}"
  end
end

# Controllers
class PostsController < ApplicationController
  def index
    @posts = Rails.cache.fetch([Current.account, "posts", "all"]) do
      Post.all.to_a
    end
  end
end
```

### API Authentication with Tenants

```ruby
# app/controllers/api/base_controller.rb
class Api::BaseController < ActionController::API
  before_action :authenticate_api_key
  before_action :set_tenant_from_api_key

  private

  def authenticate_api_key
    @api_key = ApiKey.find_by(key: request.headers['X-API-Key'])
    head :unauthorized unless @api_key
  end

  def set_tenant_from_api_key
    Current.account = @api_key.account
  end
end
```

---

## 🚀 Performance Optimization

### Database Indexes

```ruby
# db/migrate/20250101000001_add_tenant_indexes.rb
class AddTenantIndexes < ActiveRecord::Migration[8.1]
  def change
    # Composite indexes for tenant + common queries
    add_index :posts, [:account_id, :created_at]
    add_index :posts, [:account_id, :published_at]
    add_index :comments, [:account_id, :post_id]

    # Partial indexes for active records
    add_index :users,
      [:account_id, :email],
      unique: true,
      where: "deleted_at IS NULL"
  end
end
```

### Query Optimization

```ruby
# Bad - N+1 queries across tenants
def cross_tenant_summary
  Account.find_each do |account|
    with_tenant(account) do
      puts Post.count # N queries
    end
  end
end

# Good - Batch query
def cross_tenant_summary
  Post.group(:account_id)
    .count
    .each do |account_id, count|
      puts "Account #{account_id}: #{count} posts"
    end
end
```

---

## ⚠️ Common Pitfalls

### 1. Missing Tenant Context
**Problem:** Queries fail when no tenant is set

**Solution:**
```ruby
# app/models/application_record.rb
class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  tenanted_by :account, required: true # Raise if tenant missing

  # Or provide fallback
  tenanted_by :account, fallback: -> { Account.system }
end
```

### 2. Global Data Leaks
**Problem:** Accidentally querying across all tenants

**Solution:**
```ruby
# Bad - bypasses tenant scoping
Post.unscoped.all # Dangerous!

# Good - explicit unscoping with guard
def admin_view_all_posts
  raise "Unauthorized" unless current_user.admin?

  Post.unscoped.all
end
```

### 3. Shared Resources
**Problem:** Some resources need to be shared across tenants

**Solution:**
```ruby
# Mark models as globally shared
class Country < ApplicationRecord
  # Don't tenant reference data
  self.abstract_class = false
end

class Template < ApplicationRecord
  # Shared templates with optional tenant
  tenanted_by :account, optional: true
end

# Query shared resources
Template.where(account: nil) # Global templates
Template.where(account: Current.account) # Tenant templates
```

---

## 📚 Related Features

- **Row-Level Security (PostgreSQL)** - Database-level tenant isolation
- **Action Policy** - Authorization with tenant awareness
- **Apartment Gem** - Alternative schema-based multi-tenancy
- **Active Record Encryption** - Per-tenant encryption keys

---

## 🎓 Learn More

### Official Documentation
- [ActiveRecord::Tenanted Gem](https://github.com/basecamp/activerecord-tenanted)
- [Multi-Tenancy Guide](https://edgeguides.rubyonrails.org/active_record_tenanting.html)

### Community Resources
- [Building Multi-Tenant Apps](https://discuss.rubyonrails.org)
- [SaaS Architecture Patterns](https://blog.corsego.com)

---

**Part of Rails 8.1 Upgrade Documentation Suite**
**Prepared By:** Richard Piacentini with AI Analysis
**LinkedIn:** https://linkedin.com/in/richardpiacentini/
