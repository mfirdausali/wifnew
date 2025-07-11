import { MutableRefObject, RefCallback } from 'react';

type Ref<T> = MutableRefObject<T> | RefCallback<T> | null | undefined;

export function mergeRefs<T = any>(...refs: Ref<T>[]): RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref != null) {
        (ref as MutableRefObject<T | null>).current = value;
      }
    });
  };
}