import { get, groupBy, startCase, sortBy } from 'lodash';
import { GroupedListItem } from '../Components/GroupedList/GroupedList';
import { DBState } from '../Types/db';
import { Categories, Item, ListItem } from '../Types/entities';
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

type DBStructureList = {
  id: string;
  name: string;
  list: Array<ListItem>;
  items: Array<Item>;
  categories: Categories;
}

export type DBStructure = {
  [id: string]: DBStructureList;
};

export type dbRef = {
  [id: string]: {
    [key in keyof DBStructureList]: { [key: string]: DBStructureList[key][0] };
  }
};

export function firebaseToState(snapshot: dbRef): DBState {
  const dbData = Object.entries(snapshot).reduce(
    (prev, [id, {name, ...refs}]) => ([
      ...prev,
      {
        id,
        name,
        ...(
          Object.entries(refs).reduce((prevRefs, [ref, items]) => ({
            ...prevRefs,
            [ref]: Object.entries(items!).map(([id, props]) => ({
              id,
              ...props,
            })),
          }), {})
        )
      }
    ]),
    [] as DBStructure
  );

  const categories = sortBy(dbData.categories || [], 'name');

  const items = sortBy(
    (dbData.items || []).map(({ categoryId, ...item }) => ({
      ...item,
      category: categoryId
        ? {
            ...snapshot.categories[categoryId || ''],
            id: categoryId,
          }
        : undefined,
    })),
    'name'
  );

  const list = sortBy(
    (dbData.list || []).map(({ itemId, ...listItem }) => {
      const itemIndex = items.findIndex((item) => item.id === itemId);
      const [item] = items.splice(itemIndex, 1);
      return {
        ...listItem,
        item,
      };
    }),
    (item) => item.item.name
  );

  return {
    categories,
    items: items.filter(
      (dbItem) => !snapshot.list || !snapshot.list[dbItem.id]
    ),
    list,
  };
}
