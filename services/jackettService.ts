import type { TorrentResult, Category } from '../types';

const getSanitizedUrl = (url: string): string => {
  let sanitizedUrl = url.trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(sanitizedUrl)) {
    sanitizedUrl = 'http://' + sanitizedUrl;
  }
  return sanitizedUrl;
};

const handleFetchError = (error: unknown): Error => {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return new Error(
      'Connection failed. This is often a CORS issue. Please enable CORS for this site in your Jackett server settings. Also verify the URL is correct and reachable.'
    );
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error('An unknown error occurred during fetch.');
};


export const testJackettConnection = async (
  jackettUrl: string,
  apiKey: string
): Promise<void> => {
  if (!jackettUrl || !apiKey) {
    throw new Error('Jackett URL and API Key must be provided for testing.');
  }

  const sanitizedUrl = getSanitizedUrl(jackettUrl);
  // A simple query that should return quickly, we don't care about the results.
  const url = `${sanitizedUrl}/api/v2.0/indexers/all/results?apikey=${apiKey}&Query=test&_=${Date.now()}`;

  try {
    const response = await fetch(url);
    
    if (response.status === 401 || response.status === 403) {
      throw new Error('Connection successful, but the API Key seems to be invalid.');
    }

    if (!response.ok) {
      throw new Error(`Connection failed with server status: ${response.status}. Check if the server is running correctly.`);
    }

    // A successful response is enough to validate the connection.
  } catch (error) {
    throw handleFetchError(error);
  }
};

export const fetchCategories = async (
  jackettUrl: string,
  apiKey: string
): Promise<Category[]> => {
  const sanitizedUrl = getSanitizedUrl(jackettUrl);
  const url = `${sanitizedUrl}/api/v2.0/indexers/all/results/torznab/api?t=caps&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch categories with status: ${response.status}`);
    }
    const xmlString = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    
    const errorNode = xmlDoc.querySelector('error');
    if (errorNode) {
        const errorCode = errorNode.getAttribute('code');
        const errorDesc = errorNode.getAttribute('description');
        if (errorCode === '100') {
             throw new Error('Invalid API Key. Please check your Jackett settings.');
        }
        throw new Error(`Jackett API Error: ${errorDesc} (Code: ${errorCode})`);
    }

    const categoryNodes = xmlDoc.querySelectorAll('category');
    const categories: Category[] = [];

    categoryNodes.forEach(node => {
      const parentId = node.getAttribute('id');
      const parentName = node.getAttribute('name');
      if (parentId && parentName) {
        categories.push({ id: parentId, name: parentName });
        const subcatNodes = node.querySelectorAll('subcat');
        subcatNodes.forEach(subcatNode => {
          const subId = subcatNode.getAttribute('id');
          const subName = subcatNode.getAttribute('name');
          if (subId && subName) {
            categories.push({ id: subId, name: `${parentName} / ${subName}` });
          }
        });
      }
    });

    categories.sort((a, b) => a.name.localeCompare(b.name));
    return categories;
  } catch (error) {
    console.error('Failed to fetch or parse categories:', error);
    throw handleFetchError(error);
  }
};


const PUBLIC_TRACKERS = [
  'udp://tracker.openbittorrent.com:80',
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://open.tracker.cl:1337/announce',
  'udp://p4p.arenabg.com:1337/announce',
  'udp://tracker.dler.org:6969/announce',
];

export const searchTorrents = async (
  query: string,
  jackettUrl: string,
  apiKey: string,
  categoryId?: string
): Promise<TorrentResult[]> => {
  if (!jackettUrl || !apiKey) {
    throw new Error('Jackett URL and API Key must be provided.');
  }

  const sanitizedUrl = getSanitizedUrl(jackettUrl);
  let url = `${sanitizedUrl}/api/v2.0/indexers/all/results?apikey=${apiKey}&Query=${encodeURIComponent(query)}`;

  if (categoryId) {
    url += `&Category[]=${categoryId}`;
  }
  url += `&_=${Date.now()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      let errorMessage = `HTTP error! Status: ${response.status}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody.error || errorMessage;
      } catch (e) {
        // Response might not be JSON, stick with the status code message
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const results: TorrentResult[] = (data.Results || []).map((result: TorrentResult) => {
        if (!result.MagnetUri && result.InfoHash) {
            const displayName = encodeURIComponent(result.Title);
            const trackerQuery = PUBLIC_TRACKERS.map(tracker => `tr=${encodeURIComponent(tracker)}`).join('&');
            result.MagnetUri = `magnet:?xt=urn:btih:${result.InfoHash}&dn=${displayName}&${trackerQuery}`;
        }
        return result;
    });
    
    return results;

  } catch (error) {
    console.error('Failed to fetch from Jackett API:', error);
    throw handleFetchError(error);
  }
};
