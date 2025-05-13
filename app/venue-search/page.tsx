'use client';

import { useState, useEffect } from 'react';
import { fetchVenues } from 'lib/kontentClient.js';
import { ClientConfig } from 'lib/kontentClient.js';
import RichTextComponent from 'components/RichTextComponent.js';

export default function VenueSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<any | null>(null);

  const usePreview = false;

  // Debounce logic: Update `debouncedQuery` after a delay when `query` changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler); // Cleanup the timeout on component unmount or query change
    };
  }, [query]);

  // Fetch results when `debouncedQuery` changes
  useEffect(() => {
console.log("debouncedQuery changed:", debouncedQuery);

    console.log("debouncedQuery changed:", debouncedQuery);

    if (!debouncedQuery) {
      setResults([]);
      setError(null);
      return;
    }

    const searchVenues = async () => {
      setLoading(true);
      setError(null);
      setResults([]);

      console.log("Searching for venues with slug:", debouncedQuery);

      try {
        const config = {
          envId: process.env.NEXT_PUBLIC_KONTENT_ENVIRONMENT_ID || '',
          previewApiKey: process.env.KONTENT_PREVIEW_API_KEY || '',
        };
        const venues = await fetchVenues(config, debouncedQuery, usePreview);
        console.log("Fetched Venues:", venues);

        const matches = venues.filter((venue) =>
          venue.elements.venue_name.value.toLowerCase().includes(debouncedQuery.trim().toLowerCase())
        );

        console.log("Matching Venues:", matches);

        if (matches.length > 0) {
          setResults(matches);
        } else {
          setError(`No matching venues found for "${debouncedQuery}".`);
        }
      } catch (err) {
        console.error("Error fetching venues:", err);
        setError("An error occurred while searching for venues.");
      } finally {
        setLoading(false);
      }
    };

    searchVenues();
  }, [debouncedQuery]);

  const handleVenueClick = (venue: any) => {
    setSelectedVenue(venue);
  };

  return (
    <div>
      <input 
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a venue..."
        className="search-input"
      />
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {selectedVenue ? (
        <div>
          <button onClick={() => setSelectedVenue(null)}>Back to Search</button>
          <h2>{selectedVenue.elements.venue_name.value}</h2>

          {/* Render the venue details here */}
          <div className="venue-details">
            <h3>Venue Name: </h3>
            <p>{selectedVenue.elements.venue_name.value}</p>
            {/* Render the venue hero image */}
            {selectedVenue.elements.venue_hero_image.value.length > 0 && (
              <img
                src={selectedVenue.elements.venue_hero_image.value[0].url}
                alt={selectedVenue.elements.venue_hero_image.value[0].description || "Venue Hero"}
                width={200}
                height={200}
              />
            )}
            {/* Render the venue location */}
            <h3>Location:</h3>
            <div>
              {selectedVenue.elements.location.linkedItems.length > 0 ? (
                selectedVenue.elements.location.linkedItems.map((location: any, index: number) => (
                  <RichTextComponent key={index} richTextElement={location.elements.content} />
                ))
              ) : (
                <p>No location details available.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h1>Venue Search</h1>
          <form onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="Enter venue name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          {loading && <p>Loading...</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          <div>
            {results.map((venue) => (
              <div key={venue.system.id}>
                <h2>{venue.elements.venue_name.value}</h2>
                <h3>Location:</h3>
                <p>{venue.elements.location.street_address}</p>
                <p>{venue.elements.location.city}</p>
                <p>{venue.elements.location.state}</p>
                <p>{venue.elements.location.zip_code}</p>
                <p>{venue.elements.location.telephone_number}</p>
                <p>{venue.elements.location.directions}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}