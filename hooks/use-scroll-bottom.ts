import throttle from 'lodash.throttle';
import { RefObject, useEffect } from 'react';

interface UseScrollBottomOptions {
  scrollRef: RefObject<HTMLElement>;
}

const useScrollBottom = ({ scrollRef }: UseScrollBottomOptions) => {
  useEffect(() => {
    const scrollingElement = scrollRef.current;

    const callback: MutationCallback = function (mutationsList) {
      for (let mutation of mutationsList) {
        if (mutation.type === 'childList') {
          window.scrollTo(0, document.body.scrollHeight);
        }
      }
    };
    const throttleCallback = throttle(callback, 1000 / 16);

    const observer = new MutationObserver(throttleCallback);
    if (scrollingElement) {
      observer.observe(scrollingElement!, {
        subtree: true,
        childList: true,
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);
};

export default useScrollBottom;
