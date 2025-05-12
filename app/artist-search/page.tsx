'use client';

import { useState, useEffect } from 'react';
import { fetchBands } from '../../lib/kontentClient'; // Adjust the import path as needed
import RichTextComponent from '@components/RichTextComponent'; // Adjust the import path as needed
import { Elements } from '@kontent-ai/delivery-sdk';
import { PortableText, PortableTextReactResolvers } from '@kontent-ai/rich-text-resolver/utils/react';
import { Company_band, Company_content_chunk } from '@models/content-types'; // Adjust the import path as needed

const createRichTextResolver = (element: Elements.RichTextElement): PortableTextReactResolvers => ({
  types: {
    // Resolution for components and content items inserted in rich text
    componentOrItem: ({ value }) => {
      const componentItem = element.linkedItems?.find(
        (i) => i.system.codename === value.componentOrItem._ref
      );

      if (!componentItem) {
        throw new Error("Component item not found, probably not enough depth requested.");
      }

      // Handle specific content types
      switch (componentItem.system.type) {
        case "band":
          const band = componentItem as Company_band;
          return (
            <div className="band-component">
              <h2>{band.elements.band_name.value}</h2>
              <p>{band.elements.band_bio.value}</p>
            </div>
          );

        case "content_chunk": // Handle the `content_chunk` type
          const contentChunk = componentItem as Company_content_chunk;
          return (
            <div className="content-chunk-component">
              {contentChunk.elements.content.value && <p>{contentChunk.elements.content.value}</p>}
            </div>
          );

        default:
          return <div>Unsupported content type: {componentItem.system.type}</div>;
      }
    },
  },
});

export default function ArtistSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<Company_band[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedBand, setSelectedBand] = useState<any | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

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
        const config = {
          envId: process.env.NEXT_PUBLIC_KONTENT_ENVIRONMENT_ID || '',
          previewApiKey: process.env.KONTENT_PREVIEW_API_KEY || '',
        };
        const slug = ''; // Replace with a specific slug or leave empty for all bands
        const usePreview = false; // Set to true if you want to use the preview API

        const bands = await fetchBands(config, slug, usePreview);
        console.log('Fetched Bands:', bands);

        const matches = bands.filter((band: any) =>
          band.elements.band_name.value.toLowerCase().includes(debouncedQuery.toLowerCase())
        );

        if (matches.length > 0) {
          setResults(matches);
        } else {
          setError('No matching artists found.');
        }
      } catch (err) {
        console.error('Error in searchBands:', err);
        setError('An error occurred while searching for artists.');
      } finally {
        setLoading(false);
      }
    };

    searchBands();
  }, [debouncedQuery]);

  const handleBandClick = (band: any) => {
    setSelectedBand(band);
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a band..."
        className="search-input"
      />
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {selectedBand ? (
        <div>
          <button onClick={() => setSelectedBand(null)}>Back to Search Results</button>
          <h2>{selectedBand.elements.band_name.value}</h2>

          {/* Render the band bio */}
          {selectedBand.elements.band_bio.linkedItems.length > 0 ? (
            selectedBand.elements.band_bio.linkedItems.map((bio: any, index: number) => (
              <RichTextComponent key={index} richTextElement={bio.elements.content} />
            ))
          ) : (
            <p>No bio available.</p>
          )}

          {/* Render the band logo */}
          {selectedBand.elements.band_logo.value.length > 0 && (
            <img
              src={selectedBand.elements.band_logo.value[0].url}
              alt={selectedBand.elements.band_logo.value[0].description || "Band Logo"}
              width={200}
              height={200}
            />
          )}

          {/* Render the promotional images */}
          {selectedBand.elements.promotional_image.value.length > 0 && (
            <div className="promotional-images">
              {selectedBand.elements.promotional_image.value.map((image: any, index: number) => (
                <img
                  key={index}
                  src={image.url}
                  alt={image.description || "Promotional Image"}
                  width={400}
                  height={300}
                />
              ))}
            </div>
          )}

          {/* Render the band members */}
          {selectedBand.elements.band_member.linkedItems.length > 0 && (
            <div className="band-members">
              <h3>Band Members:</h3>
              <ul>
                {selectedBand.elements.band_member.linkedItems.map((member: any, index: number) => (
                  <li key={index}>
                    {member.elements.first_name.value} {member.elements.last_name.value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Render the band playlist */}
          {selectedBand.elements.band_playlist.linkedItems.length > 0 && (
            <div className="band-playlist">
              <h3>Playlist:</h3>
              <ul>
                {selectedBand.elements.band_playlist.linkedItems.map((song: any, index: number) => (
                  <li key={index}>
                    <a href={song.elements.song_link.value} target="_blank" rel="noopener noreferrer">
                      {song.elements.song_title.value}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <ul>
          {results.map((band, index) => (
            <li key={index}>
              <a href="#" onClick={() => handleBandClick(band)}>
                {band.elements.band_name.value}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}