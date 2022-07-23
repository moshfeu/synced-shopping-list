import React, {
  CSSProperties,
  ElementType,
  PropsWithChildren,
  Reducer,
  useReducer,
} from 'react';
import { SwipeDirections, useSwipeable } from 'react-swipeable';

type SwipableProps = PropsWithChildren<{
  onSwipeRight(): void;
  onSwipeLeft(): void;
  treshold?: number;
  as?: ElementType;
  colors?: {
    after?: string;
    before?: string;
  };
  icons?: {
    after?: React.ReactNode;
    before?: React.ReactNode;
  };
}>;

type Action =
  | {
      type: 'SWIPE_START';
      payload: {
        direction: SwipeDirections;
      };
    }
  | {
      type: 'SWIPE_END';
    }
  | {
      type: 'SWIPE_MOVE';
      payload: {
        offset: number;
        direction: SwipeDirections;
      };
    };

type State = {
  isSwiping?: boolean;
  direction?: SwipeDirections;
  offset?: number;
};

const wrapperStyle: CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
};

const reducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case 'SWIPE_START':
      return {
        ...state,
        isSwiping: true,
        direction: action.payload.direction,
      };
    case 'SWIPE_MOVE':
      return {
        ...state,
        direction: action.payload.direction,
        offset: action.payload.offset,
      };
    case 'SWIPE_END':
      return {
        ...state,
        isSwiping: false,
        offset: 0,
      };
  }
};

export const Swipable = ({
  icons,
  children,
  onSwipeLeft,
  onSwipeRight,
  treshold = 100,
  as: Element = 'li',
  colors = {
    before: 'green',
    after: 'red',
  },
}: SwipableProps) => {
  const [{ offset = 0, isSwiping, direction }, dispatch] = useReducer(
    reducer,
    {}
  );

  const swipeEnd = () => {
    dispatch({ type: 'SWIPE_END' });
  };

  const handlers = useSwipeable({
    touchEventOptions: {
      passive: false,
    },
    onSwipeStart: ({ dir }) => {
      dispatch({ type: 'SWIPE_START', payload: { direction: dir } });
    },
    onSwiping: ({ absX, event, dir }) => {
      event.preventDefault();
      if (absX < treshold) {
        dispatch({
          type: 'SWIPE_MOVE',
          payload: { offset: absX, direction: dir },
        });
      } else if (isSwiping) {
        direction === 'Right' ? onSwipeRight() : onSwipeLeft();
        swipeEnd();
      }
    },
    onSwiped: () => {
      swipeEnd();
    },
  });

  const style: CSSProperties = {
    transform: `translateX(${direction === 'Right' ? offset : -offset}px)`,
    transition: isSwiping ? 'none' : 'transform 0.1s ease-out',
  };

  const actionsStyle: CSSProperties = {
    top: 0,
    width: offset,
    height: '100%',
    overflow: 'hidden',
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    paddingInlineStart: offset / 5,
    transition: isSwiping ? 'none' : 'width 0.1s ease-out',
  };

  const beforeActionStyle: CSSProperties = {
    ...actionsStyle,
    backgroundColor: colors.before,
    left: 0,
  };

  const afterActionStyle: CSSProperties = {
    ...actionsStyle,
    backgroundColor: colors.after,
    right: 0,
    direction: 'rtl',
    textAlign: 'right',
  };

  return (
    <Element style={wrapperStyle}>
      {direction === 'Right' && (
        <div style={beforeActionStyle}>{icons?.before}</div>
      )}
      <div {...handlers} style={style}>
        {children}
      </div>
      {direction === 'Left' && (
        <div style={afterActionStyle}>{icons?.after}</div>
      )}
    </Element>
  );
};
