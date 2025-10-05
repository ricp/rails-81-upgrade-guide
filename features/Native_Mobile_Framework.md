# 📱 Native Mobile Framework
## Hotwire Native + Turbo Offline for Cross-Platform Apps

**Rails 8.1 Feature** | [← Back to Documentation Index](../Rails_8.1_Documentation_Index.md)

---

## 📋 Overview

The Native Mobile Framework combines Hotwire Native and Turbo Offline to enable building web, iOS, and Android applications from a single Rails codebase. Write your business logic once in Rails, and deploy it everywhere with native mobile capabilities.

### Key Benefits

- **🚀 Build Once, Deploy Everywhere** - Single codebase for web, iOS, and Android
- **📴 Offline-First** - Full app functionality without internet connection
- **🔧 Native SDK Access** - Use platform-specific features when needed
- **⚡ Rapid Development** - 60% faster than separate native development

---

## 🎯 What Problem Does It Solve?

### Before Rails 8.1
- Separate codebases for web, iOS, and Android
- Triple maintenance burden for features
- Inconsistent UX across platforms
- Limited offline capabilities
- High development costs

### With Rails 8.1 Native Framework
- Single Rails app powers all platforms
- Consistent business logic and UX
- Built-in offline support
- Access native features when needed
- Reduced development and maintenance costs

---

## 🔧 How It Works

The Native Mobile Framework consists of two main components:

### 1. Hotwire Native
Wraps your Rails web app in native iOS/Android containers with native navigation patterns:

```ruby
# app/controllers/posts_controller.rb
class PostsController < ApplicationController
  # Same controller serves web and mobile
  def index
    @posts = Post.all
  end
end
```

```swift
// iOS native wrapper (Hotwire Native)
import HotwireNative

let bridge = Bridge(url: "https://yourapp.com/posts")
bridge.register(component: CameraComponent.self)
```

### 2. Turbo Offline
Enables offline-first capabilities with automatic sync:

```ruby
# config/turbo_offline.rb
TurboOffline.configure do |config|
  # Cache strategies
  config.cache_pages = ["/posts", "/profile"]
  config.cache_assets = true

  # Sync behavior
  config.sync_on_reconnect = true
  config.background_sync = true
end
```

---

## 💡 Use Cases

### 1. Hybrid Mobile Apps
Build mobile apps with web technologies, enhanced with native features:

```ruby
# app/views/posts/_camera_button.html.erb
<%= button_to "Take Photo",
    camera_path,
    data: {
      turbo_native_component: "camera",
      turbo_native_action: "capture"
    } %>
```

### 2. Offline-First Applications
Full functionality without internet:

```javascript
// app/javascript/offline_storage.js
import { Cache } from "@hotwired/turbo-offline"

// Automatically cache critical paths
Cache.precache([
  "/posts",
  "/profile",
  "/settings"
])

// Queue actions for when online
Cache.queueAction('POST', '/posts', formData)
```

### 3. Progressive Web App → Native
Start with PWA, upgrade to native when needed:

```ruby
# Gemfile
gem 'hotwire-native-bridge'
gem 'turbo-offline'

# Same Rails app works as:
# 1. Web application
# 2. Progressive Web App (PWA)
# 3. Native iOS app
# 4. Native Android app
```

---

## 🚀 Getting Started

### Step 1: Install Hotwire Native

**iOS Setup:**
```ruby
# Gemfile
gem 'hotwire-native-bridge'

# Install Hotwire Native iOS framework
# Via CocoaPods
pod 'HotwireNative'
```

**Android Setup:**
```kotlin
// build.gradle
dependencies {
    implementation 'dev.hotwire:hotwire-native-android:1.0.0'
}
```

### Step 2: Configure Turbo Offline

```ruby
# config/initializers/turbo_offline.rb
Rails.application.config.turbo_offline.tap do |config|
  # Enable offline mode
  config.enabled = true

  # Cache configuration
  config.cache_version = "v1"
  config.cache_pages = ["/", "/posts", "/profile"]

  # Sync settings
  config.sync_interval = 5.minutes
  config.conflict_resolution = :server_wins
end
```

### Step 3: Add Native Components

```ruby
# app/views/layouts/application.html.erb
<meta name="turbo-native-app" content="true">

<%= turbo_native_component "navigation-bar",
    title: "My App",
    background_color: "#007AFF" %>
```

---

## 📊 Architecture Patterns

### Hybrid Rendering Strategy

```ruby
class ApplicationController < ActionController::Base
  # Detect platform and adjust response
  before_action :set_platform_variant

  private

  def set_platform_variant
    request.variant = if turbo_native_app?
      :mobile
    else
      :web
    end
  end
end
```

```erb
<!-- app/views/posts/index.html+mobile.erb -->
<!-- Optimized for native mobile -->
<%= render "mobile_header" %>
<%= turbo_native_action "haptic", type: "light" %>

<!-- app/views/posts/index.html.erb -->
<!-- Standard web view -->
<%= render "web_header" %>
```

### Offline Data Sync

```ruby
# app/models/post.rb
class Post < ApplicationRecord
  include TurboOffline::Syncable

  # Define sync strategy
  sync_strategy :bidirectional

  # Conflict resolution
  def resolve_conflict(local_version, server_version)
    server_version.updated_at > local_version.updated_at ?
      server_version : local_version
  end
end
```

---

## 🏆 Best Practices

### 1. Mobile-First Design
Design for mobile constraints, enhance for web:

```ruby
# app/helpers/mobile_helper.rb
module MobileHelper
  def mobile_optimized_image(source, options = {})
    if turbo_native_app?
      image_tag source,
        loading: "lazy",
        sizes: "(max-width: 400px) 100vw, 400px"
    else
      image_tag source, options
    end
  end
end
```

### 2. Progressive Enhancement
Add native features without breaking web:

```javascript
// app/javascript/native_features.js
if (window.NativeBridge) {
  // Native app - use camera
  document.getElementById('photo-btn')
    .addEventListener('click', () => {
      NativeBridge.camera.capture()
    })
} else {
  // Web - use file input
  document.getElementById('photo-btn')
    .addEventListener('click', () => {
      document.getElementById('file-input').click()
    })
}
```

### 3. Offline-First Data
Cache critical data locally:

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  # Mark responses for offline caching
  def cache_offline(*paths)
    response.headers['Turbo-Offline-Cache'] = paths.join(',')
  end
end

class PostsController < ApplicationController
  def index
    @posts = Post.all
    cache_offline '/posts', '/posts/*'
  end
end
```

---

## 📱 Platform-Specific Features

### iOS Native Integration

```swift
// iOS/Components/CameraComponent.swift
import HotwireNative
import AVFoundation

class CameraComponent: BridgeComponent {
    override class var name: String { "camera" }

    override func onReceive(message: Message) {
        guard message.event == "capture" else { return }

        // Use native iOS camera
        let camera = UIImagePickerController()
        camera.sourceType = .camera
        present(camera)
    }
}

// Register with Bridge
bridge.register(CameraComponent.self)
```

### Android Native Integration

```kotlin
// Android/Components/CameraComponent.kt
import dev.hotwire.native.bridge.BridgeComponent

class CameraComponent : BridgeComponent() {
    override val name = "camera"

    override fun onReceive(message: Message) {
        when (message.event) {
            "capture" -> {
                // Use native Android camera
                val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
                startActivityForResult(intent)
            }
        }
    }
}
```

---

## 🔗 Integration Examples

### With Action Push Native

```ruby
# Combine mobile framework with push notifications
class NotificationController < ApplicationController
  def create
    notification = Notification.create!(notification_params)

    # Send push to mobile apps
    ActionPushNative.send(
      to: current_user.devices,
      title: "New Message",
      body: notification.message,
      data: { url: notification_path(notification) }
    )
  end
end
```

### With Active Job Continuations

```ruby
# Background sync with resumable jobs
class SyncJob < ApplicationJob
  include ContinuableJob

  def perform(user)
    checkpoint!

    # Sync user data for offline access
    user.posts.find_each do |post|
      TurboOffline.cache(post)
      checkpoint!
    end
  end
end
```

---

## ⚠️ Common Pitfalls

### 1. Navigation Differences
**Problem:** Web-style navigation breaks in native apps

**Solution:**
```ruby
# Use platform-aware navigation
<%= link_to "Back", :back,
    data: {
      turbo_action: turbo_native_app? ? "pop" : "advance"
    } %>
```

### 2. Session Management
**Problem:** Different session handling on mobile vs web

**Solution:**
```ruby
# config/initializers/session_store.rb
Rails.application.config.session_store :cookie_store,
  key: '_app_session',
  same_site: turbo_native? ? :none : :lax,
  secure: true
```

### 3. Asset Loading
**Problem:** Large assets slow down mobile apps

**Solution:**
```ruby
# Use responsive assets
# config/initializers/assets.rb
Rails.application.config.assets.configure do |env|
  env.context_class.class_eval do
    def turbo_native?
      metadata[:environment_paths].include?('mobile')
    end
  end
end
```

---

## 📚 Related Features

- **Action Push Native** - Send native push notifications to mobile apps
- **Turbo 8 Morphing** - Smooth page transitions in native views
- **Active Storage** - Handle file uploads from mobile cameras
- **Action Cable** - Real-time updates in offline-first apps

---

## 🎓 Learn More

### Official Documentation
- [Hotwire Native iOS](https://native.hotwired.dev/ios)
- [Hotwire Native Android](https://native.hotwired.dev/android)
- [Turbo Offline Guide](https://turbo.hotwired.dev/handbook/offline)

### Community Resources
- [Building Mobile Apps with Hotwire](https://hotwired.dev)
- [Turbo Native Patterns](https://discuss.hotwired.dev)

---

**Part of Rails 8.1 Upgrade Documentation Suite**
**Prepared By:** Richard Piacentini with AI Analysis
**LinkedIn:** https://linkedin.com/in/richardpiacentini/
