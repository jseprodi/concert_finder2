'use client';

import { useState, useEffect } from 'react';
import { fetchVenues } from '../../lib/kontentClient';

export default function VenueSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (!debouncedQuery) {
      setResults([]);
      setError(null);
      return;
    }

    const searchVenues = async () => {
      setLoading(true);
      setError(null);
      setResults([]);

      try {
        const venues = await fetchVenues();
        const matches = venues.filter((venue) =>
          venue.elements.venue_name.value.toLowerCase().includes(debouncedQuery.toLowerCase())
        );

        if (matches.length > 0) {
          setResults(matches);
        } else {
          setError('No matching venues found.');
        }
      } catch (err) {
        setError('An error occurred while searching for venues.');
      } finally {
        setLoading(false);
      }
    };

    searchVenues();
  }, [debouncedQuery]);

  return (
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
            <p>{venue.elements.description?.value || 'No description available.'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}