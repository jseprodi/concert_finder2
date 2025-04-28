'use client';

import { useState, useEffect } from 'react';
import { fetchBands } from '../../lib/kontentClient';
import { useDebounce } from '../../hooks/useDebounce';
import { Elements } from '@kontent-ai/delivery-sdk';
import { transformToPortableText } from '@kontent-ai/rich-text-resolver';
import { PortableText, PortableTextReactResolvers } from '@kontent-ai/rich-text-resolver/utils/react';
import tailwindStyles from '../../lib/styles/tailwindStyles';

interface Band {
  system: {
    id: string;
  };
  elements: {
    [key: string]: {
      value: any;
    };
  };
}

// Defines how to transform Kontent.ai-specific portable text components
const createRichTextResolver = (element: Elements.RichTextElement): PortableTextReactResolvers => {
  console.log('Resolving rich text element:', element);

  return {
    types: {
      component: undefined,
      table: undefined,
      image: undefined,
    },
    marks: {
      link: undefined,
      contentItemLink: undefined,
    },
    block: {
      h1: undefined,
      p: undefined,
    },
  };
};

type RichTextComponentProps = {
  richTextElement: Elements.RichTextElement;
};

// Custom React component to render rich text
const RichTextComponent: React.FC<RichTextComponentProps> = ({ richTextElement }) => {
  if (!richTextElement?.value) {
    console.warn('RichTextComponent received an empty value:', richTextElement);
    return null;
  }

  try {
    const portableText = transformToPortableText(richTextElement.value);

    return (
      <div className={tailwindStyles.richText}>
        <PortableText
          value={portableText}
          components={createRichTextResolver(richTextElement)}
        />
      </div>
    );
  } catch (error) {
    console.error('Error rendering rich text:', error, richTextElement);
    return <p>Error rendering rich text.</p>;
  }
};

export default function ArtistSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<Band[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setError(null);
      return;
    }

    const searchBands = async () => {
      setLoading(true);
      setError(null);
      setResults([]);

      try {
        const bands = await fetchBands();
        const matches = bands.filter((band) =>
          band.elements.band_name.value.toLowerCase().includes(debouncedQuery.toLowerCase())
        );

        if (matches.length > 0) {
          setResults(matches);
        } else {
          setError('No matching artists found.');
        }
      } catch (err) {
        setError('An error occurred while searching for artists.');
      } finally {
        setLoading(false);
      }
    };

    searchBands();
  }, [debouncedQuery]);

  const renderElementValue = (key: string, element: any) => {
    console.log(`Key: ${key}`, element.value); // Debugging the structure of element.value

    if (key === 'band_bio' && element?.value) {
      // Render rich text for band bio
      return <RichTextComponent richTextElement={element as Elements.RichTextElement} />;
    } else if (Array.isArray(element?.value)) {
      // Handle arrays (e.g., linked items, multiple-choice elements, or images)
      return element.value.map((item: { url?: string; name?: string; title?: string; description?: string }, index: number) => {
        if (item.url) {
          // Render images
          return (
            <img
              key={index}
              src={item.url}
              alt={item.description || `Image for ${key}`}
              className={tailwindStyles.image}
            />
          );
        }
        // Render other array items
        return (
          <span key={index}>
            {item.name || item.title || item.url || JSON.stringify(item)}
            {index < element.value.length - 1 && ', '}
          </span>
        );
      });
    } else if (typeof element?.value === 'string') {
      if (key === 'social_media') {
        // Parse raw HTML and apply styles to links
        const parser = new DOMParser();
        const doc = parser.parseFromString(element.value, 'text/html');
        const links = doc.querySelectorAll('a');

        links.forEach((link) => {
          link.classList.add('text-green-500', 'underline', 'hover:text-green-700');
        });

        return <div dangerouslySetInnerHTML={{ __html: doc.body.innerHTML }} />;
      }
      return element.value;
    } else if (element?.value?.url) {
      // Handle single image fields
      return (
        <img
          src={element.value.url}
          alt={element.value.description || key.replace(/_/g, ' ')}
          className={tailwindStyles.image}
        />
      );
    } else if (element?.value?.href) {
      // Handle links
      return (
        <a
          href={element.value.href}
          target="_blank"
          rel="noopener noreferrer"
          className={tailwindStyles.link}
        >
          {element.value.text || element.value.href}
        </a>
      );
    } else if (element?.value?.length && typeof element?.value[0] === 'object') {
      // Handle arrays of objects (e.g., linked items)
      return element.value.map((item: { name?: string; title?: string }, index: number) => (
        <span key={index}>{item.name || item.title || JSON.stringify(item)}</span>
      ));
    } else {
      // Fallback for other types
      return JSON.stringify(element?.value);
    }
  };

  return (
    <div className={tailwindStyles.container}>
      <h1 className={tailwindStyles.heading}>Artist Search</h1>
      <form onSubmit={(e) => e.preventDefault()} className="mb-4">
        <input
          type="text"
          placeholder="Enter artist name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={tailwindStyles.input}
        />
      </form>

      {loading && <p className={tailwindStyles.loadingText}>Loading...</p>}
      {error && <p className={tailwindStyles.errorText}>{error}</p>}
      {!loading && !error && results.length === 0 && (
        <p className={tailwindStyles.noResultsText}>No results found.</p>
      )}

      <div className={tailwindStyles.grid}>
        {results.map((band) => (
          <div key={band.system.id} className={tailwindStyles.card}>
            <h2 className={tailwindStyles.cardHeading}>{band.elements.band_name.value}</h2>
            <ul className="space-y-2">
              {Object.entries(band.elements).map(([key, element]) => (
                <li key={key}>
                  <strong className={tailwindStyles.listItem}>{key.replace(/_/g, ' ')}:</strong>{' '}
                  {renderElementValue(key, element)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}