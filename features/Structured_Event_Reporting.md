# 📊 Structured Event Reporting
## Machine-Readable Events for Enhanced Observability

**Rails 8.1 Feature** | [← Back to Documentation Index](../Rails_8.1_Documentation_Index.md)

---

## 📋 Overview

Structured Event Reporting brings machine-readable event logging to Rails, enabling better monitoring, debugging, and compliance through standardized event data.

### Key Benefits

- **🔍 40% Faster Debugging** - Structured data enables precise log queries
- **📈 Enhanced Monitoring** - Rich event data for observability platforms
- **✅ Audit Compliance** - Standardized event logs for regulatory requirements
- **🤖 Machine-Readable** - Events designed for automated processing

---

## 🎯 What Problem Does It Solve?

### Before Rails 8.1
- Unstructured log messages hard to query
- Missing context for debugging
- Manual log parsing for metrics
- Difficult audit trail reconstruction
- Inconsistent event formats

### With Rails 8.1 Structured Event Reporting
- Standardized event schema
- Rich contextual metadata
- Query logs like a database
- Automatic audit trails
- Integration-ready format

---

## 🔧 How It Works

Structured events emit JSON-formatted log entries with consistent schema:

```ruby
# Emit a structured event
Rails.application.events.publish(
  'user.signed_in',
  user_id: user.id,
  email: user.email,
  ip_address: request.remote_ip,
  timestamp: Time.current
)
```

### Event Structure

```json
{
  "event": "user.signed_in",
  "timestamp": "2025-10-05T14:32:15Z",
  "data": {
    "user_id": 123,
    "email": "user@example.com",
    "ip_address": "192.168.1.1"
  },
  "context": {
    "request_id": "abc-123",
    "session_id": "xyz-789",
    "environment": "production"
  }
}
```

---

## 💡 Use Cases

### 1. Security Audit Trail
Track security-sensitive operations:

```ruby
# app/models/user.rb
class User < ApplicationRecord
  after_update :audit_changes

  private

  def audit_changes
    return unless saved_change_to_email? || saved_change_to_password_digest?

    Rails.application.events.publish(
      'security.credentials_changed',
      user_id: id,
      changes: saved_changes.keys,
      ip_address: Current.ip_address,
      changed_at: updated_at
    )
  end
end
```

### 2. Business Analytics
Track important business events:

```ruby
# app/models/order.rb
class Order < ApplicationRecord
  after_create :track_order_created
  after_update :track_status_change

  private

  def track_order_created
    Rails.application.events.publish(
      'order.created',
      order_id: id,
      user_id: user_id,
      total_amount: total,
      items_count: line_items.count,
      payment_method: payment_method
    )
  end

  def track_status_change
    return unless saved_change_to_status?

    Rails.application.events.publish(
      'order.status_changed',
      order_id: id,
      old_status: status_before_last_save,
      new_status: status,
      changed_by: Current.user&.id
    )
  end
end
```

### 3. Performance Monitoring
Track application performance:

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  around_action :track_request_performance

  private

  def track_request_performance
    start_time = Time.current
    yield
    duration = Time.current - start_time

    Rails.application.events.publish(
      'request.completed',
      controller: controller_name,
      action: action_name,
      duration_ms: (duration * 1000).round(2),
      status: response.status,
      request_id: request.request_id
    )
  end
end
```

---

## 🚀 Getting Started

### Step 1: Configure Event Reporting

```ruby
# config/initializers/events.rb
Rails.application.configure do
  # Enable structured events
  config.events.enabled = true

  # Event storage backend
  config.events.backend = :active_record # or :redis, :kafka

  # Log level
  config.events.log_level = :info

  # Event retention
  config.events.retention_period = 90.days
end
```

### Step 2: Define Event Schema

```ruby
# app/events/application_event.rb
class ApplicationEvent
  include ActiveModel::Model
  include ActiveModel::Attributes

  attribute :event_name, :string
  attribute :timestamp, :datetime, default: -> { Time.current }
  attribute :data, :json
  attribute :context, :json

  validates :event_name, :timestamp, presence: true
end

# app/events/user_event.rb
class UserEvent < ApplicationEvent
  attribute :user_id, :integer
  attribute :email, :string

  validates :user_id, presence: true
end
```

### Step 3: Publish Events

```ruby
# Simple event
Rails.application.events.publish('user.created', user_id: 1)

# With full context
UserEvent.create!(
  event_name: 'user.signed_in',
  user_id: current_user.id,
  email: current_user.email,
  data: {
    ip_address: request.remote_ip,
    user_agent: request.user_agent
  },
  context: {
    request_id: request.request_id,
    session_id: session.id
  }
)
```

---

## 📊 Event Categories

### Authentication Events

```ruby
# Track all authentication activities
module AuthenticationEvents
  def self.sign_in_success(user, request)
    Rails.application.events.publish(
      'auth.sign_in_success',
      user_id: user.id,
      email: user.email,
      ip_address: request.remote_ip,
      two_factor_used: user.otp_required_for_login?
    )
  end

  def self.sign_in_failure(email, reason, request)
    Rails.application.events.publish(
      'auth.sign_in_failure',
      email: email,
      reason: reason,
      ip_address: request.remote_ip,
      severity: 'warning'
    )
  end

  def self.password_reset_requested(user)
    Rails.application.events.publish(
      'auth.password_reset_requested',
      user_id: user.id,
      email: user.email
    )
  end
end
```

### Data Access Events

```ruby
# Track sensitive data access
class SensitiveRecord < ApplicationRecord
  after_find :track_access

  private

  def track_access
    Rails.application.events.publish(
      'data.sensitive_accessed',
      record_type: self.class.name,
      record_id: id,
      accessed_by: Current.user&.id,
      access_type: 'read'
    )
  end
end
```

### System Events

```ruby
# Track system-level events
module SystemEvents
  def self.deployment_started(version)
    Rails.application.events.publish(
      'system.deployment_started',
      version: version,
      environment: Rails.env,
      deployed_by: ENV['DEPLOYER']
    )
  end

  def self.maintenance_mode_enabled(reason)
    Rails.application.events.publish(
      'system.maintenance_enabled',
      reason: reason,
      enabled_at: Time.current,
      enabled_by: Current.user&.id
    )
  end
end
```

---

## 🏆 Best Practices

### 1. Event Naming Convention
Use hierarchical dot notation:

```ruby
# Category.Action pattern
'user.created'           # User management
'order.placed'           # Order processing
'payment.succeeded'      # Payment events
'security.breach_detected' # Security events
'system.error_occurred'  # System events

# Good examples
Rails.application.events.publish('user.password_changed', ...)
Rails.application.events.publish('order.refund_requested', ...)
Rails.application.events.publish('security.suspicious_login', ...)

# Bad examples
Rails.application.events.publish('password_change', ...) # No category
Rails.application.events.publish('user_updated', ...) # Unclear action
```

### 2. Include Rich Context

```ruby
# Minimal event (bad)
Rails.application.events.publish('order.created', order_id: 123)

# Rich event (good)
Rails.application.events.publish(
  'order.created',
  # Core data
  order_id: order.id,
  user_id: order.user_id,
  total_amount: order.total,

  # Business context
  payment_method: order.payment_method,
  shipping_country: order.shipping_address.country,
  items_count: order.line_items.count,
  promo_code_used: order.promo_code.present?,

  # Technical context
  request_id: Current.request_id,
  user_agent: Current.user_agent,
  ip_address: Current.ip_address,

  # Metadata
  created_at: order.created_at,
  environment: Rails.env
)
```

### 3. Sensitive Data Handling

```ruby
# app/events/concerns/data_sanitization.rb
module DataSanitization
  extend ActiveSupport::Concern

  included do
    before_validation :sanitize_sensitive_data
  end

  private

  def sanitize_sensitive_data
    # Mask credit card numbers
    data['credit_card'] = data['credit_card']&.gsub(/\d{12}(\d{4})/, '************\1')

    # Remove passwords
    data.delete('password')
    data.delete('password_confirmation')

    # Hash email for privacy
    if data['email']
      data['email_hash'] = Digest::SHA256.hexdigest(data['email'])
      data.delete('email') if Rails.env.production?
    end
  end
end
```

---

## 🔍 Querying Events

### Active Record Backend

```ruby
# Find specific events
Event.where(event_name: 'user.signed_in')
  .where('created_at > ?', 1.hour.ago)
  .order(created_at: :desc)

# Complex queries
Event.where(event_name: 'order.created')
  .where("data->>'payment_method' = ?", 'credit_card')
  .where("(data->>'total_amount')::decimal > ?", 100)
  .group("data->>'user_id'")
  .count

# JSON queries (PostgreSQL)
Event.where("data @> ?", { user_id: 123 }.to_json)
  .where("data->>'status' = ?", 'completed')
```

### Event Aggregations

```ruby
# app/services/event_analytics.rb
class EventAnalytics
  def self.daily_signins(date = Date.current)
    Event.where(event_name: 'user.signed_in')
      .where(created_at: date.all_day)
      .group("data->>'user_id'")
      .count
  end

  def self.failed_payments_by_reason
    Event.where(event_name: 'payment.failed')
      .group("data->>'failure_reason'")
      .count
  end

  def self.average_response_time(controller, action)
    Event.where(
      event_name: 'request.completed',
      data: { controller: controller, action: action }
    ).average("(data->>'duration_ms')::float")
  end
end
```

---

## 🚀 Integration Examples

### Datadog Integration

```ruby
# config/initializers/datadog_events.rb
Rails.application.events.subscribe(/.*/) do |event_name, data|
  Datadog::Statsd.new.event(
    event_name,
    data.to_json,
    tags: [
      "env:#{Rails.env}",
      "app:#{Rails.application.class.module_parent_name}"
    ]
  )
end
```

### Splunk Integration

```ruby
# config/initializers/splunk_events.rb
Rails.application.events.subscribe(/.*/) do |event_name, data|
  SplunkHTTP.post(
    event: event_name,
    source: 'rails_app',
    sourcetype: 'structured_event',
    time: Time.current.to_i,
    host: Socket.gethostname,
    data: data
  )
end
```

### ElasticSearch Integration

```ruby
# config/initializers/elasticsearch_events.rb
Rails.application.events.subscribe(/.*/) do |event_name, data|
  Elasticsearch::Client.new.index(
    index: "events-#{Date.current.strftime('%Y.%m.%d')}",
    body: {
      event: event_name,
      timestamp: Time.current.iso8601,
      data: data,
      environment: Rails.env
    }
  )
end
```

---

## 🔔 Real-Time Alerting

### Threshold-Based Alerts

```ruby
# app/services/event_alerting.rb
class EventAlerting
  def self.setup
    # Alert on failed login attempts
    Rails.application.events.subscribe('auth.sign_in_failure') do |_, data|
      count = Event.where(
        event_name: 'auth.sign_in_failure',
        created_at: 5.minutes.ago..Time.current
      ).where("data->>'email' = ?", data[:email]).count

      if count >= 5
        SecurityAlert.trigger!(
          type: 'brute_force_attempt',
          email: data[:email],
          ip_address: data[:ip_address]
        )
      end
    end

    # Alert on high error rates
    Rails.application.events.subscribe('request.error') do
      recent_errors = Event.where(
        event_name: 'request.error',
        created_at: 1.minute.ago..Time.current
      ).count

      if recent_errors > 50
        IncidentAlert.create!(
          severity: 'critical',
          title: 'High Error Rate Detected',
          description: "#{recent_errors} errors in last minute"
        )
      end
    end
  end
end
```

---

## ⚠️ Common Pitfalls

### 1. Event Volume Management
**Problem:** Too many events overwhelm storage

**Solution:**
```ruby
# Implement sampling for high-volume events
class EventSampler
  def self.sample(event_name, data, sample_rate: 0.1)
    return unless rand < sample_rate

    Rails.application.events.publish(event_name, data)
  end
end

# Use for high-volume events
EventSampler.sample(
  'request.completed',
  controller: 'api/v1/posts',
  duration: 45,
  sample_rate: 0.1 # 10% sampling
)
```

### 2. Synchronous Publishing
**Problem:** Event publishing slows down requests

**Solution:**
```ruby
# Use async publishing for non-critical events
Rails.application.events.publish_async(
  'analytics.page_view',
  page: request.path,
  user_id: current_user&.id
)

# Or use background jobs
class EventPublisher < ApplicationJob
  def perform(event_name, data)
    Rails.application.events.publish(event_name, data)
  end
end

# Publish later
EventPublisher.perform_later('order.shipped', order_id: order.id)
```

### 3. Schema Evolution
**Problem:** Event schema changes break queries

**Solution:**
```ruby
# Version your events
class Event < ApplicationRecord
  def self.publish(name, data, version: 1)
    create!(
      event_name: name,
      schema_version: version,
      data: data
    )
  end
end

# Handle multiple versions
class EventProcessor
  def process(event)
    case event.schema_version
    when 1
      process_v1(event)
    when 2
      process_v2(event)
    else
      raise "Unknown schema version: #{event.schema_version}"
    end
  end
end
```

---

## 📚 Related Features

- **Active Support Instrumentation** - Low-level event system
- **Active Job Continuations** - Track job progress events
- **Action Cable** - Broadcast events to clients
- **Rails Logging** - Traditional log integration

---

## 🎓 Learn More

### Official Documentation
- [Structured Event Reporting Guide](https://edgeguides.rubyonrails.org/structured_event_reporting.html)
- [Active Support Instrumentation](https://guides.rubyonrails.org/active_support_instrumentation.html)

### Community Resources
- [Event-Driven Rails Applications](https://discuss.rubyonrails.org)
- [Observability Best Practices](https://blog.corsego.com)

---

**Part of Rails 8.1 Upgrade Documentation Suite**
**Prepared By:** Richard Piacentini with AI Analysis
**LinkedIn:** https://linkedin.com/in/richardpiacentini/
