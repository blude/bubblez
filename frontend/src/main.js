import './style.css'

// Simple vanilla JS app
const app = document.getElementById('app')

if (app) {
  app.innerHTML = `
      <div class="status">
        <h2>🚀 Application Ready</h2>
        <p>The University Social Network is now running!</p>
        <p>Frontend loaded successfully with vanilla JavaScript</p>
      </div>
    </main>
  `
}