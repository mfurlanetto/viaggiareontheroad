import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  it: {
    translation: {
      nav: {
        destinations: "Destinazioni",
        stories: "Storie",
        guides: "Guide",
        about: "Chi sono",
      },
      hero: { readTime: "min di lettura" },
      section: { allTrips: "Tutti i viaggi" },
      filter: {
        continent: "Continente:",
        category: "Categoria:",
        all: "Tutti",
      },
      continents: {
        all: "Tutti", asia: "Asia", europe: "Europa",
        america: "America", africa: "Africa", oceania: "Oceania",
      },
      categories: {
        all: "Tutti", culture: "Cultura", adventure: "Avventura",
        nature: "Natura", food: "Gastronomia", sea: "Mare",
      },
      modal: { back: "← Torna agli articoli", date: "Data", continent: "Continente", read: "di lettura" },
      empty: "Nessun articolo trovato per i filtri selezionati.",
      footer: "Storie dal mondo, scritte con lentezza",
    }
  },
  en: {
    translation: {
      nav: {
        destinations: "Destinations",
        stories: "Stories",
        guides: "Guides",
        about: "About me",
      },
      hero: { readTime: "min read" },
      section: { allTrips: "All trips" },
      filter: {
        continent: "Continent:",
        category: "Category:",
        all: "All",
      },
      continents: {
        all: "All", asia: "Asia", europe: "Europe",
        america: "America", africa: "Africa", oceania: "Oceania",
      },
      categories: {
        all: "All", culture: "Culture", adventure: "Adventure",
        nature: "Nature", food: "Food", sea: "Sea",
      },
      modal: { back: "← Back to articles", date: "Date", continent: "Continent", read: "read" },
      empty: "No articles found for the selected filters.",
      footer: "Stories from the world, written slowly",
    }
  },
  fr: {
    translation: {
      nav: {
        destinations: "Destinations",
        stories: "Histoires",
        guides: "Guides",
        about: "À propos",
      },
      hero: { readTime: "min de lecture" },
      section: { allTrips: "Tous les voyages" },
      filter: {
        continent: "Continent :",
        category: "Catégorie :",
        all: "Tous",
      },
      continents: {
        all: "Tous", asia: "Asie", europe: "Europe",
        america: "Amérique", africa: "Afrique", oceania: "Océanie",
      },
      categories: {
        all: "Tous", culture: "Culture", adventure: "Aventure",
        nature: "Nature", food: "Gastronomie", sea: "Mer",
      },
      modal: { back: "← Retour aux articles", date: "Date", continent: "Continent", read: "de lecture" },
      empty: "Aucun article trouvé pour les filtres sélectionnés.",
      footer: "Histoires du monde, écrites lentement",
    }
  },
  es: {
    translation: {
      nav: {
        destinations: "Destinos",
        stories: "Historias",
        guides: "Guías",
        about: "Sobre mí",
      },
      hero: { readTime: "min de lectura" },
      section: { allTrips: "Todos los viajes" },
      filter: {
        continent: "Continente:",
        category: "Categoría:",
        all: "Todos",
      },
      continents: {
        all: "Todos", asia: "Asia", europe: "Europa",
        america: "América", africa: "África", oceania: "Oceanía",
      },
      categories: {
        all: "Todos", culture: "Cultura", adventure: "Aventura",
        nature: "Naturaleza", food: "Gastronomía", sea: "Mar",
      },
      modal: { back: "← Volver a los artículos", date: "Fecha", continent: "Continente", read: "de lectura" },
      empty: "No se encontraron artículos para los filtros seleccionados.",
      footer: "Historias del mundo, escritas con calma",
    }
  },
  de: {
    translation: {
      nav: {
        destinations: "Reiseziele",
        stories: "Geschichten",
        guides: "Reiseführer",
        about: "Über mich",
      },
      hero: { readTime: "min Lesezeit" },
      section: { allTrips: "Alle Reisen" },
      filter: {
        continent: "Kontinent:",
        category: "Kategorie:",
        all: "Alle",
      },
      continents: {
        all: "Alle", asia: "Asien", europe: "Europa",
        america: "Amerika", africa: "Afrika", oceania: "Ozeanien",
      },
      categories: {
        all: "Alle", culture: "Kultur", adventure: "Abenteuer",
        nature: "Natur", food: "Gastronomie", sea: "Meer",
      },
      modal: { back: "← Zurück zu den Artikeln", date: "Datum", continent: "Kontinent", read: "Lesezeit" },
      empty: "Keine Artikel für die ausgewählten Filter gefunden.",
      footer: "Geschichten aus der Welt, langsam geschrieben",
    }
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'it',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
