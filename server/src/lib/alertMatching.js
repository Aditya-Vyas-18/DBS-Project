import { ancestorIdsFromDbRows } from './categoryTree.js';

/**
 * Item matches an alert if:
 * - Alert's category is on the ancestor chain of the item's category (user watches parent → matches descendants)
 * - Price within [min_price, max_price] if set
 * - keyword substring in title or description if set
 */
export function alertMatchesItem(alert, item, categoryRows) {
  if (!alert.is_active) return false;
  const chain = ancestorIdsFromDbRows(categoryRows, item.category_id);
  if (!chain.includes(alert.category_id)) return false;
  if (alert.min_price != null && Number(item.price) < Number(alert.min_price)) return false;
  if (alert.max_price != null && Number(item.price) > Number(alert.max_price)) return false;
  if (alert.keyword && alert.keyword.trim()) {
    const k = alert.keyword.trim().toLowerCase();
    const hay = `${item.title || ''} ${item.description || ''}`.toLowerCase();
    if (!hay.includes(k)) return false;
  }
  return true;
}
