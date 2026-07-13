import { sites } from "./sites";
import "./App.css";

// Linhas de metrô estilizadas ao fundo (decorativo)
function BgMap() {
  return (
    <div className="bg-map" aria-hidden="true">
      <svg
        viewBox="0 0 390 844"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M -20 150 H 210 Q 234 150 234 174 V 420 Q 234 444 258 444 H 410"
            stroke="#ed4a5e"
            opacity="0.13"
          />
          <path
            d="M 410 70 H 120 Q 96 70 96 94 V 560 Q 96 584 72 584 H -20"
            stroke="#4c86f5"
            opacity="0.12"
          />
          <path
            d="M 40 -20 V 280 Q 40 304 64 304 H 300 Q 324 304 324 328 V 864"
            stroke="#43c98a"
            opacity="0.11"
          />
          <path
            d="M -20 700 H 180 L 300 820 H 410"
            stroke="#f6c445"
            opacity="0.12"
          />
        </g>
        <g strokeWidth="3">
          <circle cx="234" cy="300" r="6" fill="#0d1422" stroke="#ed4a5e" opacity="0.45" />
          <circle cx="96" cy="200" r="6" fill="#0d1422" stroke="#4c86f5" opacity="0.4" />
          <circle cx="180" cy="304" r="6" fill="#0d1422" stroke="#43c98a" opacity="0.4" />
          <circle cx="180" cy="700" r="6" fill="#0d1422" stroke="#f6c445" opacity="0.4" />
          {/* estação de integração: as linhas se cruzam */}
          <circle cx="310" cy="70" r="8" fill="#0d1422" stroke="#f4f7fb" opacity="0.35" />
        </g>
      </svg>
    </div>
  );
}

function App() {
  return (
    <main className="hub">
      <BgMap />
      <header className="hub-header">
        <h1>Hub</h1>
        <p>Escolha um destino</p>
      </header>
      <ul className="site-list">
        {sites.map((site) => (
          <li key={site.url} className="site-item">
            <a className="site-card" href={site.url}>
              <div className="site-cover-wrapper">
                <img
                  className="site-cover"
                  src={`/${site.slug}.jpg`}
                  alt=""
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
                {site.icon && (
                  <div className="site-icon-wrapper">
                    <div className="site-icon">{site.icon}</div>
                  </div>
                )}
              </div>
              <span className="site-title">{site.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;
