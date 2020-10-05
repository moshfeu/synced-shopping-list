import { get, groupBy, startCase } from 'lodash';
import { GroupedListItem } from '../Components/GroupedList/GroupedList';
import { UNCATEGORIZED } from '../consts';

export function groupItemsBy<
  T extends Array<unknown>,
  TObject extends T[0],
  TKey1 extends keyof TObject,
  TKey2 extends keyof NonNullable<TObject[TKey1]>,
  TKey3 extends keyof NonNullable<NonNullable<TObject[TKey1]>[TKey2]>
>(
  items: T,
  groupByPath: [TKey1, TKey2] | [TKey1, TKey2, TKey3],
  mapper: (item: T[0]) => GroupedListItem
) {
  return Object.entries(
    groupBy(items, (item) => get(item, groupByPath) || startCase(UNCATEGORIZED))
  )
    .sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB))
    .reduce<Array<[string, Array<GroupedListItem>]>>(
      (prev, [categoryName, items]) => [
        ...prev,
        [categoryName, items.map(mapper)],
      ],
      []
    );
}
