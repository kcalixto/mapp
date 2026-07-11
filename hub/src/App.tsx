import { sites } from './sites'
import './App.css'

function App() {
  return (
    <main className="hub">
      <header className="hub-header">
        <h1>Hub</h1>
        <p>Escolha um serviço</p>
      </header>
      <ul className="site-list">
        {sites.map(site => (
          <li key={site.slug}>
            <a className="site-card" href={site.url}>
              <img
                className="site-cover"
                src={`/${site.slug}.jpg`}
                alt=""
                loading="lazy"
                onError={event => {
                  event.currentTarget.style.display = 'none'
                }}
              />
              <span className="site-title">{site.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}

export default App
