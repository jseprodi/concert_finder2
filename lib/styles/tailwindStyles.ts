const tailwindStyles = {
  container: 'container mx-auto p-4',
  heading: 'text-2xl font-bold mb-4 text-gray-800', // Darker text for headings
  input: 'w-full p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
  loadingText: 'text-blue-500',
  errorText: 'text-red-500',
  noResultsText: 'text-gray-500',
  grid: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6',
  card: 'p-6 border border-gray-300 rounded-lg shadow-md bg-gray-100 hover:shadow-lg transition-shadow',
  cardHeading: 'text-xl font-semibold mb-2 text-gray-900',
  listItem: 'capitalize text-gray-700',
  image: 'max-w-full h-auto rounded shadow-md',
  link: 'text-blue-500 underline hover:text-blue-700',
  richText: 'text-gray-800 leading-relaxed', // New style for rich text
};

export default tailwindStyles;