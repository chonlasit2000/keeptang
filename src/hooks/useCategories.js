import { useCategoryContext } from '../contexts/CategoryContext.jsx';

export function useCategories() {
  return useCategoryContext();
}
