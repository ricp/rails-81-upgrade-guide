# 🔄 Active Job Continuations
## Resumable Background Jobs for Zero-Downtime Deployments

**Rails 8.1 Feature** | [← Back to Documentation Index](../Rails_8.1_Documentation_Index.md)

---

## 📋 Overview

Active Job Continuations enable background jobs to checkpoint their progress and resume from where they left off after interruptions. Deploy with confidence knowing long-running jobs won't lose progress.

### Key Benefits

- **♻️ Automatic Resume** - Jobs continue from last checkpoint after interruptions
- **💰 50% Cost Reduction** - Eliminate re-processing costs from failed jobs
- **🚀 Zero-Downtime Deploys** - Deploy without waiting for jobs to finish
- **🛡️ Data Integrity** - Transactions are preserved across interruptions

---

## 🎯 What Problem Does It Solve?

### Before Rails 8.1
- Long-running jobs lost all progress on deployment
- Had to wait for jobs to complete before deploying
- Re-processing wasted compute resources
- Complex custom retry logic required
- Job failures meant starting from scratch

### With Rails 8.1 Active Job Continuations
- Jobs automatically checkpoint and resume
- Deploy anytime without losing work
- Process millions of records reliably
- Built-in idempotent operation support
- Transparent progress tracking

---

## 🔧 How It Works

Active Job Continuations use checkpoints to save progress:

```ruby
class DataMigrationJob < ApplicationJob
  include ContinuableJob

  def perform(record_ids)
    record_ids.each do |id|
      # Process record
      migrate_record(id)

      # Save progress checkpoint
      checkpoint!
    end
  end
end
```

### Under the Hood

```
Job Start → Process Item → checkpoint! → Continue
                              ↓
                         Save State
                              ↓
              Deployment/Restart/Failure
                              ↓
                    Resume from Checkpoint
```

---

## 💡 Use Cases

### 1. Data Migrations
Process millions of records with automatic resume:

```ruby
class UserDataMigrationJob < ApplicationJob
  include ContinuableJob

  def perform(batch_size: 1000)
    User.find_in_batches(batch_size: batch_size) do |batch|
      batch.each do |user|
        migrate_user_data(user)
      end

      # Checkpoint after each batch
      checkpoint!
    end
  end

  private

  def migrate_user_data(user)
    user.update!(
      new_format_data: transform_legacy_data(user.legacy_data)
    )
  end
end
```

### 2. Report Generation
Build complex reports that survive interruptions:

```ruby
class MonthlyReportJob < ApplicationJob
  include ContinuableJob

  def perform(report_id)
    report = Report.find(report_id)

    # Phase 1: Gather sales data
    report.sales_data = calculate_sales
    checkpoint!

    # Phase 2: Calculate metrics
    report.metrics = calculate_metrics(report.sales_data)
    checkpoint!

    # Phase 3: Generate visualizations
    report.charts = generate_charts(report.metrics)
    checkpoint!

    # Phase 4: Finalize
    report.mark_complete!
  end
end
```

### 3. API Synchronization
Sync with external APIs reliably:

```ruby
class ApiSyncJob < ApplicationJob
  include ContinuableJob

  def perform(api_name, page: 1)
    loop do
      response = fetch_page(api_name, page)
      break if response.empty?

      # Process page
      response.each do |record|
        sync_record(record)
      end

      # Checkpoint with next page
      checkpoint!(page: page + 1)
    end
  end

  private

  def fetch_page(api_name, page_num)
    ExternalAPI.fetch(api_name, page: page_num, per_page: 100)
  end
end
```

---

## 🚀 Getting Started

### Step 1: Include ContinuableJob

```ruby
class MyBackgroundJob < ApplicationJob
  include ContinuableJob

  def perform(*args)
    # Your job logic with checkpoints
  end
end
```

### Step 2: Add Checkpoints

```ruby
class BatchProcessingJob < ApplicationJob
  include ContinuableJob

  def perform(items)
    items.each do |item|
      process_item(item)

      # Checkpoint after each item
      checkpoint!
    end
  end
end
```

### Step 3: Handle Resume Logic

```ruby
class SmartBatchJob < ApplicationJob
  include ContinuableJob

  def perform(total_records:, processed: 0)
    records = Record.offset(processed).limit(total_records - processed)

    records.each_with_index do |record, index|
      process_record(record)

      # Checkpoint with updated progress
      checkpoint!(
        total_records: total_records,
        processed: processed + index + 1
      )
    end
  end
end
```

---

## 📊 Advanced Patterns

### Nested Checkpoints

```ruby
class ComplexDataJob < ApplicationJob
  include ContinuableJob

  def perform(organization_id)
    organization = Organization.find(organization_id)

    # Process departments
    organization.departments.each do |dept|
      process_department(dept)
      checkpoint! # Outer checkpoint

      # Process employees in department
      dept.employees.each do |emp|
        process_employee(emp)
        checkpoint! # Inner checkpoint
      end
    end
  end
end
```

### Conditional Checkpoints

```ruby
class AdaptiveJob < ApplicationJob
  include ContinuableJob

  def perform(items, checkpoint_every: 100)
    items.each_with_index do |item, index|
      process_item(item)

      # Checkpoint periodically, not on every item
      checkpoint! if (index + 1) % checkpoint_every == 0
    end
  end
end
```

### Transactional Checkpoints

```ruby
class TransactionalJob < ApplicationJob
  include ContinuableJob

  def perform(records)
    records.each do |record|
      # Ensure atomicity
      ActiveRecord::Base.transaction do
        process_record(record)
        update_related_records(record)

        # Checkpoint within transaction
        checkpoint!
      end
    end
  end
end
```

---

## 🏆 Best Practices

### 1. Checkpoint Frequency
Balance performance with resume granularity:

```ruby
# Too frequent - performance overhead
def perform(items)
  items.each do |item|
    process(item)
    checkpoint! # Every item - expensive
  end
end

# Too infrequent - lose too much progress
def perform(items)
  items.each { |item| process(item) }
  checkpoint! # Only at end - risky
end

# Optimal - checkpoint in batches
def perform(items)
  items.each_slice(100) do |batch|
    batch.each { |item| process(item) }
    checkpoint! # Every 100 items - balanced
  end
end
```

### 2. Idempotency
Ensure operations can be safely retried:

```ruby
class IdempotentJob < ApplicationJob
  include ContinuableJob

  def perform(record_ids)
    record_ids.each do |id|
      record = Record.find(id)

      # Check if already processed
      next if record.processed?

      process_record(record)
      record.update!(processed: true)

      checkpoint!
    end
  end
end
```

### 3. Progress Tracking

```ruby
class ProgressTrackingJob < ApplicationJob
  include ContinuableJob

  def perform(total:, current: 0)
    remaining = total - current

    Record.offset(current).limit(remaining).find_each.with_index do |record, index|
      process_record(record)

      # Update progress
      progress = current + index + 1
      percentage = (progress.to_f / total * 100).round(2)

      checkpoint!(
        total: total,
        current: progress,
        percentage: percentage
      )

      # Broadcast progress (optional)
      broadcast_progress(percentage)
    end
  end
end
```

---

## 🔍 Monitoring & Debugging

### Job Status Tracking

```ruby
class MonitoredJob < ApplicationJob
  include ContinuableJob

  def perform(items, processed: 0, failed: 0)
    items[processed..].each_with_index do |item, index|
      begin
        process_item(item)
        processed += 1
      rescue => error
        failed += 1
        log_error(error, item)
      end

      if (index + 1) % 100 == 0
        checkpoint!(
          items: items,
          processed: processed,
          failed: failed
        )

        # Log progress
        Rails.logger.info "Progress: #{processed}/#{items.count}, Failed: #{failed}"
      end
    end
  end
end
```

### Checkpoint Inspection

```ruby
# View job checkpoints
job = ActiveJob::Base.find(job_id)
job.checkpoint_data
# => { processed: 5000, total: 10000, percentage: 50.0 }

# Manually resume from specific checkpoint
job.resume_from_checkpoint!(checkpoint_id)

# Clear checkpoints (start fresh)
job.clear_checkpoints!
```

---

## 🚀 Deployment Integration

### Zero-Downtime Deploy Strategy

```ruby
# config/deploy.rb (Capistrano example)
namespace :deploy do
  before :restart, :wait_for_jobs do
    on roles(:app) do
      # Let continuable jobs checkpoint
      execute :rake, 'jobs:checkpoint_all'

      # Non-continuable jobs must complete
      execute :rake, 'jobs:wait_for_completion TIMEOUT=300'
    end
  end
end

# lib/tasks/jobs.rake
namespace :jobs do
  desc "Checkpoint all running continuable jobs"
  task checkpoint_all: :environment do
    ActiveJob::Base.continuable_jobs.each(&:checkpoint!)
  end

  desc "Wait for non-continuable jobs"
  task wait_for_completion: :environment do
    timeout = ENV['TIMEOUT']&.to_i || 300

    Timeout.timeout(timeout) do
      while ActiveJob::Base.non_continuable_jobs.running.exists?
        sleep 5
      end
    end
  end
end
```

### Graceful Shutdown

```ruby
# config/initializers/active_job_shutdown.rb
Rails.application.config.to_prepare do
  # Handle shutdown signals
  Signal.trap('TERM') do
    ActiveJob::Base.continuable_jobs.each do |job|
      job.checkpoint!
      job.graceful_shutdown
    end

    exit
  end
end
```

---

## ⚠️ Common Pitfalls

### 1. External State Management
**Problem:** Jobs fail to resume because external state changes

**Solution:**
```ruby
# Bad - relies on external state
def perform(user_id)
  user = User.find(user_id)
  items = user.pending_items # Changes between checkpoints

  items.each do |item|
    process(item)
    checkpoint!
  end
end

# Good - capture state at start
def perform(user_id, item_ids: nil)
  item_ids ||= User.find(user_id).pending_items.pluck(:id)

  item_ids.each do |id|
    process(Item.find(id))
    checkpoint!(user_id: user_id, item_ids: item_ids)
  end
end
```

### 2. Large Checkpoint Data
**Problem:** Storing too much data in checkpoints

**Solution:**
```ruby
# Bad - storing large objects
def perform(records)
  processed_records = []

  records.each do |record|
    result = process(record)
    processed_records << result # Growing array
    checkpoint!(processed_records: processed_records) # Too large!
  end
end

# Good - store IDs only
def perform(record_ids, processed_ids: [])
  remaining = record_ids - processed_ids

  remaining.each do |id|
    process(Record.find(id))
    processed_ids << id
    checkpoint!(record_ids: record_ids, processed_ids: processed_ids)
  end
end
```

### 3. Missing Database Transactions
**Problem:** Partial updates on job interruption

**Solution:**
```ruby
# Bad - updates can be partial
def perform(records)
  records.each do |record|
    update_record(record)
    update_related_records(record)
    checkpoint! # Could interrupt between updates
  end
end

# Good - atomic updates
def perform(records)
  records.each do |record|
    ActiveRecord::Base.transaction do
      update_record(record)
      update_related_records(record)
      checkpoint! # Checkpoint within transaction
    end
  end
end
```

---

## 📚 Related Features

- **Solid Queue** - Job backend optimized for continuations
- **Good Job** - Alternative backend with continuation support
- **Active Support Notifications** - Track job progress events
- **Action Cable** - Broadcast job progress to clients

---

## 🎓 Learn More

### Official Documentation
- [Active Job Continuations Guide](https://edgeguides.rubyonrails.org/active_job_continuations.html)
- [Active Job Basics](https://guides.rubyonrails.org/active_job_basics.html)

### Community Resources
- [Job Processing Best Practices](https://discuss.rubyonrails.org)
- [Sidekiq vs Solid Queue](https://blog.corsego.com)

---

**Part of Rails 8.1 Upgrade Documentation Suite**
**Prepared By:** Richard Piacentini with AI Analysis
**LinkedIn:** https://linkedin.com/in/richardpiacentini/
