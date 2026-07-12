import api from './api';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  link: string;
}

const searchService = {
  search: (q: string) => {
    return api.get<{ success: boolean; data: SearchResult[] }>('/search', { params: { q } });
  },
};

export default searchService;
