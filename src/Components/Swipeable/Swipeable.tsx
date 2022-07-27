import React, {
  CSSProperties,
  ElementType,
  PropsWithChildren,
  Reducer,
  useReducer,
} from 'react';
import { SwipeDirections, useSwipeable } from 'react-swipeable';
import { HandledEvents } from 'react-swipeable/es/types';

type PercentageOrPX = `${string}${'%' | 'px'}`;
type SwipableProps = PropsWithChildren<{
  onSwipeRight?(): void;
  onSwipeLeft?(): void;
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
      type: 'SWIPE_DONE';
    }
  | {
      type: 'SWIPE_CANCEL';
    }
  | {
      type: 'SWIPE_MOVE';
      payload: {
        offset: PercentageOrPX;
        direction: SwipeDirections;
      };
    };

type State = {
  isSwiping?: boolean;
  direction?: SwipeDirections;
  offset?: PercentageOrPX;
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
    case 'SWIPE_CANCEL':
      return {
        ...state,
        isSwiping: false,
        offset: '0px',
      };
    case 'SWIPE_DONE':
      return {
        ...state,
        isSwiping: false,
        offset: '100%',
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

  const callbackWhenTransitionEnd = (event: HandledEvents) => {
    (event.currentTarget as HTMLElement).addEventListener(
      'transitionend',
      () => {
        direction === 'Right' ? onSwipeRight?.() : onSwipeLeft?.();
      },
      {
        once: true,
      }
    );
  };

  const shouldNotSwipe = (direction: SwipeDirections) => {
    return (
      (direction === 'Right' && !onSwipeRight) ||
      (direction === 'Left' && !onSwipeLeft)
    );
  };

  const handlers = useSwipeable({
    touchEventOptions: {
      passive: false,
    },
    delta: {
      up: 1000,
      down: 1000,
    },
    onSwipeStart: ({ dir }) => {
      dispatch({ type: 'SWIPE_START', payload: { direction: dir } });
    },
    onSwiping: ({ absX, event, dir }) => {
      event.preventDefault();
      if (shouldNotSwipe(dir)) {
        return;
      }
      if (absX < treshold) {
        dispatch({
          type: 'SWIPE_MOVE',
          payload: { offset: `${absX}px`, direction: dir },
        });
      } else if (isSwiping) {
        callbackWhenTransitionEnd(event);
        dispatch({ type: 'SWIPE_DONE' });
      }
    },
    onSwiped: () => {
      dispatch({ type: 'SWIPE_CANCEL' });
    },
  });

  const style: CSSProperties = {
    transform: `translateX(${direction === 'Right' ? offset : `-${offset}`})`,
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
    paddingInlineStart: `min(calc(${offset} / 5), 20px)`,
    transition: isSwiping ? 'none' : 'width, padding 0.1s ease-out',
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
