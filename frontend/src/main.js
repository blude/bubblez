import './style.css'
import './components/droplets/DropletCreation.js'
import './components/feed/FeedDisplay.js'
import './components/bubbles/BubbleDiscovery.js'

// University Social Network App
const app = document.getElementById('app')

if (app) {
  app.innerHTML = `
    <header class="header">
      <h1>🎓 University Social Network</h1>
      <p>Connecting students, professors, and staff in decentralized academic communities</p>
    </header>

    <main class="main-content">
      <section class="create-section">
        <droplet-creation id="dropletCreator"></droplet-creation>
      </section>
      
      <section class="bubble-section">
        <bubble-discovery id="bubbleDiscovery"></bubble-discovery>
      </section>
      
      <section class="feed-section">
        <feed-display id="feedDisplay"></feed-display>
      </section>
    </main>

    <footer class="footer">
      <p>© 2025 University Social Network. Built with ❤️ for academic communities.</p>
    </footer>
  `

  // Setup component event listeners
  const dropletCreator = document.getElementById('dropletCreator')
  const bubbleDiscovery = document.getElementById('bubbleDiscovery')
  const feedDisplay = document.getElementById('feedDisplay')

  if (dropletCreator) {
    dropletCreator.addEventListener('droplet-created', (event) => {
      console.log('New droplet created:', event.detail.droplet)
      // Feed display will handle real-time updates
    })
  }

  if (bubbleDiscovery) {
    bubbleDiscovery.addEventListener('bubble:joined', (event) => {
      console.log('Bubble joined:', event.detail)
      // Refresh feed when user joins new bubble
      if (feedDisplay && feedDisplay.refreshFeed) {
        feedDisplay.refreshFeed()
      }
    })
  }

  // Add some basic app styles
  const style = document.createElement('style')
  style.textContent = `
    .create-section, .bubble-section, .feed-section {
      margin-bottom: 30px;
    }
    
    @media (max-width: 768px) {
      .create-section, .bubble-section, .feed-section {
        margin: 15px;
      }
    }
    
    @media (min-width: 1024px) {
      .main-content {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 30px;
      }
      
      .create-section {
        grid-column: 1;
      }
      
      .bubble-section {
        grid-column: 2;
        grid-row: 1;
      }
      
      .feed-section {
        grid-column: 1 / -1;
        grid-row: 2;
      }
    }
  `
  document.head.appendChild(style)
}