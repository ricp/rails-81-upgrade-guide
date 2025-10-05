# 📱 Action Push Native
## Official iOS/Android Push Notifications for Rails

**Rails 8.1 Feature** | [← Back to Documentation Index](../Rails_8.1_Documentation_Index.md)

---

## 📋 Overview

Action Push Native brings first-class push notification support to Rails, providing direct integration with Apple Push Notification Service (APNs) and Firebase Cloud Messaging (FCM). No third-party services required.

### Key Benefits

- **💰 Zero Third-Party Fees** - Direct APNs/FCM integration eliminates subscription costs
- **📊 Production Proven** - 10M+ notifications/day at 37signals
- **🔒 Full Control** - Own your notification infrastructure
- **⚡ High Performance** - Optimized delivery with built-in retry logic

---

## 🎯 What Problem Does It Solve?

### Before Rails 8.1
- Third-party services (OneSignal, Pusher, etc.) required
- Monthly subscription fees scale with usage
- Complex API integrations
- Limited control over delivery
- Data privacy concerns with external services

### With Rails 8.1 Action Push Native
- Direct APNs/FCM integration built into Rails
- No monthly subscription fees
- Simple Rails API
- Full delivery control and monitoring
- Data stays in your infrastructure

---

## 🔧 How It Works

Action Push Native provides a unified interface for both iOS (APNs) and Android (FCM):

```ruby
# Send push notification
ActionPushNative.send(
  to: user.device_tokens,
  title: "New Message",
  body: "You have a new message from #{sender.name}",
  data: {
    url: message_path(message),
    sender_id: sender.id
  }
)
```

### Architecture

```
Rails App → Action Push Native → APNs (iOS)
                                → FCM (Android)
```

---

## 💡 Use Cases

### 1. User Engagement
Send timely notifications to increase app engagement:

```ruby
class MessageNotificationJob < ApplicationJob
  def perform(message)
    recipient = message.recipient

    ActionPushNative.send(
      to: recipient.devices,
      title: "#{message.sender.name} sent you a message",
      body: message.preview,
      badge: recipient.unread_messages_count,
      sound: "default",
      data: {
        type: "new_message",
        message_id: message.id,
        url: message_path(message)
      }
    )
  end
end
```

### 2. Transactional Alerts
Critical user notifications:

```ruby
class OrderShippedNotifier
  def notify(order)
    ActionPushNative.send(
      to: order.user.devices,
      title: "Order Shipped! 📦",
      body: "Your order ##{order.number} is on its way",
      data: {
        type: "order_update",
        order_id: order.id,
        tracking_url: order.tracking_url
      },
      priority: :high
    )
  end
end
```

### 3. Background Updates
Silent notifications for data sync:

```ruby
# Silent notification (no alert)
ActionPushNative.send(
  to: user.devices,
  content_available: true, # iOS background fetch
  data: {
    type: "sync",
    sync_timestamp: Time.current.to_i
  },
  priority: :normal
)
```

---

## 🚀 Getting Started

### Step 1: Install and Configure

```ruby
# Gemfile
gem 'action-push-native'

# config/initializers/action_push_native.rb
ActionPushNative.configure do |config|
  # iOS APNs Configuration
  config.apns_key_id = ENV['APNS_KEY_ID']
  config.apns_team_id = ENV['APNS_TEAM_ID']
  config.apns_key = ENV['APNS_PRIVATE_KEY']
  config.apns_environment = Rails.env.production? ? :production : :sandbox

  # Android FCM Configuration
  config.fcm_server_key = ENV['FCM_SERVER_KEY']
  config.fcm_project_id = ENV['FCM_PROJECT_ID']

  # Delivery Options
  config.retry_attempts = 3
  config.timeout = 5.seconds
end
```

### Step 2: Set Up Device Registration

```ruby
# app/models/device.rb
class Device < ApplicationRecord
  belongs_to :user

  enum platform: { ios: 0, android: 1 }

  validates :token, presence: true, uniqueness: true
  validates :platform, presence: true
end

# app/controllers/api/devices_controller.rb
class Api::DevicesController < ApplicationController
  def create
    device = current_user.devices.find_or_initialize_by(
      token: params[:token]
    )

    device.update!(
      platform: params[:platform],
      app_version: params[:app_version],
      os_version: params[:os_version]
    )

    render json: device
  end

  def destroy
    current_user.devices.find_by(token: params[:token])&.destroy
    head :no_content
  end
end
```

### Step 3: Send Notifications

```ruby
# Simple notification
ActionPushNative.send(
  to: user.devices.pluck(:token),
  title: "Hello!",
  body: "Your notification message"
)

# Advanced notification with all options
ActionPushNative.send(
  to: user.devices.ios.pluck(:token),
  title: "New Message",
  body: "You have a new message",
  badge: 5,
  sound: "message.mp3",
  category: "MESSAGE_CATEGORY",
  thread_id: "chat_123",
  data: {
    message_id: 456,
    sender_name: "John"
  },
  mutable_content: true, # For notification extensions
  expiration: 1.day.from_now
)
```

---

## 📊 Configuration Options

### iOS-Specific Options

```ruby
ActionPushNative.send(
  to: ios_tokens,
  title: "iOS Notification",
  body: "Message body",

  # iOS-specific
  badge: 1,              # App icon badge count
  sound: "default",      # Sound file or "default"
  category: "CHAT",      # Notification category
  thread_id: "chat_1",   # Group related notifications
  collapse_id: "promo",  # Replace previous with same ID
  mutable_content: true, # Enable notification extensions
  content_available: true, # Background updates

  # Advanced iOS
  interruption_level: :active, # :passive, :active, :time_sensitive, :critical
  relevance_score: 0.8,        # For notification summary
  target_content_id: "msg_123" # Deep link identifier
)
```

### Android-Specific Options

```ruby
ActionPushNative.send(
  to: android_tokens,
  title: "Android Notification",
  body: "Message body",

  # Android-specific
  icon: "ic_notification",    # Notification icon
  color: "#FF5722",           # Notification color
  channel_id: "messages",     # Notification channel
  tag: "update_1",            # Replace with same tag
  click_action: "OPEN_CHAT",  # Activity to open
  ttl: 3600,                  # Time to live (seconds)

  # Advanced Android
  priority: :high,            # :min, :low, :default, :high, :max
  notification_count: 5,      # Badge count
  visibility: :public,        # :public, :private, :secret
  image: "https://example.com/image.jpg" # Large image
)
```

### Delivery Options

```ruby
ActionPushNative.configure do |config|
  # Retry logic
  config.retry_attempts = 3
  config.retry_delay = 1.second
  config.retry_multiplier = 2

  # Timeout
  config.timeout = 5.seconds

  # Batching
  config.batch_size = 1000
  config.batch_interval = 1.second

  # Logging
  config.logger = Rails.logger
  config.log_level = :info
end
```

---

## 🏆 Best Practices

### 1. Device Management
Keep device tokens fresh and remove invalid ones:

```ruby
class DeviceCleanupJob < ApplicationJob
  def perform
    # Remove devices with failed deliveries
    Device.where('last_failed_at < ?', 30.days.ago).destroy_all

    # Update last_used timestamp on successful delivery
    ActionPushNative.on_success do |device_token|
      Device.find_by(token: device_token)
        &.touch(:last_used_at)
    end

    # Remove token on permanent failure
    ActionPushNative.on_permanent_failure do |device_token|
      Device.find_by(token: device_token)&.destroy
    end
  end
end
```

### 2. Rate Limiting
Respect user preferences and platform limits:

```ruby
class NotificationRateLimiter
  def self.can_send?(user, notification_type)
    # Check user preferences
    return false unless user.notification_preferences[notification_type]

    # Rate limit by type
    cache_key = "notifications:#{user.id}:#{notification_type}"
    count = Rails.cache.read(cache_key) || 0

    return false if count >= limit_for(notification_type)

    Rails.cache.increment(cache_key, 1, expires_in: 1.hour)
    true
  end

  def self.limit_for(type)
    {
      promotional: 3,      # Max 3 per hour
      transactional: 20,   # Max 20 per hour
      urgent: 100          # Max 100 per hour
    }[type] || 10
  end
end
```

### 3. Testing Strategy

```ruby
# spec/support/action_push_native_helpers.rb
RSpec.configure do |config|
  config.before(:each) do
    # Mock in tests
    allow(ActionPushNative).to receive(:send).and_return(true)
  end
end

# spec/jobs/notification_job_spec.rb
RSpec.describe NotificationJob do
  it "sends push notification with correct data" do
    user = create(:user)
    message = create(:message)

    expect(ActionPushNative).to receive(:send).with(
      hash_including(
        to: user.devices.pluck(:token),
        title: "New Message",
        data: { message_id: message.id }
      )
    )

    NotificationJob.perform_now(message)
  end
end
```

---

## 📱 Platform-Specific Implementation

### iOS Setup

```ruby
# 1. Generate APNs Auth Key in Apple Developer Portal
# 2. Download .p8 key file
# 3. Store credentials securely

# config/credentials/production.yml.enc
apns:
  key_id: ABC123
  team_id: DEF456
  key: |
    -----BEGIN PRIVATE KEY-----
    MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
    -----END PRIVATE KEY-----

# iOS App Configuration
# Enable Push Notifications capability
# Register for remote notifications:

// AppDelegate.swift
func application(_ application: UIApplication,
                didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

    UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, error in
        if granted {
            DispatchQueue.main.async {
                application.registerForRemoteNotifications()
            }
        }
    }
    return true
}

func application(_ application: UIApplication,
                didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()

    // Send to Rails backend
    APIClient.shared.registerDevice(token: token, platform: "ios")
}
```

### Android Setup

```ruby
# 1. Create Firebase project
# 2. Download google-services.json
# 3. Get Server Key from Firebase Console

# config/credentials/production.yml.enc
fcm:
  server_key: AAAAxxxxxxx...
  project_id: your-project-id

# Android App Configuration
# Add Firebase SDK

// MainActivity.kt
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Request notification permission (Android 13+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 0)
        }

        // Get FCM token
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val token = task.result
                // Send to Rails backend
                APIClient.registerDevice(token, "android")
            }
        }
    }
}
```

---

## 🔗 Advanced Features

### Rich Notifications (iOS)

```ruby
# Enable media attachments
ActionPushNative.send(
  to: ios_tokens,
  title: "New Photo",
  body: "John shared a photo",
  mutable_content: true,
  data: {
    media_url: "https://example.com/photo.jpg",
    media_type: "image"
  }
)

// iOS Notification Service Extension
class NotificationService: UNNotificationServiceExtension {
    override func didReceive(_ request: UNNotificationRequest,
                            withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        guard let attachment = UNNotificationAttachment.create(from: request) else {
            return contentHandler(request.content)
        }

        let content = request.content.mutableCopy() as! UNMutableNotificationContent
        content.attachments = [attachment]
        contentHandler(content)
    }
}
```

### Notification Actions

```ruby
# Define interactive actions
ActionPushNative.send(
  to: user.devices,
  title: "Friend Request",
  body: "John wants to connect",
  category: "FRIEND_REQUEST", # Must match app definition
  data: {
    request_id: 123,
    action_url: "/friend_requests/123"
  }
)

# Handle action responses
class NotificationActionsController < ApplicationController
  def accept
    request = FriendRequest.find(params[:id])
    request.accept!
    head :ok
  end

  def decline
    request = FriendRequest.find(params[:id])
    request.decline!
    head :ok
  end
end
```

---

## ⚠️ Common Pitfalls

### 1. Token Management
**Problem:** Stale device tokens cause delivery failures

**Solution:**
```ruby
# Monitor and clean up failed tokens
ActionPushNative.on_permanent_failure do |token, error|
  Rails.logger.warn "Removing invalid token: #{token} - #{error}"
  Device.find_by(token: token)&.destroy
end

# Refresh tokens periodically
class DeviceTokenRefreshJob < ApplicationJob
  def perform
    Device.find_each do |device|
      # Verify token is still valid
      result = ActionPushNative.verify_token(device.token)
      device.destroy unless result.valid?
    end
  end
end
```

### 2. Certificate Expiration
**Problem:** APNs certificates expire, causing production failures

**Solution:**
```ruby
# Monitor certificate expiration
class CertificateExpirationCheck < ApplicationJob
  def perform
    cert_expiry = ActionPushNative::APNS.certificate_expiration

    if cert_expiry < 30.days.from_now
      AdminMailer.certificate_expiring(cert_expiry).deliver_now
    end
  end
end
```

### 3. Notification Overload
**Problem:** Too many notifications lead to user opt-out

**Solution:**
```ruby
# Implement smart batching
class NotificationBatcher
  def self.batch(user, notifications)
    return if notifications.empty?

    if notifications.count > 5
      # Send summary instead of individual
      ActionPushNative.send(
        to: user.devices,
        title: "#{notifications.count} new updates",
        body: "You have multiple unread notifications",
        data: { notification_ids: notifications.pluck(:id) }
      )
    else
      # Send individual notifications
      notifications.each do |notification|
        ActionPushNative.send(
          to: user.devices,
          title: notification.title,
          body: notification.body
        )
      end
    end
  end
end
```

---

## 📚 Related Features

- **Native Mobile Framework** - Mobile app wrapper for push notification display
- **Active Job Continuations** - Reliable background processing for notification delivery
- **Action Cable** - Real-time updates complementing push notifications
- **Active Support Notifications** - Application event tracking for notification triggers

---

## 🎓 Learn More

### Official Documentation
- [Action Push Native Guide](https://edgeguides.rubyonrails.org/action_push_native.html)
- [APNs Documentation](https://developer.apple.com/documentation/usernotifications)
- [FCM Documentation](https://firebase.google.com/docs/cloud-messaging)

### Community Resources
- [Push Notification Best Practices](https://discuss.rubyonrails.org)
- [Rails Mobile Notifications Guide](https://guides.rubyonrails.org)

---

**Part of Rails 8.1 Upgrade Documentation Suite**
**Prepared By:** Richard Piacentini with AI Analysis
**LinkedIn:** https://linkedin.com/in/richardpiacentini/
