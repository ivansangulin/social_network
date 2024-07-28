import { EmblaCarouselType } from "embla-carousel";
import useEmblaCarousel from "embla-carousel-react";
import {
  ComponentPropsWithRef,
  ReactNode,
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export const PhotoCarousel = ({ children }: { children: ReactNode[] }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel();
  const detailsGroupRef = useRef<HTMLDivElement>(null);
  const showDetails = emblaApi && children.length > 1;
  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  useEffect(() => {
    const onScroll = () => {
      if (detailsGroupRef.current)
        detailsGroupRef.current.style.opacity = "100";
      setTimeout(() => {
        if (detailsGroupRef.current)
          detailsGroupRef.current.style.opacity = "0";
      }, 2000);
    };
    emblaApi?.on("scroll", onScroll);
    return () => {
      emblaApi?.off("scroll", onScroll);
    };
  }, [emblaApi]);

  return (
    <div className="overflow-hidden relative group" ref={emblaRef}>
      <div className="flex">{children}</div>
      {showDetails && (
        <>
          <div className="absolute top-0 right-0 bg-white m-2 py-1 px-2 rounded-full text-sm drop-shadow-xl">
            {`${emblaApi.selectedScrollSnap() + 1}/${children.length}`}
          </div>
          <div
            ref={detailsGroupRef}
            className="opacity-0 group-hover:!opacity-100 transition-opacity duration-100 focus-within:!opacity-100"
          >
            <PrevButton
              onClick={onPrevButtonClick}
              disabled={prevBtnDisabled}
            />
            <NextButton
              onClick={onNextButtonClick}
              disabled={nextBtnDisabled}
            />
          </div>
        </>
      )}
    </div>
  );
};

type UsePrevNextButtonsType = {
  prevBtnDisabled: boolean;
  nextBtnDisabled: boolean;
  onPrevButtonClick: () => void;
  onNextButtonClick: () => void;
};

const usePrevNextButtons = (
  emblaApi: EmblaCarouselType | undefined
): UsePrevNextButtonsType => {
  const [prevBtnDisabled, setPrevBtnDisabled] = useState<boolean>(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState<boolean>(true);

  const onPrevButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  }, [emblaApi]);

  const onNextButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on("reInit", onSelect).on("select", onSelect);
  }, [emblaApi, onSelect]);

  return {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  };
};

type PropType = ComponentPropsWithRef<"button">;

const PrevButton = ({ children, ...restProps }: PropType) => {
  return (
    <button
      className="absolute p-1 top-1/2 -translate-y-1/2 left-[8px] rounded-full bg-white z-20 drop-shadow-xl hover:bg-stone-200 disabled:hidden"
      type="button"
      {...restProps}
    >
      <ChevronLeftIcon className="h-6 w-6 -translate-x-[1px]" />
      {children}
    </button>
  );
};

const NextButton = ({ children, ...restProps }: PropType) => {
  return (
    <button
      className="absolute p-1 top-1/2 -translate-y-1/2 right-[8px] rounded-full bg-white z-20 drop-shadow-xl hover:bg-stone-200 disabled:hidden"
      type="button"
      {...restProps}
    >
      <ChevronRightIcon className="h-6 w-6 translate-x-[1px]" />
      {children}
    </button>
  );
};
